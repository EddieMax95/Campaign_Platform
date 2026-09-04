'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface Supporter {
  id: number;
  full_name: string;
  phone_number: string;
  ward: string;
  polling_station?: string;
  political_allegiance?: string;
  is_volunteer?: boolean;
  campaign: number;
}

export default function CampaignDashboard() {
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [form, setForm] = useState({
    full_name: '',
    phone_number: '',
    ward: '',
    polling_station: '',
    political_allegiance: '',
  });
  const router = useRouter();

  // Check 3-day inactivity session timeout and token validity
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const loginTimestamp = localStorage.getItem('loginTimestamp');
    const THREE_DAYS = 259200000;

    if (!token || !loginTimestamp || Date.now() - parseInt(loginTimestamp, 10) > THREE_DAYS) {
      localStorage.clear();
      router.push('/login');
      return;
    }
  }, [router]);

  const getAuthConfig = () => {
    const token = localStorage.getItem('authToken');
    return {
      headers: {
        'Authorization': `Token ${token}`,
      },
    };
  };

  const fetchSupporters = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/supporters/', getAuthConfig());
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      setSupporters(data);
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching supporters:', error);
      if (error.response && error.response.status === 401) {
        localStorage.clear();
        router.push('/login');
        return;
      }
      setSupporters([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupporters();
    const interval = setInterval(fetchSupporters, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await axios.post('http://127.0.0.1:8000/api/supporters/', form, getAuthConfig());
      setForm({ full_name: '', phone_number: '', ward: '', polling_station: '', political_allegiance: '' });
      fetchSupporters();
    } catch (error: any) {
      console.error('Error adding supporter:', error);
      if (error.response && error.response.status === 401) {
        localStorage.clear();
        router.push('/login');
      }
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="bg-blue-900 text-white p-6 rounded-xl shadow-md mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Campaign Command Center</h1>
            <p className="text-blue-200 mt-1">Next.js & Django Multi-Tenant Voter Intelligence Dashboard</p>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={fetchSupporters} 
              className="bg-blue-800 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg border border-blue-700 transition-colors"
            >
              Refresh Data
            </button>
            <button 
              onClick={handleLogout} 
              className="bg-red-600 hover:bg-red-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Registration Form */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 md:col-span-1 h-fit">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Manual Supporter Entry</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Full Name</label>
                <input 
                  type="text" value={form.full_name} 
                  onChange={(e) => setForm({...form, full_name: e.target.value})} required 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800"
                  placeholder="e.g. John Kamau"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Phone Number</label>
                <input 
                  type="text" value={form.phone_number} 
                  onChange={(e) => setForm({...form, phone_number: e.target.value})} required 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800"
                  placeholder="e.g. 254700000000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Ward</label>
                <input 
                  type="text" value={form.ward} 
                  onChange={(e) => setForm({...form, ward: e.target.value})} required 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800"
                  placeholder="e.g. Kalimoni Ward"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Polling Station</label>
                <input 
                  type="text" value={form.polling_station} 
                  onChange={(e) => setForm({...form, polling_station: e.target.value})} 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800"
                  placeholder="e.g. Gate C"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Political Allegiance</label>
                <input 
                  type="text" value={form.political_allegiance} 
                  onChange={(e) => setForm({...form, political_allegiance: e.target.value})} 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800"
                  placeholder="e.g. Linda Mwananchi"
                />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors">
                Save Supporter
              </button>
            </form>
          </div>

          {/* Supporters Database Table */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 md:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Live Supporter Database (WhatsApp & Manual Sync)</h3>
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">
                Total: {supporters.length}
              </span>
            </div>

            {loading ? (
              <p className="text-slate-500 py-4">Loading voter data...</p>
            ) : supporters.length === 0 ? (
              <p className="text-slate-500 py-4">No supporters registered yet. Add one via form or WhatsApp!</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-sm">
                      <th className="py-3 px-2">Name</th>
                      <th className="py-3 px-2">Phone</th>
                      <th className="py-3 px-2">Ward</th>
                      <th className="py-3 px-2">Polling Station</th>
                      <th className="py-3 px-2">Allegiance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {supporters.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-2 font-medium text-slate-900">{s.full_name}</td>
                        <td className="py-3 px-2">{s.phone_number}</td>
                        <td className="py-3 px-2">
                          <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-xs font-medium">
                            {s.ward}
                          </span>
                        </td>
                        <td className="py-3 px-2">{s.polling_station || 'N/A'}</td>
                        <td className="py-3 px-2 text-blue-700 font-medium">{s.political_allegiance || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}