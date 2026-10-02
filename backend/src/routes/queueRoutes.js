const express = require('express');
const router = express.Router();
const { getMyQueueStatus, getPublicQueueStatus } = require('../controllers/queueController');
const { protect } = require('../middleware/authMiddleware');

router.get('/public/:monumentId', getPublicQueueStatus);
router.get('/my/:ticketId', protect, getMyQueueStatus);

module.exports = router;
