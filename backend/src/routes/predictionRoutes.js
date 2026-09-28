const express = require('express');
const router = express.Router();
const { getPrediction } = require('../controllers/predictionController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/:monumentId', protect, authorize('admin'), getPrediction);

module.exports = router;
