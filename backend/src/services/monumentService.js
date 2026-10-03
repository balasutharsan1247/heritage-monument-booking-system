const Monument = require('../models/Monument');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const QueueEntry = require('../models/QueueEntry');

const getMonuments = async (page = 1, limit = 10, activeOnly = false) => {
  const query = activeOnly ? { isActive: true } : {};
  const skip = (page - 1) * limit;

  const monuments = await Monument.find(query).skip(skip).limit(limit).sort({ createdAt: -1 });
  const total = await Monument.countDocuments(query);

  return {
    monuments,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    totalMonuments: total
  };
};

const getMonumentById = async (id, activeOnly = false) => {
  const query = { _id: id };
  if (activeOnly) {
    query.isActive = true;
  }
  return await Monument.findOne(query);
};

const createMonument = async (data) => {
  const cleanName = data.name.trim();
  const existing = await Monument.findOne({
    name: { $regex: new RegExp(`^${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
  });
  if (existing) {
    throw new Error(`A monument with the name "${cleanName}" already exists`);
  }

  const monument = new Monument({
    ...data,
    name: cleanName,
  });
  return await monument.save();
};

const updateMonument = async (id, data) => {
  if (data.name && data.name.trim()) {
    const cleanName = data.name.trim();
    const existing = await Monument.findOne({
      name: { $regex: new RegExp(`^${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      _id: { $ne: id }
    });
    if (existing) {
      throw new Error(`Another monument with the name "${cleanName}" already exists`);
    }
    data.name = cleanName;
  }

  return await Monument.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const deleteMonument = async (id) => {
  // Referential Integrity: Check for upcoming active bookings
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const activeTickets = await Ticket.countDocuments({
    monumentId: id,
    status: 'booked',
    visitDate: { $gte: startOfToday }
  });

  if (activeTickets > 0) {
    throw new Error(
      `Cannot delete monument: There are ${activeTickets} active upcoming ticket bookings. Deactivate the monument instead or cancel the bookings first.`
    );
  }

  // Safely clean up associated records
  await User.updateMany({ assignedMonument: id }, { $unset: { assignedMonument: 1 } });
  await QueueEntry.deleteMany({ monumentId: id });
  return await Monument.findByIdAndDelete(id);
};

module.exports = {
  getMonuments,
  getMonumentById,
  createMonument,
  updateMonument,
  deleteMonument
};
