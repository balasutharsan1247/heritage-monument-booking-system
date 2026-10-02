const staffTicketService = require('../services/staffTicketService');

const verifyTicket = async (req, res, next) => {
  try {
    const { ticketId, tokenNumber, qrPayload, qrCodeData, selectedMonumentId, monumentId } = req.body;

    const verificationResult = await staffTicketService.verifyTicket({
      ticketId,
      tokenNumber,
      qrPayload: qrPayload || qrCodeData,
      selectedMonumentId: selectedMonumentId || monumentId
    });

    res.status(200).json({
      success: true,
      data: verificationResult
    });
  } catch (error) {
    next(error);
  }
};

const validateTicket = async (req, res, next) => {
  try {
    const { ticketId, tokenNumber, qrPayload, qrCodeData, selectedMonumentId, monumentId, forceMark } = req.body;
    
    const validationResult = await staffTicketService.validateTicket({
      ticketId,
      tokenNumber,
      qrPayload: qrPayload || qrCodeData,
      staffId: req.user.id,
      selectedMonumentId: selectedMonumentId || monumentId,
      forceMark
    });

    const io = req.app.get('io');
    if (io) {
      if (validationResult.monumentId) {
        io.to(`monument_${validationResult.monumentId}`).emit('queueUpdated', { monumentId: validationResult.monumentId });
      }
      // Notify specific ticket room that entry was scanned
      if (validationResult.ticketId) {
        io.emit(`ticket_${validationResult.ticketId}_admitted`, {
          ticketId: validationResult.ticketId,
          checkInTime: validationResult.checkInTime,
          status: 'used'
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Ticket successfully validated and marked as admitted.',
      data: validationResult
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  verifyTicket,
  validateTicket
};
