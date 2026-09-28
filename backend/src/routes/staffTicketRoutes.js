const express = require('express');
const { validateTicket } = require('../controllers/staffTicketController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/validate', protect, authorize('staff', 'admin'), validateTicket);

module.exports = router;
