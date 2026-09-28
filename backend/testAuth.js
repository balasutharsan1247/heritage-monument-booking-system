const app = require('./src/app');
const mongoose = require('mongoose');
const User = require('./src/models/User');

const PORT = 3001;

async function runTests() {
  console.log('Starting Auth Tests...');
  let server;
  try {
    // Connect to a test database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/heritage_test');
    console.log('Connected to Test DB');

    // Clear users
    await User.deleteMany({});

    server = app.listen(PORT, () => console.log(`Test server running on port ${PORT}`));

    const baseUrl = `http://localhost:${PORT}/api`;
    let token = '';

    // 1. Register User
    console.log('Testing Registration...');
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Visitor', email: 'visitor@test.com', password: 'password123', role: 'visitor' })
    });
    const regData = await regRes.json();
    if (regData.success && regData.data.token && !regData.data.passwordHash) {
      console.log('✅ Registration successful (Token received, no passwordHash)');
    } else {
      throw new Error('Registration failed or exposed passwordHash');
    }

    // 2. Login User
    console.log('Testing Login...');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'visitor@test.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    if (loginData.success && loginData.data.token) {
      token = loginData.data.token;
      console.log('✅ Login successful (Token received)');
    } else {
      throw new Error('Login failed');
    }

    // 3. Invalid credentials
    console.log('Testing Invalid Login...');
    const invalidLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'visitor@test.com', password: 'wrongpassword' })
    });
    const invalidLoginData = await invalidLoginRes.json();
    if (!invalidLoginData.success) {
      console.log('✅ Invalid login rejected safely');
    } else {
      throw new Error('Invalid login accepted');
    }

    // 4. Role-based authorization - Visitor
    console.log('Testing Visitor Route...');
    const visRes = await fetch(`${baseUrl}/test/visitor`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const visData = await visRes.json();
    if (visData.success) {
      console.log('✅ Visitor route accessible');
    } else {
      throw new Error('Visitor route blocked');
    }

    // 5. Role-based authorization - Staff (should fail)
    console.log('Testing Staff Route with Visitor Token...');
    const staffRes = await fetch(`${baseUrl}/test/staff`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (staffRes.status === 403) {
      console.log('✅ Staff route correctly blocked for visitor');
    } else {
      throw new Error('Staff route accessible to visitor');
    }

    // 6. Role-based authorization - Admin (should fail)
    console.log('Testing Admin Route with Visitor Token...');
    const adminRes = await fetch(`${baseUrl}/test/admin`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (adminRes.status === 403) {
      console.log('✅ Admin route correctly blocked for visitor');
    } else {
      throw new Error('Admin route accessible to visitor');
    }

    console.log('\nAll auth & authorization tests passed! ✅');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (server) server.close();
    await mongoose.connection.close();
    process.exit(0);
  }
}

runTests();
