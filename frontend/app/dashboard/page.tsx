'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = '/'; return; }
    const u = localStorage.getItem('user');
    const c = localStorage.getItem('company');
    if (u) setUser(JSON.parse(u));
    if (c) setCompany(JSON.parse(c));

    // Fetch employees
    axios.get('http://industrious-elegance-production-09e6.up.railway.app/api/employees', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setEmployees(res.data.employees)).catch(() => {});
  }, []);

  const logout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-gray-900">PayKaro</h1>
          <p className="text-xs text-gray-500">{company?.name}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user?.name}</span>
          <button onClick={logout} className="text-sm text-gray-400 hover:text-gray-900">Logout</button>
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto">
        <h2 className="text-xl font-medium text-gray-900 mb-6">Dashboard</h2>

        {/* Metrics */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total employees', value: employees.length, color: 'text-gray-900' },
            { label: 'Active this month', value: employees.length, color: 'text-green-600' },
            { label: 'Payroll due', value: '₹0', color: 'text-gray-900' },
            { label: 'Trial days left', value: '14', color: 'text-amber-600' },
          ].map((m, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{m.label}</p>
              <p className={`text-3xl font-light ${m.color}`}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: '+ Add employee', href: '/employees', bg: 'bg-gray-900 text-white' },
            { label: '📋 Mark attendance', href: '/attendance', bg: 'bg-white text-gray-900 border border-gray-200' },
            { label: '💰 Run payroll', href: '/payroll', bg: 'bg-white text-gray-900 border border-gray-200' },
            { label: '🧾 View billing', href: '/billing', bg: 'bg-white text-gray-900 border border-gray-200' },
          ].map((a, i) => (
            <a key={i} href={a.href}
              className={`${a.bg} rounded-xl p-5 text-sm font-medium hover:opacity-80 transition-opacity cursor-pointer block text-center`}>
              {a.label}
            </a>
          ))}
        </div>

        {/* Employee list preview */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Employees</h3>
            <a href="/employees" className="text-sm text-gray-500 hover:text-gray-900">View all →</a>
          </div>
          {employees.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400 text-sm">No employees yet.</p>
              <a href="/employees" className="mt-3 inline-block bg-gray-900 text-white text-sm px-4 py-2 rounded-lg">
                Add your first employee
              </a>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {employees.slice(0, 5).map((emp: any) => (
                <div key={emp.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{emp.firstName} {emp.lastName}</p>
                    <p className="text-xs text-gray-500">{emp.department} · {emp.designation}</p>
                  </div>
                  <p className="text-sm font-mono text-gray-900">₹{emp.basicSalary?.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}