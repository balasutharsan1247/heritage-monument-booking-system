const staffTicketService = require('../services/staffTicketService');

const validateTicket = async (req, res, next) => {
  try {
    const { ticketId, qrPayload } = req.body;
    
    // We assume the staff member's monument scope is not strictly checked here for MVP,
    // or maybe the staff member selects the monument they are scanning for.
    // The requirement says: "Verify that the ticket exists, belongs to the selected monument"
    // Wait, the client will supply the selected monument id. Or maybe the ticket itself has the monumentId.
    // Let's pass the body to the service
    const validationResult = await staffTicketService.validateTicket({
      ticketId,
      qrPayload,
      staffId: req.user.id,
      selectedMonumentId: req.body.monumentId // if they are validating for a specific monument
    });

    res.status(200).json({
      success: true,
      data: validationResult
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateTicket
};
