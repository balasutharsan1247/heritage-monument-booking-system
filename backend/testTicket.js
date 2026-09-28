const app = require('./src/app');
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Monument = require('./src/models/Monument');
const Ticket = require('./src/models/Ticket');

const PORT = 3002; // Use a different port than testAuth

async function runTests() {
  console.log('Starting Ticket Booking Tests...');
  let server;
  try {
    // Connect to a test database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/heritage_test');
    console.log('Connected to Test DB');

    // Clear collections
    await User.deleteMany({});
    await Monument.deleteMany({});
    await Ticket.deleteMany({});

    server = app.listen(PORT, () => console.log(`Test server running on port ${PORT}`));

    const baseUrl = `http://localhost:${PORT}/api`;
    
    // Create a visitor user and get token
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Visitor', email: 'visitor_ticket@test.com', password: 'password123', role: 'visitor' })
    });
    const regData = await regRes.json();
    const visitorToken = regData.data.token;

    // Create a monument directly using Mongoose
    const monument = new Monument({
      name: 'Test Taj Mahal',
      description: 'A test monument',
      location: 'Agra',
      latitude: 27.1751,
      longitude: 78.0421,
      capacity: 2, // Very low capacity for testing
      baseTicketPrice: 50,
      openingTime: '09:00',
      closingTime: '17:00',
      isActive: true
    });
    await monument.save();
    
    console.log('--- Running Tests ---');

    // 1. Unauthorized access
    console.log('1. Testing Unauthorized Access...');
    const unauthRes = await fetch(`${baseUrl}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        monumentId: monument._id,
        visitDate: new Date().toISOString().split('T')[0],
        slotStart: '10:00',
        slotEnd: '11:00'
      })
    });
    if (unauthRes.status === 401) {
      console.log('✅ Unauthorized access rejected');
    } else {
      throw new Error('Unauthorized access allowed');
    }

    // 2. Invalid slot (outside opening hours)
    console.log('2. Testing Invalid Slot...');
    const invalidSlotRes = await fetch(`${baseUrl}/tickets`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${visitorToken}`
      },
      body: JSON.stringify({
        monumentId: monument._id,
        visitDate: new Date().toISOString().split('T')[0],
        slotStart: '08:00', // Opens at 09:00
        slotEnd: '09:00'
      })
    });
    const invalidSlotData = await invalidSlotRes.json();
    if (!invalidSlotData.success && invalidSlotData.message.includes('outside of monument opening hours')) {
      console.log('✅ Invalid slot properly rejected');
    } else {
      console.log(invalidSlotData);
      throw new Error('Invalid slot accepted');
    }

    // 3. Valid booking
    console.log('3. Testing Valid Booking...');
    const validBookingRes = await fetch(`${baseUrl}/tickets`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${visitorToken}`
      },
      body: JSON.stringify({
        monumentId: monument._id,
        visitDate: new Date().toISOString().split('T')[0],
        slotStart: '10:00',
        slotEnd: '11:00',
        quantity: 1
      })
    });
    const validBookingData = await validBookingRes.json();
    if (validBookingData.success && validBookingData.data.tokenNumber && validBookingData.data.qrCodeData) {
      console.log('✅ Valid booking successful');
    } else {
      console.log(validBookingData);
      throw new Error('Valid booking failed');
    }

    // 4. Test duplicate booking for same user
    console.log('4. Testing Duplicate Booking for same user...');
    const duplicateBookingRes = await fetch(`${baseUrl}/tickets`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${visitorToken}`
      },
      body: JSON.stringify({
        monumentId: monument._id,
        visitDate: new Date().toISOString().split('T')[0],
        slotStart: '10:00',
        slotEnd: '11:00',
        quantity: 1
      })
    });
    const duplicateBookingData = await duplicateBookingRes.json();
    if (!duplicateBookingData.success && duplicateBookingData.message.includes('already have a booking')) {
      console.log('✅ Duplicate booking rejected');
    } else {
      console.log(duplicateBookingData);
      throw new Error('Duplicate booking allowed');
    }

    // Create another user to test capacity
    const regRes2 = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Visitor 2', email: 'visitor2_ticket@test.com', password: 'password123', role: 'visitor' })
    });
    const visitorToken2 = (await regRes2.json()).data.token;

    // 5. Test capacity limit
    console.log('5. Testing Capacity Limit...');
    const capacityRes = await fetch(`${baseUrl}/tickets`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${visitorToken2}`
      },
      body: JSON.stringify({
        monumentId: monument._id,
        visitDate: new Date().toISOString().split('T')[0],
        slotStart: '10:00',
        slotEnd: '11:00',
        quantity: 2 // This would make total 3 (1 from before + 2), which > capacity 2
      })
    });
    const capacityData = await capacityRes.json();
    if (!capacityData.success && capacityData.message.includes('Not enough capacity')) {
      console.log('✅ Capacity limit enforced');
    } else {
      console.log(capacityData);
      throw new Error('Capacity limit bypassed');
    }
    
    console.log('\nAll Ticket tests passed! ✅');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (server) server.close();
    await mongoose.connection.close();
    process.exit(0);
  }
}

runTests();
