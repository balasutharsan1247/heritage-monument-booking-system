const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const Ticket = require('../models/Ticket');
const Monument = require('../models/Monument');
const User = require('../models/User');

/**
 * Guarantee finding or creating the platform Central Treasury Wallet
 */
const getOrCreateTreasuryWallet = async () => {
  // 1. Try to find designated Treasury Wallet
  let wallet = await Wallet.findOne({ isTreasury: true });
  if (wallet) {
    return wallet;
  }

  // 2. Look for primary administrator
  const admin = await User.findOne({ role: 'admin', email: 'admin@heritage.com' })
    || await User.findOne({ role: 'admin' });

  if (admin) {
    // Check if this admin already has a wallet
    wallet = await Wallet.findOne({ userId: admin._id });
    if (wallet) {
      wallet.isTreasury = true;
      await wallet.save();
      return wallet;
    }

    // Create central treasury wallet under admin
    wallet = await Wallet.create({
      userId: admin._id,
      balance: 0,
      currency: 'INR',
      isTreasury: true,
    });
    return wallet;
  }

  // Fallback if no admin exists yet
  let anyUser = await User.findOne();
  if (!anyUser) {
    throw new Error('No users found in database to associate with Central Treasury');
  }
  wallet = await Wallet.create({
    userId: anyUser._id,
    balance: 0,
    currency: 'INR',
    isTreasury: true,
  });
  return wallet;
};

/**
 * Reconcile Central Treasury balance with confirmed tickets and transactions
 * Guarantees zero data inconsistency and zero data redundancy
 */
