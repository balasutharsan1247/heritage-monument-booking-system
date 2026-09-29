const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('./src/app');
const User = require('./src/models/User');
const Monument = require('./src/models/Monument');
const jwt = require('jsonwebtoken');

jest.setTimeout(120000);

let mongoServer;
let adminToken;
let userToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Seed test users
  const adminUser = new User({
    name: 'Admin User',
    email: 'admin@test.com',
    passwordHash: 'password123',
    role: 'admin'
  });
  await adminUser.save();
  adminToken = jwt.sign({ id: adminUser._id, role: adminUser.role }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1h' });

  const regularUser = new User({
    name: 'Regular User',
    email: 'user@test.com',
    passwordHash: 'password123',
    role: 'visitor'
  });
  await regularUser.save();
  userToken = jwt.sign({ id: regularUser._id, role: regularUser.role }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1h' });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Monument API endpoints', () => {
  let activeMonumentId;
  let inactiveMonumentId;

  beforeAll(async () => {
    const activeMonument = new Monument({
      name: 'Active Monument',
      capacity: 100,
      baseTicketPrice: 50,
      openingTime: '09:00',
      closingTime: '17:00',
      isActive: true
    });
    await activeMonument.save();
    activeMonumentId = activeMonument._id;

    const inactiveMonument = new Monument({
      name: 'Inactive Monument',
      capacity: 50,
      baseTicketPrice: 20,
      openingTime: '10:00',
      closingTime: '16:00',
      isActive: false
    });
    await inactiveMonument.save();
    inactiveMonumentId = inactiveMonument._id;
  });

  describe('Public Endpoints', () => {
    it('should get a list of active monuments only', async () => {
      const res = await request(app).get('/api/monuments');
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.monuments.length).toEqual(1);
      expect(res.body.data.monuments[0].name).toEqual('Active Monument');
    });

    it('should get an active monument by id', async () => {
      const res = await request(app).get(`/api/monuments/${activeMonumentId}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toEqual('Active Monument');
    });

    it('should return 404 for an inactive monument', async () => {
      const res = await request(app).get(`/api/monuments/${inactiveMonumentId}`);
      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Admin Endpoints', () => {
    it('should block non-admin from creating a monument', async () => {
      const res = await request(app)
        .post('/api/admin/monuments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'New Monument',
          capacity: 200,
          baseTicketPrice: 100,
          openingTime: '08:00',
          closingTime: '18:00'
        });
      expect(res.statusCode).toEqual(403);
    });

    it('should allow admin to create a monument with valid data', async () => {
      const res = await request(app)
        .post('/api/admin/monuments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin Created Monument',
          capacity: 200,
          baseTicketPrice: 100,
          openingTime: '08:00',
          closingTime: '18:00',
          latitude: 25.0,
          longitude: 80.0
        });
      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toEqual('Admin Created Monument');
    });

    it('should reject creation with invalid coordinates', async () => {
      const res = await request(app)
        .post('/api/admin/monuments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid Monument',
          capacity: 200,
          baseTicketPrice: 100,
          openingTime: '08:00',
          closingTime: '18:00',
          latitude: 100.0,
          longitude: 200.0
        });
      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toContain('Latitude must be a number between -90 and 90');
      expect(res.body.errors).toContain('Longitude must be a number between -180 and 180');
    });

    it('should allow admin to update a monument', async () => {
      const res = await request(app)
        .patch(`/api/admin/monuments/${activeMonumentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ capacity: 150 });
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.capacity).toEqual(150);
    });

    it('should allow admin to delete a monument', async () => {
      const res = await request(app)
        .delete(`/api/admin/monuments/${inactiveMonumentId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
    });
  });
});
