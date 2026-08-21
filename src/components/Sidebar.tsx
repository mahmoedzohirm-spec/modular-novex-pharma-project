// ============================================================
// components/Sidebar.tsx — Mobile Slide-out Drawer
// ============================================================
import { useAuth } from "../auth/AuthContext";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string, params?: Record<string, string>) => void;
  currentPage: string;
}

export default function Sidebar({ isOpen, onClose, onNavigate, currentPage }: SidebarProps) {
  const { currentUser, isAdmin, isLoggedIn, logout } = useAuth();

  const navItems = [
    { id: "catalog", label: "كتالوج الأدوية", icon: "💊" },
    ...(isLoggedIn && !isAdmin
      ? [
          {
            id: "pharmacy-profile",
            label: "ملفي الشخصي",
            icon: "👤",
            params: { id: currentUser?.id || "" },
          },
        ]
      : []),
    ...(isAdmin
      ? [{ id: "admin", label: "لوحة التحكم", icon: "📊" }]
      : []),
  ];

  const handleNav = (id: string, params?: Record<string, string>) => {
    onNavigate(id, params);
    onClose();
  };

  const handleLogout = () => {
    logout();
    onNavigate("catalog");
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 sm:hidden ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-white z-50 shadow-2xl transform transition-transform duration-300 sm:hidden flex flex-col`}
        style={{
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          fontFamily: "'Tajawal', sans-serif",
        }}
      >
        {/* Header */}
        <div className="bg-blue-600 px-5 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Novex Pharma"
              className="w-9 h-9 rounded-xl object-cover"
            />
            <div>
              <div className="text-white font-bold text-lg">Novex Pharma</div>
              <div className="text-blue-100 text-xs">مستودع الأدوية والتوزيع</div>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User info */}
        {isLoggedIn && (
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${isAdmin ? "bg-slate-800" : "bg-blue-600"}`}>
                {isAdmin ? "م" : currentUser?.pharmacyName?.[0] || "ص"}
              </div>
              <div>
                <div className="font-semibold text-slate-800 text-sm">{currentUser?.pharmacyName}</div>
                <div className="text-xs text-slate-500">{isAdmin ? "مدير النظام" : `@${currentUser?.username}`}</div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id, item.params)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-colors text-right ${
                currentPage === item.id
                  ? "bg-blue-600 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-slate-200">
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="font-medium text-sm">تسجيل الخروج</span>
            </button>
          ) : (
            <button
              onClick={() => handleNav("login")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span className="font-medium text-sm">تسجيل الدخول</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}