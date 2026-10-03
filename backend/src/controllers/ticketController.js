const Ticket = require('../models/Ticket');
const Monument = require('../models/Monument');
const QueueEntry = require('../models/QueueEntry');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const User = require('../models/User');
const treasuryService = require('../services/treasuryService');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const bookTicket = async (req, res) => {
  try {
    const { monumentId, visitDate, slotStart, slotEnd, quantity = 1, paymentMethod } = req.body;

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

    const parsedQuantity = Math.max(1, parseInt(quantity, 10) || 1);
    if (parsedQuantity > 10) {
      return res.status(400).json({ success: false, message: 'Maximum 10 tickets per booking transaction' });
    }

    // Check capacity for the slot considering party sizes
    const existingSlotTickets = await Ticket.find({
      monumentId,
      visitDate: { $gte: startOfDay, $lt: endOfDay },
      slotStart,
      status: { $in: ['booked', 'used'] }
    }).select('numberOfPeople');

    const totalBookedPeople = existingSlotTickets.reduce((sum, t) => sum + (t.numberOfPeople || 1), 0);
    const remainingCapacity = Math.max(0, monument.capacity - totalBookedPeople);
    if (totalBookedPeople + parsedQuantity > monument.capacity) {
      return res.status(400).json({ 
        success: false, 
        message: `Not enough capacity for this slot. Only ${remainingCapacity} visitor spot${remainingCapacity === 1 ? '' : 's'} remaining.` 
      });
    }

    // Calculate total cost
    const totalCost = monument.baseTicketPrice * parsedQuantity;

    // Handle Wallet Payment if selected: deduct visitor wallet
    if (paymentMethod === 'wallet') {
      const wallet = await Wallet.findOneAndUpdate(
        { userId: req.user.id, balance: { $gte: totalCost } },
        { $inc: { balance: -totalCost } },
        { new: true }
      );

      if (!wallet) {
        const curWallet = await Wallet.findOne({ userId: req.user.id });
        const curBalance = curWallet ? curWallet.balance : 0;
        return res.status(400).json({
          success: false,
          message: `Insufficient wallet balance. Available: ₹${curBalance}, Required: ₹${totalCost}. Please top up your wallet.`,
        });
      }

      await WalletTransaction.create({
        userId: req.user.id,
        walletId: wallet._id,
        type: 'debit',
        amount: totalCost,
        balanceAfter: wallet.balance,
        purpose: 'ticket_purchase',
        description: `Booking Pass: ${monument.name} (${quantity} ticket${quantity > 1 ? 's' : ''})`,
        paymentMethod: 'Virtual Wallet',
        status: 'completed',
      });
    }

    // Create a SINGLE BULK TICKET for the party
    const tokenNumber = `${monument.name.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    
    const ticket = new Ticket({
      visitorId: req.user.id,
      monumentId,
      visitDate: startOfDay,
      slotStart,
      slotEnd,
      tokenNumber,
      numberOfPeople: parsedQuantity,
      price: totalCost,
      status: 'booked',
    });

    // Generate QR data encoding the ticket and total attendees
    const validationPayload = {
      ticketId: ticket._id.toString(),
      monumentId: monument._id.toString(),
      tokenNumber,
      numberOfPeople: parsedQuantity
    };
    
    ticket.qrCodeData = jwt.sign(validationPayload, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
    await ticket.save();
    await ticket.populate('monumentId', 'name location imageUrl');

    // Automatically credit Central Treasury Wallet with booking revenue
    if (totalCost > 0) {
      try {
        const treasuryWallet = await treasuryService.getOrCreateTreasuryWallet();
        const updatedTreasury = await Wallet.findByIdAndUpdate(
          treasuryWallet._id,
          { $inc: { balance: totalCost } },
          { new: true }
        );

        await WalletTransaction.create({
          userId: treasuryWallet.userId,
          walletId: treasuryWallet._id,
          type: 'credit',
          amount: totalCost,
          balanceAfter: updatedTreasury ? updatedTreasury.balance : (treasuryWallet.balance + totalCost),
          purpose: 'ticket_revenue',
          referenceId: ticket._id.toString(),
          monumentId: monument._id,
          description: `Revenue from visitor ticket booking: ${ticket.tokenNumber} (${monument.name})`,
          paymentMethod: paymentMethod === 'wallet' ? 'Virtual Wallet' : 'Direct Booking Gateway',
          status: 'completed',
        });
      } catch (adminWalletErr) {
        console.error('Error crediting central treasury wallet:', adminWalletErr);
      }
    }

    // Create a single QueueEntry for the entire group
    const queueEntry = new QueueEntry({
      ticketId: ticket._id,
      monumentId: ticket.monumentId,
      tokenNumber,
      numberOfPeople: parsedQuantity,
      status: 'waiting',
      joinedAt: new Date()
    });
    await queueEntry.save();

    // Broadcast queue update
    const io = req.app.get('io');
    if (io) {
      io.to(`monument_${monumentId}`).emit('queueUpdated', { monumentId });
    }

    // Prepare response
    const responseTicket = {
      _id: ticket._id,
      monumentId: ticket.monumentId,
      visitDate: ticket.visitDate,
      slotStart: ticket.slotStart,
      slotEnd: ticket.slotEnd,
      tokenNumber: ticket.tokenNumber,
      numberOfPeople: ticket.numberOfPeople,
      price: ticket.price,
      qrCodeData: ticket.qrCodeData,
      status: ticket.status
    };

    res.status(201).json({ 
      success: true, 
      data: responseTicket,
      ticket: responseTicket,
      tickets: [responseTicket],
      primaryTicketId: responseTicket._id,
      quantity: parsedQuantity,
      totalPrice: totalCost
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ visitorId: req.user.id }).populate('monumentId', 'name location imageUrl');
    const formattedTickets = tickets.map(t => ({
      _id: t._id,
      monumentId: t.monumentId,
      visitDate: t.visitDate,
      slotStart: t.slotStart,
      slotEnd: t.slotEnd,
      tokenNumber: t.tokenNumber,
      numberOfPeople: t.numberOfPeople || 1,
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
    const ticket = await Ticket.findOne({ _id: req.params.id, visitorId: req.user.id }).populate('monumentId', 'name location imageUrl');
    
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Find any additional tickets booked for the same monument, date, and slot by this visitor
    const siblingTickets = await Ticket.find({
      visitorId: req.user.id,
      monumentId: ticket.monumentId._id || ticket.monumentId,
      visitDate: ticket.visitDate,
      slotStart: ticket.slotStart,
      status: { $in: ['booked', 'used'] }
    }).select('_id tokenNumber status qrCodeData price slotStart slotEnd numberOfPeople');

    res.json({ success: true, data: {
      _id: ticket._id,
      monumentId: ticket.monumentId,
      visitDate: ticket.visitDate,
      slotStart: ticket.slotStart,
      slotEnd: ticket.slotEnd,
      tokenNumber: ticket.tokenNumber,
      numberOfPeople: ticket.numberOfPeople || 1,
      price: ticket.price,
      qrCodeData: ticket.qrCodeData,
      status: ticket.status,
      siblingTickets: siblingTickets && siblingTickets.length > 0 ? siblingTickets : [ticket]
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

    await QueueEntry.deleteMany({ ticketId: ticket._id });

    // Refund ticket amount to wallet if ticket has price > 0
    if (ticket.price && ticket.price > 0) {
      try {
        const wallet = await Wallet.findOneAndUpdate(
          { userId: ticket.visitorId },
          { $inc: { balance: ticket.price } },
          { new: true, upsert: true }
        );

        await WalletTransaction.create({
          userId: ticket.visitorId,
          walletId: wallet._id,
          type: 'credit',
          amount: ticket.price,
          balanceAfter: wallet.balance,
          purpose: 'ticket_refund',
          referenceId: ticket._id.toString(),
          description: `Refund for Ticket #${ticket.tokenNumber}`,
          paymentMethod: 'Virtual Wallet',
          status: 'completed',
        });

        // Deduct refunded amount from Central Treasury Wallet
        const treasuryWallet = await treasuryService.getOrCreateTreasuryWallet();
        if (treasuryWallet) {
          const updatedTreasury = await Wallet.findByIdAndUpdate(
            treasuryWallet._id,
            { $inc: { balance: -ticket.price } },
            { new: true }
          );

          await WalletTransaction.create({
            userId: treasuryWallet.userId,
            walletId: treasuryWallet._id,
            type: 'debit',
            amount: ticket.price,
            balanceAfter: updatedTreasury ? updatedTreasury.balance : Math.max(0, treasuryWallet.balance - ticket.price),
            purpose: 'ticket_refund_deduction',
            referenceId: ticket._id.toString(),
            monumentId: ticket.monumentId?._id || ticket.monumentId || null,
            description: `Refund payout for Ticket #${ticket.tokenNumber}`,
            paymentMethod: 'Virtual Wallet',
            status: 'completed',
          });
        }
      } catch (refundErr) {
        console.error('Error processing wallet refund:', refundErr);
      }
    }

    const io = req.app.get('io');
    if (io && ticket.monumentId) {
      io.to(`monument_${ticket.monumentId}`).emit('queueUpdated', { monumentId: ticket.monumentId });
    }

    res.json({ success: true, message: 'Ticket cancelled and refunded successfully', data: {
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
