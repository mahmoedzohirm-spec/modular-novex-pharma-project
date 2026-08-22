// ============================================================
// pages/AdminPage.tsx — Admin Dashboard & Management
// ============================================================
import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../auth/AuthContext";
import {
  getMedicines, setMedicines,
  getPharmacies, setPharmacies,
  getReceipts, setReceipts,
  getOrders, setOrders,
  Medicine, Receipt,
  generateId,
  formatCurrency, formatDate,
  sendBrowserNotification,
  getLowStockMedicines,
  addStockMovement,
  addNotification,
  recalculatePharmacyDebt,
  initializeStorage,
} from "../config/data";
import StockAlert from "../components/StockAlert";
import ReminderModal from "../components/ReminderModal";
import ResetPasswordModal from "../components/ResetPasswordModal";
import { exportOrdersPDF, exportSalesCSV, exportReceiptsPDF, exportReceiptsCSV } from "../utils/exportReports";

interface AdminPageProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

function StatCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className={`bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>
          {icon}
        </div>
        {sub && <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium">{sub}</span>}
      </div>
      <div className="text-2xl font-black text-slate-900 mb-1">{value}</div>
      <div className="text-sm text-slate-500 font-medium">{label}</div>
    </div>
  );
}

export default function AdminPage({ onNavigate }: AdminPageProps) {
  const { isAdmin, isLoggedIn } = useAuth();
  const [medicines, setMedicinesState] = useState<Medicine[]>([]);
  const [pharmacies, setPharmaciesState] = useState<Pharmacy[]>([]);
  const [receipts, setReceiptsState] = useState<Receipt[]>([]);
  const [orders, setOrdersState] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<"dashboard" | "products" | "receipts" | "pharmacies" | "stock" | "orders">("dashboard");
  const [receiptModal, setReceiptModal] = useState<Receipt | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "warning" } | null>(null);
  
  // Reminder Modal
  const [reminderModal, setReminderModal] = useState<{ pharmacyId: string; pharmacyName: string } | null>(null);

  // Reset Password Modal
  const [resetPasswordModal, setResetPasswordModal] = useState<{ pharmacyId: string; pharmacyName: string } | null>(null);

  // Add product form
  const [newProduct, setNewProduct] = useState<Partial<Medicine>>({
    name: "", genericName: "", price: 0, bonus: "", imageUrl: "", categories: [], stock: 100, description: "",
  });
  const [addProductError, setAddProductError] = useState("");
  const [addProductSuccess, setAddProductSuccess] = useState("");
  const [newImageFile, setNewImageFile] = useState<string | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);

  // Edit product
  const [editingProduct, setEditingProduct] = useState<Medicine | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editImageFile, setEditImageFile] = useState<string | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

  // Stock management
  const [stockMovement, setStockMovement] = useState<{ medicineId: string; type: 'in' | 'out'; quantity: number; note: string }>({
    medicineId: '',
    type: 'in',
    quantity: 1,
    note: '',
  });
  const [showStockModal, setShowStockModal] = useState(false);

  // Search
  const [pharmacySearch, setPharmacySearch] = useState("");
  const [medicineSearch, setMedicineSearch] = useState("");

  // ── تحميل البيانات ──
  useEffect(() => {
    const loadData = async () => {
      try {
        // تهيئة قاعدة البيانات بالبيانات الافتراضية
        await initializeStorage();
        const [meds, pharms, recs, ords] = await Promise.all([
          getMedicines(),
          getPharmacies(),
          getReceipts(),
          getOrders(),
        ]);
        setMedicinesState(meds);
        setPharmaciesState(pharms);
        setReceiptsState(recs);
        setOrdersState(ords);
      } catch (error) {
        console.error('Error loading data:', error);
        showToast('فشل تحميل البيانات', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !isAdmin) {
      onNavigate("login");
    }
  }, [isLoggedIn, isAdmin, onNavigate]);

  const showToast = useCallback((msg: string, type: "success" | "error" | "warning" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Stats
  const totalRevenue = receipts.filter((r) => r.status === "approved").reduce((s, r) => s + r.amount, 0);
  const pendingCount = receipts.filter((r) => r.status === "pending").length;
  const totalDebt = pharmacies.reduce((s, p) => s + p.totalDebt, 0);
  const lowStockCount = medicines.filter(m => m.stock < 50).length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const deliveredOrders = orders.filter((o) => o.status === "delivered").length;

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [orders]);

  const sortedReceipts = useMemo(() => {
    const priority = { approved: 0, pending: 1, rejected: 2 };
    return [...receipts].sort((a, b) => {
      const pA = priority[a.status] ?? 3;
      const pB = priority[b.status] ?? 3;
      if (pA !== pB) return pA - pB;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [receipts]);

  const handleApproveReceipt = async (receipt: Receipt) => {
    const pharmacy = pharmacies.find(p => p.id === receipt.pharmacyId);
    if (!pharmacy) return;

    const maxDeductible = Math.min(receipt.amount, pharmacy.totalDebt);

    const updated = receipts.map((r) =>
      r.id === receipt.id ? { ...r, status: "approved" as const } : r
    );
    setReceiptsState(updated);
    await setReceipts(updated);

    const updatedPharmacies = pharmacies.map((p) => {
      if (p.id === receipt.pharmacyId) {
        return {
          ...p,
          totalPaid: p.totalPaid + maxDeductible,
          totalDebt: Math.max(0, p.totalDebt - maxDeductible),
        };
      }
      return p;
    });
    setPharmaciesState(updatedPharmacies);
    await setPharmacies(updatedPharmacies);
    setReceiptModal(null);

    await recalculatePharmacyDebt(receipt.pharmacyId);

    if (maxDeductible < receipt.amount) {
      showToast(`تم خصم ${formatCurrency(maxDeductible)} فقط (المبلغ المتبقي أقل من قيمة الإيصال)`, "warning");
    } else {
      showToast("تم قبول الإيصال وخصم المبلغ بنجاح ✓", "success");
    }

    sendBrowserNotification(
      '✅ تم قبول الإيصال',
      `تم قبول إيصال من ${receipt.pharmacyName} بقيمة ${formatCurrency(maxDeductible)}`,
      '/vite.svg'
    );
    await addNotification(`✅ تم قبول إيصال من ${receipt.pharmacyName} بقيمة ${formatCurrency(maxDeductible)}`, "success");
  };

  const handleRejectReceipt = async (receipt: Receipt) => {
    const updated = receipts.map((r) =>
      r.id === receipt.id ? { ...r, status: "rejected" as const } : r
    );
    setReceiptsState(updated);
    await setReceipts(updated);
    setReceiptModal(null);
    showToast("تم رفض الإيصال", "error");
    sendBrowserNotification(
      '❌ تم رفض الإيصال',
      `تم رفض إيصال من ${receipt.pharmacyName} بقيمة ${formatCurrency(receipt.amount)}.`,
      '/vite.svg'
    );
    await addNotification(`❌ تم رفض إيصال من ${receipt.pharmacyName} بقيمة ${formatCurrency(receipt.amount)}`, "warning");
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: "pending" | "delivered") => {
    const updated = orders.map((o) =>
      o.id === orderId ? { ...o, status: newStatus } : o
    );
    setOrdersState(updated);
    await setOrders(updated);
    showToast(`تم تحديث حالة الطلب إلى ${newStatus === "delivered" ? "تم التسليم" : "قيد التنفيذ"} ✓`);
    sendBrowserNotification(
      '📦 تحديث الطلب',
      `تم تحديث حالة الطلب #${orderId} إلى ${newStatus === "delivered" ? "تم التسليم" : "قيد التنفيذ"}.`,
      '/vite.svg'
    );
    await addNotification(`📦 تم تحديث حالة الطلب #${orderId} إلى ${newStatus === "delivered" ? "تم التسليم" : "قيد التنفيذ"}`, "info");
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddProductError("");
    if (!newProduct.name?.trim()) { setAddProductError("الرجاء إدخال اسم الدواء"); return; }
    if (!newProduct.genericName?.trim()) { setAddProductError("الرجاء إدخال الاسم الجيني"); return; }
    if (!newProduct.price || newProduct.price <= 0) { setAddProductError("الرجاء إدخال سعر صحيح"); return; }
    if (!newImageFile) { setAddProductError("الرجاء رفع صورة للمنتج"); return; }
    if (!newProduct.categories || newProduct.categories.length === 0) { setAddProductError("الرجاء اختيار تصنيف واحد على الأقل"); return; }

    const product: Medicine = {
      id: generateId("med"),
      name: newProduct.name!.trim(),
      genericName: newProduct.genericName!.trim(),
      price: newProduct.price!,
      bonus: newProduct.bonus || "",
      imageUrl: newImageFile,
      categories: newProduct.categories,
      stock: newProduct.stock || 100,
      description: newProduct.description || "",
      barcode: '',
      ratings: [],
      stockMovements: [],
      viewCount: 0,
    };

    const updatedMeds = [...medicines, product];
    setMedicinesState(updatedMeds);
    await setMedicines(updatedMeds);
    setNewProduct({ name: "", genericName: "", price: 0, bonus: "", imageUrl: "", categories: [], stock: 100, description: "" });
    setNewImageFile(null);
    setNewImagePreview(null);
    setAddProductSuccess("تم إضافة المنتج بنجاح!");
    showToast("تم إضافة المنتج بنجاح ✓");
    sendBrowserNotification(
      '💊 منتج جديد',
      `تم إضافة ${newProduct.name} إلى الكتالوج بنجاح.`,
      '/vite.svg'
    );
    await addNotification(`💊 تم إضافة منتج جديد: ${newProduct.name}`, "success");
    setTimeout(() => setAddProductSuccess(""), 3000);
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const updatedMeds = medicines.map((m) =>
      m.id === editingProduct.id
        ? { ...editingProduct, imageUrl: editImageFile || editingProduct.imageUrl }
        : m
    );
    setMedicinesState(updatedMeds);
    await setMedicines(updatedMeds);
    setShowEditModal(false);
    setEditImageFile(null);
    setEditImagePreview(null);
    setEditingProduct(null);
    showToast("تم تحديث المنتج بنجاح ✓");
  };

  const handleDeleteMedicine = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
    const updated = medicines.filter((m) => m.id !== id);
    setMedicinesState(updated);
    await setMedicines(updated);
    showToast("تم حذف المنتج");
  };

  const handleStockMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockMovement.medicineId) { showToast("الرجاء اختيار دواء", "error"); return; }
    if (stockMovement.quantity <= 0) { showToast("الرجاء إدخال كمية صحيحة", "error"); return; }
    await addStockMovement(stockMovement.medicineId, stockMovement.type, stockMovement.quantity, stockMovement.note);
    setMedicinesState(await getMedicines());
    setShowStockModal(false);
    setStockMovement({ medicineId: '', type: 'in', quantity: 1, note: '' });
    showToast(`تم إضافة حركة مخزون بنجاح ✓`);
  };

  const filteredPharmacies = pharmacies.filter(
    (p) =>
      p.pharmacyName.includes(pharmacySearch) ||
      p.username.includes(pharmacySearch) ||
      p.phone.includes(pharmacySearch)
  );

  const filteredMedicines = medicines.filter(
    (m) =>
      m.name.toLowerCase().includes(medicineSearch.toLowerCase()) ||
      m.genericName.toLowerCase().includes(medicineSearch.toLowerCase()) ||
      m.categories.some(c => c.toLowerCase().includes(medicineSearch.toLowerCase()))
  );

  const navItems = [
    { id: "dashboard", label: "لوحة المعلومات", icon: "📊" },
    { id: "stock", label: "المخزون", icon: "📦", badge: lowStockCount > 0 ? lowStockCount : undefined },
    { id: "products", label: "المنتجات", icon: "💊" },
    { id: "orders", label: "الطلبات", icon: "📦", badge: pendingOrders > 0 ? pendingOrders : undefined },
    { id: "receipts", label: "الإيصالات", icon: "🧾", badge: pendingCount },
    { id: "pharmacies", label: "الصيدليات", icon: "🏥" },
  ];

  const allCategories = ["مضادات حيوية", "مسكنات", "الجهاز الهضمي", "السكري", "القلب والأوعية", "مضادات الحساسية", "فيتامينات ومكملات"];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'Tajawal', sans-serif" }}>
      {/* Reminder Modal */}
      {reminderModal && (
        <ReminderModal
          pharmacyId={reminderModal.pharmacyId}
          pharmacyName={reminderModal.pharmacyName}
          onClose={() => setReminderModal(null)}
          onSuccess={() => {
            setReminderModal(null);
            showToast("تم إرسال رسالة التذكير بنجاح", "success");
          }}
        />
      )}

      {/* Reset Password Modal */}
      {resetPasswordModal && (
        <ResetPasswordModal
          pharmacyId={resetPasswordModal.pharmacyId}
          onClose={() => setResetPasswordModal(null)}
          onSuccess={() => {
            setResetPasswordModal(null);
            showToast(`تم إعادة تعيين كلمة المرور لـ ${resetPasswordModal.pharmacyName}`, "success");
          }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-white text-sm font-bold ${toast.type === "success" ? "bg-green-600" : toast.type === "warning" ? "bg-amber-600" : "bg-red-600"}`}>
          {toast.type === "success" ? "✓" : toast.type === "warning" ? "⚠" : "✕"} {toast.msg}
        </div>
      )}

      {/* Receipt Modal - مُعدل لظهور الأزرار بشكل ثابت */}
      {receiptModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header - ثابت */}
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between rounded-t-2xl shrink-0">
              <h3 className="text-white font-bold">مراجعة الإيصال</h3>
              <button onClick={() => setReceiptModal(null)} className="text-white/80 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* المحتوى - قابل للتمرير */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-4 rounded-xl overflow-hidden border border-slate-200">
                <img
                  src={receiptModal.imageUrl}
                  alt="إيصال الدفع"
                  className="w-full h-52 object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x250?text=Receipt+Image"; }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="text-slate-500 text-xs mb-1">الصيدلية</div>
                  <div className="font-bold text-slate-800">{receiptModal.pharmacyName}</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="text-slate-500 text-xs mb-1">المبلغ</div>
                  <div className="font-black text-blue-700 text-lg">{formatCurrency(receiptModal.amount)}</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="text-slate-500 text-xs mb-1">التاريخ</div>
                  <div className="font-semibold text-slate-700 text-xs">{formatDate(receiptModal.timestamp)}</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="text-slate-500 text-xs mb-1">الملاحظات</div>
                  <div className="font-semibold text-slate-700 text-xs">{receiptModal.notes || "—"}</div>
                </div>
              </div>

              {/* عرض الحالة إذا لم يكن pending */}
              {receiptModal.status !== "pending" && (
                <div className={`text-center py-3 rounded-xl font-bold text-sm ${receiptModal.status === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {receiptModal.status === "approved" ? "✓ تم القبول مسبقاً" : "✕ تم الرفض مسبقاً"}
                </div>
              )}
            </div>

            {/* الأزرار - ثابتة في الأسفل */}
            {receiptModal.status === "pending" && (
              <div className="px-6 pb-6 pt-3 border-t border-slate-100 shrink-0 bg-white rounded-b-2xl">
                <div className="flex gap-3">
                  <button
                    onClick={() => handleRejectReceipt(receiptModal)}
                    className="flex-1 py-3 border-2 border-red-200 text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors"
                  >
                    ✕ رفض
                  </button>
                  <button
                    onClick={() => handleApproveReceipt(receiptModal)}
                    className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors shadow-md"
                  >
                    ✓ قبول وخصم المبلغ
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stock Movement Modal */}
      {showStockModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">إضافة حركة مخزون</h3>
              <button onClick={() => setShowStockModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleStockMovement} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">الدواء</label>
                <select
                  value={stockMovement.medicineId}
                  onChange={(e) => setStockMovement({ ...stockMovement, medicineId: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">اختر دواء</option>
                  {medicines.map(m => (
                    <option key={m.id} value={m.id}>{m.name} (المخزون: {m.stock})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">نوع الحركة</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="in"
                      checked={stockMovement.type === 'in'}
                      onChange={() => setStockMovement({ ...stockMovement, type: 'in' })}
                    /> وارد
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="out"
                      checked={stockMovement.type === 'out'}
                      onChange={() => setStockMovement({ ...stockMovement, type: 'out' })}
                    /> صادر
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">الكمية</label>
                <input
                  type="number"
                  min="1"
                  value={stockMovement.quantity}
                  onChange={(e) => setStockMovement({ ...stockMovement, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">ملاحظات</label>
                <input
                  type="text"
                  value={stockMovement.note}
                  onChange={(e) => setStockMovement({ ...stockMovement, note: e.target.value })}
                  placeholder="سبب الحركة..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
              >
                إضافة الحركة
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">تعديل المنتج</h2>
              <button onClick={() => { setShowEditModal(false); setEditImageFile(null); setEditImagePreview(null); }} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">الاسم التجاري *</label>
                  <input
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">الاسم الجيني *</label>
                  <input
                    value={editingProduct.genericName}
                    onChange={(e) => setEditingProduct({ ...editingProduct, genericName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">السعر (₪) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">عرض البونص</label>
                  <input
                    value={editingProduct.bonus || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, bonus: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">التصنيفات * (اختر واحداً أو أكثر)</label>
                  <div className="flex flex-wrap gap-2">
                    {allCategories.map(cat => (
                      <label key={cat} className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={editingProduct.categories.includes(cat)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setEditingProduct(prev => {
                              if (!prev) return prev;
                              const newCats = checked
                                ? [...prev.categories, cat]
                                : prev.categories.filter(c => c !== cat);
                              return { ...prev, categories: newCats };
                            });
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span>{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">الكمية في المخزن</label>
                  <input
                    type="number"
                    min="0"
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">صورة المنتج</label>
                <div
                  className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-colors cursor-pointer"
                  onClick={() => document.getElementById("edit-product-image-upload")?.click()}
                >
                  <input
                    id="edit-product-image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) {
                        alert("حجم الصورة كبير جداً");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const base64 = ev.target?.result as string;
                        setEditImageFile(base64);
                        setEditImagePreview(base64);
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  {editImagePreview ? (
                    <img src={editImagePreview} alt="معاينة" className="h-24 mx-auto rounded-lg" />
                  ) : (
                    <div>
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm text-slate-500">اضغط لرفع صورة جديدة (اختياري)</p>
                      {editingProduct.imageUrl && !editImagePreview && (
                        <p className="text-xs text-slate-400 mt-1">الصورة الحالية موجودة</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">الوصف</label>
                <textarea
                  value={editingProduct.description || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-md"
                >
                  حفظ التعديلات
                </button>
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditImageFile(null); setEditImagePreview(null); }}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex h-screen overflow-hidden">
        {/* Admin Sidebar */}
        <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0 hidden md:flex">
          <div className="p-5 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-xl">💊</span>
              </div>
              <div>
                <div className="font-bold text-sm">Novex Pharma</div>
                <div className="text-xs text-slate-400">لوحة التحكم</div>
              </div>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as typeof activeSection)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  activeSection === item.id
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge && item.badge > 0 && (
                  <span className="bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-slate-700">
            <button
              onClick={() => onNavigate("catalog")}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              العودة للكتالوج
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {/* Top bar */}
          <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {navItems.find((n) => n.id === activeSection)?.icon}{" "}
                {navItems.find((n) => n.id === activeSection)?.label}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeSection === "dashboard" && "نظرة عامة على النظام"}
                {activeSection === "stock" && `${lowStockCount} منتج بمخزون منخفض`}
                {activeSection === "products" && `${medicines.length} منتج مسجل`}
                {activeSection === "orders" && `${orders.length} طلب (${pendingOrders} معلق)`}
                {activeSection === "receipts" && `${pendingCount} إيصال بانتظار المراجعة`}
                {activeSection === "pharmacies" && `${pharmacies.length} صيدلية مسجلة`}
              </p>
            </div>
            {/* Mobile nav */}
            <div className="flex gap-2 md:hidden">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as typeof activeSection)}
                  className={`relative p-2 rounded-lg text-lg ${activeSection === item.id ? "bg-blue-100" : "bg-slate-100"}`}
                >
                  {item.icon}
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* ─── DASHBOARD ─── */}
            {activeSection === "dashboard" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    icon="💰"
                    label="إجمالي الإيرادات المحصّلة"
                    value={formatCurrency(totalRevenue)}
                    sub="مقبولة"
                    color="bg-green-100"
                  />
                  <StatCard
                    icon="⏳"
                    label="إيصالات بانتظار المراجعة"
                    value={String(pendingCount)}
                    sub={pendingCount > 0 ? "يحتاج مراجعة" : undefined}
                    color="bg-amber-100"
                  />
                  <StatCard
                    icon="🏥"
                    label="الصيدليات المسجلة"
                    value={String(pharmacies.length)}
                    color="bg-blue-100"
                  />
                  <StatCard
                    icon="💊"
                    label="إجمالي المنتجات"
                    value={String(medicines.length)}
                    color="bg-slate-100"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <StatCard
                    icon="📦"
                    label="إجمالي الطلبات"
                    value={String(orders.length)}
                    color="bg-indigo-100"
                  />
                  <StatCard
                    icon="💳"
                    label="إجمالي الديون المستحقة"
                    value={formatCurrency(totalDebt)}
                    color="bg-red-100"
                  />
                </div>

                <StockAlert onNavigate={onNavigate} />

                {/* Recent receipts */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="font-bold text-slate-800">آخر الإيصالات</h2>
                    <button
                      onClick={() => setActiveSection("receipts")}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      عرض الكل
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="text-right px-5 py-3 text-xs text-slate-500 font-semibold">الصيدلية</th>
                          <th className="text-right px-5 py-3 text-xs text-slate-500 font-semibold">المبلغ</th>
                          <th className="text-right px-5 py-3 text-xs text-slate-500 font-semibold">التاريخ</th>
                          <th className="text-right px-5 py-3 text-xs text-slate-500 font-semibold">الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedReceipts.slice(0, 5).map((r) => (
                          <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-3 font-medium text-slate-800">{r.pharmacyName}</td>
                            <td className="px-5 py-3 font-bold text-blue-700">{formatCurrency(r.amount)}</td>
                            <td className="px-5 py-3 text-slate-500 text-xs">{formatDate(r.timestamp)}</td>
                            <td className="px-5 py-3">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                r.status === "approved" ? "bg-green-100 text-green-700" :
                                r.status === "pending" ? "bg-amber-100 text-amber-700" :
                                "bg-red-100 text-red-700"
                              }`}>
                                {r.status === "approved" ? "✓ مقبول" : r.status === "pending" ? "⏳ معلق" : "✕ مرفوض"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pharmacies summary */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="font-bold text-slate-800">ملخص الصيدليات</h2>
                    <button onClick={() => setActiveSection("pharmacies")} className="text-xs text-blue-600 hover:underline">
                      عرض الكل
                    </button>
                  </div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {pharmacies.slice(0, 3).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => onNavigate("pharmacy-profile", { id: p.id })}
                        className="bg-slate-50 rounded-xl p-4 text-right border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                            {p.pharmacyName[0]}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-sm">{p.pharmacyName}</div>
                            <div className="text-xs text-slate-500">{p.phone}</div>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs">
                          <div>
                            <div className="text-slate-500">الدين المستحق</div>
                            <div className="font-bold text-red-600">{formatCurrency(p.totalDebt)}</div>
                          </div>
                          <div>
                            <div className="text-slate-500">المدفوع</div>
                            <div className="font-bold text-green-600">{formatCurrency(p.totalPaid)}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => setReminderModal({ pharmacyId: p.id, pharmacyName: p.pharmacyName })}
                          className="mt-3 w-full py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors flex items-center justify-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          إرسال تذكير
                        </button>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─── ORDERS ─── */}
            {activeSection === "orders" && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-slate-800">الطلبات ({orders.length})</h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => exportOrdersPDF(sortedOrders)}
                        className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        📄 PDF
                      </button>
                      <button
                        onClick={() => exportSalesCSV(sortedOrders, 'orders')}
                        className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        📊 Excel
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full">⏳ {pendingOrders} معلق</span>
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">✓ {deliveredOrders} تم التسليم</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="text-right px-5 py-3 text-xs text-slate-500 font-semibold">الصيدلية</th>
                        <th className="text-right px-5 py-3 text-xs text-slate-500 font-semibold">الإجمالي</th>
                        <th className="text-right px-5 py-3 text-xs text-slate-500 font-semibold hidden sm:table-cell">الأصناف</th>
                        <th className="text-right px-5 py-3 text-xs text-slate-500 font-semibold">التاريخ</th>
                        <th className="text-right px-5 py-3 text-xs text-slate-500 font-semibold">الحالة</th>
                        <th className="text-right px-5 py-3 text-xs text-slate-500 font-semibold">إجراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-slate-400 text-sm">لا توجد طلبات حتى الآن</td>
                        </tr>
                      ) : (
                        sortedOrders.map((order) => (
                          <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-3 font-medium text-slate-800">{order.pharmacyName}</td>
                            <td className="px-5 py-3 font-bold text-blue-700">{formatCurrency(order.total)}</td>
                            <td className="px-5 py-3 text-slate-500 hidden sm:table-cell">
                              {order.items.length} صنف
                            </td>
                            <td className="px-5 py-3 text-slate-500 text-xs">{formatDate(order.timestamp)}</td>
                            <td className="px-5 py-3">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                order.status === "delivered" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                              }`}>
                                {order.status === "delivered" ? "✓ تم التسليم" : "⏳ قيد التنفيذ"}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              {order.status === "pending" ? (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, "delivered")}
                                  className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors"
                                >
                                  تم التسليم
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, "pending")}
                                  className="text-xs bg-amber-600 text-white px-3 py-1 rounded-lg hover:bg-amber-700 transition-colors"
                                >
                                  إعادة للتعليق
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ─── STOCK ─── */}
            {activeSection === "stock" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="font-bold text-slate-800 text-lg">إدارة المخزون</h2>
                  <button
                    onClick={() => setShowStockModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    إضافة حركة
                  </button>
                </div>

                <StockAlert onNavigate={onNavigate} />

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-right px-4 py-3 text-xs text-slate-500 font-semibold">الدواء</th>
                          <th className="text-right px-4 py-3 text-xs text-slate-500 font-semibold">المخزون الحالي</th>
                          <th className="text-right px-4 py-3 text-xs text-slate-500 font-semibold">آخر حركة</th>
                          <th className="text-right px-4 py-3 text-xs text-slate-500 font-semibold">إجراء</th>
                        </tr>
                      </thead>
                      <tbody>
                        {medicines.map(m => {
                          const lastMovement = m.stockMovements[m.stockMovements.length - 1];
                          return (
                            <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <img src={m.imageUrl} alt={m.name} className="w-8 h-8 rounded-lg object-cover" />
                                  <span className="font-medium text-slate-800">{m.name}</span>
                                </div>
                              </td>
                              <td className={`px-4 py-3 font-bold ${m.stock < 50 ? 'text-red-600' : 'text-slate-700'}`}>
                                {m.stock}
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-500">
                                {lastMovement ? `${lastMovement.type === 'in' ? '➕' : '➖'} ${lastMovement.quantity} - ${formatDate(lastMovement.timestamp)}` : 'لا توجد حركات'}
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => {
                                    setStockMovement({ ...stockMovement, medicineId: m.id });
                                    setShowStockModal(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                                >
                                  إضافة حركة
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ─── PRODUCTS ─── */}
            {activeSection === "products" && (
              <div className="space-y-6">
                {/* Add product form */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <h2 className="font-bold text-slate-800">➕ إضافة منتج جديد</h2>
                  </div>
                  <form onSubmit={handleAddProduct} className="p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">الاسم التجاري *</label>
                        <input
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                          placeholder="مثال: أموكسيسيلين 500 مجم"
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                          dir="rtl"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">الاسم الجيني *</label>
                        <input
                          value={newProduct.genericName}
                          onChange={(e) => setNewProduct({ ...newProduct, genericName: e.target.value })}
                          placeholder="Amoxicillin 500mg"
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">السعر (₪) *</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={newProduct.price || ""}
                          onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                          placeholder="0.00"
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">عرض البونص</label>
                        <input
                          value={newProduct.bonus}
                          onChange={(e) => setNewProduct({ ...newProduct, bonus: e.target.value })}
                          placeholder="مثال: 1+11"
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                          dir="ltr"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">التصنيفات * (اختر واحداً أو أكثر)</label>
                        <div className="flex flex-wrap gap-2">
                          {allCategories.map(cat => (
                            <label key={cat} className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer text-sm">
                              <input
                                type="checkbox"
                                checked={newProduct.categories?.includes(cat) || false}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setNewProduct(prev => {
                                    const current = prev.categories || [];
                                    const newCats = checked
                                      ? [...current, cat]
                                      : current.filter(c => c !== cat);
                                    return { ...prev, categories: newCats };
                                  });
                                }}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <span>{cat}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">الكمية في المخزن</label>
                        <input
                          type="number"
                          min="0"
                          value={newProduct.stock || ""}
                          onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) || 0 })}
                          placeholder="100"
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                          dir="ltr"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">صورة المنتج *</label>
                      <div
                        className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-colors cursor-pointer"
                        onClick={() => document.getElementById("product-image-upload")?.click()}
                      >
                        <input
                          id="product-image-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 5 * 1024 * 1024) {
                              setAddProductError("حجم الصورة يجب أن لا يتجاوز 5 ميجابايت");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              const base64 = ev.target?.result as string;
                              setNewImageFile(base64);
                              setNewImagePreview(base64);
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                        {newImagePreview ? (
                          <img src={newImagePreview} alt="معاينة" className="h-24 mx-auto rounded-lg" />
                        ) : (
                          <div>
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2">
                              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <p className="text-sm text-slate-500">اضغط لرفع صورة المنتج</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">الوصف</label>
                      <textarea
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                        placeholder="وصف مختصر للدواء..."
                        rows={2}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 resize-none"
                        dir="rtl"
                      />
                    </div>
                    {addProductError && (
                      <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {addProductError}
                      </div>
                    )}
                    {addProductSuccess && (
                      <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
                        ✓ {addProductSuccess}
                      </div>
                    )}
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-md"
                    >
                      ➕ إضافة المنتج
                    </button>
                  </form>
                </div>

                {/* Products list */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
                    <h2 className="font-bold text-slate-800">قائمة المنتجات ({medicines.length})</h2>
                    <div className="relative">
                      <input
                        value={medicineSearch}
                        onChange={(e) => setMedicineSearch(e.target.value)}
                        placeholder="بحث..."
                        className="pl-8 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 w-48"
                        dir="rtl"
                      />
                      <svg className="absolute right-3 top-2.5 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                          <th className="text-right px-5 py-3 text-xs text-slate-500 font-semibold">الاسم</th>
                          <th className="text-right px-5 py-3 text-xs text-slate-500 font-semibold hidden sm:table-cell">الاسم الجيني</th>
                          <th className="text-right px-5 py-3 text-xs text-slate-500 font-semibold">السعر</th>
                          <th className="text-right px-5 py-3 text-xs text-slate-500 font-semibold hidden sm:table-cell">البونص</th>
                          <th className="text-right px-5 py-3 text-xs text-slate-500 font-semibold hidden md:table-cell">التصنيفات</th>
                          <th className="text-right px-5 py-3 text-xs text-slate-500 font-semibold">إجراء</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMedicines.map((m) => (
                          <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <img src={m.imageUrl} alt={m.name} className="w-9 h-9 rounded-lg object-cover shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = "/images/medicine-placeholder.png"; }} />
                                <span className="font-medium text-slate-800">{m.name}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-slate-500 hidden sm:table-cell">{m.genericName}</td>
                            <td className="px-5 py-3 font-bold text-blue-700">{formatCurrency(m.price)}</td>
                            <td className="px-5 py-3 hidden sm:table-cell">
                              {m.bonus && (
                                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                                  {m.bonus}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3 text-slate-500 text-xs hidden md:table-cell">
                              <div className="flex flex-wrap gap-1">
                                {m.categories.map(cat => (
                                  <span key={cat} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                                    {cat}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-5 py-3 flex items-center gap-1">
                              <button
                                onClick={() => { setEditingProduct(m); setShowEditModal(true); setEditImagePreview(m.imageUrl); }}
                                className="text-blue-400 hover:text-blue-600 transition-colors p-1.5 hover:bg-blue-50 rounded-lg"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteMedicine(m.id)}
                                className="text-red-400 hover:text-red-600 transition-colors p-1.5 hover:bg-red-50 rounded-lg"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ─── RECEIPTS ─── */}
            {activeSection === "receipts" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="font-bold text-slate-800">الإيصالات</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => exportReceiptsPDF(sortedReceipts)}
                      className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      📄 PDF
                    </button>
                    <button
                      onClick={() => exportReceiptsCSV(sortedReceipts, 'receipts')}
                      className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      📊 Excel
                    </button>
                  </div>
                </div>
                {["pending", "approved", "rejected"].map((status) => {
                  const filtered = sortedReceipts.filter((r) => r.status === status);
                  if (filtered.length === 0 && status !== "pending") return null;
                  return (
                    <div key={status} className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <div className={`px-5 py-4 border-b border-slate-100 rounded-t-2xl ${
                        status === "pending" ? "bg-amber-50" : status === "approved" ? "bg-green-50" : "bg-red-50"
                      }`}>
                        <h2 className="font-bold text-slate-800">
                          {status === "pending" && `⏳ الإيصالات المعلقة (${filtered.length})`}
                          {status === "approved" && `✓ الإيصالات المقبولة (${filtered.length})`}
                          {status === "rejected" && `✕ الإيصالات المرفوضة (${filtered.length})`}
                        </h2>
                      </div>
                      {filtered.length === 0 ? (
                        <div className="px-5 py-8 text-center text-slate-400 text-sm">
                          لا توجد إيصالات معلقة في الوقت الحالي 🎉
                        </div>
                      ) : (
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {filtered.map((r) => (
                            <button
                              key={r.id}
                              onClick={() => setReceiptModal(r)}
                              className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden hover:border-blue-300 hover:shadow-md transition-all text-right group"
                            >
                              <div className="h-36 overflow-hidden bg-slate-200">
                                <img
                                  src={r.imageUrl}
                                  alt="إيصال"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x250/f1f5f9/94a3b8?text=Receipt"; }}
                                />
                              </div>
                              <div className="p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold text-slate-800 text-sm">{r.pharmacyName}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                                    r.status === "approved" ? "bg-green-100 text-green-700" :
                                    r.status === "pending" ? "bg-amber-100 text-amber-700" :
                                    "bg-red-100 text-red-700"
                                  }`}>
                                    {r.status === "approved" ? "مقبول" : r.status === "pending" ? "معلق" : "مرفوض"}
                                  </span>
                                </div>
                                <div className="font-black text-blue-700 text-lg">{formatCurrency(r.amount)}</div>
                                <div className="text-xs text-slate-400 mt-1">{formatDate(r.timestamp)}</div>
                                {r.status === "pending" && (
                                  <div className="mt-2 text-xs text-blue-600 font-medium">اضغط للمراجعة والموافقة ←</div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ─── PHARMACIES ─── */}
            {activeSection === "pharmacies" && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
                  <h2 className="font-bold text-slate-800">الصيدليات المسجلة ({pharmacies.length})</h2>
                  <div className="relative">
                    <input
                      value={pharmacySearch}
                      onChange={(e) => setPharmacySearch(e.target.value)}
                      placeholder="بحث..."
                      className="pl-8 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 w-48"
                      dir="rtl"
                    />
                    <svg className="absolute right-3 top-2.5 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPharmacies.map((p) => {
                    const pharmReceipts = sortedReceipts.filter((r) => r.pharmacyId === p.id);
                    const pendingReceipts = pharmReceipts.filter((r) => r.status === "pending").length;
                    return (
                      <div key={p.id} className="bg-slate-50 rounded-xl border border-slate-200 p-4 hover:border-blue-300 transition-all">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-base">
                              {p.pharmacyName[0]}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 text-sm">{p.pharmacyName}</div>
                              <div className="text-xs text-slate-500">@{p.username}</div>
                            </div>
                          </div>
                          {pendingReceipts > 0 && (
                            <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-bold">
                              {pendingReceipts} معلق
                            </span>
                          )}
                        </div>
                        <div className="space-y-1.5 text-xs mb-3">
                          <div className="flex items-center gap-2 text-slate-500">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {p.phone}
                          </div>
                          <div className="flex items-center gap-2 text-slate-500">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatDate(p.registeredAt)}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="bg-red-50 rounded-lg p-2 text-center">
                            <div className="text-xs text-red-500">المستحق</div>
                            <div className="font-black text-red-700 text-sm">{formatCurrency(p.totalDebt)}</div>
                          </div>
                          <div className="bg-green-50 rounded-lg p-2 text-center">
                            <div className="text-xs text-green-500">المدفوع</div>
                            <div className="font-black text-green-700 text-sm">{formatCurrency(p.totalPaid)}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => onNavigate("pharmacy-profile", { id: p.id })}
                            className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                          >
                            عرض الملف
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setReminderModal({ pharmacyId: p.id, pharmacyName: p.pharmacyName })}
                            className="px-3 py-2 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            تذكير
                          </button>
                          <button
                            onClick={() => setResetPasswordModal({ pharmacyId: p.id, pharmacyName: p.pharmacyName })}
                            className="px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            إعادة تعيين
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
