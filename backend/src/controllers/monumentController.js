const monumentService = require('../services/monumentService');

const validateMonumentData = (data) => {
  const errors = [];

  if (data.latitude !== undefined) {
    if (typeof data.latitude !== 'number' || data.latitude < -90 || data.latitude > 90) {
      errors.push('Latitude must be a number between -90 and 90');
    }
  }

  if (data.longitude !== undefined) {
    if (typeof data.longitude !== 'number' || data.longitude < -180 || data.longitude > 180) {
      errors.push('Longitude must be a number between -180 and 180');
    }
  }

  if (data.capacity !== undefined) {
    if (typeof data.capacity !== 'number' || data.capacity <= 0) {
      errors.push('Capacity must be a positive number');
    }
  }

  if (data.baseTicketPrice !== undefined) {
    if (typeof data.baseTicketPrice !== 'number' || data.baseTicketPrice < 0) {
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
    const errors = validateMonumentData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }
    
    const monument = await monumentService.createMonument(req.body);
    res.status(201).json({ success: true, data: monument });
  } catch (error) {
    next(error);
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
    next(error);
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
    next(error);
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
