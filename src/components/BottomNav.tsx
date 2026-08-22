// ============================================================
// components/BottomNav.tsx — شريط التنقل السفلي للجوال
// ============================================================
import { useAuth } from "../auth/AuthContext";

interface BottomNavProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
  cartCount: number;
  onOpenCart: () => void;
  currentPage?: string;
}

export default function BottomNav({ onNavigate, cartCount, onOpenCart, currentPage }: BottomNavProps) {
  const { currentUser, isLoggedIn, isAdmin } = useAuth();

  // إذا لم يكن المستخدم مسجلاً، لا نعرض الشريط
  if (!isLoggedIn) return null;

  const navItems = [
    {
      id: "catalog",
      label: "الرئيسية",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2" />
        </svg>
      ),
      onClick: () => onNavigate("catalog"),
    },
    {
      id: "cart",
      label: "السلة",
      icon: (
        <div className="relative">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {cartCount > 9 ? "9+" : cartCount}
            </span>
          )}
        </div>
      ),
      onClick: onOpenCart,
    },
    ...(isAdmin
      ? [
          {
            id: "admin",
            label: "لوحة التحكم",
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            ),
            onClick: () => onNavigate("admin"),
          },
        ]
      : [
          {
            id: "profile",
            label: "ملفي",
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            ),
            onClick: () => onNavigate("pharmacy-profile", { id: currentUser?.id || "" }),
          },
        ]),
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg sm:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={item.onClick}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 transition-colors ${
                isActive ? "text-blue-600" : "text-slate-500 hover:text-blue-600"
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
