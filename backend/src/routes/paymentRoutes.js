const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getKey,
  createOrder,
  verifyPayment,
} = require('../controllers/paymentController');

// Route to get public key (can be authenticated)
router.get('/key', getKey);

// Routes requiring authentication
router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);

module.exports = router;
