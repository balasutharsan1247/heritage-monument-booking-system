const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getWallet,
  topupWallet,
  debitWallet,
  getTransactions,
} = require('../controllers/walletController');

// All wallet routes require authentication
router.use(protect);

router.get('/', getWallet);
router.post('/topup', topupWallet);
router.post('/debit', debitWallet);
router.get('/transactions', getTransactions);

module.exports = router;
