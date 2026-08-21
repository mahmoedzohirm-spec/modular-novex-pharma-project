// ============================================================
// components/ReminderModal.tsx — إرسال رسالة تذكير للمستخدم
// ============================================================
import { useState } from 'react';
import { sendMessage, getPharmacies, setPharmacies } from '../config/data';

interface ReminderModalProps {
  pharmacyId: string;
  pharmacyName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReminderModal({ pharmacyId, pharmacyName, onClose, onSuccess }: ReminderModalProps) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!message.trim()) {
      setError('الرجاء كتابة محتوى الرسالة');
      return;
    }

    setLoading(true);

    try {
      // إرسال الرسالة إلى الصيدلية
      sendMessage(
        pharmacyId,
        'admin',
        'مدير النظام',
        `🔔 تذكير: ${message.trim()}`
      );

      // تحديث وقت آخر تذكير
      const pharmacies = getPharmacies();
      const index = pharmacies.findIndex(p => p.id === pharmacyId);
      if (index !== -1) {
        pharmacies[index].lastPaymentReminder = new Date().toISOString();
        setPharmacies(pharmacies);
      }

      setLoading(false);
      onSuccess();
      onClose();
    } catch (err) {
      setError('حدث خطأ أثناء إرسال الرسالة');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">📨 إرسال تذكير</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-slate-500 mb-4">
          إرسال رسالة تذكير لـ <span className="font-bold text-slate-700">{pharmacyName}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              محتوى الرسالة
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="اكتب نص التذكير هنا..."
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 resize-none"
              dir="rtl"
            />
            <p className="text-xs text-slate-400 mt-1">سيتم إرسال الرسالة إلى صندوق رسائل الصيدلية</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-300 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  جاري الإرسال...
                </>
              ) : (
                'إرسال التذكير'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}