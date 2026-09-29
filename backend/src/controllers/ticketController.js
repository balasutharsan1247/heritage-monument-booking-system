const Ticket = require('../models/Ticket');
const Monument = require('../models/Monument');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const bookTicket = async (req, res) => {
  try {
    const { monumentId, visitDate, slotStart, slotEnd, quantity = 1 } = req.body;

    if (!monumentId || !visitDate || !slotStart || !slotEnd) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
    }

    const monument = await Monument.findById(monumentId);
    if (!monument || !monument.isActive) {
      return res.status(404).json({ success: false, message: 'Monument not found or inactive' });
    }

    // Validate opening hours
    if (slotStart < monument.openingTime || slotEnd > monument.closingTime) {
      return res.status(400).json({ success: false, message: 'Slot is outside of monument opening hours' });
    }

    const date = new Date(visitDate);
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

    // Check capacity for the slot
    const existingTickets = await Ticket.countDocuments({
      monumentId,
      visitDate: { $gte: startOfDay, $lt: endOfDay },
      slotStart,
      status: { $in: ['booked', 'used'] }
    });

    if (existingTickets + quantity > monument.capacity) {
      return res.status(400).json({ success: false, message: 'Not enough capacity for this slot' });
    }

    // Prevent duplicate booking for the same user, monument, date, and slot
    const userExistingBooking = await Ticket.findOne({
      visitorId: req.user.id,
      monumentId,
      visitDate: { $gte: startOfDay, $lt: endOfDay },
      slotStart,
      status: 'booked'
    });

    if (userExistingBooking) {
      return res.status(400).json({ success: false, message: 'You already have a booking for this slot' });
    }

    // Create tickets
    const tickets = [];
    for (let i = 0; i < quantity; i++) {
      const tokenNumber = `${monument.name.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
      
      const ticket = new Ticket({
        visitorId: req.user.id,
        monumentId,
        visitDate: startOfDay,
        slotStart,
        slotEnd,
        tokenNumber,
        price: monument.baseTicketPrice,
        status: 'booked',
      });

      // Generate QR data
      const validationPayload = {
        ticketId: ticket._id.toString(),
        monumentId: monument._id.toString(),
        tokenNumber
      };
      
      ticket.qrCodeData = jwt.sign(validationPayload, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
      await ticket.save();
      tickets.push(ticket);
    }

    // Prepare response without exposing sensitive data (though ticket doesn't have much)
    const responseTickets = tickets.map(t => ({
      _id: t._id,
      monumentId: t.monumentId,
      visitDate: t.visitDate,
      slotStart: t.slotStart,
      slotEnd: t.slotEnd,
      tokenNumber: t.tokenNumber,
      price: t.price,
      qrCodeData: t.qrCodeData,
      status: t.status
    }));

    res.status(201).json({ success: true, data: quantity === 1 ? responseTickets[0] : responseTickets });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ visitorId: req.user.id }).populate('monumentId', 'name location');
    const formattedTickets = tickets.map(t => ({
      _id: t._id,
      monumentId: t.monumentId,
      visitDate: t.visitDate,
      slotStart: t.slotStart,
      slotEnd: t.slotEnd,
      tokenNumber: t.tokenNumber,
      price: t.price,
      qrCodeData: t.qrCodeData,
      status: t.status
    }));
    res.json({ success: true, data: formattedTickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ _id: req.params.id, visitorId: req.user.id }).populate('monumentId', 'name location');
    
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    res.json({ success: true, data: {
      _id: ticket._id,
      monumentId: ticket.monumentId,
      visitDate: ticket.visitDate,
      slotStart: ticket.slotStart,
      slotEnd: ticket.slotEnd,
      tokenNumber: ticket.tokenNumber,
      price: ticket.price,
      qrCodeData: ticket.qrCodeData,
      status: ticket.status
    } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const cancelTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ _id: req.params.id, visitorId: req.user.id });
    
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (ticket.status !== 'booked') {
      return res.status(400).json({ success: false, message: 'Only booked tickets can be cancelled' });
    }

    ticket.status = 'cancelled';
    await ticket.save();

    res.json({ success: true, message: 'Ticket cancelled successfully', data: {
      _id: ticket._id,
      status: ticket.status
    } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  bookTicket,
  getMyTickets,
  getTicket,
  cancelTicket
};
