const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

// Test routes for different roles
router.get('/visitor', protect, authorize('visitor', 'staff', 'admin'), (req, res) => {
  res.status(200).json({ success: true, message: 'Visitor access granted' });
});

router.get('/staff', protect, authorize('staff', 'admin'), (req, res) => {
  res.status(200).json({ success: true, message: 'Staff access granted' });
});

router.get('/admin', protect, authorize('admin'), (req, res) => {
  res.status(200).json({ success: true, message: 'Admin access granted' });
});

module.exports = router;
