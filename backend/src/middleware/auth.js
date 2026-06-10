const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer '))
      return res.status(401).json({ error: 'No token provided' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { company: { select: { id: true, name: true, isActive: true } } },
    });
    if (!user || !user.isActive) return res.status(401).json({ error: 'User not found' });
    if (!user.company.isActive) return res.status(403).json({ error: 'Account suspended' });
    req.user = user;
    req.companyId = user.companyId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ error: 'Access denied' });
  next();
};

module.exports = { authenticate, requireRole };