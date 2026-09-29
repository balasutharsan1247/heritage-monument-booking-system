const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('./src/app');
const User = require('./src/models/User');
const Monument = require('./src/models/Monument');
const Ticket = require('./src/models/Ticket');
const QueueEntry = require('./src/models/QueueEntry');

jest.setTimeout(120000); // Increase timeout for MongoMemoryServer

let mongoServer;
let adminToken;
let staffToken;
let visitorToken;
let adminId;
let staffId;
let visitorId;
let monumentId;
let tickets = [];

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Setup Users
  const admin = await User.create({ name: 'Admin', email: 'admin@test.com', passwordHash: 'hashed', role: 'admin' });
  adminId = admin._id;
  adminToken = require('jsonwebtoken').sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });

  const monument = await Monument.create({
    name: 'Test Monument',
    location: 'Test Location',
    capacity: 100,
    baseTicketPrice: 10,
    openingTime: '09:00',
    closingTime: '17:00'
  });
  monumentId = monument._id;

  const staff = await User.create({ name: 'Staff', email: 'staff@test.com', passwordHash: 'hashed', role: 'staff', assignedMonument: monument._id });
  staffId = staff._id;
  staffToken = require('jsonwebtoken').sign({ id: staff._id, role: staff.role }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });

  const visitor = await User.create({ name: 'Visitor', email: 'visitor@test.com', passwordHash: 'hashed', role: 'visitor' });
  visitorId = visitor._id;
  visitorToken = require('jsonwebtoken').sign({ id: visitor._id, role: visitor.role }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });

  // Setup Tickets
  const ticket1 = await Ticket.create({ visitorId: visitor._id, monumentId: monument._id, visitDate: new Date(), slotStart: '10:00', slotEnd: '11:00', tokenNumber: 'T1', price: 10, status: 'booked' });
  const ticket2 = await Ticket.create({ visitorId: visitor._id, monumentId: monument._id, visitDate: new Date(), slotStart: '10:00', slotEnd: '11:00', tokenNumber: 'T2', price: 10, status: 'booked' });
  const ticket3 = await Ticket.create({ visitorId: visitor._id, monumentId: monument._id, visitDate: new Date(), slotStart: '10:00', slotEnd: '11:00', tokenNumber: 'T3', price: 10, status: 'booked' });
  tickets = [ticket1, ticket2, ticket3];
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await QueueEntry.deleteMany({});
});

describe('Queue Management Tests', () => {
  it('Should reject staff without proper assignedMonument', async () => {
    const unassignedStaff = await User.create({ name: 'Staff2', email: 'staff2@test.com', passwordHash: 'hashed', role: 'staff' });
    const token = require('jsonwebtoken').sign({ id: unassignedStaff._id, role: unassignedStaff.role }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });

    const res = await request(app)
      .get(`/api/staff/queues/${monumentId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(403);
  });

  it('Should fetch current queue for permitted staff', async () => {
    await QueueEntry.create({ ticketId: tickets[0]._id, monumentId, tokenNumber: tickets[0].tokenNumber, status: 'waiting' });

    const res = await request(app)
      .get(`/api/staff/queues/${monumentId}`)
      .set('Authorization', `Bearer ${staffToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].status).toBe('waiting');
  });

  it('Should enforce queue ordering (FIFO) and transition to called', async () => {
    await QueueEntry.create({ ticketId: tickets[0]._id, monumentId, tokenNumber: tickets[0].tokenNumber, status: 'waiting', joinedAt: new Date(Date.now() - 1000) });
    await QueueEntry.create({ ticketId: tickets[1]._id, monumentId, tokenNumber: tickets[1].tokenNumber, status: 'waiting', joinedAt: new Date(Date.now()) });

    // Call Next
    const res = await request(app)
      .post(`/api/staff/queues/${monumentId}/call-next`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokenNumber).toBe(tickets[0].tokenNumber); // Ticket 1 was created earlier
    expect(res.body.data.status).toBe('called');
  });

  it('Should skip a waiting visitor', async () => {
    const entry = await QueueEntry.create({ ticketId: tickets[0]._id, monumentId, tokenNumber: tickets[0].tokenNumber, status: 'waiting' });

    const res = await request(app)
      .post(`/api/staff/queues/${monumentId}/${entry._id}/skip`)
      .set('Authorization', `Bearer ${staffToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('skipped');
  });

  it('Should reject invalid state transition: waiting -> completed', async () => {
    const entry = await QueueEntry.create({ ticketId: tickets[0]._id, monumentId, tokenNumber: tickets[0].tokenNumber, status: 'waiting' });

    const res = await request(app)
      .post(`/api/staff/queues/${monumentId}/${entry._id}/complete`)
      .set('Authorization', `Bearer ${staffToken}`);
    
    expect(res.status).toBe(400); // Invalid state transition
    expect(res.body.message).toContain('Invalid state transition');
  });

  it('Should complete a called visitor', async () => {
    const entry = await QueueEntry.create({ ticketId: tickets[0]._id, monumentId, tokenNumber: tickets[0].tokenNumber, status: 'called' });

    const res = await request(app)
      .post(`/api/staff/queues/${monumentId}/${entry._id}/complete`)
      .set('Authorization', `Bearer ${staffToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('completed');
  });

  it('Should calculate estimated wait for visitor', async () => {
    await QueueEntry.create({ ticketId: tickets[0]._id, monumentId, tokenNumber: tickets[0].tokenNumber, status: 'waiting', joinedAt: new Date(Date.now() - 2000) });
    await QueueEntry.create({ ticketId: tickets[1]._id, monumentId, tokenNumber: tickets[1].tokenNumber, status: 'waiting', joinedAt: new Date(Date.now() - 1000) });
    const myEntry = await QueueEntry.create({ ticketId: tickets[2]._id, monumentId, tokenNumber: tickets[2].tokenNumber, status: 'waiting', joinedAt: new Date() });

    const res = await request(app)
      .get(`/api/queues/my/${tickets[2]._id}`)
      .set('Authorization', `Bearer ${visitorToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.data.entriesAhead).toBe(2);
    expect(res.body.data.estimatedWait).toBe(10); // 2 * 5
  });
});
