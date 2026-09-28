const app = require('./src/app');
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Monument = require('./src/models/Monument');
const Ticket = require('./src/models/Ticket');
const modelService = require('./src/services/modelService');

const PORT = 3006;

async function runTests() {
  console.log('Starting Prediction API Tests...');
  let server;
  let originalPredictVisitorCount;
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/heritage_test_predictions');
    console.log('Connected to Test DB');

    await User.deleteMany({});
    await Monument.deleteMany({});
    await Ticket.deleteMany({});

    server = app.listen(PORT, () => console.log(`Test server running on port ${PORT}`));
    const baseUrl = `http://localhost:${PORT}/api`;

    // Register users
    const adminRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Admin Pred', email: 'adminpred@example.com', password: 'password123', role: 'admin' })
    });
    const adminData = await adminRes.json();
    const adminToken = adminData.data.token;
    const adminUserId = adminData.data._id;

    const visitorRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Visitor Pred', email: 'visitorpred@example.com', password: 'password123', role: 'visitor' })
    });
    const visitorData = await visitorRes.json();
    const visitorToken = visitorData.data.token;
    const visitorUserId = visitorData.data._id;

    // Create Monuments
    const monument = await Monument.create({
      name: 'Prediction Monument', description: 'desc', location: 'City', latitude: 10, longitude: 20, capacity: 100, baseTicketPrice: 50, openingTime: '09:00', closingTime: '17:00'
    });
    const monumentId = monument._id.toString();

    const emptyMonument = await Monument.create({
      name: 'Empty Monument', description: 'desc', location: 'City', latitude: 10, longitude: 20, capacity: 100, baseTicketPrice: 50, openingTime: '09:00', closingTime: '17:00'
    });
    const emptyMonumentId = emptyMonument._id.toString();

    // Create Ticket for yesterday
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    yesterday.setUTCHours(10, 0, 0, 0);

    await Ticket.create({
      visitorId: visitorUserId, monumentId: monument._id, visitDate: yesterday, slotStart: '09:00', slotEnd: '10:00', tokenNumber: 'P-1234', price: 50, status: 'used'
    });

    // Save original service method
    originalPredictVisitorCount = modelService.predictVisitorCount;

    console.log('---');
    
    // Test 1: Successful prediction for valid future date
    console.log('Testing successful prediction (future date)...');
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    let dateStr = tomorrow.toISOString().split('T')[0];
    let res = await fetch(`${baseUrl}/admin/predictions/${monumentId}?date=${dateStr}`, { headers: { 'Authorization': `Bearer ${adminToken}` } });
    let data = await res.json();
    if (res.status === 200 && data.success && data.data.predictedVisitorCount === 0) {
      console.log('✅ Prediction for tomorrow returned 0 successfully (prev day has no tickets)');
    } else {
      throw new Error(`Prediction future failed. Status: ${res.status}, body: ${JSON.stringify(data)}`);
    }

    // Test 2: Successful prediction (target=today, prev=yesterday, should return 1)
    console.log('Testing successful prediction (target=today)...');
    const today = new Date();
    dateStr = today.toISOString().split('T')[0];
    res = await fetch(`${baseUrl}/admin/predictions/${monumentId}?date=${dateStr}`, { headers: { 'Authorization': `Bearer ${adminToken}` } });
    data = await res.json();
    if (res.status === 200 && data.data.predictedVisitorCount === 1) {
      console.log('✅ Prediction for today returned 1 successfully (prev day has 1 ticket)');
    } else {
      throw new Error('Prediction for today failed');
    }

    // Test 3: Unauthorized Access (No token, Visitor token)
    console.log('Testing unauthorized access...');
    let resNoToken = await fetch(`${baseUrl}/admin/predictions/${monumentId}?date=${dateStr}`);
    let resVisitor = await fetch(`${baseUrl}/admin/predictions/${monumentId}?date=${dateStr}`, { headers: { 'Authorization': `Bearer ${visitorToken}` } });
    if (resNoToken.status === 401 && resVisitor.status === 403) {
      console.log('✅ Unauthorized access rejected');
    } else {
      throw new Error('Unauthorized access test failed');
    }

    // Test 4: Invalid date format
    console.log('Testing invalid date format...');
    res = await fetch(`${baseUrl}/admin/predictions/${monumentId}?date=invalid-date`, { headers: { 'Authorization': `Bearer ${adminToken}` } });
    data = await res.json();
    if (res.status === 400 && data.message.includes('Invalid date format')) {
      console.log('✅ Invalid date format handled');
    } else {
      throw new Error('Invalid date format test failed');
    }

    // Test 5: Past date
    console.log('Testing past date...');
    const past = new Date();
    past.setUTCDate(past.getUTCDate() - 5);
    res = await fetch(`${baseUrl}/admin/predictions/${monumentId}?date=${past.toISOString().split('T')[0]}`, { headers: { 'Authorization': `Bearer ${adminToken}` } });
    if (res.status === 400) {
      console.log('✅ Past date handled');
    } else {
      throw new Error('Past date test failed');
    }

    // Test 6: Missing input features (no historical data)
    console.log('Testing missing input features...');
    res = await fetch(`${baseUrl}/admin/predictions/${emptyMonumentId}?date=${dateStr}`, { headers: { 'Authorization': `Bearer ${adminToken}` } });
    data = await res.json();
    if (res.status === 422 && data.message.includes('Missing input features')) {
      console.log('✅ Missing input features handled');
    } else {
      throw new Error(`Missing input features test failed. Status: ${res.status}, Message: ${data.message}`);
    }

    // Test 7: Unavailable model version mock
    console.log('Testing unavailable model version...');
    modelService.predictVisitorCount = async () => {
      const err = new Error('Unsupported model version'); err.type = 'UNSUPPORTED_VERSION'; throw err;
    };
    res = await fetch(`${baseUrl}/admin/predictions/${monumentId}?date=${dateStr}`, { headers: { 'Authorization': `Bearer ${adminToken}` } });
    if (res.status === 400) {
      console.log('✅ Unsupported model version handled');
    } else {
      throw new Error('Unsupported model version test failed');
    }

    // Test 8: Service failure mock
    console.log('Testing service failure...');
    modelService.predictVisitorCount = async () => {
      const err = new Error('Model service connection failed'); err.type = 'SERVICE_UNAVAILABLE'; throw err;
    };
    res = await fetch(`${baseUrl}/admin/predictions/${monumentId}?date=${dateStr}`, { headers: { 'Authorization': `Bearer ${adminToken}` } });
    if (res.status === 503) {
      console.log('✅ Service failure handled');
    } else {
      throw new Error('Service failure test failed');
    }

    console.log('\nAll Prediction API tests passed! ✅');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (originalPredictVisitorCount) {
      modelService.predictVisitorCount = originalPredictVisitorCount;
    }
    if (server) server.close();
    await mongoose.connection.close();
    process.exit(0);
  }
}

runTests();
