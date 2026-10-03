const treasuryService = require('../services/treasuryService');

/**
 * GET /api/admin/treasury
 * Retrieve Central Treasury reserve, revenue breakdown, and financial ledger
 */
const getTreasury = async (req, res, next) => {
  try {
    const { page, limit, filterType, search } = req.query;
    const stats = await treasuryService.getTreasuryStats({
      page,
      limit,
      filterType,
      search,
    });
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/treasury/transactions
 * Create a new Treasury allocation (Grant/Credit) or disbursement (Maintenance/Debit)
 */
const createTransaction = async (req, res, next) => {
  try {
    const { type, amount, purpose, description, monumentId, paymentMethod } = req.body;

    if (!type || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Both transaction type (credit/debit) and amount are required',
      });
    }

    const result = await treasuryService.recordTreasuryTransaction({
      adminUserId: req.user.id,
      type,
      amount,
      purpose,
      description,
      monumentId,
      paymentMethod,
    });

    res.status(201).json({
      success: true,
      message: `${type === 'credit' ? 'Allocation' : 'Disbursement'} recorded successfully`,
      data: result,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/admin/treasury/transactions/:id
 * Update transaction description/purpose
 */
const updateTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { description, purpose } = req.body;

    const updated = await treasuryService.updateTreasuryTransaction(id, { description, purpose });
    res.status(200).json({
      success: true,
      message: 'Transaction record updated',
      data: updated,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/admin/treasury/transactions/:id
 * Reverse/cancel an erroneous allocation or disbursement
 */
const reverseTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const result = await treasuryService.reverseTreasuryTransaction(id, req.user.id, reason);
    res.status(200).json({
      success: true,
      message: 'Transaction successfully reversed and ledger balance updated',
      data: result,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/admin/treasury/reconcile
 * Trigger single-source-of-truth reconciliation between all tickets and treasury ledger
 */
const reconcile = async (req, res, next) => {
  try {
    const result = await treasuryService.reconcileTreasury(req.user.id);
    res.status(200).json({
      success: true,
      message: 'Treasury successfully reconciled with verified ticket bookings and ledger',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTreasury,
  createTransaction,
  updateTransaction,
  reverseTransaction,
  reconcile,
};
