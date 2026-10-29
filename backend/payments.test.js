const request = require('supertest');
const crypto = require('crypto');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('./src/app');
const User = require('./src/models/User');
const Monument = require('./src/models/Monument');
const Wallet = require('./src/models/Wallet');
const Ticket = require('./src/models/Ticket');

jest.setTimeout(120000);

let mongoServer;
let visitorToken;
let visitorId;
let monumentId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  const visitor = await User.create({
    name: 'Payment Visitor',
    email: 'pay_visitor@test.com',
    passwordHash: 'hashed123',
    role: 'visitor',
  });
  visitorId = visitor._id;
  visitorToken = jwt.sign(
    { id: visitor._id, role: visitor.role },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '1d' }
  );

  const monument = await Monument.create({
    name: 'Test Taj Mahal',
    description: 'A magnificent test monument',
    location: 'Agra, UP',
    openingTime: '06:00',
    closingTime: '18:00',
    capacity: 100,
    baseTicketPrice: 50,
    foreignTicketPrice: 500,
    isActive: true,
  });
  monumentId = monument._id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Razorpay Payments API', () => {
  it('GET /api/payments/key - returns Razorpay key and mock status', async () => {
    const res = await request(app).get('/api/payments/key');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('keyId');
  });

  it('POST /api/payments/create-order - creates an order in subunits (paise)', async () => {
    const res = await request(app)
      .post('/api/payments/create-order')
      .set('Authorization', `Bearer ${visitorToken}`)
      .send({
        amount: 250,
        purpose: 'ticket',
        details: { monumentId: monumentId.toString() },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.order).toBeDefined();
    expect(res.body.order.amount).toBe(25000); // 250 * 100 paise
  });

  it('POST /api/payments/verify - top-ups wallet on verified payment', async () => {
    const orderRes = await request(app)
      .post('/api/payments/create-order')
      .set('Authorization', `Bearer ${visitorToken}`)
      .send({
        amount: 500,
        purpose: 'wallet_topup',
      });

    const orderId = orderRes.body.order.id;

    const crypto = require('crypto');
    const paymentId1 = 'pay_test_topup_123';
    const sig1 = process.env.RAZORPAY_KEY_SECRET
      ? crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId1}`).digest('hex')
      : 'sig_test_123';

    const verifyRes = await request(app)
      .post('/api/payments/verify')
      .set('Authorization', `Bearer ${visitorToken}`)
      .send({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId1,
        razorpay_signature: sig1,
        purpose: 'wallet_topup',
        details: {
          amount: 500,
          description: 'Top-up via Razorpay Test',
        },
      });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);
    expect(verifyRes.body.data.balance).toBe(500);

    const wallet = await Wallet.findOne({ userId: visitorId });
    expect(wallet.balance).toBe(500);
  });

  it('POST /api/payments/verify - issues confirmed ticket on verified booking', async () => {
    const orderRes = await request(app)
      .post('/api/payments/create-order')
      .set('Authorization', `Bearer ${visitorToken}`)
      .send({
        amount: 100, // 2 domestic tickets @ 50
        purpose: 'ticket',
      });

    const orderId = orderRes.body.order.id;

    const paymentId2 = 'pay_test_ticket_456';
    const sig2 = process.env.RAZORPAY_KEY_SECRET
      ? crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId2}`).digest('hex')
      : 'sig_test_456';

    const verifyRes = await request(app)
      .post('/api/payments/verify')
      .set('Authorization', `Bearer ${visitorToken}`)
      .send({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId2,
        razorpay_signature: sig2,
        purpose: 'ticket',
        details: {
          monumentId: monumentId.toString(),
          visitDate: new Date().toISOString().split('T')[0],
          slotStart: '09:00',
          slotEnd: '11:00',
          quantity: 2,
          visitorCategory: 'domestic',
        },
      });

    expect(verifyRes.status).toBe(201);
    expect(verifyRes.body.success).toBe(true);
    expect(verifyRes.body.primaryTicketId).toBeDefined();

    const ticket = await Ticket.findById(verifyRes.body.primaryTicketId);
    expect(ticket).toBeDefined();
    expect(ticket.numberOfPeople).toBe(2);
    expect(ticket.price).toBe(100);
    expect(ticket.paymentMethod).toBe('razorpay');
    expect(ticket.paymentId).toBe('pay_test_ticket_456');
    expect(ticket.orderId).toBe(orderId);
  });

  it('syncExpiredTickets - marks tickets as expired if slot has passed without check-in', async () => {
    const { syncExpiredTickets } = require('./src/services/ticketExpiryService');
    const pastTicket = await Ticket.create({
      visitorId,
      monumentId,
      visitDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
      slotStart: '09:00',
      slotEnd: '11:00',
      tokenNumber: 'PAST-123456-EX',
      numberOfPeople: 1,
      price: 50,
      visitorCategory: 'domestic',
      status: 'booked',
    });

    await syncExpiredTickets();

    const refreshedTicket = await Ticket.findById(pastTicket._id);
    expect(refreshedTicket.status).toBe('expired');
  });
});
