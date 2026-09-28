const express = require('express');
const monumentController = require('../controllers/monumentController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Admin Endpoints
router.use(protect);
router.use(authorize('admin'));

router.post('/', monumentController.createMonument);
router.patch('/:id', monumentController.updateMonument);
router.delete('/:id', monumentController.deleteMonument);

module.exports = router;
