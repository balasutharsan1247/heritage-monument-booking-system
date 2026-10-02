const Ticket = require('../models/Ticket');
const Monument = require('../models/Monument');
const QueueEntry = require('../models/QueueEntry');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

/**
 * Resolves a ticket from JWT qrPayload, tokenNumber, or ticketId
 */
const resolveTicket = async ({ ticketId, tokenNumber, qrPayload }) => {
  let resolvedTicketId = ticketId;
  let resolvedTokenNumber = tokenNumber;

  if (qrPayload) {
    const trimmed = qrPayload.trim();
    // 1. Try JWT
    try {
      const decoded = jwt.verify(trimmed, process.env.JWT_SECRET || 'fallback_secret');
      if (decoded.ticketId) resolvedTicketId = decoded.ticketId;
      if (decoded.tokenNumber) resolvedTokenNumber = decoded.tokenNumber;
    } catch (jwtErr) {
      // 2. Try JSON string
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.ticketId) resolvedTicketId = parsed.ticketId;
        if (parsed.tokenNumber) resolvedTokenNumber = parsed.tokenNumber;
      } catch (jsonErr) {
        // 3. Check if valid ObjectId
        if (mongoose.Types.ObjectId.isValid(trimmed) && trimmed.length === 24) {
          resolvedTicketId = trimmed;
        } else {
          // 4. Treat as token number (e.g., TAJ-123456-AB)
          resolvedTokenNumber = trimmed;
        }
      }
    }
  }

  let ticket = null;
  if (resolvedTicketId) {
    ticket = await Ticket.findById(resolvedTicketId)
      .populate('monumentId', 'name location openingTime closingTime')
      .populate('visitorId', 'name email');
  }

  if (!ticket && resolvedTokenNumber) {
    ticket = await Ticket.findOne({ tokenNumber: resolvedTokenNumber.trim() })
      .populate('monumentId', 'name location openingTime closingTime')
      .populate('visitorId', 'name email');
  }

  return ticket;
};

/**
 * Checks if a ticket is valid for admission
 */
const checkTicketValidity = (ticket, selectedMonumentId) => {
  if (!ticket) {
    return { valid: false, reason: 'Ticket record not found' };
  }

  if (ticket.status === 'cancelled') {
    return { valid: false, reason: 'Ticket has been cancelled and refunded' };
  }

  if (ticket.status === 'used') {
    const checkInStr = ticket.checkInTime 
      ? new Date(ticket.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      : 'earlier';
    return { valid: false, reason: `Ticket has already been used for entry (${checkInStr})` };
  }

  if (selectedMonumentId && ticket.monumentId && ticket.monumentId._id.toString() !== selectedMonumentId.toString()) {
    return { 
      valid: false, 
      reason: `Ticket belongs to "${ticket.monumentId.name}", not the selected gate` 
    };
  }

  const now = new Date();
  const ticketDate = new Date(ticket.visitDate);
  const isSameDate = ticketDate.getFullYear() === now.getFullYear() &&
                     ticketDate.getMonth() === now.getMonth() &&
                     ticketDate.getDate() === now.getDate();

  if (!isSameDate) {
    if (ticketDate < now) {
      return { valid: false, reason: `Ticket expired (valid on ${ticketDate.toLocaleDateString()})` };
    } else {
      return { valid: false, reason: `Ticket is for a future date (${ticketDate.toLocaleDateString()})` };
    }
  }

  // Grace period on slot (allow entry during and up to 1 hr after slot end)
  if (ticket.slotEnd) {
    const [endHour, endMinute] = ticket.slotEnd.split(':').map(Number);
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    if (currentHour > endHour + 1 || (currentHour === endHour + 1 && currentMinute > endMinute)) {
      return { valid: false, reason: `Ticket slot (${ticket.slotStart} – ${ticket.slotEnd}) has expired` };
    }
  }

  return { valid: true, reason: 'Ticket is valid for admission' };
};

/**
 * Verifies ticket details without marking as used
 */
const verifyTicket = async ({ ticketId, tokenNumber, qrPayload, selectedMonumentId }) => {
  const ticket = await resolveTicket({ ticketId, tokenNumber, qrPayload });
  if (!ticket) {
    const error = new Error('Ticket not found in system');
    error.statusCode = 404;
    throw error;
  }

  const validity = checkTicketValidity(ticket, selectedMonumentId);

  return {
    ticketId: ticket._id,
    tokenNumber: ticket.tokenNumber,
    monumentId: ticket.monumentId?._id,
    monumentName: ticket.monumentId?.name,
    monumentLocation: ticket.monumentId?.location,
    slotStart: ticket.slotStart,
    slotEnd: ticket.slotEnd,
    visitDate: ticket.visitDate,
    status: ticket.status,
    price: ticket.price,
    numberOfPeople: ticket.numberOfPeople || 1,
    visitor: ticket.visitorId ? {
      name: ticket.visitorId.name,
      email: ticket.visitorId.email
    } : null,
    valid: validity.valid,
    reason: validity.reason
  };
};

/**
 * Validates and marks ticket as used
 */
const validateTicket = async ({ ticketId, tokenNumber, qrPayload, staffId, selectedMonumentId, forceMark = false }) => {
  const ticket = await resolveTicket({ ticketId, tokenNumber, qrPayload });
  if (!ticket) {
    const error = new Error('Ticket not found');
    error.statusCode = 404;
    throw error;
  }

  const validity = checkTicketValidity(ticket, selectedMonumentId);
  if (!validity.valid && !forceMark) {
    const error = new Error(validity.reason);
    error.statusCode = 400;
    throw error;
  }

  // Update ticket to 'used'
  const now = new Date();
  ticket.status = 'used';
  ticket.checkInTime = now;
  ticket.scannedByStaffId = staffId;
  await ticket.save();

  // Update or create QueueEntry
  let queueEntry = null;
  try {
    queueEntry = await QueueEntry.findOne({ ticketId: ticket._id });
    if (queueEntry) {
      queueEntry.status = 'completed';
      queueEntry.completedAt = now;
      await queueEntry.save();
    } else {
      queueEntry = await QueueEntry.create({
        ticketId: ticket._id,
        monumentId: ticket.monumentId?._id,
        tokenNumber: ticket.tokenNumber,
        status: 'completed',
        numberOfPeople: ticket.numberOfPeople || 1,
        completedAt: now,
        joinedAt: now
      });
    }
  } catch (queueErr) {
    console.error('Warning: could not update QueueEntry during ticket validation:', queueErr.message);
  }

  return {
    ticketId: ticket._id,
    tokenNumber: ticket.tokenNumber,
    monumentId: ticket.monumentId?._id,
    monumentName: ticket.monumentId?.name,
    monumentLocation: ticket.monumentId?.location,
    slotStart: ticket.slotStart,
    slotEnd: ticket.slotEnd,
    status: ticket.status,
    numberOfPeople: ticket.numberOfPeople || 1,
    checkInTime: ticket.checkInTime,
    visitorName: ticket.visitorId?.name,
    queueStatus: queueEntry ? queueEntry.status : 'completed'
  };
};

module.exports = {
  resolveTicket,
  checkTicketValidity,
  verifyTicket,
  validateTicket
};
