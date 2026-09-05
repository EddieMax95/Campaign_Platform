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

interface CampaignInfo {
  name: string;
  candidate_name?: string;
  [key: string]: any;
}

export default function CampaignDashboard() {
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [campaignInfo, setCampaignInfo] = useState<CampaignInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Filter states
  const [wardFilter, setWardFilter] = useState('');
  const [pollingFilter, setPollingFilter] = useState('');

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

  const fetchCampaignData = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/campaigns/', getAuthConfig());
      const data = response.data;
      setCampaignInfo(Array.isArray(data) ? data[0] : data.results ? data.results[0] : data);
    } catch (error: any) {
      console.error('Error fetching campaign details:', error);
      if (error.response && error.response.status === 401) {
        localStorage.clear();
        router.push('/login');
      }
    }
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
    fetchCampaignData();
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

  // Format phone number to ensure it starts with '+'
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    const trimmed = phone.trim();
    return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
  };

  // Filtered supporters based on ward and polling station input text
  const filteredSupporters = supporters.filter((s) => {
    const matchesWard = s.ward.toLowerCase().includes(wardFilter.toLowerCase());
    const pollingValue = s.polling_station || '';
    const matchesPolling = pollingValue.toLowerCase().includes(pollingFilter.toLowerCase());
    return matchesWard && matchesPolling;
  });

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="bg-blue-900 text-white p-6 rounded-2xl shadow-lg mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Campaign Command Center</h1>
            {campaignInfo && (
              <p className="text-blue-200 mt-1 font-medium text-sm sm:text-base">
                Active Campaign: <span className="text-white font-semibold">{campaignInfo.name}</span> {campaignInfo.candidate_name ? `(${campaignInfo.candidate_name})` : ''}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <button 
              onClick={fetchSupporters} 
              className="bg-blue-800 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl border border-blue-700 transition-all shadow-sm"
            >
              Refresh Data
            </button>
            <button 
              onClick={handleLogout} 
              className="bg-red-600 hover:bg-red-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm"
            >
              Sign Out
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Registration Form */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-1 h-fit">
            <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Manual Supporter Entry</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Full Name</label>
                <input 
                  type="text" value={form.full_name} 
                  onChange={(e) => setForm({...form, full_name: e.target.value})} required 
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-800 transition-all"
                  placeholder="e.g. John Kamau"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Phone Number</label>
                <input 
                  type="text" value={form.phone_number} 
                  onChange={(e) => setForm({...form, phone_number: e.target.value})} required 
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-800 transition-all"
                  placeholder="e.g. 254700000000"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Ward</label>
                <input 
                  type="text" value={form.ward} 
                  onChange={(e) => setForm({...form, ward: e.target.value})} required 
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-800 transition-all"
                  placeholder="e.g. Kalimoni Ward"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Polling Station</label>
                <input 
                  type="text" value={form.polling_station} 
                  onChange={(e) => setForm({...form, polling_station: e.target.value})} 
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-800 transition-all"
                  placeholder="e.g. Gate C"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Political Allegiance</label>
                <input 
                  type="text" value={form.political_allegiance} 
                  onChange={(e) => setForm({...form, political_allegiance: e.target.value})} 
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-800 transition-all"
                  placeholder="e.g. Linda Mwananchi"
                />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-blue-600/20">
                Save Supporter
              </button>
            </form>
          </div>

          {/* Supporters Database Table & Filtering */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Live Supporter Database</h3>
                <p className="text-xs text-slate-500">WhatsApp & Manual records synchronized automatically</p>
              </div>
              <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full border border-blue-100">
                Showing: {filteredSupporters.length} of {supporters.length}
              </span>
            </div>

            {/* Filter Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Filter by Ward</label>
                <input 
                  type="text" 
                  value={wardFilter}
                  onChange={(e) => setWardFilter(e.target.value)}
                  placeholder="Type ward name..."
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Filter by Polling Station</label>
                <input 
                  type="text" 
                  value={pollingFilter}
                  onChange={(e) => setPollingFilter(e.target.value)}
                  placeholder="Type polling station..."
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 transition-all"
                />
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400">Loading voter intelligence data...</div>
            ) : filteredSupporters.length === 0 ? (
              <div className="py-12 text-center text-slate-400">No supporters match your active filters.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="py-3 px-3">Name</th>
                      <th className="py-3 px-3">Phone</th>
                      <th className="py-3 px-3">Ward</th>
                      <th className="py-3 px-3">Polling Station</th>
                      <th className="py-3 px-3">Allegiance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {filteredSupporters.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-3 font-semibold text-slate-900">{s.full_name}</td>
                        <td className="py-3.5 px-3 font-mono text-slate-600">
                          <a 
                            href={`tel:${formatPhoneNumber(s.phone_number)}`} 
                            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:underline font-medium bg-blue-50/50 px-2.5 py-1 rounded-lg border border-blue-100 transition-colors"
                            title="Click to call candidate phone"
                          >
                            <span>{formatPhoneNumber(s.phone_number)}</span>
                          </a>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200">
                            {s.ward}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-slate-600">{s.polling_station || 'N/A'}</td>
                        <td className="py-3.5 px-3 text-blue-700 font-medium">{s.political_allegiance || 'N/A'}</td>
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