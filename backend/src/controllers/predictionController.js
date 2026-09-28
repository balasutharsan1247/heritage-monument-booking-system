const Monument = require('../models/Monument');
const modelService = require('../services/modelService');

// @desc    Get visitor footfall prediction
// @route   GET /api/admin/predictions/:monumentId?date=YYYY-MM-DD
// @access  Private/Admin
exports.getPrediction = async (req, res) => {
  try {
    const { monumentId } = req.params;
    const { date } = req.query;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD.'
      });
    }

    const targetDateObj = new Date(date);
    if (isNaN(targetDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date.'
      });
    }

    targetDateObj.setUTCHours(0, 0, 0, 0);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (targetDateObj < today) {
      return res.status(400).json({
        success: false,
        message: 'Prediction date cannot be in the past.'
      });
    }

    const maxDate = new Date(today);
    maxDate.setUTCDate(maxDate.getUTCDate() + 30);
    if (targetDateObj > maxDate) {
      return res.status(400).json({
        success: false,
        message: 'Prediction date too far in the future. Unsupported date.'
      });
    }

    const monument = await Monument.findById(monumentId);
    if (!monument) {
      return res.status(404).json({
        success: false,
        message: 'Monument not found.'
      });
    }

    // Call simulated model service
    const predictionResult = await modelService.predictVisitorCount(monumentId, date);

    res.status(200).json({
      success: true,
      data: {
        monumentId,
        targetDate: date,
        ...predictionResult
      }
    });

  } catch (error) {
    if (error.type === 'MISSING_FEATURES') {
      return res.status(422).json({
        success: false,
        message: `Model error: ${error.message}`
      });
    }
    
    if (error.type === 'UNSUPPORTED_VERSION') {
       return res.status(400).json({
         success: false,
         message: `Model error: ${error.message}`
       });
    }

    if (error.type === 'SERVICE_UNAVAILABLE') {
      return res.status(503).json({
        success: false,
        message: `Model service error: ${error.message}`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};
