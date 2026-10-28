const mongoose = require('mongoose');

const monumentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  imageUrl: {
    type: String,
  },
  location: {
    type: String,
  },
  latitude: {
    type: Number,
  },
  longitude: {
    type: Number,
  },
  capacity: {
    type: Number,
    required: true,
  },
  baseTicketPrice: {
    type: Number,
    required: true,
  },
  foreignTicketPrice: {
    type: Number,
    default: 0,
  },
  slotCapacity: {
    type: Number,
  },
  dailyCapacity: {
    type: Number,
  },
  stayLimit: {
    type: String,
  },
  sessionsInfo: {
    type: String,
  },
  ticketPricingDomestic: {
    type: String,
  },
  ticketPricingForeign: {
    type: String,
  },
  additionalFees: {
    type: String,
  },
  bookingRules: {
    type: [String],
    default: [],
  },
  openingTime: {
    type: String,
    required: true,
  },
  closingTime: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Monument', monumentSchema);
