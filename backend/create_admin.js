require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');

const createAdmin = async () => {
  const args = process.argv.slice(2);
  const email = args[0] || process.env.ADMIN_EMAIL || 'admin@heritage.com';
  const password = args[1] || process.env.ADMIN_PASSWORD || 'adminpassword123';
  const name = args[2] || process.env.ADMIN_NAME || 'System Administrator';

  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in .env');
    }

    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let user = await User.findOne({ email });

    if (user) {
      user.name = name;
      user.passwordHash = passwordHash;
      user.role = 'admin';
      await user.save();
      console.log(`\n✅ Existing user updated to ADMIN role successfully!`);
    } else {
      user = await User.create({
        name,
        email,
        passwordHash,
        role: 'admin'
      });
      console.log(`\n✅ New ADMIN user created successfully!`);
    }

    console.log('-------------------------------------------');
    console.log(`User ID   : ${user._id}`);
    console.log(`Name      : ${user.name}`);
    console.log(`Email     : ${user.email}`);
    console.log(`Password  : ${password}`);
    console.log(`Role      : ${user.role}`);
    console.log('-------------------------------------------');
    console.log(`You can now log in at http://localhost:5173/login with these credentials.\n`);

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed.');
    process.exit(0);
  }
};

createAdmin();
