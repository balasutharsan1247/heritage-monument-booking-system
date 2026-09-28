const express = require('express');
const router = express.Router();
const {
  getSummary,
  getMonumentSummary,
  getMonumentHourly,
  getMonumentQueue
} = require('../controllers/adminDashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All dashboard routes require admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/summary', getSummary);
router.get('/:monumentId', getMonumentSummary);
router.get('/:monumentId/hourly', getMonumentHourly);
router.get('/:monumentId/queue', getMonumentQueue);

module.exports = router;
