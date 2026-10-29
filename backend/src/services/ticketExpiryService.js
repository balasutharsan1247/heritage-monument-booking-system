const Ticket = require('../models/Ticket');

/**
 * Synchronize expired tickets:
 * Any ticket that is 'booked' and whose slot has passed without checking in
 * is updated to 'expired'.
 *
 * @param {Object} extraQuery - optional additional query filters
 */
const syncExpiredTickets = async (extraQuery = {}) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 1. All past dates are automatically expired
    await Ticket.updateMany(
      {
        ...extraQuery,
        status: 'booked',
        visitDate: { $lt: startOfToday },
      },
      {
        $set: { status: 'expired' },
      }
    );

    // 2. For today's tickets, check if slotEnd is in the past
    const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
    const todayTickets = await Ticket.find({
      ...extraQuery,
      status: 'booked',
      visitDate: { $gte: startOfToday, $lt: startOfTomorrow },
    });

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const expiredIds = [];
    for (const ticket of todayTickets) {
      if (ticket.slotEnd) {
        const [endHour, endMinute] = ticket.slotEnd.split(':').map(Number);
        if (
          !isNaN(endHour) &&
          !isNaN(endMinute) &&
          (currentHour > endHour || (currentHour === endHour && currentMinute >= endMinute))
        ) {
          expiredIds.push(ticket._id);
        }
      }
    }

    if (expiredIds.length > 0) {
      await Ticket.updateMany(
        { _id: { $in: expiredIds } },
        { $set: { status: 'expired' } }
      );
    }
  } catch (error) {
    console.error('Failed to sync expired tickets:', error);
  }
};

module.exports = {
  syncExpiredTickets,
};
