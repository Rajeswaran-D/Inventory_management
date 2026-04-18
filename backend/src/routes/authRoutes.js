const express = require('express');
const jwt = require('jsonwebtoken');

const { query } = require('../lib/db');
const { createId } = require('../lib/ids');
const { protect } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../utils/mailer');
const { JWT_SECRET, comparePassword, generateToken, hashPassword } = require('../lib/auth');

const router = express.Router();

function serializeUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
  };
}

async function getUserById(id) {
  const result = await query(
    `
      SELECT id, name, email, password_hash, role, is_active, created_at, updated_at
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );
  return result.rows[0] || null;
}

async function requireAdmin(userId) {
  const user = await getUserById(userId);
  return user && user.role === 'admin' ? user : null;
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await query('SELECT id FROM users WHERE email = $1 LIMIT 1', [normalizedEmail]);
    if (existing.rowCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists',
      });
    }

    const user = {
      id: createId(),
      name: String(name).trim(),
      email: normalizedEmail,
      role: role || 'employee',
    };

    await query(
      `
        INSERT INTO users (id, name, email, password_hash, role, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [user.id, user.name, user.email, await hashPassword(password), user.role, true]
    );

    const token = generateToken(user.id, user.role);
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error registering user',
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const result = await query(
      `
        SELECT id, name, email, password_hash, role, is_active
        FROM users
        WHERE email = $1
        LIMIT 1
      `,
      [normalizedEmail]
    );
    const user = result.rows[0];

    if (!user || !(await comparePassword(password, user.password_hash))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'User account is inactive',
      });
    }

    const token = generateToken(user.id, user.role);
    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: serializeUser(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error logging in',
    });
  }
});

router.get('/me', protect, async (req, res) => {
  try {
    const user = await getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user: serializeUser(user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
    });
  }
});

router.post('/logout', protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

router.get('/users', protect, async (req, res) => {
  try {
    const requester = await requireAdmin(req.user.userId);
    if (!requester) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const users = await query(
      `
        SELECT id, name, email, role, is_active, created_at
        FROM users
        ORDER BY created_at DESC
      `
    );

    res.status(200).json({
      success: true,
      count: users.rowCount,
      users: users.rows.map(serializeUser),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
});

router.post('/users', protect, async (req, res) => {
  try {
    const requester = await requireAdmin(req.user.userId);
    if (!requester) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await query('SELECT id FROM users WHERE email = $1 LIMIT 1', [normalizedEmail]);
    if (existing.rowCount > 0) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    const user = {
      id: createId(),
      name: String(name).trim(),
      email: normalizedEmail,
      role: role || 'employee',
    };

    await query(
      `
        INSERT INTO users (id, name, email, password_hash, role, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [user.id, user.name, user.email, await hashPassword(password), user.role, true]
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error creating user' });
  }
});

router.delete('/users/:id', protect, async (req, res) => {
  try {
    const requester = await requireAdmin(req.user.userId);
    if (!requester) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    const deleted = await query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);
    if (deleted.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting user' });
  }
});

router.put('/change-password', protect, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Old and new passwords are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const user = await getUserById(req.user.userId);
    if (!user || !(await comparePassword(oldPassword, user.password_hash))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [await hashPassword(newPassword), user.id]
    );

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error changing password' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const result = await query(
      `
        SELECT id, email, role
        FROM users
        WHERE email = $1
        LIMIT 1
      `,
      [normalizedEmail]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Email not registered',
      });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, purpose: 'password-reset' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password/${token}`;
    await sendPasswordResetEmail(user.email, resetLink);

    return res.status(200).json({
      success: true,
      message: 'Reset link sent to your email',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      message: 'Unexpected Server Error',
      error: error.message,
    });
  }
});

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
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      const message = error.name === 'TokenExpiredError'
        ? 'This reset link has expired. Please request a new one.'
        : 'Invalid or malformed reset link.';
      return res.status(400).json({ success: false, message });
    }

    if (decoded.purpose !== 'password-reset') {
      return res.status(400).json({ success: false, message: 'Invalid reset token' });
    }

    const user = await getUserById(decoded.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [await hashPassword(newPassword), user.id]
    );

    res.status(200).json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Error resetting password' });
  }
});

module.exports = router;
