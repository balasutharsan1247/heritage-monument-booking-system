/*
 * References vs Embedding Explanation:
 * 
 * We use references (ObjectId) for `visitorId` and `monumentId` instead of embedding because:
 * 1. Independent Lifecycle: A Ticket has a distinct lifecycle from a User or Monument. It changes status (booked -> used) and belongs to a time slot.
 * 2. Query Efficiency: We often need to query Tickets by Monument and Date (to find available slots) or by User (to show booking history). Keeping them in a separate collection with indexes on `monumentId` and `visitDate` makes these queries extremely efficient.
 * 3. Unbounded Growth: A popular monument will have millions of tickets. Embedding them inside the Monument document would cause it to exceed MongoDB's 16MB document size limit quickly and lead to severe performance degradation.
 */

const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  visitorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  monumentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Monument',
    required: true,
    index: true,
  },
  visitDate: {
    type: Date,
    required: true,
    index: true,
  },
  slotStart: {
    type: String,
    required: true,
  },
  slotEnd: {
    type: String,
    required: true,
  },
  tokenNumber: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  qrCodeData: {
    type: String,
  },
  status: {
    type: String,
    enum: ['booked', 'used', 'cancelled'],
    default: 'booked',
  },
  checkInTime: {
    type: Date,
  },
  scannedByStaffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

ticketSchema.index({ monumentId: 1, visitDate: 1, status: 1 });
ticketSchema.index({ visitDate: 1, status: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);
