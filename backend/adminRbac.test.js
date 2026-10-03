const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('./src/app');
const User = require('./src/models/User');
const Monument = require('./src/models/Monument');

jest.setTimeout(120000);

let mongoServer;
let adminToken;
let adminId;
let visitorToken;
let staffToken;
let monument1;
let monument2;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  const admin = await User.create({
    name: 'Super Admin',
    email: 'superadmin@heritage.gov.in',
    passwordHash: 'hashed_admin_pass',
    role: 'admin'
  });
  adminId = admin._id;
  adminToken = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });

  const visitor = await User.create({
    name: 'Normal User',
    email: 'normal@user.com',
    passwordHash: 'hashed_user_pass',
    role: 'visitor'
  });
  visitorToken = jwt.sign({ id: visitor._id, role: visitor.role }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });

  monument1 = await Monument.create({
    name: 'Taj Mahal',
    location: 'Agra, Uttar Pradesh',
    capacity: 500,
    baseTicketPrice: 50,
    openingTime: '06:00',
    closingTime: '18:30'
  });

  monument2 = await Monument.create({
    name: 'Qutub Minar',
    location: 'New Delhi',
    capacity: 300,
    baseTicketPrice: 35,
    openingTime: '07:00',
    closingTime: '17:00'
  });

  const staff = await User.create({
    name: 'Taj Staff Member',
    email: 'tajstaff@heritage.gov.in',
    passwordHash: 'hashed_staff_pass',
    role: 'staff',
    assignedMonument: monument1._id
  });
  staffToken = jwt.sign({ id: staff._id, role: staff.role }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Admin RBAC & User Management Tests', () => {

  it('should disallow non-admin users from accessing /api/admin/users', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${visitorToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should allow admin to list all users populated with assigned monuments', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3);

    const staffInList = res.body.data.find(u => u.email === 'tajstaff@heritage.gov.in');
    expect(staffInList).toBeDefined();
    expect(staffInList.assignedMonument).toBeDefined();
    expect(staffInList.assignedMonument.name).toBe('Taj Mahal');
  });

  it('should allow admin to create a new Staff account with assigned monument site', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Qutub Gate Officer',
        email: 'qutub.officer@heritage.gov.in',
        password: 'securePassword123',
        role: 'staff',
        assignedMonument: monument2._id.toString()
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Qutub Gate Officer');
    expect(res.body.data.role).toBe('staff');
    expect(res.body.data.assignedMonument._id.toString()).toBe(monument2._id.toString());
  });

  it('should reject staff creation without an assigned monument site', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Invalid Staff',
        email: 'invalid.staff@heritage.gov.in',
        password: 'securePassword123',
        role: 'staff',
        assignedMonument: ''
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/monument site is required/i);
  });

  it('should allow admin to create another Administrator account', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Deputy Director',
        email: 'deputy.director@heritage.gov.in',
        password: 'deputyPassword456',
        role: 'admin'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('admin');
  });

  it('should allow admin to create a normal User / Visitor account', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Citizen Traveler',
        email: 'traveler@gmail.com',
        password: 'travelerPassword789',
        role: 'visitor'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('visitor');
  });

  it('should allow admin to update user role and assigned monument', async () => {
    // Find the traveler created earlier
    const user = await User.findOne({ email: 'traveler@gmail.com' });

    // Promote to staff stationed at Taj Mahal
    const res = await request(app)
      .patch(`/api/admin/users/${user._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        role: 'staff',
        assignedMonument: monument1._id.toString()
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('staff');
    expect(res.body.data.assignedMonument._id.toString()).toBe(monument1._id.toString());
  });

  it('should prevent admin from deleting their own account', async () => {
    const res = await request(app)
      .delete(`/api/admin/users/${adminId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/cannot delete your own/i);
  });

  it('should allow admin to delete another user account', async () => {
    const userToDelete = await User.create({
      name: 'Temp User',
      email: 'temp.delete@example.com',
      passwordHash: 'hash',
      role: 'visitor'
    });

    const res = await request(app)
      .delete(`/api/admin/users/${userToDelete._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const check = await User.findById(userToDelete._id);
    expect(check).toBeNull();
  });

  it('should enforce public registration to always default to visitor role even if client passes role=admin', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Sneaky User',
        email: 'sneaky@hacker.io',
        password: 'hackerPassword123',
        role: 'admin' // Attempting privilege escalation
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('visitor'); // Must be visitor, not admin!

    const saved = await User.findOne({ email: 'sneaky@hacker.io' });
    expect(saved.role).toBe('visitor');
  });

  it('should return populated assignedMonument in auth login response', async () => {
    // Login with tajstaff
    const bcrypt = require('bcryptjs');
    const staffPassword = 'StaffKnownPassword123';
    const staffHash = await bcrypt.hash(staffPassword, 10);
    const loginStaff = await User.create({
      name: 'Login Test Staff',
      email: 'login.staff@heritage.gov.in',
      passwordHash: staffHash,
      role: 'staff',
      assignedMonument: monument1._id
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login.staff@heritage.gov.in',
        password: staffPassword
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.assignedMonument).toBeDefined();
    expect(res.body.data.assignedMonument.name).toBe('Taj Mahal');
  });

});
