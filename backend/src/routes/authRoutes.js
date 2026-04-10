const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../utils/mailer');

// Generate JWT Token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'your_super_secret_key_change_this_later',
    { expiresIn: '7d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public (Admin only in production, but public for initial setup)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Create user
    user = await User.create({
      name,
      email,
      password,
      role: role || 'employee'
    });

    // Create token
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error registering user'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user and return token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user (include password field)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is inactive'
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Create token
    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error logging in'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current logged-in user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @route   GET /api/auth/users
// @desc    Get all users (admin only)
// @access  Private - Admin
router.get('/users', protect, async (req, res) => {
  try {
    const requester = await User.findById(req.user.userId);
    if (requester.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
});

// @route   POST /api/auth/users
// @desc    Admin creates a new user (employee or admin)
// @access  Private - Admin
router.post('/users', protect, async (req, res) => {
  try {
    const requester = await User.findById(req.user.userId);
    if (requester.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    const user = await User.create({ name, email, password, role: role || 'employee' });
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error creating user' });
  }
});

// @route   DELETE /api/auth/users/:id
// @desc    Admin deletes a user
// @access  Private - Admin
router.delete('/users/:id', protect, async (req, res) => {
  try {
    const requester = await User.findById(req.user.userId);
    if (requester.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    if (req.params.id === req.user.userId.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting user' });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change own password (any authenticated user)
// @access  Private
router.put('/change-password', protect, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Old and new passwords are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.userId).select('+password');
    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();
    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error changing password' });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email with a 15-min JWT link
// @access  Public
router.post('/forgot-password', async (req, res) => {
  console.log("--- Forgot Password Attempt ---");
  try {
    const { email } = req.body;
    console.log("Input Email:", email);

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    console.log("User Status:", user ? `Found (${user.email})` : "Not Found");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Email not registered'
      });
    }

    let token;
    try {
      token = jwt.sign(
        { userId: user._id, purpose: 'password-reset' },
        process.env.JWT_SECRET || 'your_super_secret_key_change_this_later',
        { expiresIn: '15m' }
      );
      console.log("JWT Token generated successfully");
    } catch (jwtErr) {
      console.error("JWT Signing Error:", jwtErr.message);
      return res.status(500).json({ message: "Internal Token Error", error: jwtErr.message });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password/${token}`;
    console.log("Reset Link constructed");

    try {
      console.log("Attempting to send email via Nodemailer...");
      await sendPasswordResetEmail(user.email, resetLink);
      console.log("✅ Email sent successfully");
    } catch (mailError) {
      console.error('❌ Mailer execution failed:', mailError.message);
      return res.status(500).json({ 
        message: 'Mailer Error',
        error: mailError.message,
        hint: process.env.EMAIL_USER === 'your_gmail@gmail.com' ? 'Update .env credentials' : 'Check SMTP settings'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Reset link sent to your email'
    });
  } catch (error) {
    console.error("🏁 Critical Forgot Password Error:", error);
    return res.status(500).json({
      message: "Unexpected Server Error",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Verify token and set a new password
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_key_change_this_later');
    } catch (err) {
      const msg = err.name === 'TokenExpiredError'
        ? 'This reset link has expired. Please request a new one.'
        : 'Invalid or malformed reset link.';
      return res.status(400).json({ success: false, message: msg });
    }

    if (decoded.purpose !== 'password-reset') {
      return res.status(400).json({ success: false, message: 'Invalid reset token' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = newPassword;  // pre-save hook hashes it
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Error resetting password' });
  }
});

module.exports = router;
