const express = require('express');
const router = express.Router();
const { getQueue, callNext, skipVisitor, completeVisit } = require('../controllers/queueController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('staff', 'admin'));

router.route('/:monumentId')
  .get(getQueue);

router.post('/:monumentId/call-next', callNext);
router.post('/:monumentId/:entryId/skip', skipVisitor);
router.post('/:monumentId/:entryId/complete', completeVisit);

module.exports = router;
