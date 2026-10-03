const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('./src/app');
const User = require('./src/models/User');
const Monument = require('./src/models/Monument');
const Ticket = require('./src/models/Ticket');
const jwt = require('jsonwebtoken');

jest.setTimeout(120000);

let mongoServer;
let visitorToken;
let visitorId;
let monument;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  const visitor = new User({
    name: 'Test Visitor',
    email: 'visitor@test.com',
    passwordHash: 'password123',
    role: 'visitor'
  });
  await visitor.save();
  visitorId = visitor._id;
  visitorToken = jwt.sign({ id: visitor._id, role: visitor.role }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1h' });

  monument = new Monument({
    name: 'Red Fort',
    location: 'Delhi',
    imageUrl: 'https://example.com/updated-red-fort.jpg',
    capacity: 100,
    baseTicketPrice: 60,
    openingTime: '09:00',
    closingTime: '17:00',
    isActive: true
  });
  await monument.save();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Ticket API endpoints', () => {
  it('should return populated monumentId with imageUrl in getMyTickets and getTicket', async () => {
    // 1. Book a ticket
    const today = new Date().toISOString().split('T')[0];
    const bookRes = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${visitorToken}`)
      .send({
        monumentId: monument._id.toString(),
        visitDate: today,
        slotStart: '10:00',
        slotEnd: '12:00',
        quantity: 1,
        paymentMethod: 'direct'
      });

    expect(bookRes.statusCode).toEqual(201);
    expect(bookRes.body.success).toBe(true);
    const ticketId = bookRes.body.data._id;

    // 2. Fetch /api/tickets/my
    const myTicketsRes = await request(app)
      .get('/api/tickets/my')
      .set('Authorization', `Bearer ${visitorToken}`);

    expect(myTicketsRes.statusCode).toEqual(200);
    expect(myTicketsRes.body.success).toBe(true);
    expect(myTicketsRes.body.data.length).toBeGreaterThan(0);

    const ticket = myTicketsRes.body.data.find(t => t._id.toString() === ticketId.toString());
    expect(ticket).toBeDefined();
    expect(ticket.monumentId).toBeDefined();
    expect(ticket.monumentId.name).toEqual('Red Fort');
    expect(ticket.monumentId.location).toEqual('Delhi');
    expect(ticket.monumentId.imageUrl).toEqual('https://example.com/updated-red-fort.jpg');

    // 3. Fetch /api/tickets/:id
    const singleTicketRes = await request(app)
      .get(`/api/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${visitorToken}`);

    expect(singleTicketRes.statusCode).toEqual(200);
    expect(singleTicketRes.body.success).toBe(true);
    expect(singleTicketRes.body.data.monumentId.imageUrl).toEqual('https://example.com/updated-red-fort.jpg');
  });

  it('reflects updated monument imageUrl dynamically for existing tickets', async () => {
    // Admin updates the monument imageUrl
    const newImageUrl = 'https://example.com/newly-updated-red-fort.jpg';
    await Monument.findByIdAndUpdate(monument._id, { imageUrl: newImageUrl });

    // Fetch /api/tickets/my again
    const myTicketsRes = await request(app)
      .get('/api/tickets/my')
      .set('Authorization', `Bearer ${visitorToken}`);

    expect(myTicketsRes.statusCode).toEqual(200);
    const updatedTicket = myTicketsRes.body.data[0];
    expect(updatedTicket.monumentId.imageUrl).toEqual(newImageUrl);
  });
});
