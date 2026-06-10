const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { search, dept } = req.query;
    const where = { companyId: req.companyId };
    if (dept) where.department = dept;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName:  { contains: search, mode: 'insensitive' } },
        { employeeCode: { contains: search, mode: 'insensitive' } },
      ];
    }
    const employees = await prisma.employee.findMany({ where, orderBy: { employeeCode: 'asc' } });
    res.json({ employees });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

router.post('/', async (req, res) => {
  try {
    const count = await prisma.employee.count({ where: { companyId: req.companyId } });
    const employeeCode = `EMP-${String(count + 1).padStart(3, '0')}`;
    const employee = await prisma.employee.create({
      data: {
        ...req.body,
        companyId: req.companyId,
        employeeCode,
        basicSalary: parseFloat(req.body.basicSalary),
        dateOfJoining: new Date(req.body.dateOfJoining),
      },
    });
    res.status(201).json({ message: 'Employee added!', employee });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await prisma.employee.findFirst({ where: { id: req.params.id, companyId: req.companyId } });
    if (!existing) return res.status(404).json({ error: 'Employee not found' });
    const employee = await prisma.employee.update({ where: { id: req.params.id }, data: req.body });
    res.json({ employee });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.employee.findFirst({ where: { id: req.params.id, companyId: req.companyId } });
    if (!existing) return res.status(404).json({ error: 'Employee not found' });
    await prisma.employee.update({ where: { id: req.params.id }, data: { isActive: false, dateOfLeaving: new Date() } });
    res.json({ message: 'Employee deactivated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to deactivate employee' });
  }
});

module.exports = router;