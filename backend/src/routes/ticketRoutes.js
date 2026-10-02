const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const ticketController = require('../controllers/ticketController');

const router = express.Router();

router.post('/', protect, authorize('visitor'), ticketController.bookTicket);
router.get('/my', protect, authorize('visitor'), ticketController.getMyTickets);
router.get('/:id', protect, authorize('visitor'), ticketController.getTicket);
router.patch('/:id/cancel', protect, authorize('visitor'), ticketController.cancelTicket);
router.post('/:id/cancel', protect, authorize('visitor'), ticketController.cancelTicket);

module.exports = router;
