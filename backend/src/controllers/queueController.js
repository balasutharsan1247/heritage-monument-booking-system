const QueueEntry = require('../models/QueueEntry');
const Ticket = require('../models/Ticket');
const Monument = require('../models/Monument');
const User = require('../models/User');

// Helper to broadcast queue updates
const broadcastQueueUpdate = (req, monumentId) => {
  const io = req.app.get('io');
  if (io) {
    io.to(`monument_${monumentId}`).emit('queueUpdated', { monumentId });
  }
};

// Helper to check staff permissions
const checkStaffPermission = async (userId, monumentId, role) => {
  if (role === 'admin') return true;
  const user = await User.findById(userId);
  if (!user || user.role !== 'staff') return false;
  return user.assignedMonument && user.assignedMonument.toString() === monumentId.toString();
};

// Staff: Get current queue for a monument
exports.getQueue = async (req, res, next) => {
  try {
    const { monumentId } = req.params;

    const hasAccess = await checkStaffPermission(req.user.id, monumentId, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Not authorized for this monument' });
    }

    const queue = await QueueEntry.find({ monumentId, status: { $in: ['waiting', 'called'] } })
      .sort({ joinedAt: 1 })
      .populate('ticketId', 'tokenNumber');

    res.status(200).json({ success: true, data: queue });
  } catch (error) {
    next(error);
  }
};

// Staff: Call next visitor
exports.callNext = async (req, res, next) => {
  try {
    const { monumentId } = req.params;

    const hasAccess = await checkStaffPermission(req.user.id, monumentId, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Not authorized for this monument' });
    }

    // Get the first waiting person
    const nextEntry = await QueueEntry.findOne({ monumentId, status: 'waiting' }).sort({ joinedAt: 1 });

    if (!nextEntry) {
      return res.status(404).json({ success: false, message: 'Queue is empty' });
    }

    nextEntry.status = 'called';
    nextEntry.calledAt = Date.now();
    await nextEntry.save();

    broadcastQueueUpdate(req, monumentId);

    res.status(200).json({ success: true, data: nextEntry });
  } catch (error) {
    next(error);
  }
};

// Staff: Skip a visitor
exports.skipVisitor = async (req, res, next) => {
  try {
    const { monumentId, entryId } = req.params;

    const hasAccess = await checkStaffPermission(req.user.id, monumentId, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Not authorized for this monument' });
    }

    const entry = await QueueEntry.findOne({ _id: entryId, monumentId });

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Queue entry not found' });
    }

    if (entry.status !== 'waiting' && entry.status !== 'called') {
      return res.status(400).json({ success: false, message: 'Invalid state transition: can only skip waiting or called entries' });
    }

    entry.status = 'skipped';
    await entry.save();

    broadcastQueueUpdate(req, monumentId);

    res.status(200).json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
};

// Staff: Complete a visit
exports.completeVisit = async (req, res, next) => {
  try {
    const { monumentId, entryId } = req.params;

    const hasAccess = await checkStaffPermission(req.user.id, monumentId, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Not authorized for this monument' });
    }

    const entry = await QueueEntry.findOne({ _id: entryId, monumentId });

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Queue entry not found' });
    }

    if (entry.status !== 'called') {
      return res.status(400).json({ success: false, message: 'Invalid state transition: can only complete called entries' });
    }

    entry.status = 'completed';
    entry.completedAt = Date.now();
    await entry.save();

    broadcastQueueUpdate(req, monumentId);

    res.status(200).json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
};

// Visitor: Get my queue status
exports.getMyQueueStatus = async (req, res, next) => {
  try {
    const { ticketId } = req.params;

    let entry = await QueueEntry.findOne({ ticketId });

    if (!entry) {
      const ticket = await Ticket.findById(ticketId);
      if (ticket && ticket.status !== 'cancelled') {
        entry = await QueueEntry.create({
          ticketId: ticket._id,
          monumentId: ticket.monumentId,
          tokenNumber: ticket.tokenNumber,
          status: 'waiting',
          joinedAt: new Date()
        });
      }
    }

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Queue entry not found' });
    }

    let estimatedWait = 0;
    let entriesAhead = 0;

    if (entry.status === 'waiting') {
      entriesAhead = await QueueEntry.countDocuments({
        monumentId: entry.monumentId,
        status: 'waiting',
        joinedAt: { $lt: entry.joinedAt }
      });
      
      // Estimated Wait Time = (number of waiting entries ahead) * 5 (minutes)
      estimatedWait = entriesAhead * 5;
    }

    const currentlyServing = await QueueEntry.findOne({
      monumentId: entry.monumentId,
      status: 'called'
    }).sort({ calledAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        ...entry.toObject(),
        entriesAhead,
        estimatedWait, // in minutes
        currentlyServing: currentlyServing ? {
          tokenNumber: currentlyServing.tokenNumber,
          calledAt: currentlyServing.calledAt
        } : null
      }
    });
  } catch (error) {
    next(error);
  }
};

// Public: Get live queue status for monument displays without auth
exports.getPublicQueueStatus = async (req, res, next) => {
  try {
    const { monumentId } = req.params;

    const current = await QueueEntry.findOne({ monumentId, status: 'called' })
      .sort({ calledAt: -1 });

    const waiting = await QueueEntry.find({ monumentId, status: 'waiting' })
      .sort({ joinedAt: 1 });

    res.status(200).json({
      success: true,
      data: {
        current: current ? {
          _id: current._id,
          tokenNumber: current.tokenNumber,
          calledAt: current.calledAt
        } : null,
        waiting: waiting.map(w => ({
          _id: w._id,
          tokenNumber: w.tokenNumber,
          joinedAt: w.joinedAt
        })),
        totalWaiting: waiting.length
      }
    });
  } catch (error) {
    next(error);
  }
};
