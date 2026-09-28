const Ticket = require('../models/Ticket');
const Monument = require('../models/Monument');
const jwt = require('jsonwebtoken');

const validateTicket = async ({ ticketId, qrPayload, staffId, selectedMonumentId }) => {
  let resolvedTicketId = ticketId;
  let decodedPayload = null;

  if (qrPayload) {
    try {
      decodedPayload = jwt.verify(qrPayload, process.env.JWT_SECRET || 'fallback_secret');
      resolvedTicketId = decodedPayload.ticketId;
    } catch (err) {
      const error = new Error('Invalid or expired QR payload');
      error.statusCode = 400;
      throw error;
    }
  }

  if (!resolvedTicketId) {
    const error = new Error('Ticket identifier is required');
    error.statusCode = 400;
    throw error;
  }

  const ticket = await Ticket.findById(resolvedTicketId).populate('monumentId');

  if (!ticket) {
    const error = new Error('Ticket not found');
    error.statusCode = 404;
    throw error;
  }

  if (selectedMonumentId && ticket.monumentId._id.toString() !== selectedMonumentId) {
    const error = new Error('Ticket does not belong to the selected monument');
    error.statusCode = 400;
    throw error;
  }

  if (ticket.status === 'cancelled') {
    const error = new Error('Ticket is cancelled');
    error.statusCode = 400;
    throw error;
  }

  if (ticket.status === 'used') {
    const error = new Error('Ticket is already used');
    error.statusCode = 400;
    throw error;
  }

  // Check if visitDate matches today's date
  const now = new Date();
  
  // visitDate in DB is stored as startOfDay
  const ticketDate = new Date(ticket.visitDate);
  const isSameDate = ticketDate.getFullYear() === now.getFullYear() &&
                     ticketDate.getMonth() === now.getMonth() &&
                     ticketDate.getDate() === now.getDate();
                     
  if (!isSameDate) {
    if (ticketDate < now) {
       const error = new Error('Ticket is expired (valid for a past date)');
       error.statusCode = 400;
       throw error;
    } else {
       const error = new Error('Ticket is valid for a future date');
       error.statusCode = 400;
       throw error;
    }
  }

  // Optional: We could check if slotEnd is passed, but for now date check is sufficient for expiration
  const [endHour, endMinute] = ticket.slotEnd.split(':').map(Number);
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  if (currentHour > endHour || (currentHour === endHour && currentMinute > endMinute)) {
    const error = new Error('Ticket slot time has expired');
    error.statusCode = 400;
    throw error;
  }

  // Update ticket
  ticket.status = 'used';
  ticket.checkInTime = now;
  ticket.scannedByStaffId = staffId;
  await ticket.save();

  return {
    ticketId: ticket._id,
    tokenNumber: ticket.tokenNumber,
    monumentId: ticket.monumentId._id,
    monumentName: ticket.monumentId.name,
    slotStart: ticket.slotStart,
    slotEnd: ticket.slotEnd,
    status: ticket.status,
    checkInTime: ticket.checkInTime
  };
};

module.exports = {
  validateTicket
};
