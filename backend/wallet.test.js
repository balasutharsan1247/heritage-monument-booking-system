const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('./src/app');
const User = require('./src/models/User');
const Wallet = require('./src/models/Wallet');
const WalletTransaction = require('./src/models/WalletTransaction');

const Monument = require('./src/models/Monument');

jest.setTimeout(120000);

let mongoServer;
let visitorToken;
let visitorId;
let adminToken;
let adminId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  const visitor = await User.create({
    name: 'Wallet Visitor',
    email: 'wallet_visitor@test.com',
    passwordHash: 'hashed123',
    role: 'visitor',
  });
  visitorId = visitor._id;
  visitorToken = jwt.sign(
    { id: visitor._id, role: visitor.role },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '1d' }
  );

  const admin = await User.create({
    name: 'Treasury Admin',
    email: 'treasury_admin@test.com',
    passwordHash: 'hashed123',
    role: 'admin',
  });
  adminId = admin._id;
  adminToken = jwt.sign(
    { id: admin._id, role: admin.role },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '1d' }
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Wallet.deleteMany({});
  await WalletTransaction.deleteMany({});
});

describe('Virtual Wallet API Tests', () => {
  it('Should fetch or initialize wallet with zero balance', async () => {
    const res = await request(app)
      .get('/api/wallet')
      .set('Authorization', `Bearer ${visitorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.balance).toBe(0);
    expect(res.body.data.currency).toBe('INR');
    expect(res.body.data.transactions).toEqual([]);
  });

  it('Should successfully top up / credit wallet funds', async () => {
    const res = await request(app)
      .post('/api/wallet/topup')
      .set('Authorization', `Bearer ${visitorToken}`)
      .send({ amount: 500, paymentMethod: 'UPI' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.balance).toBe(500);
    expect(res.body.data.transaction.type).toBe('credit');
    expect(res.body.data.transaction.amount).toBe(500);

    // Verify subsequent top-up accumulates balance
    const res2 = await request(app)
      .post('/api/wallet/topup')
      .set('Authorization', `Bearer ${visitorToken}`)
      .send({ amount: 250, paymentMethod: 'NetBanking' });

    expect(res2.status).toBe(200);
    expect(res2.body.data.balance).toBe(750);
  });

  it('Should reject negative or invalid top-up amount', async () => {
    const res = await request(app)
      .post('/api/wallet/topup')
      .set('Authorization', `Bearer ${visitorToken}`)
      .send({ amount: -100 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('Should successfully debit wallet when funds are sufficient', async () => {
    // First credit ₹1000
    await request(app)
      .post('/api/wallet/topup')
      .set('Authorization', `Bearer ${visitorToken}`)
      .send({ amount: 1000 });

    // Debit ₹250
    const res = await request(app)
      .post('/api/wallet/debit')
      .set('Authorization', `Bearer ${visitorToken}`)
      .send({ amount: 250, purpose: 'ticket_purchase', description: 'Test Entry' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.balance).toBe(750);
    expect(res.body.data.transaction.type).toBe('debit');
    expect(res.body.data.transaction.amount).toBe(250);
  });

  it('Should reject debit when funds are insufficient', async () => {
    // Balance is 0
    const res = await request(app)
      .post('/api/wallet/debit')
      .set('Authorization', `Bearer ${visitorToken}`)
      .send({ amount: 200 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Insufficient wallet balance');
  });

  it('Should list all wallet transactions', async () => {
    await request(app)
      .post('/api/wallet/topup')
      .set('Authorization', `Bearer ${visitorToken}`)
      .send({ amount: 300 });

    await request(app)
      .post('/api/wallet/debit')
      .set('Authorization', `Bearer ${visitorToken}`)
      .send({ amount: 100 });

    const res = await request(app)
      .get('/api/wallet/transactions')
      .set('Authorization', `Bearer ${visitorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.transactions.length).toBe(2);
    expect(res.body.data.total).toBe(2);
  });

  it('Should forbid admin from manually adding money to wallet', async () => {
    const res = await request(app)
      .post('/api/wallet/topup')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 1000 });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Admins cannot manually add money');
  });

  it('Should deduct visitor wallet and increase admin wallet when visitor books ticket', async () => {
    // 1. Give visitor ₹1000
    await request(app)
      .post('/api/wallet/topup')
      .set('Authorization', `Bearer ${visitorToken}`)
      .send({ amount: 1000 });

    // 2. Create monument
    const monument = await Monument.create({
      name: 'Taj Mahal Reserve',
      capacity: 50,
      baseTicketPrice: 200,
      openingTime: '08:00',
      closingTime: '18:00',
      isActive: true,
    });

    // 3. Visitor books 2 tickets (₹400) using wallet
    const bookingRes = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${visitorToken}`)
      .send({
        monumentId: monument._id,
        visitDate: new Date().toISOString().split('T')[0],
        slotStart: '09:00',
        slotEnd: '11:00',
        quantity: 2,
        paymentMethod: 'wallet',
      });

    expect(bookingRes.status).toBe(201);
    expect(bookingRes.body.success).toBe(true);

    // 4. Verify visitor wallet deducted (1000 - 400 = 600)
    const visitorWalletRes = await request(app)
      .get('/api/wallet')
      .set('Authorization', `Bearer ${visitorToken}`);
    expect(visitorWalletRes.body.data.balance).toBe(600);

    // 5. Verify admin treasury wallet increased by ₹400
    const adminWalletRes = await request(app)
      .get('/api/wallet')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminWalletRes.body.data.balance).toBe(400);
    expect(adminWalletRes.body.data.transactions[0].type).toBe('credit');
    expect(adminWalletRes.body.data.transactions[0].purpose).toBe('ticket_revenue');
    expect(adminWalletRes.body.data.transactions[0].amount).toBe(400);

    // 6. Test cancellation: cancel bulk ticket (₹400)
    const ticketId = bookingRes.body.data?._id || bookingRes.body.data[0]?._id;
    const cancelRes = await request(app)
      .post(`/api/tickets/${ticketId}/cancel`)
      .set('Authorization', `Bearer ${visitorToken}`);

    expect(cancelRes.status).toBe(200);

    // 7. Verify visitor refunded (600 + 400 = 1000)
    const visitorRefundRes = await request(app)
      .get('/api/wallet')
      .set('Authorization', `Bearer ${visitorToken}`);
    expect(visitorRefundRes.body.data.balance).toBe(1000);

    // 8. Verify admin treasury deducted (400 - 400 = 0)
    const adminDeductRes = await request(app)
      .get('/api/wallet')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminDeductRes.body.data.balance).toBe(0);
  });
});
