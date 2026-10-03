const Ticket = require('../models/Ticket');
const QueueEntry = require('../models/QueueEntry');
const Monument = require('../models/Monument');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const treasuryService = require('../services/treasuryService');
const mongoose = require('mongoose');

// Helper to get date boundaries
const getDateRange = (startDate, endDate) => {
  let start, end;
  
  if (startDate) {
    start = new Date(startDate);
  } else {
    start = new Date();
  }
  start.setHours(0, 0, 0, 0);
  
  if (endDate) {
    end = new Date(endDate);
  } else {
    end = new Date(start);
  }
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};

// GET /api/admin/dashboard/summary
exports.getSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const hasDateRange = Boolean(startDate || endDate);
    const { start, end } = getDateRange(startDate, endDate);

    // If date range is specified, match tickets within that range.
    // If not specified, summarize ALL tickets (all-time) so dashboard properties reflect the whole system!
    const matchCriteria = {
      status: { $in: ['booked', 'used'] }
    };
    if (hasDateRange) {
      matchCriteria.visitDate = { $gte: start, $lte: end };
    }

    const ticketStats = await Ticket.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: null,
          totalTickets: { $sum: { $ifNull: ["$numberOfPeople", 1] } },
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: "$price" },
          totalVisitors: { 
            $sum: { $cond: [{ $eq: ["$status", "used"] }, { $ifNull: ["$numberOfPeople", 1] }, 0] } 
          }
        }
      }
    ]);

    const result = ticketStats[0] || {
      totalTickets: 0,
      totalBookings: 0,
      totalRevenue: 0,
      totalVisitors: 0
    };

    const totalMonuments = await Monument.countDocuments({ isActive: true });
    const allMonumentsCount = await Monument.countDocuments();
    const totalUsers = await User.countDocuments();

    const validQuery = { status: 'booked' };
    const usedQuery = { status: 'used' };
    const cancelledQuery = { status: 'cancelled' };
    if (hasDateRange) {
      validQuery.visitDate = { $gte: start, $lte: end };
      usedQuery.visitDate = { $gte: start, $lte: end };
      cancelledQuery.visitDate = { $gte: start, $lte: end };
    }

    const validTickets = await Ticket.countDocuments(validQuery);
    const usedTickets = await Ticket.countDocuments(usedQuery);
    const cancelledTickets = await Ticket.countDocuments(cancelledQuery);

    let treasuryBalance = 0;
    try {
      const treasuryWallet = await treasuryService.getOrCreateTreasuryWallet();
      if (treasuryWallet) {
        if (treasuryWallet.balance === 0 && result.totalRevenue > 0) {
          await treasuryService.reconcileTreasury(req.user?.id);
          const refreshed = await treasuryService.getOrCreateTreasuryWallet();
          treasuryBalance = refreshed.balance;
        } else {
          treasuryBalance = treasuryWallet.balance;
        }
      }
    } catch (treasuryErr) {
      console.error('Error fetching treasury balance in summary:', treasuryErr);
      treasuryBalance = result.totalRevenue;
    }

    // Also compute today's stats for granular breakdown
    const todayBoundary = getDateRange();
    const todayStats = await Ticket.aggregate([
      {
        $match: {
          visitDate: { $gte: todayBoundary.start, $lte: todayBoundary.end },
          status: { $in: ['booked', 'used'] }
        }
      },
      {
        $group: {
          _id: null,
          totalTickets: { $sum: { $ifNull: ["$numberOfPeople", 1] } },
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: "$price" },
          totalVisitors: { 
            $sum: { $cond: [{ $eq: ["$status", "used"] }, { $ifNull: ["$numberOfPeople", 1] }, 0] } 
          }
        }
      }
    ]);
    const todayResult = todayStats[0] || { totalTickets: 0, totalBookings: 0, totalRevenue: 0, totalVisitors: 0 };

    res.json({
      success: true,
      data: {
        totalTickets: result.totalTickets || result.totalBookings,
        totalBookings: result.totalBookings,
        totalRevenue: result.totalRevenue,
        treasuryBalance,
        totalVisitors: result.totalVisitors,
        validTickets,
        usedTickets,
        cancelledTickets,
        totalMonuments,
        allMonumentsCount,
        totalUsers,
        today: todayResult,
        measured: {
          totalTickets: result.totalTickets || result.totalBookings,
          totalBookings: result.totalBookings,
          totalRevenue: result.totalRevenue,
          totalVisitors: result.totalVisitors,
          validTickets,
          usedTickets,
          cancelledTickets,
          totalMonuments,
          totalUsers
        }
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/dashboard/:monumentId
exports.getMonumentSummary = async (req, res) => {
  try {
    const { monumentId } = req.params;
    const { startDate, endDate } = req.query;
    const { start, end } = getDateRange(startDate, endDate);

    const ticketStats = await Ticket.aggregate([
      {
        $match: {
          monumentId: new mongoose.Types.ObjectId(monumentId),
          visitDate: { $gte: start, $lte: end },
          status: { $in: ['booked', 'used'] }
        }
      },
      {
        $group: {
          _id: null,
          totalTickets: { $sum: { $ifNull: ["$numberOfPeople", 1] } },
          totalRevenue: { $sum: "$price" },
          totalVisitors: { 
            $sum: { $cond: [{ $eq: ["$status", "used"] }, { $ifNull: ["$numberOfPeople", 1] }, 0] } 
          }
        }
      }
    ]);

    const result = ticketStats[0] || {
      totalTickets: 0,
      totalRevenue: 0,
      totalVisitors: 0
    };

    res.json({
      success: true,
      data: {
        measured: {
          totalTickets: result.totalTickets,
          totalRevenue: result.totalRevenue,
          totalVisitors: result.totalVisitors,
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/dashboard/:monumentId/hourly
exports.getMonumentHourly = async (req, res) => {
  try {
    const { monumentId } = req.params;
    const { date } = req.query;
    const { start, end } = getDateRange(date, date);

    const hourlyStats = await Ticket.aggregate([
      {
        $match: {
          monumentId: new mongoose.Types.ObjectId(monumentId),
          visitDate: { $gte: start, $lte: end },
          status: { $in: ['booked', 'used'] }
        }
      },
      {
        $addFields: {
          hour: { $toInt: { $substr: ["$slotStart", 0, 2] } }
        }
      },
      {
        $group: {
          _id: "$hour",
          tickets: { $sum: 1 },
          visitors: { 
            $sum: { $cond: [{ $eq: ["$status", "used"] }, 1, 0] } 
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        measured: hourlyStats.map(stat => ({
          hour: stat._id,
          tickets: stat.tickets,
          visitors: stat.visitors
        }))
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/dashboard/:monumentId/queue
exports.getMonumentQueue = async (req, res) => {
  try {
    const { monumentId } = req.params;
    const { date } = req.query;
    const { start, end } = getDateRange(date, date);

    const queueStats = await QueueEntry.aggregate([
      {
        $match: {
          monumentId: new mongoose.Types.ObjectId(monumentId),
          joinedAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalEntries: { $sum: 1 },
          waiting: { $sum: { $cond: [{ $eq: ["$status", "waiting"] }, 1, 0] } },
          called: { $sum: { $cond: [{ $eq: ["$status", "called"] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          skipped: { $sum: { $cond: [{ $eq: ["$status", "skipped"] }, 1, 0] } },
          totalWaitTimeMs: { 
            $sum: { 
              $cond: [
                { $and: [{ $eq: ["$status", "completed"] }, { $ne: ["$calledAt", null] }] }, 
                { $subtract: ["$calledAt", "$joinedAt"] }, 
                0
              ] 
            } 
          },
          completedCountForWaitTime: { 
            $sum: { 
              $cond: [
                { $and: [{ $eq: ["$status", "completed"] }, { $ne: ["$calledAt", null] }] }, 
                1, 
                0
              ] 
            } 
          }
        }
      }
    ]);

    const result = queueStats[0] || {
      totalEntries: 0,
      waiting: 0,
      called: 0,
      completed: 0,
      skipped: 0,
      totalWaitTimeMs: 0,
      completedCountForWaitTime: 0
    };

    const averageWaitTimeMinutes = result.completedCountForWaitTime > 0 
      ? Math.round((result.totalWaitTimeMs / result.completedCountForWaitTime) / 60000) 
      : 0;

    res.json({
      success: true,
      data: {
        measured: {
          totalEntries: result.totalEntries,
          statusCounts: {
            waiting: result.waiting,
            called: result.called,
            completed: result.completed,
            skipped: result.skipped
          },
          averageWaitTimeMinutes
        }
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/dashboard/queues/overview
exports.getQueuesOverview = async (req, res) => {
  try {
    const monuments = await Monument.find({}).select('name location capacity openingTime closingTime isActive');
    
    const overview = await Promise.all(
      monuments.map(async (m) => {
        const waitingCount = await QueueEntry.countDocuments({ monumentId: m._id, status: 'waiting' });
        const currentEntry = await QueueEntry.findOne({ monumentId: m._id, status: 'called' })
          .sort({ calledAt: -1 });
        const completedToday = await QueueEntry.countDocuments({ monumentId: m._id, status: 'completed' });
        
        return {
          monumentId: m._id,
          name: m.name,
          location: m.location,
          capacity: m.capacity,
          isActive: m.isActive,
          waitingCount,
          currentServing: currentEntry ? currentEntry.tokenNumber : null,
          completedToday,
          estimatedWaitMinutes: waitingCount * 5
        };
      })
    );

    res.json({ success: true, data: overview });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
