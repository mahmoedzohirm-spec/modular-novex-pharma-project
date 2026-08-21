// ============================================================
// pages/CatalogPage.tsx — Medicine Catalog & Ordering
// ============================================================
import { useState, useMemo, useCallback, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { useCart } from "../hooks/useCart";
import {
  getMedicines,
  getPharmacies,
  setPharmacies,
  getOrders,
  setOrders,
  setMedicines,
  Medicine,
  CartItem,
  generateId,
  formatCurrency,
  sendBrowserNotification,
  getMedicineAverageRating,
  updateStockAfterOrder,
  addNotification,
} from "../config/data";
import BarcodeScanner from "../components/BarcodeScanner";
import RatingStars from "../components/RatingStars";

interface CatalogPageProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

const CATEGORIES = ["الكل", "مضادات حيوية", "مسكنات", "الجهاز الهضمي", "السكري", "القلب والأوعية", "مضادات الحساسية", "فيتامينات ومكملات"];

// Cart Sidebar Component
function CartSidebar({
  isOpen,
  onClose,
  cart,
  updateQuantity,
  removeFromCart,
  clearCart,
  cartTotal,
  savingsTotal,
  onCheckout,
}: {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  updateQuantity: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  cartTotal: number;
  savingsTotal: number;
  onCheckout: () => void;
}) {
  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 z-50 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      <div
        className={`fixed top-0 left-0 h-full w-full sm:w-96 bg-white z-50 shadow-2xl flex flex-col transform transition-transform duration-300`}
        style={{
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          fontFamily: "'Tajawal', sans-serif",
        }}
      >
        {/* Header */}
        <div className="bg-blue-600 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="font-bold text-lg">سلة الطلب</span>
            {cart.length > 0 && (
              <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                {cart.length} صنف
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium">السلة فارغة</p>
              <p className="text-xs text-center">أضف بعض الأدوية من الكتالوج لتبدأ طلبك</p>
            </div>
          ) : (
            cart.map((item) => {
              const hasDiscount = item.bonus && item.originalPrice !== undefined && item.originalPrice > item.price;
              return (
                <div key={item.medicineId} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{item.medicineName}</p>
                      <p className="text-xs text-slate-500">{item.genericName}</p>
                      {item.bonus && (
                        <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full mt-1 font-medium">
                          بونص: {item.bonus}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.medicineId)}
                      className="text-red-400 hover:text-red-600 transition-colors p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
                      <button
                        onClick={() => updateQuantity(item.medicineId, item.quantity - 1)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 transition-colors text-slate-600 font-bold text-sm"
                      >
                        −
                      </button>
                      <span className="px-3 text-sm font-bold text-slate-800 min-w-[2.5rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.medicineId, item.quantity + 1)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 transition-colors text-slate-600 font-bold text-sm"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right">
                      {hasDiscount ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-400 line-through">
                            {formatCurrency(item.originalPrice! * item.quantity)}
                          </span>
                          <span className="font-bold text-green-700">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      ) : (
                        <span className="font-bold text-blue-700">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">عدد الأصناف:</span>
              <span className="font-semibold">{cart.length} صنف</span>
            </div>
            {savingsTotal > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-600 font-medium">🎉 التوفير (البونصات):</span>
                <span className="font-bold text-green-600">- {formatCurrency(savingsTotal)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-slate-800 font-bold">الإجمالي:</span>
              <span className="text-xl font-black text-blue-700">{formatCurrency(cartTotal)}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={clearCart}
                className="flex-1 py-2.5 border border-slate-300 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                إفراغ السلة
              </button>
              <button
                onClick={onCheckout}
                className="flex-[2] py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-md"
              >
                تأكيد الطلب ✓
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Medicine Card Component
function MedicineCard({
  medicine,
  onAddToCart,
  isLoggedIn,
  onLoginPrompt,
  onViewDetails,
}: {
  medicine: Medicine;
  onAddToCart: (medicine: Medicine, qty: number) => void;
  isLoggedIn: boolean;
  onLoginPrompt: () => void;
  onViewDetails: (id: string) => void;
}) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const avgRating = getMedicineAverageRating(medicine.id);

  const handleAdd = () => {
    if (!isLoggedIn) { onLoginPrompt(); return; }
    onAddToCart(medicine, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all duration-300 group flex flex-col">
      {/* Image */}
      <div className="relative overflow-hidden h-40 bg-slate-100">
        <img
          src={medicine.imageUrl}
          alt={medicine.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/images/medicine-placeholder.png";
          }}
        />
        <div className="absolute top-2 right-2 flex flex-wrap gap-1">
          {medicine.categories.slice(0, 2).map(cat => (
            <span key={cat} className="bg-white/90 backdrop-blur-sm text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full border border-blue-200 shadow-sm">
              {cat}
            </span>
          ))}
          {medicine.categories.length > 2 && (
            <span className="bg-white/90 backdrop-blur-sm text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full border border-blue-200 shadow-sm">
              +{medicine.categories.length - 2}
            </span>
          )}
        </div>
        {medicine.bonus && (
          <div className="absolute top-2 left-2">
            <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
              🎁 {medicine.bonus}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-slate-900 text-sm leading-tight mb-0.5 line-clamp-2">
          {medicine.name}
        </h3>
        <p className="text-xs text-slate-400 italic mb-2">{medicine.genericName}</p>
        <p className="text-xs text-slate-500 mb-3 line-clamp-2 flex-1">{medicine.description}</p>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <RatingStars rating={avgRating} readonly size="sm" />
          <span className="text-xs text-slate-400">({medicine.ratings.length})</span>
        </div>

        {/* Price - original only */}
        <div className="mb-3">
          <span className="text-lg font-black text-blue-700">{formatCurrency(medicine.price)}</span>
          <span className="text-xs text-slate-400 mr-1">/ علبة</span>
        </div>

        {/* Quantity + Add + View Details */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden flex-shrink-0 bg-slate-50">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="px-2 py-1.5 hover:bg-slate-200 transition-colors text-slate-600 font-bold text-xs"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-12 text-center text-xs font-bold text-slate-800 bg-transparent outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                onClick={() => setQty(qty + 1)}
                className="px-2 py-1.5 hover:bg-slate-200 transition-colors text-slate-600 font-bold text-xs"
              >
                +
              </button>
            </div>
            <button
              onClick={handleAdd}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1 ${
                added
                  ? "bg-green-500 text-white"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
              }`}
            >
              {added ? "✓ أضيف!" : "+ أضف للسلة"}
            </button>
          </div>
          <button
            onClick={() => onViewDetails(medicine.id)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium text-center"
          >
            🔍 تفاصيل وتقييمات
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CatalogPage({ onNavigate }: CatalogPageProps) {
  const { currentUser, isLoggedIn, isAdmin } = useAuth();
  const { cart, addToCart, updateQuantity, removeFromCart, clearCart, cartTotal, savingsTotal, cartCount } = useCart();
  const [medicines, setMedicinesState] = useState(getMedicines());
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("الكل");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // ترتيب الأدوية بحيث الجديدة تظهر أولاً ثم الباقي أبجدياً
  const sortedMedicines = useMemo(() => {
    const copy = [...medicines];
    const newMeds = copy.filter(m => (m.viewCount || 0) < 2);
    const oldMeds = copy.filter(m => (m.viewCount || 0) >= 2);
    const sortByName = (a: Medicine, b: Medicine) => a.name.localeCompare(b.name, 'ar');
    newMeds.sort(sortByName);
    oldMeds.sort(sortByName);
    return [...newMeds, ...oldMeds];
  }, [medicines]);

  // زيادة viewCount للأدوية الجديدة بعد كل عرض
  useEffect(() => {
    const hasNew = medicines.some(m => (m.viewCount || 0) < 2);
    if (!hasNew) return;
    const updated = medicines.map(m => {
      if ((m.viewCount || 0) < 2) {
        return { ...m, viewCount: (m.viewCount || 0) + 1 };
      }
      return m;
    });
    setMedicines(updated);
    setMedicinesState(updated);
    setMedicines(updated);
  }, []);

  const filteredMedicines = useMemo(() => {
    return sortedMedicines.filter((m) => {
      const matchSearch =
        !search ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.genericName.toLowerCase().includes(search.toLowerCase()) ||
        m.categories.some(cat => cat.toLowerCase().includes(search.toLowerCase()));
      const matchCat = selectedCategory === "الكل" || m.categories.includes(selectedCategory);
      return matchSearch && matchCat;
    });
  }, [sortedMedicines, search, selectedCategory]);

  const handleAddToCart = useCallback(
    (medicine: Medicine, qty: number) => {
      addToCart(
        {
          medicineId: medicine.id,
          medicineName: medicine.name,
          genericName: medicine.genericName,
          price: medicine.price,
          bonus: medicine.bonus,
        },
        qty
      );
    },
    [addToCart]
  );

  const handleCheckout = () => {
    if (!isLoggedIn || !currentUser) {
      setCheckoutError("يجب تسجيل الدخول أولاً لإتمام الطلب");
      return;
    }
    if (cart.length === 0) return;

    const pharmacies = getPharmacies();
    const updated = pharmacies.map((p) =>
      p.id === currentUser.id ? { ...p, totalDebt: p.totalDebt + cartTotal } : p
    );
    setPharmacies(updated);

    const orders = getOrders();
    const newOrder = {
      id: generateId("ord"),
      pharmacyId: currentUser.id,
      pharmacyName: currentUser.pharmacyName,
      items: [...cart],
      total: cartTotal,
      timestamp: new Date().toISOString(),
      status: "pending" as const,
    };
    setOrders([...orders, newOrder]);

    // ✅ تحديث المخزون تلقائياً بعد الطلب
    updateStockAfterOrder(newOrder);

    clearCart();
    setIsCartOpen(false);
    setCheckoutSuccess(true);
    sendBrowserNotification(
      '📦 طلب جديد',
      `تم إرسال طلب بقيمة ${formatCurrency(cartTotal)} من ${currentUser.pharmacyName}`,
      '/vite.svg'
    );
    addNotification(`📦 تم إرسال طلب بقيمة ${formatCurrency(cartTotal)} من ${currentUser.pharmacyName}`, "success");
    setTimeout(() => setCheckoutSuccess(false), 4000);
  };

  const handleBarcodeDetected = (barcode: string) => {
    const found = medicines.find(m => m.barcode === barcode);
    if (found) {
      onNavigate('medicine-details', { id: found.id });
    } else {
      alert('لم يتم العثور على دواء بهذا الباركود');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'Tajawal', sans-serif" }}>
      {/* Barcode Scanner */}
      {showScanner && (
        <BarcodeScanner onDetected={handleBarcodeDetected} onClose={() => setShowScanner(false)} />
      )}

      {/* Cart Sidebar */}
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
        clearCart={clearCart}
        cartTotal={cartTotal}
        savingsTotal={savingsTotal}
        onCheckout={handleCheckout}
      />

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">تسجيل الدخول مطلوب</h3>
            <p className="text-sm text-slate-500 mb-5">يجب تسجيل الدخول لإضافة الأدوية إلى سلة الطلب</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="flex-1 py-2.5 border border-slate-300 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50"
              >
                إلغاء
              </button>
              <button
                onClick={() => { setShowLoginPrompt(false); onNavigate("login"); }}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700"
              >
                تسجيل الدخول
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Banner */}
      <div className="bg-gradient-to-l from-blue-700 via-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black mb-2">كتالوج الأدوية</h1>
              <p className="text-blue-100 text-sm sm:text-base">
                تصفح أكثر من {medicines.length} صنف دوائي بأفضل الأسعار وعروض البونص
              </p>
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-blue-100 text-xs">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  توصيل سريع لجميع المناطق
                </div>
                <div className="flex items-center gap-1.5 text-blue-100 text-xs">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                  عروض بونص حصرية
                </div>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap justify-center sm:justify-end">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center border border-white/20">
                <div className="text-2xl font-black">{medicines.length}+</div>
                <div className="text-xs text-blue-200">صنف دوائي</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center border border-white/20">
                <div className="text-2xl font-black">{CATEGORIES.length - 1}</div>
                <div className="text-xs text-blue-200">تصنيف</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="sticky top-16 bg-white border-b border-slate-200 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن دواء بالاسم التجاري، الجيني، أو التصنيف..."
                className="w-full px-4 py-2.5 pr-10 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-slate-50"
                dir="rtl"
              />
              <svg className="absolute right-3 top-3 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {search && (
                <button onClick={() => setSearch("")} className="absolute left-3 top-3 text-slate-400 hover:text-slate-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {/* Scanner Button */}
            {isLoggedIn && (
              <button
                onClick={() => setShowScanner(true)}
                className="flex items-center gap-2 bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7V5a2 2 0 012-2h2m10 0h2a2 2 0 012 2v2m0 10v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
                </svg>
                مسح باركود
              </button>
            )}
            {/* Cart Button (desktop) */}
            {isLoggedIn && !isAdmin && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="hidden sm:flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                السلة
                {cartCount > 0 && (
                  <span className="bg-white text-blue-700 text-xs font-black px-2 py-0.5 rounded-full">
                    {cartCount}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Category filters - متوافق مع الجوال */}
<div className="flex flex-wrap gap-1.5 mt-3 pb-1">
  {CATEGORIES.map((cat) => (
    <button
      key={cat}
      onClick={() => setSelectedCategory(cat)}
      className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
        selectedCategory === cat
          ? "bg-blue-600 text-white shadow-sm"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {cat}
    </button>
  ))}
</div>
        </div>
      </div>

      {/* Success toast */}
      {checkoutSuccess && (
        <div className="fixed top-20 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-bold">تم إرسال طلبك بنجاح! سيتم التواصل معك قريباً.</span>
        </div>
      )}

      {checkoutError && (
        <div className="fixed top-20 right-4 z-50 bg-red-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-bold">{checkoutError}</span>
          <button onClick={() => setCheckoutError("")} className="mr-2">✕</button>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Results info */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-slate-500">
            عرض <span className="font-bold text-slate-700">{filteredMedicines.length}</span> من أصل{" "}
            <span className="font-bold text-slate-700">{medicines.length}</span> صنف
            {selectedCategory !== "الكل" && (
              <span className="mr-1">
                في <span className="text-blue-600 font-bold">{selectedCategory}</span>
              </span>
            )}
          </p>
          {!isLoggedIn && (
            <button
              onClick={() => onNavigate("login")}
              className="text-sm text-blue-600 hover:underline font-medium flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              سجّل دخولك للطلب
            </button>
          )}
        </div>

        {filteredMedicines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="font-semibold text-slate-600">لا توجد نتائج</p>
            <p className="text-sm mt-1">جرب البحث بكلمات مختلفة أو تصفية مختلفة</p>
            <button
              onClick={() => { setSearch(""); setSelectedCategory("الكل"); }}
              className="mt-4 text-blue-600 text-sm font-medium hover:underline"
            >
              إعادة ضبط الفلاتر
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredMedicines.map((medicine) => (
              <MedicineCard
                key={medicine.id}
                medicine={medicine}
                onAddToCart={handleAddToCart}
                isLoggedIn={isLoggedIn && !isAdmin}
                onLoginPrompt={() => setShowLoginPrompt(true)}
                onViewDetails={(id) => onNavigate('medicine-details', { id })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Cart Bar (mobile) */}
      {isLoggedIn && !isAdmin && cartCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 sm:hidden">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-blue-600 text-white py-3.5 px-5 rounded-2xl shadow-xl flex items-center justify-between font-bold text-sm"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="bg-white text-blue-700 text-xs font-black px-2 py-0.5 rounded-full">{cartCount}</span>
              <span>عرض السلة</span>
            </div>
            <span className="font-black">{formatCurrency(cartTotal)}</span>
          </button>
        </div>
      )}
    </div>
  );
}