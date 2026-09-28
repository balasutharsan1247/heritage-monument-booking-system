const express = require('express');
const monumentController = require('../controllers/monumentController');

const router = express.Router();

// Visitor / Public Endpoints
router.get('/', monumentController.getPublicMonuments);
router.get('/:id', monumentController.getPublicMonumentById);

module.exports = router;
