const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { razorpay, keyId, keySecret, isPlaceholderKey } = require('../config/razorpay');
const Ticket = require('../models/Ticket');
const Monument = require('../models/Monument');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const treasuryService = require('../services/treasuryService');

/**
 * Get Public Razorpay Key ID
 */
const getKey = (req, res) => {
  res.json({
    success: true,
    keyId: keyId || '',
    isMock: isPlaceholderKey,
  });
};

/**
 * Create a Razorpay Order
 * Supports both Monument Ticket Booking and Wallet Top-up
 */
const createOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', purpose = 'ticket', details = {} } = req.body;
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid payment amount greater than 0 is required.',
      });
    }

    // Amount in Razorpay subunits (paise for INR, 1 INR = 100 paise)
    const amountInPaise = Math.round(numAmount * 100);
    const receipt = `rcpt_${purpose}_${Date.now().toString().slice(-8)}`;

    // If using real Razorpay credentials (rzp_test_... or rzp_live_...)
    if (!isPlaceholderKey && razorpay) {
      try {
        const order = await razorpay.orders.create({
          amount: amountInPaise,
          currency: currency.toUpperCase(),
          receipt,
          notes: {
            userId: req.user.id.toString(),
            purpose,
            ...(purpose === 'ticket' && details.monumentId ? { monumentId: details.monumentId } : {}),
          },
        });

        return res.json({
          success: true,
          order,
          keyId,
          isMock: false,
        });
      } catch (err) {
        console.error('Razorpay SDK order creation error:', err);
        return res.status(500).json({
          success: false,
          message: err.error?.description || err.message || 'Failed to create Razorpay order',
        });
      }
    }

    // Fallback: Local Sandbox Mock Order (when using placeholder keys before user adds their real test keys)
    const mockOrderId = `order_mock_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const mockOrder = {
      id: mockOrderId,
      entity: 'order',
      amount: amountInPaise,
      amount_paid: 0,
      amount_due: amountInPaise,
      currency: currency.toUpperCase(),
      receipt,
      status: 'created',
      attempts: 0,
      notes: {
        userId: req.user.id.toString(),
        purpose,
      },
      created_at: Math.floor(Date.now() / 1000),
    };

    return res.json({
      success: true,
      order: mockOrder,
      keyId: keyId || 'rzp_test_placeholder_key',
      isMock: true,
      notice: 'Running in Local Sandbox Mock Mode. Replace RAZORPAY_KEY_ID & SECRET with your official keys anytime.',
    });
  } catch (error) {
    console.error('Create Order Handler Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Verify Razorpay Payment Signature and finalize Ticket Booking or Wallet Credit
 */
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      purpose = 'ticket',
      details = {},
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing order_id or payment_id for verification',
      });
    }

    // Cryptographic Signature Verification
    const isMockOrder = isPlaceholderKey || razorpay_order_id.startsWith('order_mock_');
    let isSignatureValid = false;

    if (isMockOrder) {
      // In local mock sandbox mode, mock signatures pass automatically
      isSignatureValid = true;
    } else {
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      isSignatureValid = (generatedSignature === razorpay_signature);
    }

    if (!isSignatureValid) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Invalid HMAC SHA-256 signature',
      });
    }

    // -------------------------------------------------------------
    // CASE 1: PURPOSE = TICKET BOOKING
    // -------------------------------------------------------------
    if (purpose === 'ticket') {
      const {
        monumentId,
        visitDate,
        slotStart,
        slotEnd,
        quantity = 1,
        visitorCategory = 'domestic',
      } = details;

      if (!monumentId || !visitDate || !slotStart || !slotEnd) {
        return res.status(400).json({
          success: false,
          message: 'Missing required booking details in verification payload',
        });
      }

      const monument = await Monument.findById(monumentId);
      if (!monument || !monument.isActive) {
        return res.status(404).json({ success: false, message: 'Monument not found or inactive' });
      }

      const date = new Date(visitDate);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

      const parsedQuantity = Math.max(1, parseInt(quantity, 10) || 1);
      if (parsedQuantity > 10) {
        return res.status(400).json({ success: false, message: 'Maximum 10 tickets per booking transaction' });
      }

      // Check remaining capacity for the slot
      const existingSlotTickets = await Ticket.find({
        monumentId,
        visitDate: { $gte: startOfDay, $lt: endOfDay },
        slotStart,
        status: { $in: ['booked', 'used'] },
      }).select('numberOfPeople');

      const totalBookedPeople = existingSlotTickets.reduce((sum, t) => sum + (t.numberOfPeople || 1), 0);
      const remainingCapacity = Math.max(0, monument.capacity - totalBookedPeople);
      if (totalBookedPeople + parsedQuantity > monument.capacity) {
        return res.status(400).json({
          success: false,
          message: `Slot filled during payment. Remaining spots: ${remainingCapacity}. Please choose another slot.`,
        });
      }

      const isForeign = visitorCategory === 'foreign';
      const unitPrice = isForeign && monument.foreignTicketPrice !== undefined
        ? monument.foreignTicketPrice
        : monument.baseTicketPrice;
      const totalCost = unitPrice * parsedQuantity;

      // Unique token number
      const tokenNumber = `${monument.name.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

      // Create Ticket
      const ticket = new Ticket({
        visitorId: req.user.id,
        monumentId,
        visitDate: startOfDay,
        slotStart,
        slotEnd,
        tokenNumber,
        numberOfPeople: parsedQuantity,
        price: totalCost,
        visitorCategory: isForeign ? 'foreign' : 'domestic',
        status: 'booked',
        paymentMethod: 'razorpay',
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      });

      // Encrypt QR Code payload
      const validationPayload = {
        ticketId: ticket._id.toString(),
        monumentId: monument._id.toString(),
        tokenNumber,
        numberOfPeople: parsedQuantity,
        paymentId: razorpay_payment_id,
      };

      ticket.qrCodeData = jwt.sign(validationPayload, process.env.JWT_SECRET || 'fallback_secret', {
        expiresIn: '7d',
      });

      await ticket.save();
      await ticket.populate('monumentId', 'name location imageUrl');

      // Credit Central Treasury Wallet with audited booking revenue
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
            description: `Revenue from visitor ticket booking: ${ticket.tokenNumber} (${monument.name}) via Razorpay [${razorpay_payment_id}]`,
            paymentMethod: 'Razorpay Gateway',
            status: 'completed',
          });
        } catch (adminWalletErr) {
          console.error('Failed to credit Treasury Wallet after Razorpay booking:', adminWalletErr);
        }
      }

      return res.status(201).json({
        success: true,
        message: 'Payment verified and ticket booked successfully!',
        primaryTicketId: ticket._id,
        data: ticket,
      });
    }

    // -------------------------------------------------------------
    // CASE 2: PURPOSE = WALLET TOP-UP
    // -------------------------------------------------------------
    if (purpose === 'wallet_topup') {
      const { amount, description = 'Money transferred directly from Razorpay' } = details;
      const numAmount = parseFloat(amount);

      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid wallet top-up amount',
        });
      }

      // Check if user is admin
      const isAdmin = req.user && req.user.role === 'admin';
      if (isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Admins cannot top-up personal balance; Central Treasury is funded via ticket revenue and grants.',
        });
      }

      // Find or create visitor wallet
      let wallet = await Wallet.findOne({ userId: req.user.id });
      if (!wallet) {
        wallet = await Wallet.create({
          userId: req.user.id,
          balance: 0,
          currency: 'INR',
        });
      }

      wallet.balance += numAmount;
      await wallet.save();

      // Log wallet transaction
      const transaction = await WalletTransaction.create({
        userId: req.user.id,
        walletId: wallet._id,
        type: 'credit',
        amount: numAmount,
        balanceAfter: wallet.balance,
        purpose: 'topup',
        description: `Money transferred directly from Razorpay [${razorpay_payment_id}]`,
        referenceId: razorpay_payment_id,
        paymentMethod: 'Razorpay',
        status: 'completed',
      });

      return res.json({
        success: true,
        message: `Payment successful! ₹${numAmount.toLocaleString()} added to your Virtual Wallet.`,
        data: {
          balance: wallet.balance,
          currency: wallet.currency,
          transaction,
        },
      });
    }

    return res.status(400).json({
      success: false,
      message: `Unknown payment purpose: ${purpose}`,
    });
  } catch (error) {
    console.error('Payment Verification Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getKey,
  createOrder,
  verifyPayment,
};
