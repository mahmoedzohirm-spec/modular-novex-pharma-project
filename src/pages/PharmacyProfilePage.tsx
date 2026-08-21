// ============================================================
// pages/PharmacyProfilePage.tsx — Pharmacy Statement & Receipt History
// ============================================================
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../auth/AuthContext";
import {
  getPharmacies,
  getReceipts, setReceipts,
  getOrders,
  Pharmacy, Receipt,
  generateId,
  formatCurrency, formatDate,
  sendBrowserNotification,
  addNotification,
  recalculatePharmacyDebt,
} from "../config/data";
import { generateInvoicePDF } from "../components/InvoicePDF";
import { exportPharmacyFinancialReportPDF } from "../utils/exportReports";

interface PharmacyProfilePageProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
  params?: Record<string, string>;
}

export default function PharmacyProfilePage({ onNavigate, params }: PharmacyProfilePageProps) {
  const { currentUser, isAdmin, isLoggedIn, refreshUser } = useAuth();
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [receipts, setReceiptsState] = useState<Receipt[]>([]);
  const [orders] = useState(getOrders());
  const [activeTab, setActiveTab] = useState<"overview" | "receipts" | "orders">("overview");

  // Payment form
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [imagePreviewModal, setImagePreviewModal] = useState<string | null>(null);

  // ترتيب الإيصالات
  const sortedReceipts = useMemo(() => {
    const priority = { approved: 0, pending: 1, rejected: 2 };
    return [...receipts].sort((a, b) => {
      const pA = priority[a.status] ?? 3;
      const pB = priority[b.status] ?? 3;
      if (pA !== pB) return pA - pB;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [receipts]);

  // ✅ ترتيب الطلبات (الأحدث أولاً)
  const pharmacyOrders = useMemo(() => {
    return orders
      .filter((o) => o.pharmacyId === pharmacy?.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [orders, pharmacy]);

  useEffect(() => {
    if (!isLoggedIn) { onNavigate("login"); return; }

    const pharmacies = getPharmacies();
    let found: Pharmacy | undefined;

    if (isAdmin && params?.id) {
      found = pharmacies.find((p) => p.id === params.id);
    } else if (currentUser) {
      found = pharmacies.find((p) => p.id === (params?.id || currentUser.id));
      if (!isAdmin && found && found.id !== currentUser.id) {
        onNavigate("catalog");
        return;
      }
    }

    if (found) {
      setPharmacy(found);
      const allReceipts = getReceipts();
      setReceiptsState(allReceipts.filter((r) => r.pharmacyId === found!.id));
      // تحديث المستخدم الحالي
      refreshUser();
    }
  }, [isLoggedIn, isAdmin, currentUser, params, onNavigate, refreshUser]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setSubmitError("حجم الصورة يجب أن لا يتجاوز 5 ميجابايت"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageFile(ev.target?.result as string);
      setImageUrl("");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");

    if (!pharmacy) {
      setSubmitError("بيانات الصيدلية غير متوفرة");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) { setSubmitError("الرجاء إدخال مبلغ صحيح"); return; }
    const finalImage = imageFile || imageUrl.trim();
    if (!finalImage) { setSubmitError("الرجاء إرفاق صورة الإيصال أو إدخال رابطها"); return; }

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const similar = receipts.filter(r =>
      r.amount === parsedAmount &&
      new Date(r.timestamp) > oneDayAgo
    );
    if (similar.length > 0) {
      const confirmSend = window.confirm(
        `⚠️ يوجد إيصال مكرر بنفس المبلغ (${formatCurrency(parsedAmount)}) خلال الـ 24 ساعة الماضية.\n\n` +
        `تأكد من عدم إرساله مرتين.\nهل تريد المتابعة مع الإرسال؟`
      );
      if (!confirmSend) return;
    }

    setSubmitLoading(true);
    await new Promise((r) => setTimeout(r, 800));

    const allReceipts = getReceipts();
    const newReceipt: Receipt = {
      id: generateId("rec"),
      pharmacyId: pharmacy.id,
      pharmacyName: pharmacy.pharmacyName,
      amount: parsedAmount,
      imageUrl: finalImage,
      timestamp: new Date().toISOString(),
      status: "pending",
      notes: notes.trim(),
    };

    const updated = [...allReceipts, newReceipt];
    setReceipts(updated);
    setReceiptsState(updated.filter((r) => r.pharmacyId === pharmacy.id));

    setAmount("");
    setNotes("");
    setImageUrl("");
    setImageFile(null);
    setShowPaymentForm(false);
    setSubmitLoading(false);
    setSubmitSuccess("تم إرسال إيصال الدفع بنجاح! سيتم مراجعته من قِبل الإدارة.");
    sendBrowserNotification(
      '🧾 إيصال دفع',
      `تم إرسال إيصال بقيمة ${formatCurrency(parsedAmount)} من ${pharmacy.pharmacyName}`,
      '/vite.svg'
    );
    addNotification(`🧾 تم إرسال إيصال بقيمة ${formatCurrency(parsedAmount)} من ${pharmacy.pharmacyName}`, "success");
    setTimeout(() => setSubmitSuccess(""), 4000);
  };

  const approvedAmount = sortedReceipts.filter((r) => r.status === "approved").reduce((s, r) => s + r.amount, 0);
  const pendingAmount = sortedReceipts.filter((r) => r.status === "pending").reduce((s, r) => s + r.amount, 0);

  if (!pharmacy) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" style={{ fontFamily: "'Tajawal', sans-serif" }}>
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="text-slate-500">جاري تحميل بيانات الصيدلية...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'Tajawal', sans-serif" }}>
      {imagePreviewModal && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setImagePreviewModal(null)}
        >
          <img
            src={imagePreviewModal}
            alt="معاينة الإيصال"
            className="max-w-full max-h-[90vh] rounded-xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setImagePreviewModal(null)}
            className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {submitSuccess && (
        <div className="fixed top-20 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-bold max-w-sm">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {submitSuccess}
        </div>
      )}

      <div className="bg-linear-to-l from-slate-800 via-slate-900 to-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => onNavigate(isAdmin ? "admin" : "catalog")}
            className="flex items-center gap-2 text-slate-300 hover:text-white text-sm mb-5 transition-colors group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {isAdmin ? "العودة للوحة التحكم" : "العودة للكتالوج"}
          </button>

          <div className="flex items-start gap-5 flex-wrap">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl sm:text-3xl font-black shrink-0 shadow-lg">
              {pharmacy.pharmacyName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black">{pharmacy.pharmacyName}</h1>
                <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-bold">
                  🏥 صيدلية
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 flex-wrap text-sm text-slate-300">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  @{pharmacy.username}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {pharmacy.phone}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  عضو منذ {formatDate(pharmacy.registeredAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-red-50 rounded-xl border border-red-100">
              <div className="text-xs text-red-500 font-medium mb-1">المبلغ المتبقي</div>
              <div className="text-lg sm:text-xl font-black text-red-700">{formatCurrency(pharmacy.totalDebt)}</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-xl border border-green-100">
              <div className="text-xs text-green-500 font-medium mb-1">إجمالي المدفوع</div>
              <div className="text-lg sm:text-xl font-black text-green-700">{formatCurrency(approvedAmount)}</div>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-xl border border-amber-100">
              <div className="text-xs text-amber-500 font-medium mb-1">تحت المراجعة</div>
              <div className="text-lg sm:text-xl font-black text-amber-700">{formatCurrency(pendingAmount)}</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-xl border border-blue-100">
              <div className="text-xs text-blue-500 font-medium mb-1">إجمالي الطلبات</div>
              <div className="text-lg sm:text-xl font-black text-blue-700">{pharmacyOrders.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-1 bg-slate-200/60 rounded-xl p-1 mb-6 w-fit">
          {[
            { id: "overview", label: "نظرة عامة", icon: "📋" },
            { id: "receipts", label: `الإيصالات (${sortedReceipts.length})`, icon: "🧾" },
            { id: "orders", label: `الطلبات (${pharmacyOrders.length})`, icon: "📦" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h2 className="font-bold text-slate-800 mb-4">بيانات الحساب</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {[
                  { label: "اسم الصيدلية", value: pharmacy.pharmacyName },
                  { label: "اسم المستخدم", value: `@${pharmacy.username}` },
                  { label: "رقم الهاتف", value: pharmacy.phone },
                  { label: "نوع الحساب", value: "صيدلية" },
                  { label: "تاريخ التسجيل", value: formatDate(pharmacy.registeredAt) },
                  { label: "رقم الحساب", value: pharmacy.id },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-50 rounded-xl p-3">
                    <div className="text-slate-500 text-xs font-medium mb-1">{item.label}</div>
                    <div className="font-semibold text-slate-800">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h2 className="font-bold text-slate-800 mb-4">الملخص المالي</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <span className="text-slate-600 text-sm">إجمالي قيمة المشتريات</span>
                  <span className="font-bold text-slate-800">
                    {formatCurrency(pharmacy.totalDebt + approvedAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <span className="text-slate-600 text-sm">المبالغ المدفوعة (مقبولة)</span>
                  <span className="font-bold text-green-700">- {formatCurrency(approvedAmount)}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <span className="text-slate-600 text-sm">مبالغ تحت المراجعة</span>
                  <span className="font-bold text-amber-600">⏳ {formatCurrency(pendingAmount)}</span>
                </div>
                <div className="flex items-center justify-between py-3 bg-red-50 rounded-xl px-4">
                  <span className="font-bold text-slate-800">الرصيد المتبقي</span>
                  <span className="text-xl font-black text-red-700">{formatCurrency(pharmacy.totalDebt)}</span>
                </div>
              </div>

              {isAdmin && (
                <button
                  onClick={async () => {
                    await exportPharmacyFinancialReportPDF(pharmacy, sortedReceipts, pharmacyOrders);
                  }}
                  className="mt-4 w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  📄 تحميل التقرير المالي الكامل (PDF)
                </button>
              )}
            </div>

            {/* ✅ قسم الرسائل الواردة - تمت الإضافة */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h2 className="font-bold text-slate-800 mb-4">📩 الرسائل الواردة</h2>
              {pharmacy.messages.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">لا توجد رسائل</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {pharmacy.messages.map((msg) => (
                    <div key={msg.id} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 text-sm">{msg.senderName}</span>
                        <span className="text-xs text-slate-400">{formatDate(msg.timestamp)}</span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{msg.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!isAdmin && (
              <div className="bg-white rounded-2xl border border-blue-200 shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-slate-800">إرسال إيصال دفع</h2>
                      <p className="text-xs text-slate-500 mt-0.5">أرسل إيصال التحويل البنكي لخصم المبلغ من رصيدك</p>
                    </div>
                    <button
                      onClick={() => setShowPaymentForm(!showPaymentForm)}
                      className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${showPaymentForm ? "bg-slate-200 text-slate-700" : "bg-blue-600 text-white hover:bg-blue-700 shadow-md"}`}
                    >
                      {showPaymentForm ? "إلغاء" : "💳 إرسال إيصال"}
                    </button>
                  </div>
                </div>

                {showPaymentForm && (
                  <form onSubmit={handleSubmitPayment} className="p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                          المبلغ المرسل (₪) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                          ملاحظات (اختياري)
                        </label>
                        <input
                          type="text"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="مثال: تحويل بنكي - حساب الشركة"
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                          dir="rtl"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        صورة الإيصال *
                      </label>
                      <div className="space-y-3">
                        <div
                          className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-colors cursor-pointer"
                          onClick={() => document.getElementById("receipt-upload")?.click()}
                        >
                          <input
                            id="receipt-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                          />
                          {imageFile ? (
                            <div>
                              <img
                                src={imageFile}
                                alt="معاينة"
                                className="h-32 object-cover rounded-lg mx-auto mb-2 cursor-pointer"
                                onClick={(e) => { e.stopPropagation(); setImagePreviewModal(imageFile); }}
                              />
                              <p className="text-xs text-green-600 font-medium">✓ تم رفع الصورة — اضغط لتغييرها</p>
                            </div>
                          ) : (
                            <>
                              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <p className="text-sm text-slate-500 font-medium">اضغط لرفع صورة الإيصال</p>
                              <p className="text-xs text-slate-400 mt-1">JPG, PNG, WEBP — حتى 5 ميجابايت</p>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-px bg-slate-200"></div>
                          <span className="text-xs text-slate-400 font-medium">أو</span>
                          <div className="flex-1 h-px bg-slate-200"></div>
                        </div>
                        <input
                          type="url"
                          value={imageUrl}
                          onChange={(e) => { setImageUrl(e.target.value); setImageFile(null); }}
                          placeholder="أدخل رابط صورة الإيصال (URL)"
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                          dir="ltr"
                        />
                        {imageUrl && !imageFile && (
                          <div className="rounded-xl overflow-hidden border border-slate-200">
                            <img
                              src={imageUrl}
                              alt="معاينة"
                              className="w-full h-32 object-cover cursor-pointer"
                              onClick={() => setImagePreviewModal(imageUrl)}
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {submitError && (
                      <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {submitError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitLoading}
                      className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {submitLoading ? (
                        <>
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          جاري الإرسال...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          إرسال الإيصال
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "receipts" && (
          <div className="space-y-4">
            {!isAdmin && (
              <div className="flex justify-end">
                <button
                  onClick={() => { setActiveTab("overview"); setShowPaymentForm(true); }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-md flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  إرسال إيصال جديد
                </button>
              </div>
            )}

            {sortedReceipts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                  </svg>
                </div>
                <p className="font-semibold text-slate-600 mb-1">لا توجد إيصالات بعد</p>
                <p className="text-sm text-slate-400">لم يتم إرسال أي إيصالات دفع حتى الآن</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedReceipts.map((r) => (
                  <div key={r.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="flex flex-col sm:flex-row">
                      <div
                        className="h-40 sm:h-auto sm:w-48 shrink-0 bg-slate-100 cursor-zoom-in relative group"
                        onClick={() => setImagePreviewModal(r.imageUrl)}
                      >
                        <img
                          src={r.imageUrl}
                          alt="إيصال"
                          className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-sm">لا يمكن تحميل الصورة</div>`;
                          }}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </div>
                      </div>

                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                          <div>
                            <div className="text-xs text-slate-500 mb-1">رقم الإيصال: {r.id}</div>
                            <div className="text-2xl font-black text-blue-700">{formatCurrency(r.amount)}</div>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold ${
                            r.status === "approved" ? "bg-green-100 text-green-700 border border-green-200" :
                            r.status === "pending" ? "bg-amber-100 text-amber-700 border border-amber-200" :
                            "bg-red-100 text-red-700 border border-red-200"
                          }`}>
                            {r.status === "approved" ? "✓ مقبول" : r.status === "pending" ? "⏳ قيد المراجعة" : "✕ مرفوض"}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                          <div>
                            <div className="text-slate-500 mb-0.5">التاريخ والوقت</div>
                            <div className="font-medium text-slate-700">{formatDate(r.timestamp)}</div>
                          </div>
                          {r.notes && (
                            <div>
                              <div className="text-slate-500 mb-0.5">الملاحظات</div>
                              <div className="font-medium text-slate-700">{r.notes}</div>
                            </div>
                          )}
                        </div>

                        {r.status === "pending" && !isAdmin && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700 flex items-center gap-2">
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            قيد المراجعة من قِبل الإدارة، سيتم الرد قريباً
                          </div>
                        )}
                        {r.status === "approved" && (
                          <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-700 flex items-center gap-2">
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            تم قبول الإيصال وخصم المبلغ من رصيدك
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="space-y-4">
            {pharmacyOrders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <p className="font-semibold text-slate-600 mb-1">لا توجد طلبات بعد</p>
                <p className="text-sm text-slate-400">لم يتم تقديم أي طلبات شراء حتى الآن</p>
                {!isAdmin && (
                  <button
                    onClick={() => onNavigate("catalog")}
                    className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
                  >
                    تصفح الكتالوج
                  </button>
                )}
              </div>
            ) : (
              // ✅ الطلبات مرتبة من الأحدث إلى الأقدم
              pharmacyOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                    <div>
                      <span className="text-xs text-slate-500">رقم الطلب: </span>
                      <span className="text-xs font-bold text-slate-700">{order.id}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">{formatDate(order.timestamp)}</span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${order.status === "delivered" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                        {order.status === "delivered" ? "✓ تم التسليم" : "⏳ قيد التنفيذ"}
                      </span>
                      <button
                        onClick={() => generateInvoicePDF(order, pharmacy.pharmacyName)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-bold px-2 py-1 bg-blue-50 rounded-lg flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        طباعة
                      </button>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="space-y-2 mb-4">
                      {order.items.map((item) => (
                        <div key={item.medicineId} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                              {item.quantity}
                            </span>
                            <span className="font-medium text-slate-800">{item.medicineName}</span>
                            <span className="text-slate-400 text-xs">{item.genericName}</span>
                            {item.bonus && (
                              <span className="bg-blue-50 text-blue-600 text-xs px-1.5 py-0.5 rounded-full">
                                {item.bonus}
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-slate-700">{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <span className="font-bold text-slate-700">إجمالي الطلب</span>
                      <span className="text-lg font-black text-blue-700">{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
