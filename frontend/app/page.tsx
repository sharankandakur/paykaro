'use client';
import { useState } from 'react';
import axios from 'axios';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    companyName: '', adminName: '', email: '', password: '', phone: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const url = isRegister
        ? 'http://localhost:5000/api/auth/register'
        : 'http://localhost:5000/api/auth/login';
      const payload = isRegister ? form : { email: form.email, password: form.password };
      const res = await axios.post(url, payload);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('company', JSON.stringify(res.data.company));
      localStorage.setItem('user', JSON.stringify(res.data.user));
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-medium tracking-tight text-gray-900">PayKaro</h1>
          <p className="text-gray-500 text-sm mt-1">HR & Payroll for Indian businesses</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-lg font-medium text-gray-900 mb-6">
            {isRegister ? 'Start your free trial' : 'Welcome back'}
          </h2>

          <div className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Company name</label>
                  <input
                    name="companyName"
                    value={form.companyName}
                    onChange={handleChange}
                    placeholder="Suresh Garments Pvt Ltd"
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Your name</label>
                  <input
                    name="adminName"
                    value={form.adminName}
                    onChange={handleChange}
                    placeholder="Suresh Kumar"
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Phone</label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="9876543210"
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="suresh@company.com"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Please wait...' : isRegister ? 'Create account' : 'Login'}
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              {isRegister
                ? 'Already have an account? Login'
                : "Don't have an account? Sign up free"}
            </button>
          </div>

          {isRegister && (
            <p className="text-xs text-gray-400 text-center mt-4">
              14-day free trial · No credit card needed
            </p>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          ₹4/employee/month · Pay only for what you use
        </p>
      </div>
    </div>
  );
}