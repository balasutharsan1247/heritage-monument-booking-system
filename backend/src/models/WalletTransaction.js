const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  walletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: true,
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01,
  },
  balanceAfter: {
    type: Number,
    required: true,
  },
  purpose: {
    type: String,
    enum: [
      'topup',
      'ticket_purchase',
      'ticket_refund',
      'ticket_revenue',
      'ticket_refund_deduction',
      'manual_debit',
      'grant',
      'maintenance',
      'subsidy',
      'restoration',
      'manual_adjustment',
      'other',
    ],
    default: 'topup',
  },
  monumentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Monument',
    default: null,
  },
  description: {
    type: String,
    trim: true,
  },
  referenceId: {
    type: String,
    default: null,
  },
  paymentMethod: {
    type: String,
    default: 'Digital Wallet',
  },
  status: {
    type: String,
    enum: ['completed', 'failed', 'pending', 'cancelled', 'reversed'],
    default: 'completed',
  },
}, { timestamps: true });

walletTransactionSchema.index({ userId: 1, createdAt: -1 });
walletTransactionSchema.index({ walletId: 1, createdAt: -1 });

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
