// ============================================================
// App.tsx — Main SPA Router & Layout Orchestrator
// Novex Pharma — مستودع الأدوية والتوزيع
// ============================================================
import { useState, useCallback, useEffect } from "react";
import { AuthProvider } from "./auth/AuthContext";
import { initializeStorage } from "./config/data";
import { useCart } from "./hooks/useCart";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import LoginPage from "./pages/LoginPage";
import CatalogPage from "./pages/CatalogPage";
import AdminPage from "./pages/AdminPage";
import PharmacyProfilePage from "./pages/PharmacyProfilePage";
import MedicineDetailsPage from "./pages/MedicineDetailsPage";

initializeStorage();

type Page = "catalog" | "login" | "admin" | "pharmacy-profile" | "medicine-details";

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>("catalog");
  const [pageParams, setPageParams] = useState<Record<string, string>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { cartCount } = useCart();

  const navigate = useCallback((page: string, params?: Record<string, string>) => {
    setCurrentPage(page as Page);
    setPageParams(params || {});
    setIsSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsSidebarOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const isFullscreenPage = currentPage === "login";

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl" lang="ar">
      {!isFullscreenPage && (
        <>
          <Header
            onNavigate={navigate}
            cartCount={cartCount}
            onOpenSidebar={() => setIsSidebarOpen(true)}
          />
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            onNavigate={navigate}
            currentPage={currentPage}
          />
        </>
      )}

      {currentPage === "login" && <LoginPage onNavigate={navigate} />}
      {currentPage === "catalog" && <CatalogPage onNavigate={navigate} />}
      {currentPage === "admin" && <AdminPage onNavigate={navigate} />}
      {currentPage === "pharmacy-profile" && (
        <PharmacyProfilePage onNavigate={navigate} params={pageParams} />
      )}
      {currentPage === "medicine-details" && (
        <MedicineDetailsPage onNavigate={navigate} params={pageParams} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}