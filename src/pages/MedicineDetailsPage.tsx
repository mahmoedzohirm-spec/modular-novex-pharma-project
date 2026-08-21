// ============================================================
// pages/MedicineDetailsPage.tsx — Medicine details with ratings
// ============================================================
import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { getMedicines, addRating, Medicine, formatCurrency } from '../config/data';
import RatingStars from '../components/RatingStars';

interface MedicineDetailsPageProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
  params?: Record<string, string>;
}

export default function MedicineDetailsPage({ onNavigate, params }: MedicineDetailsPageProps) {
  const { currentUser } = useAuth();
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [userRating, setUserRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const meds = getMedicines();
    const found = meds.find(m => m.id === params?.id);
    if (found) setMedicine(found);
  }, [params]);

  const handleSubmitRating = () => {
    if (!medicine || !currentUser) return;
    if (userRating === 0) {
      alert('الرجاء اختيار تقييم');
      return;
    }
    addRating(medicine.id, currentUser.id, currentUser.pharmacyName, userRating, comment);
    // تحديث العرض
    const updated = getMedicines().find(m => m.id === medicine.id);
    if (updated) setMedicine(updated);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  if (!medicine) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">جاري تحميل البيانات...</p>
      </div>
    );
  }

  const avgRating = medicine.ratings.length > 0
    ? medicine.ratings.reduce((s, r) => s + r.rating, 0) / medicine.ratings.length
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 py-8" style={{ fontFamily: "'Tajawal', sans-serif" }}>
      <div className="max-w-3xl mx-auto px-4">
        <button
          onClick={() => onNavigate('catalog')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          العودة للكتالوج
        </button>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <img src={medicine.imageUrl} alt={medicine.name} className="w-full h-64 object-cover" />
          <div className="p-6">
            <h1 className="text-2xl font-bold text-slate-900">{medicine.name}</h1>
            <p className="text-slate-500 italic">{medicine.genericName}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-2xl font-black text-blue-700">{formatCurrency(medicine.price)}</span>
              <span className="text-sm text-slate-400">/ علبة</span>
              {medicine.bonus && (
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">🎁 {medicine.bonus}</span>
              )}
            </div>
            <p className="text-slate-600 mt-3">{medicine.description}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {medicine.categories.map(cat => (
                <span key={cat} className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-full">{cat}</span>
              ))}
            </div>

            {/* Ratings */}
            <div className="mt-6 border-t border-slate-200 pt-4">
              <div className="flex items-center gap-4">
                <span className="font-bold text-slate-800">التقييم:</span>
                <RatingStars rating={avgRating} readonly />
                <span className="text-sm text-slate-500">({medicine.ratings.length} تقييم)</span>
              </div>

              {/* Add rating */}
              {currentUser && (
                <div className="mt-4 bg-slate-50 rounded-xl p-4">
                  <h3 className="font-bold text-slate-800 mb-2">أضف تقييمك</h3>
                  <div className="flex items-center gap-3 mb-2">
                    <RatingStars rating={userRating} onChange={setUserRating} />
                    <span className="text-sm text-slate-500">{userRating > 0 ? userRating : 'اختر'}</span>
                  </div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="اكتب تعليقك (اختياري)"
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  <button
                    onClick={handleSubmitRating}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors"
                  >
                    إرسال التقييم
                  </button>
                  {submitted && (
                    <div className="mt-2 text-green-600 text-sm font-medium">✓ تم إضافة تقييمك!</div>
                  )}
                </div>
              )}

              {/* Ratings list */}
              {medicine.ratings.length > 0 && (
                <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                  {medicine.ratings.map((r, idx) => (
                    <div key={idx} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800">{r.userName}</span>
                        <RatingStars rating={r.rating} readonly size="sm" />
                      </div>
                      {r.comment && <p className="text-sm text-slate-600 mt-1">{r.comment}</p>}
                      <p className="text-xs text-slate-400 mt-1">{new Date(r.timestamp).toLocaleDateString('ar-EG')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}