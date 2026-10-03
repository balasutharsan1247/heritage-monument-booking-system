const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const treasuryController = require('../controllers/treasuryController');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/', treasuryController.getTreasury);
router.post('/transactions', treasuryController.createTransaction);
router.patch('/transactions/:id', treasuryController.updateTransaction);
router.delete('/transactions/:id', treasuryController.reverseTransaction);
router.post('/reconcile', treasuryController.reconcile);

module.exports = router;
