const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { authenticate } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { companyName, email, password, phone, adminName } = req.body;
    if (!companyName || !email || !password)
      return res.status(400).json({ error: 'Company name, email and password are required' });
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already registered' });
    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: companyName, email, phone,
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      });
      const user = await tx.user.create({
        data: {
          companyId: company.id,
          name: adminName || companyName,
          email, password: hashedPassword,
          role: 'HR_ADMIN',
        },
      });
      return { company, user };
    });
    const token = jwt.sign({ userId: result.user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      message: '14-day free trial started!',
      token,
      user: { id: result.user.id, name: result.user.name, email: result.user.email, role: result.user.role },
      company: { id: result.company.id, name: result.company.name },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: { select: { id: true, name: true, isActive: true } } },
    });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      company: user.company,
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  res.json({
    user: { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role },
    company: req.user.company,
  });
});

module.exports = router;