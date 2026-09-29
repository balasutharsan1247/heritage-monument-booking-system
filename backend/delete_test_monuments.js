const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Monument = require('./src/models/Monument');

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/heritage')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Delete test monuments
    const namesToDelete = ["Prediction Monument", "Empty Monument"];
    const result = await Monument.deleteMany({ name: { $in: namesToDelete } });
    
    console.log(`Deleted ${result.deletedCount} monument(s).`);
    mongoose.disconnect();
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB', err);
  });
