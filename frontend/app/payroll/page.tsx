'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

const api = (token: string) => axios.create({
  baseURL: 'http://industrious-elegance-production-09e6.up.railway.app/api',
  headers: { Authorization: `Bearer ${token}` }
});

export default function PayrollPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<any[]>([]);
  const [currentRun, setCurrentRun] = useState<any>(null);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

  const months = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  useEffect(() => {
    if (!token) { window.location.href = '/'; return; }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [empRes, histRes] = await Promise.all([
        api(token).get('/employees'),
        api(token).get('/payroll/history'),
      ]);
      setEmployees(empRes.data.employees);
      setPayrollRuns(histRes.data.payrollRuns);
    } catch {}
  };

  const runPayroll = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api(token).post('/payroll/run', { month, year });
      setCurrentRun(res.data.payrollRun);
      setPayslips(res.data.payslips);
      setSuccess(`Payroll processed for ${res.data.payslips.length} employees!`);
      fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Payroll processing failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayslips = async (runId: string) => {
    try {
      const res = await api(token).get(`/payroll/${runId}/payslips`);
      setPayslips(res.data.payslips);
      setCurrentRun(res.data.payrollRun);
    } catch {}
  };

  // Calculate preview for one employee
  const previewPayslip = (emp: any) => {
    const basic = emp.basicSalary;
    const hra = Math.round(basic * 0.4);
    const allow = Math.round(basic * 0.1);
    const gross = basic + hra + allow;
    const pf = emp.pfApplicable ? Math.round(basic * 0.12) : 0;
    const esi = (emp.esiApplicable && gross <= 21000) ? Math.round(gross * 0.0075) : 0;
    const pt = emp.ptApplicable ? (gross >= 30000 ? 200 : gross >= 15000 ? 150 : 0) : 0;
    const net = gross - pf - esi - pt;
    return { basic, hra, allow, gross, pf, esi, pt, net };
  };

  const totals = employees.reduce((acc, emp) => {
    const p = previewPayslip(emp);
    return {
      gross: acc.gross + p.gross,
      net: acc.net + p.net,
      pf: acc.pf + p.pf,
      esi: acc.esi + p.esi,
    };
  }, { gross: 0, net: 0, pf: 0, esi: 0 });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="/dashboard" className="text-gray-400 hover:text-gray-900 text-sm">← Dashboard</a>
          <h1 className="text-lg font-medium text-gray-900">Payroll</h1>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={month}
            onChange={e => setMonth(parseInt(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
          >
            {months.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={e => setYear(parseInt(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
          >
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button
            onClick={runPayroll}
            disabled={loading || employees.length === 0}
            className="bg-gray-900 text-white text-sm px-5 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : `Run payroll for ${months[month - 1]}`}
          </button>
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto">
        {success && (
          <div className="mb-4 bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg">{success}</div>
        )}
        {error && (
          <div className="mb-4 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Employees', value: employees.length },
            { label: 'Gross payroll', value: `₹${totals.gross.toLocaleString()}` },
            { label: 'Total PF', value: `₹${totals.pf.toLocaleString()}` },
            { label: 'Net disbursement', value: `₹${totals.net.toLocaleString()}` },
          ].map((c, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{c.label}</p>
              <p className="text-2xl font-light text-gray-900">{c.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Employee payslip list */}
          <div className="col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-medium text-gray-900">
                {payslips.length > 0 ? 'Processed payslips' : 'Payslip preview'}
              </h3>
            </div>

            {employees.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-sm">
                No employees found. <a href="/employees" className="text-gray-900 underline">Add employees first</a>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['Employee', 'Gross', 'PF', 'ESI', 'Net'].map(h => (
                      <th key={h} className="text-left text-xs text-gray-500 uppercase tracking-wide px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {employees.map((emp) => {
                    const p = previewPayslip(emp);
                    const slip = payslips.find(s => s.employeeId === emp.id);
                    return (
                      <tr
                        key={emp.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedPayslip({ emp, p, slip })}
                      >
                        <td className="px-5 py-3">
                          <p className="text-sm font-medium text-gray-900">{emp.firstName} {emp.lastName}</p>
                          <p className="text-xs text-gray-500">{emp.department}</p>
                        </td>
                        <td className="px-5 py-3 text-sm font-mono">₹{(slip?.grossSalary || p.gross).toLocaleString()}</td>
                        <td className="px-5 py-3 text-sm font-mono text-red-500">-₹{(slip?.pfEmployee || p.pf).toLocaleString()}</td>
                        <td className="px-5 py-3 text-sm font-mono text-red-500">-₹{(slip?.esiEmployee || p.esi).toLocaleString()}</td>
                        <td className="px-5 py-3 text-sm font-mono font-medium">₹{(slip?.netSalary || p.net).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">Total</td>
                    <td className="px-5 py-3 text-sm font-mono font-medium">₹{totals.gross.toLocaleString()}</td>
                    <td className="px-5 py-3 text-sm font-mono font-medium text-red-500">-₹{totals.pf.toLocaleString()}</td>
                    <td className="px-5 py-3 text-sm font-mono font-medium text-red-500">-₹{totals.esi.toLocaleString()}</td>
                    <td className="px-5 py-3 text-sm font-mono font-medium">₹{totals.net.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          {/* Right panel — payslip detail or history */}
          <div className="space-y-4">
            {/* Payslip detail */}
            {selectedPayslip ? (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">Payslip</h3>
                  <button onClick={() => setSelectedPayslip(null)} className="text-gray-400 text-sm">✕</button>
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {selectedPayslip.emp.firstName} {selectedPayslip.emp.lastName}
                </p>
                <p className="text-xs text-gray-500 mb-4">{selectedPayslip.emp.department} · {selectedPayslip.emp.designation}</p>
                <div className="space-y-2 text-sm">
                  {[
                    { label: 'Basic salary', val: selectedPayslip.p.basic, color: '' },
                    { label: 'HRA (40%)', val: selectedPayslip.p.hra, color: '' },
                    { label: 'Special allowance', val: selectedPayslip.p.allow, color: '' },
                    { label: 'Gross salary', val: selectedPayslip.p.gross, color: 'font-medium border-t border-gray-100 pt-2 mt-2' },
                    { label: 'PF deduction', val: -selectedPayslip.p.pf, color: 'text-red-500' },
                    { label: 'ESI deduction', val: -selectedPayslip.p.esi, color: 'text-red-500' },
                    { label: 'Prof. tax', val: -selectedPayslip.p.pt, color: 'text-red-500' },
                  ].map((row, i) => (
                    <div key={i} className={`flex justify-between ${row.color}`}>
                      <span className="text-gray-600">{row.label}</span>
                      <span className="font-mono">
                        {row.val < 0 ? `-₹${Math.abs(row.val).toLocaleString()}` : `₹${row.val.toLocaleString()}`}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between bg-gray-900 text-white rounded-lg px-3 py-2 mt-3">
                    <span className="text-sm">Net take home</span>
                    <span className="font-mono font-medium">₹{selectedPayslip.p.net.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-sm text-gray-500 text-center py-4">
                  Click any employee row to preview their payslip
                </p>
              </div>
            )}

            {/* Payroll history */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-medium text-gray-900">History</h3>
              </div>
              {payrollRuns.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No payroll runs yet</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {payrollRuns.map((run) => (
                    <div
                      key={run.id}
                      className="px-5 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                      onClick={() => fetchPayslips(run.id)}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {months[run.month - 1]} {run.year}
                        </p>
                        <p className="text-xs text-gray-500">
                          ₹{run.totalNet?.toLocaleString()} net
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                        {run.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}