const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../lib/auth');

function protect(req, res, next) {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }
}

function isAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Only admins can perform this action',
    });
  }
  next();
}

function isAdminOrEmployee(req, res, next) {
  if (req.user.role !== 'admin' && req.user.role !== 'employee') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }
  next();
}

module.exports = { protect, isAdmin, isAdminOrEmployee };
