const User = require('../models/User');
const Monument = require('../models/Monument');
const bcrypt = require('bcryptjs');

// GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    const filter = {};

    if (role && ['admin', 'staff', 'visitor', 'user'].includes(role)) {
      filter.role = role === 'user' ? 'visitor' : role;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const users = await User.find(filter)
      .select('-passwordHash')
      .populate('assignedMonument', 'name location openingTime closingTime')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve users' });
  }
};

// POST /api/admin/users
const createUser = async (req, res) => {
  try {
    const { name, email, password, role = 'visitor', assignedMonument } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const normalizedRole = role === 'user' ? 'visitor' : role;
    if (!['admin', 'staff', 'visitor'].includes(normalizedRole)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified' });
    }

    let monumentId = null;
    if (normalizedRole === 'staff') {
      if (!assignedMonument) {
        return res.status(400).json({ success: false, message: 'Assigned monument site is required for staff members' });
      }
      const monumentExists = await Monument.findById(assignedMonument);
      if (!monumentExists) {
        return res.status(404).json({ success: false, message: 'Assigned monument site not found' });
      }
      monumentId = monumentExists._id;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: normalizedRole,
      assignedMonument: normalizedRole === 'staff' ? monumentId : undefined
    });

    const populated = await User.findById(newUser._id)
      .select('-passwordHash')
      .populate('assignedMonument', 'name location openingTime closingTime');

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: populated
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: 'Failed to create user account' });
  }
};

// PATCH /api/admin/users/:id
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, assignedMonument } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name && name.trim()) {
      user.name = name.trim();
    }

    if (email && email.trim()) {
      const normalizedEmail = email.toLowerCase().trim();
      if (normalizedEmail !== user.email) {
        const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: id } });
        if (existing) {
          return res.status(400).json({ success: false, message: 'Email is already in use by another account' });
        }
        user.email = normalizedEmail;
      }
    }

    if (password && password.trim()) {
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      }
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(password, salt);
    }

    if (role) {
      const normalizedRole = role === 'user' ? 'visitor' : role;
      if (!['admin', 'staff', 'visitor'].includes(normalizedRole)) {
        return res.status(400).json({ success: false, message: 'Invalid role specified' });
      }
      user.role = normalizedRole;
    }

    if (user.role === 'staff') {
      const targetMonumentId = assignedMonument !== undefined ? assignedMonument : user.assignedMonument;
      if (!targetMonumentId) {
        return res.status(400).json({ success: false, message: 'Assigned monument site is required for staff members' });
      }
      const monumentExists = await Monument.findById(targetMonumentId);
      if (!monumentExists) {
        return res.status(404).json({ success: false, message: 'Assigned monument site not found' });
      }
      user.assignedMonument = monumentExists._id;
    } else {
      user.assignedMonument = undefined;
    }

    await user.save();

    const populated = await User.findById(user._id)
      .select('-passwordHash')
      .populate('assignedMonument', 'name location openingTime closingTime');

    res.status(200).json({
      success: true,
      message: 'Account updated successfully',
      data: populated
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Failed to update user account' });
  }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const currentUserId = req.user?.id || req.user?._id;
    if (currentUserId && currentUserId.toString() === id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the only administrator account in the system',
        });
      }
    }

    // Clean up related records while preserving system financial audit integrity
    const Wallet = require('../models/Wallet');
    const WalletTransaction = require('../models/WalletTransaction');
    const Ticket = require('../models/Ticket');
    const QueueEntry = require('../models/QueueEntry');

    // If user holds Central Treasury, reassign treasury to another admin rather than deleting it!
    const treasuryWallet = await Wallet.findOne({ userId: id, isTreasury: true });
    if (treasuryWallet) {
      const nextAdmin = await User.findOne({ role: 'admin', _id: { $ne: id } });
      if (nextAdmin) {
        treasuryWallet.userId = nextAdmin._id;
        await treasuryWallet.save();
      }
    }

    // Cancel active bookings; preserve historical used tickets to maintain revenue audit consistency
    const activeBookings = await Ticket.find({ visitorId: id, status: 'booked' });
    const activeTicketIds = activeBookings.map((t) => t._id);
    if (activeTicketIds.length > 0) {
      await QueueEntry.deleteMany({ ticketId: { $in: activeTicketIds } });
      await Ticket.updateMany({ _id: { $in: activeTicketIds } }, { $set: { status: 'cancelled' } });
    }

    // Delete personal non-treasury wallet
    await Wallet.deleteMany({ userId: id, isTreasury: false });

    // Delete user account
    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: `User account "${user.name}" (${user.email}) deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user account' });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser
};
