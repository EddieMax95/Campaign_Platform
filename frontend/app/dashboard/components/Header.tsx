interface HeaderProps {
  campaignName?: string;
  candidateName?: string;
  onRefresh: () => void;
  onLogout: () => void;
}

export default function Header({ campaignName, candidateName, onRefresh, onLogout }: HeaderProps) {
  return (
    <header className="bg-blue-900 text-white p-4 sm:p-6 rounded-2xl shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Campaign Command Center</h1>
        {campaignName && (
          <p className="text-blue-200 mt-1 font-medium text-xs sm:text-base">
            Active Campaign: <span className="text-white font-semibold">{campaignName}</span> {candidateName ? `(${candidateName})` : ''}
          </p>
        )}
      </div>
      <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto justify-between sm:justify-end">
        <button 
          onClick={onRefresh} 
          className="flex-1 sm:flex-none bg-blue-800 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2.5 rounded-xl border border-blue-700 transition-all shadow-sm"
        >
          Refresh Data
        </button>
        <button 
          onClick={onLogout} 
          className="flex-1 sm:flex-none bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2.5 rounded-xl transition-all shadow-sm"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}