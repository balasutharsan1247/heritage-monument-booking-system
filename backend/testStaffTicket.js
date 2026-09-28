const app = require('./src/app');
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Monument = require('./src/models/Monument');
const Ticket = require('./src/models/Ticket');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const PORT = 3004;

async function runTests() {
  console.log('Starting Staff Ticket Validation Tests...');
  let server;
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/heritage_test');
    console.log('Connected to Test DB');

    await User.deleteMany({});
    await Monument.deleteMany({});
    await Ticket.deleteMany({});

    server = app.listen(PORT, () => console.log(`Test server running on port ${PORT}`));

    const baseUrl = `http://localhost:${PORT}/api`;
    
    // Create staff user
    const staffRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Staff', email: 'staff_val@test.com', password: 'password123', role: 'staff' })
    });
    const staffData = await staffRes.json();
    const staffToken = staffData.data.token;

    // Create visitor
    const visRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Visitor', email: 'visitor_val@test.com', password: 'password123', role: 'visitor' })
    });
    
    const visitorUser = await User.findOne({ email: 'visitor_val@test.com' });
    const visitorId = visitorUser._id;

    // Create Monument
    const monument = new Monument({
      name: 'Validation Monument',
      description: 'A monument',
      location: 'Delhi',
      capacity: 100,
      baseTicketPrice: 100,
      openingTime: '00:00',
      closingTime: '23:59',
      isActive: true
    });
    await monument.save();

    console.log('--- Running Tests ---');

    // Helper to create tickets directly for various states
    const createTicket = async (status, visitDateStr, slotStart, slotEnd) => {
      const tokenNumber = `VAL-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
      const ticket = new Ticket({
        visitorId,
        monumentId: monument._id,
        visitDate: new Date(visitDateStr),
        slotStart,
        slotEnd,
        tokenNumber,
        price: 100,
        status,
      });
      
      const validationPayload = {
        ticketId: ticket._id.toString(),
        monumentId: monument._id.toString(),
        tokenNumber
      };
      
      ticket.qrCodeData = jwt.sign(validationPayload, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
      await ticket.save();
      return ticket;
    };

    const today = new Date();
    const todayStr = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const futureStr = new Date(futureDate.getFullYear(), futureDate.getMonth(), futureDate.getDate()).toISOString();

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    const pastStr = new Date(pastDate.getFullYear(), pastDate.getMonth(), pastDate.getDate()).toISOString();

    // 1. Valid Ticket
    console.log('1. Testing Valid Ticket...');
    const validTicket = await createTicket('booked', todayStr, '00:00', '23:59');
    
    const validRes = await fetch(`${baseUrl}/staff/tickets/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${staffToken}` },
      body: JSON.stringify({ qrPayload: validTicket.qrCodeData, selectedMonumentId: monument._id.toString() })
    });
    const validData = await validRes.json();
    if (validData.success && validData.data.status === 'used') {
      console.log('✅ Valid ticket validated successfully');
    } else {
      console.log(validData);
      throw new Error('Valid ticket failed validation');
    }

    // 2. Duplicate (already used)
    console.log('2. Testing Duplicate Ticket...');
    const duplicateRes = await fetch(`${baseUrl}/staff/tickets/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${staffToken}` },
      body: JSON.stringify({ qrPayload: validTicket.qrCodeData, selectedMonumentId: monument._id.toString() })
    });
    const duplicateData = await duplicateRes.json();
    if (!duplicateData.success && duplicateData.message.includes('already used')) {
      console.log('✅ Duplicate ticket rejected');
    } else {
      console.log(duplicateData);
      throw new Error('Duplicate ticket allowed');
    }

    // 3. Cancelled Ticket
    console.log('3. Testing Cancelled Ticket...');
    const cancelledTicket = await createTicket('cancelled', todayStr, '00:00', '23:59');
    const cancelledRes = await fetch(`${baseUrl}/staff/tickets/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${staffToken}` },
      body: JSON.stringify({ ticketId: cancelledTicket._id.toString() })
    });
    const cancelledData = await cancelledRes.json();
    if (!cancelledData.success && cancelledData.message.includes('cancelled')) {
      console.log('✅ Cancelled ticket rejected');
    } else {
      console.log(cancelledData);
      throw new Error('Cancelled ticket allowed');
    }

    // 4. Expired Ticket (past date)
    console.log('4. Testing Expired Ticket (past date)...');
    const pastTicket = await createTicket('booked', pastStr, '00:00', '23:59');
    const pastRes = await fetch(`${baseUrl}/staff/tickets/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${staffToken}` },
      body: JSON.stringify({ ticketId: pastTicket._id.toString() })
    });
    const pastData = await pastRes.json();
    if (!pastData.success && pastData.message.includes('expired')) {
      console.log('✅ Expired ticket rejected');
    } else {
      console.log(pastData);
      throw new Error('Expired ticket allowed');
    }

    // 5. Expired Ticket (future date)
    console.log('5. Testing Future Ticket (wrong date)...');
    const futureTicket = await createTicket('booked', futureStr, '00:00', '23:59');
    const futureRes = await fetch(`${baseUrl}/staff/tickets/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${staffToken}` },
      body: JSON.stringify({ ticketId: futureTicket._id.toString() })
    });
    const futureData = await futureRes.json();
    if (!futureData.success && futureData.message.includes('future date')) {
      console.log('✅ Future ticket rejected');
    } else {
      console.log(futureData);
      throw new Error('Future ticket allowed');
    }

    // 6. Malformed QR Ticket
    console.log('6. Testing Malformed QR...');
    const malformedRes = await fetch(`${baseUrl}/staff/tickets/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${staffToken}` },
      body: JSON.stringify({ qrPayload: 'invalid.payload.here' })
    });
    const malformedData = await malformedRes.json();
    if (!malformedData.success && malformedData.message.includes('Invalid or expired QR')) {
      console.log('✅ Malformed QR rejected');
    } else {
      console.log(malformedData);
      throw new Error('Malformed QR allowed');
    }

    console.log('\nAll Staff Ticket Validation tests passed! ✅');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (server) server.close();
    await mongoose.connection.close();
    process.exit(0);
  }
}

runTests();
