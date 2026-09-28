/*
 * References vs Embedding Explanation:
 * 
 * We use references for `ticketId` and `monumentId` instead of embedding because:
 * 1. Real-time updates: QueueEntry documents change rapidly ('waiting' -> 'called' -> 'served'). A separate collection allows targeted, fast updates without locking or modifying the parent Monument or Ticket.
 * 2. Active Queues: We need to query all active queue entries for a specific Monument (e.g., status: 'waiting' or 'called'). An index on `monumentId` in a separate collection supports this live queue dashboard efficiently.
 * 3. Separation of Concerns: A Ticket represents a booking and payment, while a QueueEntry represents the physical presence and live state of a visitor at the monument.
 */

const mongoose = require('mongoose');

const queueEntrySchema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true,
  },
  monumentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Monument',
    required: true,
    index: true,
  },
  tokenNumber: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['waiting', 'called', 'completed', 'skipped'],
    default: 'waiting',
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  calledAt: {
    type: Date,
  },
  completedAt: {
    type: Date,
  },
});

queueEntrySchema.index({ monumentId: 1, joinedAt: 1 });

module.exports = mongoose.model('QueueEntry', queueEntrySchema);
