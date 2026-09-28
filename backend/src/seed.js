require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Monument = require('./models/Monument');
const VisitorLog = require('./models/VisitorLog');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding...');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // 1. Users
    // Read passwords from env or use explicitly labelled development-only passwords
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'DevOnlyPassword_Admin';
    const staffPassword = process.env.SEED_STAFF_PASSWORD || 'DevOnlyPassword_Staff';
    const visitorPassword = process.env.SEED_VISITOR_PASSWORD || 'DevOnlyPassword_Visitor';
    
    const adminHash = await bcrypt.hash(adminPassword, 10);
    const staffHash = await bcrypt.hash(staffPassword, 10);
    const visitorHash = await bcrypt.hash(visitorPassword, 10);

    const usersToSeed = [
      { name: 'Admin Demo', email: 'admin@demo.local', role: 'admin', passwordHash: adminHash },
      { name: 'Staff Demo', email: 'staff@demo.local', role: 'staff', passwordHash: staffHash },
      { name: 'Visitor One', email: 'visitor1@demo.local', role: 'visitor', passwordHash: visitorHash },
      { name: 'Visitor Two', email: 'visitor2@demo.local', role: 'visitor', passwordHash: visitorHash },
    ];

    for (const user of usersToSeed) {
      await User.updateOne({ email: user.email }, { $set: user }, { upsert: true });
    }
    console.log('Users seeded successfully.');

    // 2. Monuments (Fictional/Demo)
    const monumentsToSeed = [
      {
        name: '[DEMO] Grand Castle',
        description: 'A fictional grand castle for development testing.',
        location: 'Demo City, DC',
        capacity: 1000,
        baseTicketPrice: 50,
        openingTime: '09:00',
        closingTime: '17:00',
      },
      {
        name: '[DEMO] Ancient Ruins',
        description: 'Fictional ancient ruins used as seed data.',
        location: 'Demo Valley, DV',
        capacity: 500,
        baseTicketPrice: 20,
        openingTime: '08:00',
        closingTime: '18:00',
      },
      {
        name: '[DEMO] Modern Art Pavilion',
        description: 'A mock pavilion to test the booking system.',
        location: 'Demo Metro, DM',
        capacity: 200,
        baseTicketPrice: 15,
        openingTime: '10:00',
        closingTime: '20:00',
      }
    ];

    const monumentIds = [];
    for (const monument of monumentsToSeed) {
      const result = await Monument.findOneAndUpdate(
        { name: monument.name },
        { $set: monument },
        { upsert: true, returnDocument: 'after' }
      );
      monumentIds.push(result._id);
    }
    console.log('Monuments seeded successfully.');

    // Assign first monument to the staff member
    await User.updateOne(
      { email: 'staff@demo.local' },
      { $set: { assignedMonument: monumentIds[0] } }
    );
    console.log('Staff monument assignment updated.');

    // 3. Visitor Logs (Sample data for dev only)
    // To ensure idempotency and avoid bloating the DB, we can delete existing demo logs for these monuments
    // and recreate a few sample logs.
    await VisitorLog.deleteMany({ monumentId: { $in: monumentIds } });

    const sampleLogs = [];
    const today = new Date();
    
    for (const mId of monumentIds) {
      // Add a couple of dummy logs per monument
      sampleLogs.push({
        monumentId: mId,
        date: today,
        hour: 10,
        visitorCount: 45,
        actualVisitDuration: 90,
        dayType: 'weekday'
      });
      sampleLogs.push({
        monumentId: mId,
        date: today,
        hour: 14,
        visitorCount: 120,
        actualVisitDuration: 110,
        dayType: 'weekday'
      });
    }

    await VisitorLog.insertMany(sampleLogs);
    console.log('Sample VisitorLogs seeded successfully (for development only).');
    
    console.log('---');
    console.log('Data seed complete.');
    console.log('To remove this development data, you can run:');
    console.log('db.users.deleteMany({ email: { $regex: "@demo.local$" } })');
    console.log('db.monuments.deleteMany({ name: { $regex: "^\\\\[DEMO\\\\]" } })');
    console.log('db.visitorlogs.deleteMany({}) // (Be careful to only run this in dev)');
    console.log('---');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    mongoose.connection.close();
  }
};

const runSeed = async () => {
  await connectDB();
  await seedData();
};

runSeed();
