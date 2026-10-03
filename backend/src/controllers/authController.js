const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please add all fields' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists with normalized email
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user - Public registrations are strictly visitor
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'visitor'
    });

    if (user) {
      res.status(201).json({
        success: true,
        data: {
          _id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          assignedMonument: null,
          token: generateToken(user._id, user.role),
        }
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check for user email and populate assigned monument
    const user = await User.findOne({ email: normalizedEmail }).populate('assignedMonument', 'name location openingTime closingTime');

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      res.json({
        success: true,
        data: {
          _id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          assignedMonument: user.assignedMonument,
          token: generateToken(user._id, user.role),
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user data (Test route for protected middleware)
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-passwordHash')
      .populate('assignedMonument', 'name location openingTime closingTime');
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'placeholder');

// @desc    Authenticate with Google
// @route   POST /api/auth/google
// @access  Public
const googleLoginUser = async (req, res, next) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ success: false, message: 'No Google token provided' });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID || 'placeholder',
    });
    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      // Create user if they don't exist
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(googleId, salt); // random password hash basically
      
      user = await User.create({
        name,
        email,
        passwordHash,
        role: 'visitor'
      });
    }

    res.json({
      success: true,
      data: {
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        assignedMonument: user.assignedMonument,
        token: generateToken(user._id, user.role),
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(401).json({ success: false, message: 'Invalid Google token' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  googleLoginUser,
  getMe,
};
