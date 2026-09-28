const app = require('./src/app');
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Monument = require('./src/models/Monument');
const Ticket = require('./src/models/Ticket');
const QueueEntry = require('./src/models/QueueEntry');

const PORT = 3004;

async function runTests() {
  console.log('Starting Admin Dashboard Tests...');
  let server;
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/heritage_test');
    console.log('Connected to Test DB');

    await User.deleteMany({});
    await Monument.deleteMany({});
    await Ticket.deleteMany({});
    await QueueEntry.deleteMany({});

    server = app.listen(PORT, () => console.log(`Test server running on port ${PORT}`));
    const baseUrl = `http://localhost:${PORT}/api`;

    // Setup Admin
    const adminRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Admin', email: 'admin@test.com', password: 'password', role: 'admin' })
    });
    const adminData = await adminRes.json();
    const adminToken = adminData.data.token;

    // Setup Visitor
    const visRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Visitor', email: 'visitor@test.com', password: 'password', role: 'visitor' })
    });
    const visData = await visRes.json();
    const visToken = visData.data.token;
    const visitorId = visData.data._id;

    // Setup Monument
    const monRes = await fetch(`${baseUrl}/admin/monuments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Dashboard Monument',
        description: 'Test',
        location: 'Test',
        capacity: 100,
        baseTicketPrice: 50,
        openingTime: '09:00',
        closingTime: '17:00'
      })
    });
    const monData = await monRes.json();
    const monumentId = monData.data._id;

    const today = new Date();
    today.setHours(0,0,0,0);

    // Seed Data
    // Ticket 1: used (visitor = 1, ticket = 1, rev = 50) - 10:00 slot
    const t1 = await Ticket.create({
      visitorId,
      monumentId,
      visitDate: today,
      slotStart: '10:00',
      slotEnd: '11:00',
      tokenNumber: 'T1',
      price: 50,
      status: 'used'
    });

    // Ticket 2: booked (visitor = 0, ticket = 1, rev = 50) - 11:00 slot
    const t2 = await Ticket.create({
      visitorId,
      monumentId,
      visitDate: today,
      slotStart: '11:00',
      slotEnd: '12:00',
      tokenNumber: 'T2',
      price: 50,
      status: 'booked'
    });

    // Ticket 3: cancelled (ignored)
    const t3 = await Ticket.create({
      visitorId,
      monumentId,
      visitDate: today,
      slotStart: '12:00',
      slotEnd: '13:00',
      tokenNumber: 'T3',
      price: 50,
      status: 'cancelled'
    });

    // Queue Entries
    const t1joined = new Date(today);
    t1joined.setHours(10, 0, 0, 0);
    const t1called = new Date(t1joined.getTime() + 5 * 60000); // 5 mins later
    const t1completed = new Date(t1called.getTime() + 10 * 60000); // 10 mins later

    await QueueEntry.create({
      ticketId: t1._id,
      monumentId,
      tokenNumber: 'T1',
      status: 'completed',
      joinedAt: t1joined,
      calledAt: t1called,
      completedAt: t1completed
    });

    await QueueEntry.create({
      ticketId: t2._id,
      monumentId,
      tokenNumber: 'T2',
      status: 'waiting',
      joinedAt: new Date(today.getTime() + 11*3600*1000)
    });

    // TEST 1: Authorization
    console.log('Testing Authorization...');
    const dashAuthFail = await fetch(`${baseUrl}/admin/dashboard/summary`, {
      headers: { 'Authorization': `Bearer ${visToken}` }
    });
    if (dashAuthFail.status === 403) {
      console.log('✅ Visitor blocked from admin dashboard');
    } else {
      throw new Error(`Auth test failed: ${dashAuthFail.status}`);
    }

    // TEST 2: GET Summary
    console.log('Testing GET Summary...');
    const dashSum = await fetch(`${baseUrl}/admin/dashboard/summary`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const dashSumData = await dashSum.json();
    if (dashSumData.success && dashSumData.data.measured.totalTickets === 2 && dashSumData.data.measured.totalRevenue === 100 && dashSumData.data.measured.totalVisitors === 1) {
      console.log('✅ Summary correct');
    } else {
      console.error(dashSumData);
      throw new Error('Summary data incorrect');
    }

    // TEST 3: GET Monument Summary
    console.log('Testing GET Monument Summary...');
    const dashMonSum = await fetch(`${baseUrl}/admin/dashboard/${monumentId}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const dashMonSumData = await dashMonSum.json();
    if (dashMonSumData.success && dashMonSumData.data.measured.totalTickets === 2) {
      console.log('✅ Monument Summary correct');
    } else {
      throw new Error('Monument Summary data incorrect');
    }

    // TEST 4: GET Hourly
    console.log('Testing GET Hourly...');
    const dashHourly = await fetch(`${baseUrl}/admin/dashboard/${monumentId}/hourly`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const dashHourlyData = await dashHourly.json();
    if (dashHourlyData.success && dashHourlyData.data.measured.length === 2) { // hour 10 and hour 11
      const h10 = dashHourlyData.data.measured.find(h => h.hour === 10);
      const h11 = dashHourlyData.data.measured.find(h => h.hour === 11);
      if (h10.visitors === 1 && h11.visitors === 0) {
        console.log('✅ Hourly breakdown correct');
      } else {
        throw new Error('Hourly breakdown data incorrect');
      }
    } else {
      throw new Error('Hourly breakdown missing or incorrect');
    }

    // TEST 5: GET Queue Analytics
    console.log('Testing GET Queue Analytics...');
    const dashQueue = await fetch(`${baseUrl}/admin/dashboard/${monumentId}/queue`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const dashQueueData = await dashQueue.json();
    if (dashQueueData.success && dashQueueData.data.measured.totalEntries === 2) {
      const waitMins = dashQueueData.data.measured.averageWaitTimeMinutes;
      if (waitMins === 5) { // 5 mins
        console.log('✅ Queue analytics and average wait time correct');
      } else {
        throw new Error(`Queue wait time incorrect: expected 5, got ${waitMins}`);
      }
    } else {
      throw new Error('Queue analytics incorrect');
    }

    console.log('\nAll Admin Dashboard tests passed! ✅');

  } catch (error) {
    console.error('Test Failed:', error);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
      await mongoose.connection.close();
      console.log('Server and DB connection closed.');
    }
  }
}

runTests();
