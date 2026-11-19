const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    
    // Auto-resolve society_id from user token or x-society-id header (for superadmin impersonation)
    if (decoded.role === 'superadmin') {
      req.society_id = req.headers['x-society-id'] ? parseInt(req.headers['x-society-id']) : (req.query.society_id ? parseInt(req.query.society_id) : null);
    } else {
      req.society_id = decoded.society_id;
    }

    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is invalid or expired' });
  }
};

const requireSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied: Super Admin privileges required' });
};

const requireAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
    return next();
  }
  return res.status(403).json({ message: 'Access denied: Admin privileges required' });
};

module.exports = authMiddleware;
module.exports.requireSuperAdmin = requireSuperAdmin;
module.exports.requireAdmin = requireAdmin;
