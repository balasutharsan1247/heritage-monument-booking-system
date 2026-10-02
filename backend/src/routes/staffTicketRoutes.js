const express = require('express');
const { verifyTicket, validateTicket } = require('../controllers/staffTicketController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/verify', protect, authorize('staff', 'admin'), verifyTicket);
router.post('/validate', protect, authorize('staff', 'admin'), validateTicket);

module.exports = router;
