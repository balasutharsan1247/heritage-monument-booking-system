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
    imageUrl: "/images/taj-mahal.jpg",
    capacity: 25000,
    slotCapacity: 25000,
    dailyCapacity: 50000,
    baseTicketPrice: 50,
    foreignTicketPrice: 1100,
    openingTime: "06:00",
    closingTime: "18:00",
    sessionsInfo: "2 core ASI slots daily: Forenoon (Sunrise–12:00 PM) & Afternoon (12:00 PM–Sunset)",
    stayLimit: "3 hours per ticket (strictly barcode-scanned at entry and exit turnstiles; overstay incurs penalty fee equal to an extra ticket)",
    ticketPricingDomestic: "Base Complex: ₹50 online (₹55 counter) | Main Mausoleum: +₹200 (Total: ₹250)",
    ticketPricingForeign: "Base Complex: ₹1,100 – ₹1,300 (SAARC/BIMSTEC: ₹540) | Main Mausoleum: +₹200 (Total: ₹1,300–₹1,500)",
    additionalFees: "Main Mausoleum: +₹200 | Night Viewing (5 full-moon nights): ₹510 (Domestic) / ₹750 (Foreign)",
    bookingRules: [
      "Children below 15: Free entry",
      "3-Hour Stay Limit: Barcode-scanned at entry and exit turnstiles. Exceeding 3 hours incurs an exit penalty fee equal to an extra ticket",
      "ASI Online Ticketing: Booking online or via gate QR code saves ₹5 off domestic base tickets and avoids lines",
      "Closed on Fridays for religious prayers"
    ],
    latitude: 27.1751,
    longitude: 78.0421,
    isActive: true
  },
  {
    name: "Red Fort",
    description: "A historic Mughal fort in Delhi, India, constructed in 1639 by Emperor Shah Jahan as the palace of his fortified capital Shahjahanabad. UNESCO World Heritage Site.",
    location: "New Delhi, Delhi",
    imageUrl: "/images/red-fort.jpg",
    capacity: 4000,
    slotCapacity: 4000,
    dailyCapacity: 30000,
    baseTicketPrice: 35,
    foreignTicketPrice: 550,
    openingTime: "09:30",
    closingTime: "16:30",
    sessionsInfo: "Hourly ASI booking windows from 9:30 AM to 4:30 PM",
    stayLimit: "Recommended 2–3 hours",
    ticketPricingDomestic: "Fort Grounds: ₹35 online / ₹40 counter | Museums (combined): ~₹80",
    ticketPricingForeign: "Fort Grounds: ₹550 (SAARC/BIMSTEC: ₹35) | Museums: +₹320",
    additionalFees: "Museums (combined): +₹80 (Domestic) / +₹320 (Foreign) | Sound & Light Show: ₹60–₹80 (Domestic) / ₹250 (Foreign)",
    bookingRules: [
      "Children below 15: Free entry",
      "Closed on Mondays and during Independence Day week (security closures)",
      "ASI Online Ticketing discount: ₹5 off domestic base tickets compared to manual counter purchases",
      "Sound & Light Show conducted every evening in Hindi and English"
    ],
    latitude: 28.6562,
    longitude: 77.2410,
    isActive: true
  },
  {
    name: "Gateway of India",
    description: "An iconic 20th-century arch monument overlooking the Arabian Sea at the Apollo Bunder waterfront in Mumbai, built to commemorate the landing of King George V and Queen Mary.",
    location: "Mumbai, Maharashtra",
    imageUrl: "/images/gateway-of-india.jpg",
    capacity: 10000,
    slotCapacity: 10000,
    dailyCapacity: 100000,
    baseTicketPrice: 0,
    foreignTicketPrice: 0,
    openingTime: "00:00",
    closingTime: "23:59",
    sessionsInfo: "Open 24/7 public access promenade; continuous entry without rigid slot caps. Ferries depart every 15–30 minutes (9:00 AM – 2:00 PM for Elephanta Island).",
    stayLimit: "No restriction for public promenade",
    ticketPricingDomestic: "Promenade Entry: Free (₹0)",
    ticketPricingForeign: "Promenade Entry: Free (₹0)",
    additionalFees: "Harbor Cruises: ₹100 – ₹150 | Elephanta Island Ferry: ₹200 – ₹300 return | Elephanta Caves island entry (ASI) charged separately on arrival",
    bookingRules: [
      "Promenade public access is 100% free and open 24/7",
      "Ferries depart every 15–30 minutes (9:00 AM – 2:00 PM for Elephanta Island)",
      "Elephanta Caves island entry (ASI) charged separately on arrival"
    ],
    latitude: 18.9220,
    longitude: 72.8347,
    isActive: true
  },
  {
    name: "Qutub Minar",
    description: "A 72.5-metre tall minaret and victory tower forming part of the Qutb complex in South Delhi. Built in 1192 and designated a UNESCO World Heritage Site.",
    location: "New Delhi, Delhi",
    imageUrl: "/images/qutub-minar.jpg",
    capacity: 3500,
    slotCapacity: 3500,
    dailyCapacity: 30000,
    baseTicketPrice: 35,
    foreignTicketPrice: 550,
    openingTime: "07:00",
    closingTime: "17:00",
    sessionsInfo: "Hourly booking slots from 7:00 AM to 5:00 PM (dynamic ASI allocation ~2,500–3,500 per hour)",
    stayLimit: "Recommended 1.5–2 hours",
    ticketPricingDomestic: "Entry Ticket: ₹35 online / ₹40 counter",
    ticketPricingForeign: "Entry Ticket: ₹550 (SAARC/BIMSTEC: ₹35)",
    additionalFees: "Access to entire monument complex, Iron Pillar, and ruins included",
    bookingRules: [
      "Children below 15: Free entry",
      "Minaret interior remains permanently closed to public; ticket grants entry to the entire monument complex",
      "ASI Online Ticketing discount: ₹5 off domestic base tickets compared to manual counter purchases"
    ],
    latitude: 28.5245,
    longitude: 77.1855,
    isActive: true
  },
  {
    name: "Meenakshi Temple",
    description: "A historic Hindu temple situated on the southern bank of the Vaigai River in Madurai, Tamil Nadu, renowned for its towering sculpted gopurams and Dravidian architecture.",
    location: "Madurai, Tamil Nadu",
    imageUrl: "/images/meenakshi-temple.jpg",
    capacity: 5000,
    slotCapacity: 5000,
    dailyCapacity: 50000,
    baseTicketPrice: 0,
    foreignTicketPrice: 50,
    openingTime: "05:00",
    closingTime: "22:00",
    sessionsInfo: "Morning (5:00 AM – 12:30 PM), Evening (4:00 PM – 10:00 PM). Continuous flow; ~4,000–6,000/hr peak rate.",
    stayLimit: "Continuous flow darshan",
    ticketPricingDomestic: "General Darshan: Free (₹0) | Special Entry: ₹50 – ₹100",
    ticketPricingForeign: "Entry: ₹50 (outer sanctum & halls only; inner sanctum restricted to Hindus)",
    additionalFees: "Hall of 1,000 Pillars: ₹5 | Cloakroom: ₹30",
    bookingRules: [
      "Hall of 1,000 Pillars: ₹5 additional fee",
      "Mobile phones, bags, and leather items strictly prohibited inside; cloakroom available (₹30)",
      "Inner sanctum access restricted to Hindus; outer sanctum & halls open to all visitors",
      "Peak Festival Protocols: During major pilgrimage days (Pongal, Chithirai), tokens strictly regulated on-site by temple marshals with 3–5 hr VIP queue waits"
    ],
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
