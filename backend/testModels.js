const mongoose = require('mongoose');

// Import models
const User = require('./src/models/User');
const Monument = require('./src/models/Monument');
const Ticket = require('./src/models/Ticket');
const QueueEntry = require('./src/models/QueueEntry');
const VisitorLog = require('./src/models/VisitorLog');
const Prediction = require('./src/models/Prediction');

async function runTests() {
  console.log('Testing Mongoose Models...');

  try {
    // Test User
    const validUser = new User({
      name: 'John Doe',
      email: 'john@example.com',
      passwordHash: 'hashed123',
      role: 'visitor'
    });
    await validUser.validate();
    console.log('✅ User validation passed for valid document.');

    const invalidUser = new User({
      name: 'Jane Doe',
      email: 'jane@example.com',
      // Missing required passwordHash
      role: 'invalid_role' // Invalid enum
    });
    try {
      await invalidUser.validate();
      console.error('❌ User validation failed: Invalid document was accepted.');
    } catch (err) {
      console.log('✅ User validation correctly caught errors:', Object.keys(err.errors).join(', '));
    }

    // Test Monument
    const validMonument = new Monument({
      name: 'Taj Mahal',
      capacity: 1000,
      baseTicketPrice: 50,
      openingTime: '06:00',
      closingTime: '18:00'
    });
    await validMonument.validate();
    console.log('✅ Monument validation passed for valid document.');

    // Test Ticket
    const validTicket = new Ticket({
      visitorId: new mongoose.Types.ObjectId(),
      monumentId: new mongoose.Types.ObjectId(),
      visitDate: new Date(),
      slotStart: '10:00',
      slotEnd: '11:00',
      tokenNumber: 'A123',
      price: 50
    });
    await validTicket.validate();
    console.log('✅ Ticket validation passed for valid document.');

    // Test QueueEntry
    const validQueueEntry = new QueueEntry({
      ticketId: new mongoose.Types.ObjectId(),
      monumentId: new mongoose.Types.ObjectId(),
      tokenNumber: 'A123'
    });
    await validQueueEntry.validate();
    console.log('✅ QueueEntry validation passed for valid document.');

    // Test VisitorLog
    const validLog = new VisitorLog({
      monumentId: new mongoose.Types.ObjectId(),
      date: new Date(),
      hour: 10,
      dayType: 'weekend'
    });
    await validLog.validate();
    console.log('✅ VisitorLog validation passed for valid document.');

    // Test Prediction
    const validPrediction = new Prediction({
      monumentId: new mongoose.Types.ObjectId(),
      targetDate: new Date(),
      predictedVisitorCount: 500
    });
    await validPrediction.validate();
    console.log('✅ Prediction validation passed for valid document.');

    console.log('\nAll model validation tests executed successfully.');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

runTests();
