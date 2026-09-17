'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

import Header from './components/Header';
import MetricsGrid from './components/MetricsGrid';
import SupporterForm from './components/SupporterForm';
import BroadcastHub from './components/BroadcastHub';
import SupporterTable from './components/SupporterTable';
import DirectChatModal from './components/DirectChatModal';

interface Supporter {
  id: number;
  full_name: string;
  phone_number: string;
  ward: string;
  polling_station?: string;
  political_allegiance?: string;
  is_volunteer?: boolean;
  campaign?: number;
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
  const [allegianceFilter, setAllegianceFilter] = useState('');

  // Broadcast states
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
    return { headers: { 'Authorization': `Token ${token}` } };
  };

  const fetchCampaignData = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/campaigns/', getAuthConfig());
      const data = response.data;
      setCampaignInfo(Array.isArray(data) ? data[0] : data.results ? data.results[0] : data);
    } catch (error: any) {
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
      if (error.response && error.response.status === 401) {
        localStorage.clear();
        router.push('/login');
      }
    }
  };

  const handleBroadcast = async (e: FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage) return;
    
    const targetWardToSend = broadcastWard === 'CUSTOM_TYPED' ? customBroadcastWard.trim() : broadcastWard;
    setIsBroadcasting(true);
    setBroadcastStatus(null);

    try {
      const payload: any = { message: broadcastMessage };

      if (targetWardToSend) {
        payload.ward = targetWardToSend;
      } else {
        payload.phone_numbers = filteredSupporters.map(s => s.phone_number).filter(Boolean);
      }

      const response = await axios.post(
        'http://127.0.0.1:8000/api/supporters/broadcast/', 
        payload, 
        getAuthConfig()
      );
      
      setBroadcastStatus(`Success! Broadcast dispatched to ${response.data.sent} supporters out of ${response.data.total_targeted} targeted records.`);
      setBroadcastMessage('');
    } catch (error) {
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
        { phone_number: activeSupporter.phone_number, message: directMessage }, 
        getAuthConfig()
      );
      setDirectStatus('Message sent successfully!');
      setDirectMessage('');
      setTimeout(() => {
        setActiveSupporter(null);
        setDirectStatus(null);
      }, 1500);
    } catch (error) {
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

  const wardStats = supporters.reduce((acc: { [key: string]: number }, s) => {
    const wardName = s.ward.trim() || 'Unassigned';
    acc[wardName] = (acc[wardName] || 0) + 1;
    return acc;
  }, {});

  const sortedWards = Object.entries(wardStats).sort(([, a], [, b]) => a - b);
  const uniqueWards = Array.from(new Set(supporters.map((s) => s.ward?.trim()).filter(Boolean)));

  const filteredSupporters = supporters.filter((s) => {
    const matchesWard = (s.ward || '').toLowerCase().includes(wardFilter.toLowerCase());
    const matchesPolling = (s.polling_station || '').toLowerCase().includes(pollingFilter.toLowerCase());
    const matchesAllegiance = (s.political_allegiance || '').toLowerCase().includes(allegianceFilter.toLowerCase());
    return matchesWard && matchesPolling && matchesAllegiance;
  });

  const activeTargetWardName = broadcastWard === 'CUSTOM_TYPED' ? customBroadcastWard.trim() : broadcastWard;
  const targetedBroadcastCount = activeTargetWardName 
    ? supporters.filter(s => s.ward.toLowerCase() === activeTargetWardName.toLowerCase()).length 
    : filteredSupporters.length;

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans relative">
      <div className="max-w-7xl mx-auto space-y-8">
        <Header 
          campaignName={campaignInfo?.name} 
          candidateName={campaignInfo?.candidate_name}
          onRefresh={fetchSupporters} 
          onLogout={handleLogout} 
        />

        <MetricsGrid sortedWards={sortedWards} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-8 lg:col-span-1">
            <SupporterForm 
              form={form} 
              onChange={(field, val) => setForm({...form, [field]: val})} 
              onSubmit={handleSubmit} 
            />

            <BroadcastHub 
              broadcastWard={broadcastWard}
              setBroadcastWard={setBroadcastWard}
              customBroadcastWard={customBroadcastWard}
              setCustomBroadcastWard={setCustomBroadcastWard}
              broadcastMessage={broadcastMessage}
              setBroadcastMessage={setBroadcastMessage}
              isBroadcasting={isBroadcasting}
              broadcastStatus={broadcastStatus}
              uniqueWards={uniqueWards}
              targetedBroadcastCount={targetedBroadcastCount}
              onBroadcast={handleBroadcast}
            />
          </div>

          <SupporterTable 
            supporters={supporters}
            filteredSupporters={filteredSupporters}
            loading={loading}
            wardFilter={wardFilter}
            setWardFilter={setWardFilter}
            pollingFilter={pollingFilter}
            setPollingFilter={setPollingFilter}
            allegianceFilter={allegianceFilter}
            setAllegianceFilter={setAllegianceFilter}
            formatPhoneNumber={formatPhoneNumber}
            onOpenDirectChat={(s) => setActiveSupporter(s)}
          />
        </div>
      </div>

      {activeSupporter && (
        <DirectChatModal 
          activeSupporter={activeSupporter}
          directMessage={directMessage}
          setDirectMessage={setDirectMessage}
          isSendingDirect={isSendingDirect}
          directStatus={directStatus}
          formatPhoneNumber={formatPhoneNumber}
          onClose={() => { setActiveSupporter(null); setDirectMessage(''); setDirectStatus(null); }}
          onSend={handleSendDirect}
        />
      )}
    </main>
  );
}