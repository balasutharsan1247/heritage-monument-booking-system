const Monument = require('../models/Monument');

const getMonuments = async (page = 1, limit = 10, activeOnly = false) => {
  const query = activeOnly ? { isActive: true } : {};
  const skip = (page - 1) * limit;

  const monuments = await Monument.find(query).skip(skip).limit(limit);
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
  const monument = new Monument(data);
  return await monument.save();
};

const updateMonument = async (id, data) => {
  return await Monument.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const deleteMonument = async (id) => {
  return await Monument.findByIdAndDelete(id);
};

module.exports = {
  getMonuments,
  getMonumentById,
  createMonument,
  updateMonument,
  deleteMonument
};
