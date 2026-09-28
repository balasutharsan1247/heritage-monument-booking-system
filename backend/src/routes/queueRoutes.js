const express = require('express');
const router = express.Router();
const { getMyQueueStatus } = require('../controllers/queueController');
const { protect } = require('../middleware/authMiddleware');

router.get('/my/:ticketId', protect, getMyQueueStatus);

module.exports = router;
