const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Monument = require('./src/models/Monument');

dotenv.config();

const monumentsToSeed = [
  {
    name: "Taj Mahal",
    description: "An ivory-white marble mausoleum on the right bank of the river Yamuna in the Indian city of Agra.",
    location: "Agra, Uttar Pradesh",
    imageUrl: "https://images.unsplash.com/photo-1564507592208-0270e599fbdb?w=800&auto=format&fit=crop",
    capacity: 5000,
    baseTicketPrice: 50,
    openingTime: "06:00",
    closingTime: "18:00"
  },
  {
    name: "Red Fort",
    description: "A historic fort in the city of Delhi in India that served as the main residence of the Mughal Emperors.",
    location: "Delhi",
    imageUrl: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800&auto=format&fit=crop",
    capacity: 3000,
    baseTicketPrice: 35,
    openingTime: "09:30",
    closingTime: "16:30"
  },
  {
    name: "Gateway of India",
    description: "An arch-monument built in the early 20th century in the city of Mumbai, India.",
    location: "Mumbai, Maharashtra",
    imageUrl: "https://images.unsplash.com/photo-1570168007204-c1e3e515cebf?w=800&auto=format&fit=crop",
    capacity: 2000,
    baseTicketPrice: 0,
    openingTime: "00:00",
    closingTime: "23:59"
  },
  {
    name: "Qutub Minar",
    description: "A minaret and 'victory tower' that forms part of the Qutb complex, a UNESCO World Heritage Site in the Mehrauli area of New Delhi, India.",
    location: "Delhi",
    imageUrl: "https://images.unsplash.com/photo-1585093766782-b7f32e9dbdb8?w=800&auto=format&fit=crop",
    capacity: 2500,
    baseTicketPrice: 40,
    openingTime: "07:00",
    closingTime: "17:00"
  },
  {
    name: "Meenakshi Temple",
    description: "A historic Hindu temple located on the southern bank of the Vaigai River in the temple city of Madurai, Tamil Nadu, India.",
    location: "Madurai, Tamil Nadu",
    imageUrl: "https://images.unsplash.com/photo-1587563813959-1e3c88019053?w=800&auto=format&fit=crop",
    capacity: 4000,
    baseTicketPrice: 0,
    openingTime: "05:00",
    closingTime: "22:00"
  }
];

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/heritage')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Check if these monuments exist, if not, add them
    for (let monumentData of monumentsToSeed) {
      let existingMonument = await Monument.findOne({ name: monumentData.name });
      if (existingMonument) {
        existingMonument.imageUrl = monumentData.imageUrl;
        await existingMonument.save();
        console.log(`Updated image for ${monumentData.name}`);
      } else {
        await Monument.create(monumentData);
        console.log(`Created new monument: ${monumentData.name}`);
      }
    }

    mongoose.disconnect();
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB', err);
  });