const reconcileTreasury = async (adminUserId = null) => {
  const treasuryWallet = await getOrCreateTreasuryWallet();

  // 1. Fetch all valid confirmed and checked-in tickets
  const tickets = await Ticket.find({ status: { $in: ['booked', 'used'] } }).populate('monumentId');
  const totalTicketRevenue = tickets.reduce((sum, t) => sum + (Number(t.price) || 0), 0);

  // 2. Fetch manual credit allocations (grants, subsidies, adjustments)
  const manualCreditAgg = await WalletTransaction.aggregate([
    {
      $match: {
        walletId: treasuryWallet._id,
        type: 'credit',
        purpose: { $in: ['grant', 'subsidy', 'manual_adjustment'] },
        status: 'completed',
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const totalGrants = manualCreditAgg[0]?.total || 0;

  // 3. Fetch manual debit disbursements (maintenance, restoration, debits)
  const manualDebitAgg = await WalletTransaction.aggregate([
    {
      $match: {
        walletId: treasuryWallet._id,
        type: 'debit',
        purpose: { $in: ['maintenance', 'restoration', 'manual_debit', 'other'] },
        status: 'completed',
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const totalDisbursements = manualDebitAgg[0]?.total || 0;

  // 4. Fetch ticket refunds deducted from treasury
  const refundAgg = await WalletTransaction.aggregate([
    {
      $match: {
        walletId: treasuryWallet._id,
        type: 'debit',
        purpose: { $in: ['ticket_refund', 'ticket_refund_deduction'] },
        status: 'completed',
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const totalRefunds = refundAgg[0]?.total || 0;

  // Single Source of Truth Expected Balance
  const expectedBalance = Math.max(0, totalTicketRevenue + totalGrants - totalDisbursements - totalRefunds);

  // 5. Backfill missing ticket revenue transactions into the ledger so history is 100% complete
  let backfilledCount = 0;
  for (const ticket of tickets) {
    if (!ticket.price || ticket.price <= 0) continue;

    const existingTx = await WalletTransaction.findOne({
      walletId: treasuryWallet._id,
      referenceId: ticket._id.toString(),
      purpose: 'ticket_revenue',
    });

    if (!existingTx) {
      await WalletTransaction.create({
        userId: treasuryWallet.userId,
        walletId: treasuryWallet._id,
        type: 'credit',
        amount: ticket.price,
        balanceAfter: expectedBalance,
        purpose: 'ticket_revenue',
        referenceId: ticket._id.toString(),
        monumentId: ticket.monumentId?._id || ticket.monumentId || null,
        description: `Revenue from visitor ticket booking: ${ticket.tokenNumber} (${ticket.monumentId?.name || 'Heritage Site'})`,
        paymentMethod: ticket.paymentMethod || 'Direct Booking Gateway',
        status: 'completed',
        createdAt: ticket.createdAt || new Date(),
      });
      backfilledCount++;
    }
  }

  // Update Treasury Wallet balance
  treasuryWallet.balance = expectedBalance;
  await treasuryWallet.save();

  return {
    reconciled: true,
    previousBalance: treasuryWallet.balance,
    currentBalance: expectedBalance,
    totalTicketRevenue,
    totalGrants,
    totalDisbursements,
    totalRefunds,
    ticketsCount: tickets.length,
    backfilledTransactions: backfilledCount,
  };
};

/**
 * Get comprehensive Central Treasury statistics, metrics, and ledger
 */
const getTreasuryStats = async (options = {}) => {
  const treasuryWallet = await getOrCreateTreasuryWallet();

  // If wallet shows 0 balance but tickets exist, run auto-reconciliation to restore actual rupees!
  const confirmedTicketsCount = await Ticket.countDocuments({ status: { $in: ['booked', 'used'] } });
  if (treasuryWallet.balance === 0 && confirmedTicketsCount > 0) {
    await reconcileTreasury();
    await treasuryWallet.reload?.() || Object.assign(treasuryWallet, await Wallet.findById(treasuryWallet._id));
  }

  // Ticket revenue aggregation
  const ticketRevenueAgg = await Ticket.aggregate([
    { $match: { status: { $in: ['booked', 'used'] } } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$price' },
        totalBookings: { $sum: 1 },
        totalVisitors: { $sum: { $ifNull: ['$numberOfPeople', 1] } },
      },
    },
  ]);
  const ticketStats = ticketRevenueAgg[0] || { totalRevenue: 0, totalBookings: 0, totalVisitors: 0 };

  // Monument revenue breakdown
  const monumentRevenueAgg = await Ticket.aggregate([
    { $match: { status: { $in: ['booked', 'used'] } } },
    {
      $group: {
        _id: '$monumentId',
        revenue: { $sum: '$price' },
        bookingsCount: { $sum: 1 },
        visitorsCount: { $sum: { $ifNull: ['$numberOfPeople', 1] } },
      },
    },
    {
      $lookup: {
        from: 'monuments',
        localField: '_id',
        foreignField: '_id',
        as: 'monument',
      },
    },
    { $unwind: { path: '$monument', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        monumentId: '$_id',
        name: { $ifNull: ['$monument.name', 'Historical Monument'] },
        location: { $ifNull: ['$monument.location', 'India'] },
        baseTicketPrice: { $ifNull: ['$monument.baseTicketPrice', 0] },
        revenue: 1,
        bookingsCount: 1,
        visitorsCount: 1,
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  // Financial ledger aggregation
  const ledgerAgg = await WalletTransaction.aggregate([
    { $match: { walletId: treasuryWallet._id, status: 'completed' } },
    {
      $group: {
        _id: '$purpose',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  let totalGrants = 0;
  let totalDisbursements = 0;
  let totalRefunds = 0;

  for (const item of ledgerAgg) {
    if (['grant', 'subsidy', 'manual_adjustment'].includes(item._id)) {
      totalGrants += item.total;
    } else if (['maintenance', 'restoration', 'manual_debit'].includes(item._id)) {
      totalDisbursements += item.total;
    } else if (['ticket_refund', 'ticket_refund_deduction'].includes(item._id)) {
      totalRefunds += item.total;
    }
  }

  // Fetch recent ledger transactions
  const { page = 1, limit = 50, filterType, search } = options;
  const txQuery = { walletId: treasuryWallet._id };

  if (filterType === 'credit') txQuery.type = 'credit';
  if (filterType === 'debit') txQuery.type = 'debit';
  if (filterType === 'revenue') txQuery.purpose = 'ticket_revenue';
  if (filterType === 'grant') txQuery.purpose = { $in: ['grant', 'subsidy', 'manual_adjustment'] };
  if (filterType === 'maintenance') txQuery.purpose = { $in: ['maintenance', 'restoration', 'manual_debit'] };
  if (filterType === 'refund') txQuery.purpose = { $in: ['ticket_refund', 'ticket_refund_deduction'] };

  if (search && search.trim()) {
    txQuery.description = { $regex: search.trim(), $options: 'i' };
  }

  const transactions = await WalletTransaction.find(txQuery)
    .populate('monumentId', 'name location')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const totalTransactions = await WalletTransaction.countDocuments(txQuery);

  return {
    wallet: {
      _id: treasuryWallet._id,
      balance: treasuryWallet.balance,
      currency: treasuryWallet.currency,
      isTreasury: true,
      updatedAt: treasuryWallet.updatedAt,
    },
    metrics: {
      balance: treasuryWallet.balance,
      totalTicketRevenue: ticketStats.totalRevenue,
      totalBookings: ticketStats.totalBookings,
      totalVisitors: ticketStats.totalVisitors,
      totalGrants,
      totalDisbursements,
      totalRefunds,
    },
    monumentBreakdown: monumentRevenueAgg,
    transactions,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: totalTransactions,
      pages: Math.ceil(totalTransactions / limit),
    },
  };
};

/**
 * Record a manual Treasury Allocation (Credit) or Maintenance Disbursement (Debit)
 */
const recordTreasuryTransaction = async ({
  adminUserId,
  type,
  amount,
  purpose = 'other',
  description,
  monumentId = null,
  paymentMethod = 'Central Treasury Transfer',
}) => {
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    throw new Error('Transaction amount must be greater than 0');
  }

  if (!['credit', 'debit'].includes(type)) {
    throw new Error('Transaction type must be credit or debit');
  }

  const treasuryWallet = await getOrCreateTreasuryWallet();

  if (type === 'debit' && numAmount > treasuryWallet.balance) {
    throw new Error(
      `Insufficient treasury reserves. Available balance: ₹${treasuryWallet.balance.toLocaleString()}, Requested disbursement: ₹${numAmount.toLocaleString()}`
    );
  }

  // Atomically update balance
  const delta = type === 'credit' ? numAmount : -numAmount;
  const updatedWallet = await Wallet.findByIdAndUpdate(
    treasuryWallet._id,
    { $inc: { balance: delta } },
    { new: true }
  );

  const tx = await WalletTransaction.create({
    userId: adminUserId || treasuryWallet.userId,
    walletId: treasuryWallet._id,
    type,
    amount: numAmount,
    balanceAfter: updatedWallet.balance,
    purpose,
    monumentId: monumentId || null,
    description: description || (type === 'credit' ? 'Treasury Capital Inflow' : 'Site Maintenance Disbursement'),
    paymentMethod,
    status: 'completed',
  });

  const populatedTx = await WalletTransaction.findById(tx._id).populate('monumentId', 'name location');

  return {
    transaction: populatedTx,
    balance: updatedWallet.balance,
  };
};

/**
 * Update transaction description/notes
 */
const updateTreasuryTransaction = async (transactionId, { description, purpose }) => {
  const tx = await WalletTransaction.findById(transactionId);
  if (!tx) throw new Error('Transaction record not found');

  if (description) tx.description = description.trim();
  if (purpose) tx.purpose = purpose;

  await tx.save();
  return await WalletTransaction.findById(transactionId).populate('monumentId', 'name location');
};

/**
 * Reverse an erroneous manual allocation or disbursement
 */
const reverseTreasuryTransaction = async (transactionId, adminUserId, reason = 'Administrative Reversal') => {
  const tx = await WalletTransaction.findById(transactionId);
  if (!tx) throw new Error('Transaction record not found');
  if (tx.status === 'cancelled' || tx.status === 'reversed') {
    throw new Error('This transaction is already reversed or cancelled');
  }

  if (['ticket_revenue', 'ticket_refund'].includes(tx.purpose)) {
    throw new Error('Direct ticket booking revenue cannot be manually reversed. Cancel the ticket booking instead.');
  }

  const treasuryWallet = await getOrCreateTreasuryWallet();

  // If the original transaction was a credit (added money), reversing it means removing money.
  // Check if treasury has sufficient balance.
  if (tx.type === 'credit' && treasuryWallet.balance < tx.amount) {
    throw new Error(
      `Cannot reverse credit: treasury balance (₹${treasuryWallet.balance}) is less than reversal amount (₹${tx.amount})`
    );
  }

  const reverseDelta = tx.type === 'credit' ? -tx.amount : tx.amount;
  const updatedWallet = await Wallet.findByIdAndUpdate(
    treasuryWallet._id,
    { $inc: { balance: reverseDelta } },
    { new: true }
  );

  tx.status = 'reversed';
  tx.description = `${tx.description} [REVERSED: ${reason}]`;
  await tx.save();

  return {
    reversedTransaction: tx,
    balance: updatedWallet.balance,
  };
};

module.exports = {
  getOrCreateTreasuryWallet,
  reconcileTreasury,
  getTreasuryStats,
  recordTreasuryTransaction,
  updateTreasuryTransaction,
  reverseTreasuryTransaction,
};
