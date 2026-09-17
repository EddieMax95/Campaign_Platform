import { FormEvent } from 'react';

interface BroadcastHubProps {
  broadcastWard: string;
  setBroadcastWard: (val: string) => void;
  customBroadcastWard: string;
  setCustomBroadcastWard: (val: string) => void;
  broadcastMessage: string;
  setBroadcastMessage: (val: string) => void;
  isBroadcasting: boolean;
  broadcastStatus: string | null;
  uniqueWards: string[];
  targetedBroadcastCount: number;
  onBroadcast: (e: FormEvent) => void;
  selectedPhoneNumbers?: string[]; // Added to accept the active filtered array of numbers
}

export default function BroadcastHub({
  broadcastWard,
  setBroadcastWard,
  customBroadcastWard,
  setCustomBroadcastWard,
  broadcastMessage,
  setBroadcastMessage,
  isBroadcasting,
  broadcastStatus,
  uniqueWards,
  targetedBroadcastCount,
  onBroadcast,
  selectedPhoneNumbers = [],
}: BroadcastHubProps) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="mb-4 pb-2 border-b border-slate-100">
        <h3 className="text-lg font-bold text-slate-800">WhatsApp Broadcast Hub</h3>
        <p className="text-xs text-slate-500">Send instant targeted rally alerts or mobilization texts</p>
      </div>

      <form onSubmit={onBroadcast} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Target Ward</label>
          <select 
            value={broadcastWard}
            onChange={(e) => setBroadcastWard(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white text-slate-800 transition-all"
          >
            <option value="">All Wards (Entire Constituency)</option>
            <option value="CUSTOM_TYPED" className="font-semibold text-emerald-700">+ Type Custom Ward...</option>
            {uniqueWards.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </div>

        {broadcastWard === 'CUSTOM_TYPED' && (
          <div>
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
            {selectedPhoneNumbers.length > 0 && (
              <span className="text-slate-400 ml-1">({selectedPhoneNumbers.length} active filtered)</span>
            )}
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
  );
}