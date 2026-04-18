const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_change_this_later';

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function comparePassword(plainTextPassword, hashedPassword) {
  return bcrypt.compare(plainTextPassword, hashedPassword);
}

function generateToken(userId, role, extraPayload = {}) {
  return jwt.sign(
    { userId, role, ...extraPayload },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = {
  JWT_SECRET,
  hashPassword,
  comparePassword,
  generateToken,
};
