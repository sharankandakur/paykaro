'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

const api = (token: string) => axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { Authorization: `Bearer ${token}` }
});

const STATUSES = ['PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY', 'WEEKLY_OFF'];

const statusStyle: Record<string, string> = {
  PRESENT:    'bg-green-100 text-green-700',
  ABSENT:     'bg-red-100 text-red-600',
  HALF_DAY:   'bg-amber-100 text-amber-700',
  ON_LEAVE:   'bg-blue-100 text-blue-700',
  HOLIDAY:    'bg-purple-100 text-purple-700',
  WEEKLY_OFF: 'bg-gray-100 text-gray-500',
};

export default function AttendancePage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [savedToday, setSavedToday] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

  useEffect(() => {
    if (!token) { window.location.href = '/'; return; }
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (employees.length > 0) fetchAttendance();
  }, [selectedDate, employees]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await api(token).get('/employees');
      setEmployees(res.data.employees);
      // Default all to PRESENT
      const defaults: Record<string, string> = {};
      res.data.employees.forEach((e: any) => { defaults[e.id] = 'PRESENT'; });
      setAttendance(defaults);
    } catch {}
    setLoading(false);
  };

  const fetchAttendance = async () => {
    try {
      const date = new Date(selectedDate);
      const res = await api(token).get('/attendance', {
        params: {
          month: date.getMonth() + 1,
          year: date.getFullYear(),
        }
      });
      // Filter for selected date
      const dayRecords = res.data.records.filter((r: any) =>
        r.date.startsWith(selectedDate)
      );
      if (dayRecords.length > 0) {
        const map: Record<string, string> = {};
        dayRecords.forEach((r: any) => { map[r.employeeId] = r.status; });
        // Merge with defaults
        const merged: Record<string, string> = {};
        employees.forEach((e: any) => {
          merged[e.id] = map[e.id] || 'PRESENT';
        });
        setAttendance(merged);
        setSavedToday(true);
      } else {
        // Reset to PRESENT for all
        const defaults: Record<string, string> = {};
        employees.forEach((e: any) => { defaults[e.id] = 'PRESENT'; });
        setAttendance(defaults);
        setSavedToday(false);
      }
    } catch {}
  };

  const markAll = (status: string) => {
    const updated: Record<string, string> = {};
    employees.forEach(e => { updated[e.id] = status; });
    setAttendance(updated);
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
      const records = employees.map(e => ({
        employeeId: e.id,
        status: attendance[e.id] || 'PRESENT',
      }));
      await api(token).post('/attendance/bulk', {
        date: selectedDate,
        records,
      });
      setSuccess('Attendance saved!');
      setSavedToday(true);
      setTimeout(() => setSuccess(''), 3000);
    } catch {}
    setSaving(false);
  };

  // Summary counts
  const counts = Object.values(attendance).reduce((acc: Record<string, number>, s) => {
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="/dashboard" className="text-gray-400 hover:text-gray-900 text-sm">← Dashboard</a>
          <h1 className="text-lg font-medium text-gray-900">Attendance</h1>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
          />
          <button
            onClick={saveAttendance}
            disabled={saving || employees.length === 0}
            className="bg-gray-900 text-white text-sm px-5 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save attendance'}
          </button>
        </div>
      </div>

      <div className="p-6 max-w-5xl mx-auto">
        {success && (
          <div className="mb-4 bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg">
            ✓ {success}
          </div>
        )}

        {/* Summary row */}
        <div className="grid grid-cols-6 gap-3 mb-6">
          {[
            { label: 'Present', key: 'PRESENT', style: 'bg-green-50 text-green-700 border-green-200' },
            { label: 'Absent', key: 'ABSENT', style: 'bg-red-50 text-red-600 border-red-200' },
            { label: 'Half day', key: 'HALF_DAY', style: 'bg-amber-50 text-amber-700 border-amber-200' },
            { label: 'On leave', key: 'ON_LEAVE', style: 'bg-blue-50 text-blue-700 border-blue-200' },
            { label: 'Holiday', key: 'HOLIDAY', style: 'bg-purple-50 text-purple-700 border-purple-200' },
            { label: 'Week off', key: 'WEEKLY_OFF', style: 'bg-gray-50 text-gray-500 border-gray-200' },
          ].map(s => (
            <div key={s.key} className={`rounded-xl border px-4 py-3 text-center ${s.style}`}>
              <p className="text-2xl font-light">{counts[s.key] || 0}</p>
              <p className="text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Quick mark all buttons */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-gray-500 mr-2">Mark all as:</span>
          {['PRESENT', 'ABSENT', 'HOLIDAY', 'WEEKLY_OFF'].map(s => (
            <button
              key={s}
              onClick={() => markAll(s)}
              className={`text-xs px-3 py-1.5 rounded-full border ${statusStyle[s]} hover:opacity-80`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Employee attendance list */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-medium text-gray-900">
              {new Date(selectedDate).toLocaleDateString('en-IN', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
              })}
            </h3>
            {savedToday && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                ✓ Saved
              </span>
            )}
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-400 text-sm">Loading employees...</div>
          ) : employees.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400 text-sm mb-3">No employees found</p>
              <a href="/employees" className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg">
                Add employees first
              </a>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {employees.map((emp) => (
                <div key={emp.id} className="px-5 py-3 flex items-center justify-between">
                  {/* Employee info */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                      {emp.firstName[0]}{emp.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {emp.firstName} {emp.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{emp.department} · {emp.employeeCode}</p>
                    </div>
                  </div>

                  {/* Status selector */}
                  <div className="flex items-center gap-2">
                    {STATUSES.map(status => (
                      <button
                        key={status}
                        onClick={() => setAttendance({ ...attendance, [emp.id]: status })}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                          attendance[emp.id] === status
                            ? statusStyle[status] + ' border-current font-medium'
                            : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        {status === 'WEEKLY_OFF' ? 'W/O' :
                         status === 'HALF_DAY' ? 'Half' :
                         status === 'ON_LEAVE' ? 'Leave' :
                         status.charAt(0) + status.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={saveAttendance}
            disabled={saving || employees.length === 0}
            className="bg-gray-900 text-white text-sm px-6 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : `Save attendance for ${employees.length} employees`}
          </button>
        </div>
      </div>
    </div>
  );
}