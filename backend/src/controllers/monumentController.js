const monumentService = require('../services/monumentService');

const validateMonumentData = (data, isCreate = false) => {
  const errors = [];

  if (isCreate) {
    if (!data.name || !data.name.trim()) errors.push('Monument name is required');
    if (data.capacity === undefined || data.capacity === null) errors.push('Slot capacity is required');
    if (data.baseTicketPrice === undefined || data.baseTicketPrice === null) errors.push('Base ticket price is required');
    if (!data.openingTime) errors.push('Opening time is required');
    if (!data.closingTime) errors.push('Closing time is required');
  }

  if (data.latitude !== undefined && data.latitude !== null && data.latitude !== '') {
    const lat = Number(data.latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.push('Latitude must be a number between -90 and 90');
    }
  }

  if (data.longitude !== undefined && data.longitude !== null && data.longitude !== '') {
    const lng = Number(data.longitude);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.push('Longitude must be a number between -180 and 180');
    }
  }

  if (data.capacity !== undefined && data.capacity !== null) {
    const cap = Number(data.capacity);
    if (isNaN(cap) || cap <= 0) {
      errors.push('Capacity must be a positive number');
    }
  }

  if (data.baseTicketPrice !== undefined && data.baseTicketPrice !== null) {
    const price = Number(data.baseTicketPrice);
    if (isNaN(price) || price < 0) {
      errors.push('Base ticket price must be a non-negative number');
    }
  }

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (data.openingTime !== undefined && !timeRegex.test(data.openingTime)) {
    errors.push('Opening time must be in HH:MM format');
  }
  if (data.closingTime !== undefined && !timeRegex.test(data.closingTime)) {
    errors.push('Closing time must be in HH:MM format');
  }
  if (data.openingTime && data.closingTime && data.openingTime >= data.closingTime) {
    errors.push('Opening time must be earlier than closing time');
  }

  return errors;
};

// Public endpoints
const getPublicMonuments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    
    const result = await monumentService.getMonuments(page, limit, true);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getPublicMonumentById = async (req, res, next) => {
  try {
    const monument = await monumentService.getMonumentById(req.params.id, true);
    if (!monument) {
      return res.status(404).json({ success: false, message: 'Monument not found or inactive' });
    }
    res.status(200).json({ success: true, data: monument });
  } catch (error) {
    next(error);
  }
};

// Admin endpoints
const createMonument = async (req, res, next) => {
  try {
    const errors = validateMonumentData(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }
    
    const monument = await monumentService.createMonument(req.body);
    res.status(201).json({ success: true, data: monument });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message, errors: [error.message] });
  }
};

const updateMonument = async (req, res, next) => {
  try {
    const errors = validateMonumentData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }
    
    const monument = await monumentService.updateMonument(req.params.id, req.body);
    if (!monument) {
      return res.status(404).json({ success: false, message: 'Monument not found' });
    }
    res.status(200).json({ success: true, data: monument });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message, errors: [error.message] });
  }
};

const deleteMonument = async (req, res, next) => {
  try {
    const monument = await monumentService.deleteMonument(req.params.id);
    if (!monument) {
      return res.status(404).json({ success: false, message: 'Monument not found' });
    }
    res.status(200).json({ success: true, message: 'Monument deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAdminMonuments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 100;
    
    const result = await monumentService.getMonuments(page, limit, false);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicMonuments,
  getPublicMonumentById,
  getAdminMonuments,
  createMonument,
  updateMonument,
  deleteMonument
};
