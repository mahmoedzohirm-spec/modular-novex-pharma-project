// ============================================================
// components/EditProfileModal.tsx — Edit pharmacy profile
// ============================================================
import { useState } from 'react';
import { Pharmacy } from '../config/data';

interface EditProfileModalProps {
  pharmacy: Pharmacy;
  onSave: (updated: Partial<Pharmacy>) => void;
  onClose: () => void;
}

export default function EditProfileModal({ pharmacy, onSave, onClose }: EditProfileModalProps) {
  const [form, setForm] = useState({
    pharmacyName: pharmacy.pharmacyName,
    phone: pharmacy.phone,
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.pharmacyName.trim()) { setError('الرجاء إدخال اسم الصيدلية'); return; }
    if (!form.phone.trim()) { setError('الرجاء إدخال رقم الهاتف'); return; }

    const updated: Partial<Pharmacy> = {
      pharmacyName: form.pharmacyName.trim(),
      phone: form.phone.trim(),
    };

    if (form.password) {
      if (form.password.length < 6) { setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return; }
      if (form.password !== form.confirmPassword) { setError('كلمة المرور وتأكيدها غير متطابقتين'); return; }
      updated.password = form.password;
    }

    onSave(updated);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">تعديل الملف الشخصي</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">اسم الصيدلية</label>
            <input
              type="text"
              value={form.pharmacyName}
              onChange={(e) => setForm({ ...form, pharmacyName: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
              dir="rtl"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">رقم الهاتف</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">كلمة المرور الجديدة (اختياري)</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="اترك فارغاً إذا لم ترغب في التغيير"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
              dir="rtl"
            />
          </div>
          {form.password && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">تأكيد كلمة المرور</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                dir="rtl"
              />
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}
          <button
            type="submit"
            className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-md"
          >
            حفظ التغييرات
          </button>
        </form>
      </div>
    </div>
  );
}