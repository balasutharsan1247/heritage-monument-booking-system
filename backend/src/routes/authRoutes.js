const express = require('express');
const router = express.Router();
const { registerUser, loginUser, googleLoginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLoginUser);
router.get('/me', protect, getMe);

module.exports = router;
