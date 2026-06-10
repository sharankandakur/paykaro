'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

const api = (token: string) => axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { Authorization: `Bearer ${token}` }
});

export default function BillingPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

  const PRICES = {
    EMPLOYEE_MONTHLY: 4,
    PAYROLL_RUN: 49,
    PAYSLIP_WHATSAPP: 2,
    COMPLIANCE_REPORT: 99,
    BANK_FILE_EXPORT: 29,
    MINIMUM: 99,
  };

  const months = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  useEffect(() => {
    if (!token) { window.location.href = '/'; return; }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, payRes] = await Promise.all([
        api(token).get('/employees'),
        api(token).get('/payroll/history'),
      ]);
      setEmployees(empRes.data.employees);
      setPayrollRuns(payRes.data.payrollRuns);
    } catch {}
    setLoading(false);
  };

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const monthName = now.toLocaleString('en-IN', { month: 'long' });

  const activeEmployees = employees.filter(e => e.isActive).length;
  const thisMonthRuns = payrollRuns.filter(r => r.month === month && r.year === year).length;

  const employeeCharge = activeEmployees * PRICES.EMPLOYEE_MONTHLY;
  const payrollCharge = thisMonthRuns * PRICES.PAYROLL_RUN;
  const subtotal = Math.max(employeeCharge + payrollCharge, PRICES.MINIMUM);
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + gst;

  const lineItems = [
    {
      description: `Active employees (${activeEmployees} x Rs.${PRICES.EMPLOYEE_MONTHLY})`,
      amount: employeeCharge,
      icon: '👥',
    },
    {
      description: `Payroll runs (${thisMonthRuns} x Rs.${PRICES.PAYROLL_RUN})`,
      amount: payrollCharge,
      icon: '💰',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="/dashboard" className="text-gray-400 hover:text-gray-900 text-sm">
            Back to Dashboard
          </a>
          <h1 className="text-lg font-medium text-gray-900">Billing</h1>
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-medium">
          Trial active — 14 days remaining
        </span>
      </div>

      <div className="p-6 max-w-4xl mx-auto">

        <div className="bg-gray-900 text-white rounded-xl p-5 mb-6">
          <h2 className="font-medium mb-1">Pay only for what you use</h2>
          <p className="text-sm text-gray-400">
            No fixed monthly plans. You are charged based on employees and actions.
            Bill is auto-generated on the 1st of every month.
          </p>
          <div className="grid grid-cols-4 gap-4 mt-4">
            {[
              { label: 'Per employee', price: 'Rs.' + PRICES.EMPLOYEE_MONTHLY, sub: 'per month' },
              { label: 'Payroll run', price: 'Rs.' + PRICES.PAYROLL_RUN, sub: 'per run' },
              { label: 'WhatsApp payslip', price: 'Rs.' + PRICES.PAYSLIP_WHATSAPP, sub: 'per send' },
              { label: 'Minimum bill', price: 'Rs.' + PRICES.MINIMUM, sub: 'per month' },
            ].map((p, i) => (
              <div key={i} className="bg-white/10 rounded-lg px-4 py-3">
                <p className="text-lg font-medium">{p.price}</p>
                <p className="text-xs text-gray-400">{p.label}</p>
                <p className="text-xs text-gray-500">{p.sub}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">

          <div className="col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">
                    Current bill — {monthName} {year}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Due on 7th {months[month % 12]} {month === 12 ? year + 1 : year}
                  </p>
                </div>
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                  Pending
                </span>
              </div>

              {loading ? (
                <div className="p-12 text-center text-gray-400 text-sm">Loading...</div>
              ) : (
                <div className="p-5">
                  <div className="space-y-3 mb-4">
                    {lineItems.map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{item.icon}</span>
                          <span className="text-sm text-gray-700">{item.description}</span>
                        </div>
                        <span className="text-sm font-mono font-medium text-gray-900">
                          Rs.{item.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  {(employeeCharge + payrollCharge) < PRICES.MINIMUM && (
                    <div className="bg-amber-50 text-amber-700 text-xs px-3 py-2 rounded-lg mb-4">
                      Minimum bill of Rs.{PRICES.MINIMUM} applies this month
                    </div>
                  )}

                  <div className="border-t border-gray-100 pt-4 space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Subtotal</span>
                      <span className="font-mono">Rs.{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>GST (18%)</span>
                      <span className="font-mono">Rs.{gst.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between bg-gray-900 text-white rounded-lg px-4 py-3 mt-3">
                      <span className="font-medium">Total due</span>
                      <span className="font-mono font-medium text-lg">
                        Rs.{total.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => alert('Razorpay payment gateway will open here. Add your Razorpay keys in backend .env to enable real payments.')}
                    className="w-full mt-4 bg-blue-600 text-white text-sm py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Pay Rs.{total.toLocaleString()} now
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-medium text-gray-900">Invoice history</h3>
              </div>
              {payrollRuns.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  No invoices yet. Your first invoice generates on 1st {months[month % 12]}
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Month', 'Employees', 'Amount', 'Status'].map(h => (
                        <th key={h} className="text-left text-xs text-gray-500 uppercase tracking-wide px-5 py-3">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payrollRuns.map((run) => {
                      const bill = Math.max(
                        activeEmployees * PRICES.EMPLOYEE_MONTHLY + PRICES.PAYROLL_RUN,
                        PRICES.MINIMUM
                      );
                      const billTotal = Math.round(bill * 1.18);
                      return (
                        <tr key={run.id} className="hover:bg-gray-50">
                          <td className="px-5 py-3 text-sm font-medium text-gray-900">
                            {months[run.month - 1]} {run.year}
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-600">
                            {activeEmployees}
                          </td>
                          <td className="px-5 py-3 text-sm font-mono text-gray-900">
                            Rs.{billTotal.toLocaleString()}
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              Paid
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-medium text-gray-900 mb-4">This month usage</h3>
              <div className="space-y-3">
                {[
                  { label: 'Active employees', value: activeEmployees, unit: 'employees' },
                  { label: 'Payroll runs', value: thisMonthRuns, unit: 'runs' },
                  { label: 'Payslips sent', value: 0, unit: 'sent' },
                  { label: 'Compliance reports', value: 0, unit: 'downloaded' },
                ].map((u, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{u.label}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {u.value}{' '}
                      <span className="text-gray-400 font-normal text-xs">{u.unit}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-medium text-gray-900 mb-3">Cost as you grow</h3>
              <div className="space-y-2">
                {[
                  { emp: 10, label: '10 employees' },
                  { emp: 25, label: '25 employees' },
                  { emp: 50, label: '50 employees' },
                  { emp: 100, label: '100 employees' },
                ].map((s, i) => {
                  const cost = Math.round(
                    Math.max(
                      s.emp * PRICES.EMPLOYEE_MONTHLY + PRICES.PAYROLL_RUN,
                      PRICES.MINIMUM
                    ) * 1.18
                  );
                  const isActive = s.emp === activeEmployees;
                  return (
                    <div
                      key={i}
                      className={`flex justify-between items-center px-3 py-2 rounded-lg text-sm ${
                        isActive
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-600'
                      }`}
                    >
                      <span>{s.label}</span>
                      <span className="font-mono font-medium">Rs.{cost}/mo</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-3">Includes GST. 1 payroll run per month</p>
            </div>

            <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
              <h3 className="font-medium text-blue-900 mb-2">Need help?</h3>
              <p className="text-xs text-blue-700 mb-3">
                Questions about your bill or want to add more features?
              </p>
              
                href="mailto:support@paykaro.in"
                className="text-xs bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 block text-center"
              <a>
                Contact support
              </a>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}