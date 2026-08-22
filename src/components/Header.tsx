// ============================================================
// components/Header.tsx — Top Navigation Bar
// ============================================================
import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { getNotifications, setNotifications, formatDate } from "../config/data";

interface HeaderProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
  cartCount?: number;
  onOpenCart?: () => void;
  onOpenSidebar?: () => void;
  currentPage?: string;
}

export default function Header({
  onNavigate,
  cartCount = 0,
  onOpenCart,
  onOpenSidebar,
}: HeaderProps) {
  const { currentUser, isAdmin, isLoggedIn, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifState] = useState(getNotifications());

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    setNotifState(updated);
  };

  const handleLogout = () => {
    logout();
    onNavigate("catalog");
    setShowUserMenu(false);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Mobile menu button */}
          <button
            onClick={onOpenSidebar}
            className="sm:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo */}
          <button
            onClick={() => onNavigate("catalog")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <img
              src="/logo.png"
              alt="Novex Pharma"
              className="w-9 h-9 rounded-xl object-cover shadow-md"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                const parent = target.parentElement;
                if (parent) {
                  const fallback = document.createElement("div");
                  fallback.className =
                    "w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm";
                  fallback.textContent = "N";
                  parent.prepend(fallback);
                }
              }}
            />
            <div className="text-right hidden sm:block">
              <div className="font-bold text-slate-900 text-lg leading-none" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                Novex Pharma
              </div>
              <div className="text-xs text-slate-500 leading-none" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                مستودع الأدوية والتوزيع
              </div>
            </div>
          </button>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Cart button */}
            {isLoggedIn && !isAdmin && onOpenCart && (
              <button
                onClick={onOpenCart}
                className="relative p-2 rounded-lg text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </button>
            )}

            {/* Notifications */}
            {isLoggedIn && (
              <div className="relative">
                <button
                  onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
                  className="relative p-2 rounded-lg text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                      <span className="font-bold text-slate-800">الإشعارات</span>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">
                          تحديد الكل كمقروء
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-slate-500 text-sm">لا توجد إشعارات</div>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!n.read ? "bg-blue-50/50" : ""}`}>
                            <div className="flex items-start gap-2">
                              <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${n.type === "success" ? "bg-green-500" : n.type === "warning" ? "bg-amber-500" : "bg-blue-500"}`} />
                              <div>
                                <p className="text-sm text-slate-700">{n.message}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{formatDate(n.timestamp)}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User menu / Login button */}
            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${isAdmin ? "bg-slate-800" : "bg-blue-600"}`}>
                    {isAdmin ? "م" : currentUser?.pharmacyName?.[0] || "ص"}
                  </div>
                  <div className="hidden sm:block text-right">
                    <div className="text-xs font-semibold text-slate-800" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                      {currentUser?.pharmacyName}
                    </div>
                    <div className="text-xs text-slate-500" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                      {isAdmin ? "مدير النظام" : "صيدلية"}
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showUserMenu && (
                  <div className="absolute left-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 z-50 py-1" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                    {isAdmin && (
                      <button
                        onClick={() => { onNavigate("admin"); setShowUserMenu(false); }}
                        className="w-full text-right px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        لوحة التحكم
                      </button>
                    )}
                    {!isAdmin && (
                      <button
                        onClick={() => {
                          onNavigate("pharmacy-profile", { id: currentUser?.id || "" });
                          setShowUserMenu(false);
                        }}
                        className="w-full text-right px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        ملفي الشخصي
                      </button>
                    )}
                    <hr className="border-slate-100 my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-right px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      تسجيل الخروج
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => onNavigate("login")}
                className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                style={{ fontFamily: "'Tajawal', sans-serif" }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                تسجيل الدخول
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Click outside handler */}
      {(showNotifications || showUserMenu) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => { setShowNotifications(false); setShowUserMenu(false); }}
        />
      )}
    </header>
  );
}
