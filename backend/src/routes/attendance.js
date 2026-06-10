const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { month, year, employeeId } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate   = new Date(year, month, 0);
    const where = { companyId: req.companyId, date: { gte: startDate, lte: endDate } };
    if (employeeId) where.employeeId = employeeId;
    const records = await prisma.attendance.findMany({
      where,
      include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } },
    });
    res.json({ records });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { employeeId, date, status, checkIn, checkOut, overtimeHours } = req.body;
    const record = await prisma.attendance.upsert({
      where: { employeeId_date: { employeeId, date: new Date(date) } },
      create: { companyId: req.companyId, employeeId, date: new Date(date), status, checkIn, checkOut, overtimeHours: overtimeHours || 0 },
      update: { status, checkIn, checkOut, overtimeHours: overtimeHours || 0 },
    });
    res.json({ record });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

router.post('/bulk', async (req, res) => {
  try {
    const { date, records } = req.body;
    const results = await Promise.all(
      records.map(r =>
        prisma.attendance.upsert({
          where: { employeeId_date: { employeeId: r.employeeId, date: new Date(date) } },
          create: { companyId: req.companyId, employeeId: r.employeeId, date: new Date(date), status: r.status },
          update: { status: r.status },
        })
      )
    );
    res.json({ message: `Attendance marked for ${results.length} employees` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark bulk attendance' });
  }
});

module.exports = router;