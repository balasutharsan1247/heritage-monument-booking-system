const Ticket = require('../models/Ticket');

/**
 * Simulates calling the external Python prediction service.
 * In the prototype, this uses a Baseline (Previous-Period Value) model.
 */
exports.predictVisitorCount = async (monumentId, targetDateStr) => {
  const targetDateObj = new Date(targetDateStr);
  targetDateObj.setUTCHours(0, 0, 0, 0);

  // Simulated service failure randomly (e.g., 5% chance) or based on a specific date for testing
  if (targetDateStr === '2099-01-01') {
    const error = new Error('Model service connection failed');
    error.type = 'SERVICE_UNAVAILABLE';
    throw error;
  }
  
  if (targetDateStr === '2020-01-01') {
      const error = new Error('Unsupported model version');
      error.type = 'UNSUPPORTED_VERSION';
      throw error;
  }

  // Previous day calculation (since baseline is Previous-Period Value)
  const prevDate = new Date(targetDateObj);
  prevDate.setUTCDate(prevDate.getUTCDate() - 1);

  // Check if historical data exists for the monument at all
  const totalMonumentTickets = await Ticket.countDocuments({ monumentId });
  if (totalMonumentTickets === 0) {
    const error = new Error('Missing input features (no historical data available for monument)');
    error.type = 'MISSING_FEATURES';
    throw error;
  }

  // Use previous day tickets count as a proxy for Previous-Period Value baseline
  const ticketsCount = await Ticket.countDocuments({
    monumentId,
    visitDate: {
      $gte: prevDate,
      $lt: new Date(prevDate.getTime() + 24 * 60 * 60 * 1000)
    },
    status: { $ne: 'cancelled' }
  });

  return {
    predictedVisitorCount: ticketsCount,
    modelName: 'Baseline (Previous-Period Value)',
    modelVersion: '1.0',
    trainingDataRange: '2025-01-01 to 2025-01-01',
    evaluationMetrics: {
      mae: null,
      rmse: null,
      mape: null,
      note: 'Awaiting sufficient data to compute metrics.'
    },
    dataQualityStatus: 'Flagged (Insufficient history)',
    disclaimer: 'This prediction uses a naive baseline model due to lack of historical data. Do not use for critical operational decisions.'
  };
};
