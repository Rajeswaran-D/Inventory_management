const express = require('express');
const router = express.Router();
const prisma = require('../utils/prismaClient'); // Replaces User model
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Protect middleware requires User lookup, so we need to inline/mock that part or ensure middleware uses Prisma.
// Let's assume auth middleware still extracts req.user = { userId, role } from token.
const { protect } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../utils/mailer');

// Helper to match Mongoose pre-save crypto
const hashPassword = async (pwd) => await bcrypt.hash(pwd, await bcrypt.genSalt(10));
const matchPassword = async (entered, hashed) => await bcrypt.compare(entered, hashed);

const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'your_super_secret_key_change_this_later',
    { expiresIn: '7d' }
  );
};

// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    let user = await prisma.user.findUnique({ where: { email } });
    if (user) return res.status(400).json({ success: false, message: 'Email already exists' });

    user = await prisma.user.create({
      data: {
        name,
        email,
        password: await hashPassword(password),
        role: role || 'employee'
      }
    });

    const token = generateToken(user.id, user.role);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: { id: user.id, _id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error registering user' });
  }
});

// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (!user.isActive) return res.status(401).json({ success: false, message: 'User account is inactive' });

    const isMatch = await matchPassword(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = generateToken(user.id, user.role);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: { id: user.id, _id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error logging in' });
  }
});

// @route   GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    res.status(200).json({
      success: true,
      user: { id: user.id, _id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching user' });
  }
});

router.post('/logout', protect, (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

router.get('/users', protect, async (req, res) => {
  try {
    const requester = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true, updatedAt: true } // Omit password
    });
    res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
});

router.post('/users', protect, async (req, res) => {
  try {
    const requester = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!requester || requester.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });

    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email and password are required' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ success: false, message: 'Email already in use' });

    const user = await prisma.user.create({
      data: { name, email, password: await hashPassword(password), role: role || 'employee' }
    });
    res.status(201).json({
      success: true, message: 'User created successfully',
      user: { id: user.id, _id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error creating user' });
  }
});

router.delete('/users/:id', protect, async (req, res) => {
  try {
    const requester = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!requester || requester.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });
    if (req.params.id === req.user.userId) return res.status(400).json({ success: false, message: 'You cannot delete your own account' });

    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting user' });
  }
});

router.put('/change-password', protect, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json({ success: false, message: 'Old and new passwords are required' });
    if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    const isMatch = await matchPassword(oldPassword, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect' });

    await prisma.user.update({
      where: { id: user.id },
      data: { password: await hashPassword(newPassword) }
    });
    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error changing password' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ success: false, message: 'Email not registered' });

    const token = jwt.sign({ userId: user.id, purpose: 'password-reset' }, process.env.JWT_SECRET || 'your_super_secret_key_change_this_later', { expiresIn: '15m' });
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${token}`;
    
    try {
      await sendPasswordResetEmail(user.email, resetLink);
    } catch(mailError) {
      return res.status(500).json({ message: 'Mailer Error', error: mailError.message });
    }

    return res.status(200).json({ success: true, message: 'Reset link sent to your email' });
  } catch (error) {
    return res.status(500).json({ message: "Unexpected Server Error", error: error.message });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ success: false, message: 'Token and new password are required' });
    if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_key_change_this_later');
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset link' });
    }

    if (decoded.purpose !== 'password-reset') return res.status(400).json({ success: false, message: 'Invalid reset token' });

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await prisma.user.update({
      where: { id: user.id },
      data: { password: await hashPassword(newPassword) }
    });

    res.status(200).json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error resetting password' });
  }
});

module.exports = router;
