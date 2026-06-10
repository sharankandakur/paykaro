'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

const api = (token: string) => axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { Authorization: `Bearer ${token}` }
});

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', email: '',
    department: '', designation: '', basicSalary: '',
    dateOfJoining: '', employmentType: 'FULL_TIME',
    pfApplicable: true, esiApplicable: true, ptApplicable: true,
  });

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

  const fetchEmployees = async () => {
    try {
      const res = await api(token).get('/employees');
      setEmployees(res.data.employees);
    } catch { }
  };

  useEffect(() => {
    if (!token) { window.location.href = '/'; return; }
    fetchEmployees();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    setForm({ ...form, [target.name]: target.type === 'checkbox' ? target.checked : target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await api(token).post('/employees', form);
      setSuccess('Employee added successfully!');
      setShowForm(false);
      setForm({
        firstName: '', lastName: '', phone: '', email: '',
        department: '', designation: '', basicSalary: '',
        dateOfJoining: '', employmentType: 'FULL_TIME',
        pfApplicable: true, esiApplicable: true, ptApplicable: true,
      });
      fetchEmployees();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="/dashboard" className="text-gray-400 hover:text-gray-900 text-sm">← Dashboard</a>
          <h1 className="text-lg font-medium text-gray-900">Employees</h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700"
        >
          + Add employee
        </button>
      </div>

      <div className="p-6 max-w-6xl mx-auto">
        {success && (
          <div className="mb-4 bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Add Employee Form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="font-medium text-gray-900 mb-5">Add new employee</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'First name', name: 'firstName', type: 'text', placeholder: 'Meena' },
                { label: 'Last name', name: 'lastName', type: 'text', placeholder: 'Subramaniam' },
                { label: 'Phone', name: 'phone', type: 'text', placeholder: '9876543210' },
                { label: 'Email (optional)', name: 'email', type: 'email', placeholder: 'meena@email.com' },
                { label: 'Department', name: 'department', type: 'text', placeholder: 'Tailoring' },
                { label: 'Designation', name: 'designation', type: 'text', placeholder: 'Senior Tailor' },
                { label: 'Basic salary (₹)', name: 'basicSalary', type: 'number', placeholder: '25000' },
                { label: 'Date of joining', name: 'dateOfJoining', type: 'date', placeholder: '' },
              ].map((f) => (
                <div key={f.name}>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">{f.label}</label>
                  <input
                    name={f.name}
                    type={f.type}
                    placeholder={f.placeholder}
                    value={(form as any)[f.name]}
                    onChange={handleChange}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
              ))}

              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Employment type</label>
                <select
                  name="employmentType"
                  value={form.employmentType}
                  onChange={handleChange}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                >
                  <option value="FULL_TIME">Full time</option>
                  <option value="PART_TIME">Part time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="INTERN">Intern</option>
                </select>
              </div>
            </div>

            {/* Statutory toggles */}
            <div className="flex gap-6 mt-4">
              {[
                { label: 'PF applicable', name: 'pfApplicable' },
                { label: 'ESI applicable', name: 'esiApplicable' },
                { label: 'PT applicable', name: 'ptApplicable' },
              ].map((t) => (
                <label key={t.name} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name={t.name}
                    checked={(form as any)[t.name]}
                    onChange={handleChange}
                    className="rounded"
                  />
                  {t.label}
                </label>
              ))}
            </div>

            {error && (
              <div className="mt-3 bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>
            )}

            <div className="flex gap-3 mt-5">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-gray-900 text-white text-sm px-5 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save employee'}
              </button>
              <button
                onClick={() => { setShowForm(false); setError(''); }}
                className="border border-gray-200 text-gray-600 text-sm px-5 py-2 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Employee Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-medium text-gray-900">
              All employees <span className="text-gray-400 font-normal">({employees.length})</span>
            </h3>
          </div>

          {employees.length === 0 ? (
            <div className="p-16 text-center">
              <p className="text-gray-400 text-sm mb-3">No employees added yet</p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg"
              >
                + Add your first employee
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Employee', 'Department', 'Designation', 'Basic salary', 'PF', 'ESI', 'Status'].map(h => (
                    <th key={h} className="text-left text-xs text-gray-500 uppercase tracking-wide px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-gray-900">{emp.firstName} {emp.lastName}</p>
                      <p className="text-xs text-gray-500 font-mono">{emp.employeeCode}</p>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{emp.department}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{emp.designation}</td>
                    <td className="px-5 py-3 text-sm font-mono text-gray-900">₹{emp.basicSalary?.toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${emp.pfApplicable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {emp.pfApplicable ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${emp.esiApplicable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {emp.esiApplicable ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}