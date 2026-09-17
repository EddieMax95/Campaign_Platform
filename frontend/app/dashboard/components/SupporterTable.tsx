interface Supporter {
  id: number;
  full_name: string;
  phone_number: string;
  ward: string;
  polling_station?: string;
  political_allegiance?: string;
}

interface SupporterTableProps {
  supporters: Supporter[];
  filteredSupporters: Supporter[];
  loading: boolean;
  wardFilter: string;
  setWardFilter: (val: string) => void;
  pollingFilter: string;
  setPollingFilter: (val: string) => void;
  allegianceFilter: string;
  setAllegianceFilter: (val: string) => void;
  formatPhoneNumber: (phone: string) => string;
  onOpenDirectChat: (supporter: Supporter) => void;
}

export default function SupporterTable({
  supporters,
  filteredSupporters,
  loading,
  wardFilter,
  setWardFilter,
  pollingFilter,
  setPollingFilter,
  allegianceFilter,
  setAllegianceFilter,
  formatPhoneNumber,
  onOpenDirectChat,
}: SupporterTableProps) {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2 overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-800">Live Supporter Database</h3>
          <p className="text-xs text-slate-500">WhatsApp & Manual records synchronized automatically</p>
        </div>
        <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full border border-blue-100">
          Showing: {filteredSupporters.length} of {supporters.length}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 bg-slate-50/80 p-3 sm:p-4 rounded-xl border border-slate-200">
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Filter by Ward</label>
          <input 
            type="text" 
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            placeholder="Type ward name..."
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 transition-all"
          />
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
          <input 
            type="text" 
            value={allegianceFilter}
            onChange={(e) => setAllegianceFilter(e.target.value)}
            placeholder="Type political allegiance..."
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400">Loading voter intelligence data...</div>
      ) : filteredSupporters.length === 0 ? (
        <div className="py-12 text-center text-slate-400">No supporters match your active filters.</div>
      ) : (
        <div className="w-full overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full text-left border-collapse min-w-[650px]">
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
                      onClick={() => onOpenDirectChat(s)}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold text-xs px-3 py-1.5 rounded-xl transition-all shadow-sm whitespace-nowrap"
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
  );
}