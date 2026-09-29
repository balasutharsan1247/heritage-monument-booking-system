const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Monument = require('./src/models/Monument');

dotenv.config();

const imageUrlMapping = {
  "Taj Mahal": "/images/taj-mahal.jpg",
  "Red Fort": "/images/red-fort.jpg",
  "Gateway of India": "/images/gateway-of-india.jpg",
  "Qutub Minar": "/images/qutub-minar.jpg",
  "Meenakshi Temple": "/images/meenakshi-temple.jpg"
};

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/heritage')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    for (const [name, imageUrl] of Object.entries(imageUrlMapping)) {
      const result = await Monument.updateOne({ name }, { $set: { imageUrl } });
      console.log(`Updated ${name}: matched ${result.matchedCount}, modified ${result.modifiedCount}`);
    }
    
    console.log('Finished updating image URLs.');
    mongoose.disconnect();
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB', err);
  });
