import { FormEvent } from 'react';

interface SupporterFormProps {
  form: {
    full_name: string;
    phone_number: string;
    ward: string;
    polling_station: string;
    political_allegiance: string;
  };
  onChange: (field: string, value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

export default function SupporterForm({ form, onChange, onSubmit }: SupporterFormProps) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Manual Supporter Entry</h3>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Full Name</label>
          <input 
            type="text" value={form.full_name} 
            onChange={(e) => onChange('full_name', e.target.value)} required 
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-800 transition-all"
            placeholder="e.g. John Kamau"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Phone Number</label>
          <input 
            type="text" value={form.phone_number} 
            onChange={(e) => onChange('phone_number', e.target.value)} required 
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-800 transition-all"
            placeholder="e.g. 254700000000"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Ward</label>
          <input 
            type="text" value={form.ward} 
            onChange={(e) => onChange('ward', e.target.value)} required 
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-800 transition-all"
            placeholder="e.g. Kalimoni Ward"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Polling Station</label>
          <input 
            type="text" value={form.polling_station} 
            onChange={(e) => onChange('polling_station', e.target.value)} 
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-800 transition-all"
            placeholder="e.g. Gate C"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Political Allegiance</label>
          <input 
            type="text" value={form.political_allegiance} 
            onChange={(e) => onChange('political_allegiance', e.target.value)} 
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-800 transition-all"
            placeholder="e.g. Linda Mwananchi"
          />
        </div>
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-blue-600/20">
          Save Supporter
        </button>
      </form>
    </div>
  );
}