const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');

/**
 * Get or create wallet for logged-in user
 */
const getWallet = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ userId: req.user.id });
    if (!wallet) {
      wallet = await Wallet.create({
        userId: req.user.id,
        balance: 0,
        currency: 'INR',
      });
    }

    const transactions = await WalletTransaction.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: {
        _id: wallet._id,
        balance: wallet.balance,
        currency: wallet.currency,
        isTreasury: req.user.role === 'admin',
        role: req.user.role,
        transactions,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Top up / Credit wallet
 */
const topupWallet = async (req, res) => {
  try {
    if (req.user && req.user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admins cannot manually add money to their wallet. Admin wallet automatically receives funds from visitor bookings.',
      });
    }

    const { amount, paymentMethod = 'UPI / Card', description = 'Wallet Top-up' } = req.body;
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Top-up amount must be greater than 0' });
    }

    if (numAmount > 50000) {
      return res.status(400).json({ success: false, message: 'Maximum top-up limit per transaction is ₹50,000' });
    }

    // Atomically find and update wallet
    let wallet = await Wallet.findOneAndUpdate(
      { userId: req.user.id },
      { $inc: { balance: numAmount } },
      { new: true, upsert: true }
    );

    const transaction = await WalletTransaction.create({
      userId: req.user.id,
      walletId: wallet._id,
      type: 'credit',
      amount: numAmount,
      balanceAfter: wallet.balance,
      purpose: 'topup',
      description,
      paymentMethod,
      status: 'completed',
    });

    res.status(200).json({
      success: true,
      message: `Successfully added ₹${numAmount.toLocaleString()} to wallet`,
      data: {
        balance: wallet.balance,
        transaction,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Debit wallet
 */
const debitWallet = async (req, res) => {
  try {
    const { amount, purpose = 'manual_debit', description = 'Wallet Debit', referenceId = null } = req.body;
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Debit amount must be greater than 0' });
    }

    // Ensure wallet exists and has sufficient balance atomically
    const wallet = await Wallet.findOneAndUpdate(
      { userId: req.user.id, balance: { $gte: numAmount } },
      { $inc: { balance: -numAmount } },
      { new: true }
    );

    if (!wallet) {
      const currentWallet = await Wallet.findOne({ userId: req.user.id });
      const currentBalance = currentWallet ? currentWallet.balance : 0;
      return res.status(400).json({
        success: false,
        message: `Insufficient wallet balance. Available: ₹${currentBalance}, Requested: ₹${numAmount}`,
      });
    }

    const transaction = await WalletTransaction.create({
      userId: req.user.id,
      walletId: wallet._id,
      type: 'debit',
      amount: numAmount,
      balanceAfter: wallet.balance,
      purpose,
      description,
      referenceId,
      status: 'completed',
    });

    res.status(200).json({
      success: true,
      message: `Successfully debited ₹${numAmount.toLocaleString()} from wallet`,
      data: {
        balance: wallet.balance,
        transaction,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get complete transaction history
 */
const getTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      WalletTransaction.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      WalletTransaction.countDocuments({ userId: req.user.id }),
    ]);

    res.json({
      success: true,
      data: {
        transactions,
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getWallet,
  topupWallet,
  debitWallet,
  getTransactions,
};
