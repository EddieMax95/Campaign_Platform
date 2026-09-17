import { FormEvent } from 'react';

interface Supporter {
  id: number;
  full_name: string;
  phone_number: string;
  ward: string;
  polling_station?: string;
}

interface DirectChatModalProps {
  activeSupporter: Supporter;
  directMessage: string;
  setDirectMessage: (val: string) => void;
  isSendingDirect: boolean;
  directStatus: string | null;
  formatPhoneNumber: (phone: string) => string;
  onClose: () => void;
  onSend: (e: FormEvent) => void;
}

export default function DirectChatModal({
  activeSupporter,
  directMessage,
  setDirectMessage,
  isSendingDirect,
  directStatus,
  formatPhoneNumber,
  onClose,
  onSend,
}: DirectChatModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-4 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Direct WhatsApp Outreach</h3>
            <p className="text-xs text-slate-500">Sending message to <span className="font-semibold text-slate-700">{activeSupporter.full_name}</span></p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1">&times;</button>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1 text-slate-600">
          <p><span className="font-bold">Phone:</span> {formatPhoneNumber(activeSupporter.phone_number)}</p>
          <p><span className="font-bold">Ward:</span> {activeSupporter.ward} | <span className="font-bold">Station:</span> {activeSupporter.polling_station || 'N/A'}</p>
        </div>

        <form onSubmit={onSend} className="space-y-4">
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
              onClick={onClose}
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
  );
}