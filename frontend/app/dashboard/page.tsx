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

interface WardTarget {
  ward_name: string;
  target_voters: number;
}

interface CampaignInfo {
  name: string;
  candidate_name?: string;
  ward_targets?: WardTarget[];
  [key: string]: any;
}

export default function CampaignDashboard() {
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [campaignInfo, setCampaignInfo] = useState<CampaignInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Filter states
  const [wardFilter, setWardFilter] = useState('');
  const [pollingFilter, setPollingFilter] = useState('');
  const [allegianceFilter, setAllegianceFilter] = useState('');

  // Broadcast states with typing option for custom wards
  const [broadcastWard, setBroadcastWard] = useState('');
  const [customBroadcastWard, setCustomBroadcastWard] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastStatus, setBroadcastStatus] = useState<string | null>(null);

  // Direct 1-to-1 message modal states
  const [activeSupporter, setActiveSupporter] = useState<Supporter | null>(null);
  const [directMessage, setDirectMessage] = useState('');
  const [isSendingDirect, setIsSendingDirect] = useState(false);
  const [directStatus, setDirectStatus] = useState<string | null>(null);

  const [form, setForm] = useState({
    full_name: '',
    phone_number: '',
    ward: '',
    polling_station: '',
    political_allegiance: '',
  });
  const router = useRouter();

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

  const handleBroadcast = async (e: FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage) return;
    
    // Determine target ward: if dropdown is set to 'custom', use the typed value; otherwise use dropdown selection
    const targetWardToSend = broadcastWard === 'CUSTOM_TYPED' ? customBroadcastWard.trim() : broadcastWard;

    setIsBroadcasting(true);
    setBroadcastStatus(null);

    try {
      const response = await axios.post(
        'http://127.0.0.1:8000/api/broadcast/', 
        { ward: targetWardToSend, message: broadcastMessage }, 
        getAuthConfig()
      );
      setBroadcastStatus(`Success! Broadcast dispatched to ${response.data.sent} supporters.`);
      setBroadcastMessage('');
    } catch (error: any) {
      console.error('Broadcast error:', error);
      setBroadcastStatus('Failed to send broadcast. Please check your backend connection.');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleSendDirect = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeSupporter || !directMessage) return;

    setIsSendingDirect(true);
    setDirectStatus(null);

    try {
      await axios.post(
        'http://127.0.0.1:8000/api/broadcast/', 
        { 
          phone_number: activeSupporter.phone_number, 
          message: directMessage 
        }, 
        getAuthConfig()
      );
      setDirectStatus('Message sent successfully!');
      setDirectMessage('');
      setTimeout(() => {
        setActiveSupporter(null);
        setDirectStatus(null);
      }, 1500);
    } catch (error: any) {
      console.error('Direct message error:', error);
      setDirectStatus('Failed to send message.');
    } finally {
      setIsSendingDirect(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    const trimmed = phone.trim();
    return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
  };

  // Compute stats per ward dynamically
  const wardStats = supporters.reduce((acc: { [key: string]: number }, s) => {
    const wardName = s.ward.trim() || 'Unassigned';
    acc[wardName] = (acc[wardName] || 0) + 1;
    return acc;
  }, {});

  const sortedWards = Object.entries(wardStats).sort(([, a], [, b]) => a - b);

  // Extract unique wards and allegiances dynamically from all registered records
  const uniqueWards = Array.from(new Set(supporters.map((s) => s.ward?.trim()).filter(Boolean)));
  const uniqueAllegiances = Array.from(new Set(supporters.map((s) => s.political_allegiance?.trim()).filter(Boolean)));

  const filteredSupporters = supporters.filter((s) => {
    const matchesWard = wardFilter === '' || s.ward.toLowerCase() === wardFilter.toLowerCase();
    const pollingValue = s.polling_station || '';
    const matchesPolling = pollingValue.toLowerCase().includes(pollingFilter.toLowerCase());
    const matchesAllegiance = allegianceFilter === '' || (s.political_allegiance && s.political_allegiance.toLowerCase() === allegianceFilter.toLowerCase());
    return matchesWard && matchesPolling && matchesAllegiance;
  });

  // Calculate targeted count dynamically based on dropdown or custom typed ward
  const activeTargetWardName = broadcastWard === 'CUSTOM_TYPED' ? customBroadcastWard.trim() : broadcastWard;
  const targetedBroadcastCount = activeTargetWardName 
    ? supporters.filter(s => s.ward.toLowerCase() === activeTargetWardName.toLowerCase()).length 
    : supporters.length;

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans relative">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="bg-blue-900 text-white p-6 rounded-2xl shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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

        {/* Tactical Cold Zone & Performance Overview with Scrollable Grid for Large Ward Counts */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Ward Density Intelligence</h3>
              <p className="text-xs text-slate-500">Automatically identifies low-performing zones requiring immediate campaign mobilization</p>
            </div>
            <span className="bg-amber-50 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-200">
              ⚡ Action Required on Cold Zones
            </span>
          </div>

          <div className="max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {sortedWards.length === 0 ? (
                <p className="text-slate-400 text-sm col-span-full py-4">No ward data available yet.</p>
              ) : (
                sortedWards.map(([ward, count], index) => {
                  const isColdZone = index < 2 && sortedWards.length > 1;
                  return (
                    <div 
                      key={ward} 
                      className={`p-4 rounded-xl border transition-all ${
                        isColdZone 
                          ? 'bg-red-50/50 border-red-200 shadow-sm' 
                          : 'bg-slate-50/50 border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-slate-800 text-sm truncate max-w-[140px]" title={ward}>{ward}</span>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          isColdZone ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {isColdZone ? 'Cold Zone' : 'Active'}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900">{count}</span>
                        <span className="text-xs text-slate-500 font-medium">supporters logged</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Entry Form & WhatsApp Broadcast Hub */}
          <div className="space-y-8 lg:col-span-1">
            {/* Registration Form */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
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

            {/* WhatsApp Broadcast Hub with Dynamic Dropdown & Custom Ward Typing Option */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="mb-4 pb-2 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800">WhatsApp Broadcast Hub</h3>
                <p className="text-xs text-slate-500">Send instant targeted rally alerts or mobilization texts</p>
              </div>

              <form onSubmit={handleBroadcast} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Target Ward</label>
                  <select 
                    value={broadcastWard}
                    onChange={(e) => setBroadcastWard(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white text-slate-800 transition-all max-h-48 overflow-y-auto"
                  >
                    <option value="">All Wards (Entire Constituency)</option>
                    <option value="CUSTOM_TYPED" className="font-semibold text-emerald-700">+ Type Custom Ward...</option>
                    {uniqueWards.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>

                {broadcastWard === 'CUSTOM_TYPED' && (
                  <div className="animate-in fade-in duration-150">
                    <label className="block text-xs font-bold text-emerald-700 uppercase mb-1">Enter Custom Ward Name</label>
                    <input 
                      type="text"
                      value={customBroadcastWard}
                      onChange={(e) => setCustomBroadcastWard(e.target.value)}
                      placeholder="e.g. Juja Ward"
                      required
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800 transition-all"
                    />
                  </div>
                )}

                <div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Targeting: <span className="font-bold text-emerald-700">{targetedBroadcastCount} supporters</span>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Broadcast Message</label>
                  <textarea 
                    rows={3}
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Type rally message e.g., Mheshimiwa will visit Gate C tomorrow..."
                    required
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white text-slate-800 transition-all"
                  />
                </div>

                {broadcastStatus && (
                  <p className="text-xs font-semibold text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                    {broadcastStatus}
                  </p>
                )}

                <button 
                  type="submit" 
                  disabled={isBroadcasting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-emerald-600/20"
                >
                  {isBroadcasting ? 'Broadcasting via WhatsApp...' : 'Send WhatsApp Broadcast'}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Database Table & Advanced Filtering */}
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

            {/* Advanced Multi-Filter Section with Scrollable Ward Dropdown Support */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Filter by Ward</label>
                <select 
                  value={wardFilter}
                  onChange={(e) => setWardFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 transition-all max-h-48 overflow-y-auto"
                >
                  <option value="">All Wards ({uniqueWards.length})</option>
                  {uniqueWards.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Search Polling Station</label>
                <input 
                  type="text" 
                  value={pollingFilter}
                  onChange={(e) => setPollingFilter(e.target.value)}
                  placeholder="Type polling station..."
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Filter by Allegiance</label>
                <select 
                  value={allegianceFilter}
                  onChange={(e) => setAllegianceFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 transition-all"
                >
                  <option value="">All Allegiances</option>
                  {uniqueAllegiances.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
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
                      <th className="py-3 px-3 text-right">Action</th>
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
                            title="Click to call phone"
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
                        <td className="py-3.5 px-3 text-right">
                          <button
                            onClick={() => setActiveSupporter(s)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold text-xs px-3 py-1.5 rounded-xl transition-all shadow-sm"
                          >
                            Chat 1-on-1
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 1-on-1 Direct Chat Modal */}
      {activeSupporter && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Direct WhatsApp Outreach</h3>
                <p className="text-xs text-slate-500">Sending message to <span className="font-semibold text-slate-700">{activeSupporter.full_name}</span></p>
              </div>
              <button 
                onClick={() => { setActiveSupporter(null); setDirectMessage(''); setDirectStatus(null); }}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1 text-slate-600">
              <p><span className="font-bold">Phone:</span> {formatPhoneNumber(activeSupporter.phone_number)}</p>
              <p><span className="font-bold">Ward:</span> {activeSupporter.ward} | <span className="font-bold">Station:</span> {activeSupporter.polling_station || 'N/A'}</p>
            </div>

            <form onSubmit={handleSendDirect} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Personalized Message</label>
                <textarea 
                  rows={4}
                  value={directMessage}
                  onChange={(e) => setDirectMessage(e.target.value)}
                  placeholder="Type direct message..."
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white text-slate-800 transition-all"
                />
              </div>

              {directStatus && (
                <p className={`text-xs font-semibold p-2.5 rounded-lg border ${
                  directStatus.includes('success') ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
                }`}>
                  {directStatus}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => { setActiveSupporter(null); setDirectMessage(''); setDirectStatus(null); }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl transition-all text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSendingDirect}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold py-2.5 rounded-xl transition-all shadow-md text-sm"
                >
                  {isSendingDirect ? 'Sending...' : 'Send WhatsApp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}