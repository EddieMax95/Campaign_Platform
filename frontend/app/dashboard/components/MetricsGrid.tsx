interface MetricsGridProps {
  sortedWards: [string, number][];
}

export default function MetricsGrid({ sortedWards }: MetricsGridProps) {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-800">Ward Density Intelligence</h3>
          <p className="text-xs text-slate-500">Automatically identifies low-performing zones requiring immediate mobilization</p>
        </div>
        <span className="bg-amber-50 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-200 self-start sm:self-auto">
          ⚡ Action Required on Cold Zones
        </span>
      </div>

      <div className="max-h-[320px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {sortedWards.length === 0 ? (
            <p className="text-slate-400 text-sm col-span-full py-4 text-center">No ward data available yet.</p>
          ) : (
            sortedWards.map(([ward, count], index) => {
              const isColdZone = index < 2 && sortedWards.length > 1;
              return (
                <div 
                  key={ward} 
                  className={`p-4 rounded-xl border transition-all ${
                    isColdZone ? 'bg-red-50/50 border-red-200 shadow-sm' : 'bg-slate-50/50 border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-slate-800 text-sm truncate max-w-[160px]" title={ward}>{ward}</span>
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
  );
}