// ============================================================
// components/ResetPasswordModal.tsx — Reset password modal
// ============================================================
import { useState } from 'react';
import { getPharmacies, setPharmacies } from '../config/data'; // ✅ تم إزالة 'Pharmacy'

interface ResetPasswordModalProps {
  pharmacyId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ResetPasswordModal({ pharmacyId, onClose, onSuccess }: ResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword || newPassword.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('كلمة المرور وتأكيدها غير متطابقتين');
      return;
    }

    setLoading(true);
    const pharmacies = getPharmacies();
    const index = pharmacies.findIndex(p => p.id === pharmacyId);
    if (index === -1) {
      setError('لم يتم العثور على الصيدلية');
      setLoading(false);
      return;
    }

    pharmacies[index].password = newPassword;
    setPharmacies(pharmacies);
    setLoading(false);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">إعادة تعيين كلمة المرور</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-slate-500 mb-4">سيتم إعادة تعيين كلمة المرور لهذه الصيدلية.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">كلمة المرور الجديدة</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="6 أحرف على الأقل"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
              dir="rtl"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">تأكيد كلمة المرور</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
              dir="rtl"
            />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-amber-600 text-white rounded-xl font-bold text-sm hover:bg-amber-700 transition-colors shadow-md disabled:opacity-60"
          >
            {loading ? 'جاري إعادة التعيين...' : 'إعادة تعيين كلمة المرور'}
          </button>
        </form>
      </div>
    </div>
  );
}