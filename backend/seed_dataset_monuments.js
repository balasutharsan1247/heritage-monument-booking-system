const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Monument = require('./src/models/Monument');
const User = require('./src/models/User');
const Ticket = require('./src/models/Ticket');

const datasetMonuments = [
  {
    name: "Taj Mahal",
    description: "An ivory-white marble mausoleum on the right bank of the river Yamuna in the Indian city of Agra, commissioned in 1632 by Mughal emperor Shah Jahan. UNESCO World Heritage Site.",
    location: "Agra, Uttar Pradesh",
    imageUrl: "https://images.unsplash.com/photo-1564507592208-0270e599fbdb?w=800&auto=format&fit=crop",
    capacity: 5000,
    baseTicketPrice: 50,
    openingTime: "06:00",
    closingTime: "18:00",
    latitude: 27.1751,
    longitude: 78.0421,
    isActive: true
  },
  {
    name: "Red Fort",
    description: "A historic Mughal fort in Delhi, India, constructed in 1639 by Emperor Shah Jahan as the palace of his fortified capital Shahjahanabad. UNESCO World Heritage Site.",
    location: "New Delhi, Delhi",
    imageUrl: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800&auto=format&fit=crop",
    capacity: 3000,
    baseTicketPrice: 35,
    openingTime: "09:30",
    closingTime: "16:30",
    latitude: 28.6562,
    longitude: 77.2410,
    isActive: true
  },
  {
    name: "Gateway of India",
    description: "An iconic 20th-century arch monument overlooking the Arabian Sea at the Apollo Bunder waterfront in Mumbai, built to commemorate the landing of King George V and Queen Mary.",
    location: "Mumbai, Maharashtra",
    imageUrl: "https://images.unsplash.com/photo-1570168007204-c1e3e515cebf?w=800&auto=format&fit=crop",
    capacity: 2000,
    baseTicketPrice: 0,
    openingTime: "00:00",
    closingTime: "23:59",
    latitude: 18.9220,
    longitude: 72.8347,
    isActive: true
  },
  {
    name: "Qutub Minar",
    description: "A 72.5-metre tall minaret and victory tower forming part of the Qutb complex in South Delhi. Built in 1192 and designated a UNESCO World Heritage Site.",
    location: "New Delhi, Delhi",
    imageUrl: "https://images.unsplash.com/photo-1585093766782-b7f32e9dbdb8?w=800&auto=format&fit=crop",
    capacity: 2500,
    baseTicketPrice: 40,
    openingTime: "07:00",
    closingTime: "17:00",
    latitude: 28.5245,
    longitude: 77.1855,
    isActive: true
  },
  {
    name: "Meenakshi Temple",
    description: "A historic Hindu temple situated on the southern bank of the Vaigai River in Madurai, Tamil Nadu, renowned for its towering sculpted gopurams and Dravidian architecture.",
    location: "Madurai, Tamil Nadu",
    imageUrl: "https://images.unsplash.com/photo-1587563813959-1e3c88019053?w=800&auto=format&fit=crop",
    capacity: 4000,
    baseTicketPrice: 0,
    openingTime: "05:00",
    closingTime: "22:00",
    latitude: 9.9195,
    longitude: 78.1193,
    isActive: true
  }
];

async function seedDatabaseMonuments() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI environment variable is missing.");
    }

    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(mongoUri);
    console.log("Connected successfully.");

    // Find a visitor user to associate sample tickets with
    let visitor = await User.findOne({ role: 'visitor' });
    if (!visitor) {
      visitor = await User.findOne();
    }

    // Clean up test monument if present
    await Monument.deleteMany({ name: "TEST" });

    const seededMonuments = [];

    for (const data of datasetMonuments) {
      const monument = await Monument.findOneAndUpdate(
        { name: data.name },
        { $set: data },
        { upsert: true, new: true }
      );
      seededMonuments.push(monument);
      console.log(`✓ Monument ready: ${monument.name} (ID: ${monument._id})`);

      // Ensure historical ticket entries exist so modelService has lag features
      if (visitor) {
        const ticketCount = await Ticket.countDocuments({ monumentId: monument._id });
        if (ticketCount === 0) {
          const yesterday = new Date();
          yesterday.setUTCDate(yesterday.getUTCDate() - 1);
          yesterday.setUTCHours(10, 0, 0, 0);

          await Ticket.create({
            visitorId: visitor._id,
            monumentId: monument._id,
            visitDate: yesterday,
            slotStart: "10:00",
            slotEnd: "11:00",
            tokenNumber: `INIT-${monument._id.toString().slice(-4)}-001`,
            price: monument.baseTicketPrice,
            numberOfPeople: 1,
            status: "used"
          });
          console.log(`  └ Seeded initial baseline ticket for ${monument.name}`);
        }
      }
    }

    console.log(`\nSuccessfully seeded all ${seededMonuments.length} monuments from the dataset into the database!`);
  } catch (error) {
    console.error("Error seeding dataset monuments:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

seedDatabaseMonuments();
