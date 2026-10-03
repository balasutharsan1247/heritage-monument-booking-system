const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const ticketController = require('../controllers/ticketController');

const router = express.Router();

router.post('/', protect, authorize('visitor', 'admin'), ticketController.bookTicket);
router.get('/my', protect, authorize('visitor', 'admin'), ticketController.getMyTickets);
router.get('/:id', protect, authorize('visitor', 'admin'), ticketController.getTicket);
router.patch('/:id/cancel', protect, authorize('visitor', 'admin'), ticketController.cancelTicket);
router.post('/:id/cancel', protect, authorize('visitor', 'admin'), ticketController.cancelTicket);

module.exports = router;
