const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

const calcPayslip = (emp, daysWorked = 26, otHours = 0, advance = 0) => {
  const basic       = emp.basicSalary;
  const earnedBasic = Math.round((basic / 26) * daysWorked * 100) / 100;
  const hra         = Math.round((emp.hra || earnedBasic * 0.4) * 100) / 100;
  const specialAllow= Math.round((emp.specialAllow || earnedBasic * 0.1) * 100) / 100;
  const otPay       = Math.round((basic / 208) * 1.5 * otHours * 100) / 100;
  const gross       = Math.round((earnedBasic + hra + specialAllow + otPay) * 100) / 100;
  const pf          = emp.pfApplicable ? Math.round(earnedBasic * 0.12 * 100) / 100 : 0;
  const esi         = (emp.esiApplicable && gross <= 21000) ? Math.round(gross * 0.0075 * 100) / 100 : 0;
  const pt          = emp.ptApplicable ? (gross >= 30000 ? 200 : gross >= 15000 ? 150 : 0) : 0;
  const totalDed    = Math.round((pf + esi + pt + advance) * 100) / 100;
  const net         = Math.round((gross - totalDed) * 100) / 100;
  return {
    employeeId: emp.id,
    basicSalary: earnedBasic, hra, specialAllow, overtimePay: otPay,
    grossSalary: gross, pfEmployee: pf, esiEmployee: esi,
    professionalTax: pt, advanceDeduction: advance, otherDeductions: 0,
    totalDeductions: totalDed, netSalary: net, daysWorked, daysInMonth: 26,
    employerPF: emp.pfApplicable ? Math.round(earnedBasic * 0.12 * 100) / 100 : 0,
    employerESI: (emp.esiApplicable && gross <= 21000) ? Math.round(gross * 0.0325 * 100) / 100 : 0,
  };
};

router.post('/run', async (req, res) => {
  try {
    const { month, year } = req.body;
    const companyId = req.companyId;
    const employees = await prisma.employee.findMany({ where: { companyId, isActive: true } });
    if (!employees.length) return res.status(400).json({ error: 'No active employees' });
    const attRecords = await prisma.attendance.findMany({
      where: { companyId, date: { gte: new Date(year, month - 1, 1), lte: new Date(year, month, 0) } },
    });
    const attMap = {};
    for (const r of attRecords) {
      if (!attMap[r.employeeId]) attMap[r.employeeId] = { daysPresent: 0, otHours: 0 };
      if (r.status === 'PRESENT')  attMap[r.employeeId].daysPresent += 1;
      if (r.status === 'HALF_DAY') attMap[r.employeeId].daysPresent += 0.5;
      if (r.overtimeHours)         attMap[r.employeeId].otHours += r.overtimeHours;
    }
    const payslips = employees.map(emp => {
      const att = attMap[emp.id] || { daysPresent: 26, otHours: 0 };
      return calcPayslip(emp, att.daysPresent, att.otHours);
    });
    const totals = payslips.reduce((a, p) => ({
      totalGross: a.totalGross + p.grossSalary,
      totalDeductions: a.totalDeductions + p.totalDeductions,
      totalNet: a.totalNet + p.netSalary,
      employerPF: a.employerPF + p.employerPF,
      employerESI: a.employerESI + p.employerESI,
    }), { totalGross: 0, totalDeductions: 0, totalNet: 0, employerPF: 0, employerESI: 0 });
    const run = await prisma.$transaction(async (tx) => {
      const r = await tx.payrollRun.upsert({
        where: { companyId_month_year: { companyId, month, year } },
        create: { companyId, month, year, status: 'PROCESSED', ...totals, processedAt: new Date(), processedBy: req.user.id },
        update: { status: 'PROCESSED', ...totals, processedAt: new Date() },
      });
      await tx.payslip.deleteMany({ where: { payrollRunId: r.id } });
      await tx.payslip.createMany({ data: payslips.map(p => ({ payrollRunId: r.id, ...p })) });
      await tx.usageEvent.create({
        data: { companyId, eventType: 'PAYROLL_RUN', quantity: 1, unitPrice: 49, totalAmount: 49, metadata: { month, year } },
      });
      return r;
    });
    res.json({ message: `Payroll processed for ${employees.length} employees`, payrollRun: run, totals, payslips });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Payroll processing failed' });
  }
});

router.get('/history', async (req, res) => {
  try {
    const runs = await prisma.payrollRun.findMany({
      where: { companyId: req.companyId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    res.json({ payrollRuns: runs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payroll history' });
  }
});

router.get('/:runId/payslips', async (req, res) => {
  try {
    const run = await prisma.payrollRun.findFirst({ where: { id: req.params.runId, companyId: req.companyId } });
    if (!run) return res.status(404).json({ error: 'Payroll run not found' });
    const payslips = await prisma.payslip.findMany({
      where: { payrollRunId: run.id },
      include: { employee: { select: { firstName: true, lastName: true, employeeCode: true, department: true, designation: true } } },
    });
    res.json({ payslips, payrollRun: run });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payslips' });
  }
});

module.exports = router;