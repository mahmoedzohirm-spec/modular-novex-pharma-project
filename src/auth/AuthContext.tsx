// ============================================================
// auth/AuthContext.tsx — Session Management & Access Control
// ============================================================
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  Pharmacy,
  getCurrentUser,
  setCurrentUser as saveCurrentUser,
  getPharmacies,
  setPharmacies,
  generateId,
  ADMIN_CREDENTIALS,
  STORAGE_KEYS,
} from "../config/data";

interface AuthContextType {
  currentUser: Pharmacy | null;
  isAdmin: boolean;
  isLoggedIn: boolean;
  login: (username: string, password: string) => { success: boolean; message: string; isAdmin: boolean };
  register: (data: RegisterData) => { success: boolean; message: string };
  logout: () => void;
  refreshUser: () => void;
}

export interface RegisterData {
  pharmacyName: string;
  username: string;
  password: string;
  phone: string;
  accountType: "pharmacy";
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode; }) {
  const [currentUser, setCurrentUser] = useState<Pharmacy | null>(getCurrentUser());

  const isAdmin = currentUser?.accountType === "admin" || currentUser?.username === "admin";
  const isLoggedIn = !!currentUser;

  const refreshUser = useCallback(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
  }, []);

  useEffect(() => {
    const handleStorage = () => refreshUser();
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [refreshUser]);

  const login = useCallback(
    (username: string, password: string): { success: boolean; message: string; isAdmin: boolean } => {
      // Check admin credentials
      if (
        username.trim() === ADMIN_CREDENTIALS.username &&
        password === ADMIN_CREDENTIALS.password
      ) {
        const adminUser: Pharmacy = {
          id: "admin-000",
          pharmacyName: "مدير النظام",
          username: "admin",
          password: "admin123",
          phone: "0500000000",
          accountType: "admin",
          totalDebt: 0,
          totalPaid: 0,
          registeredAt: new Date().toISOString(),
        };
        saveCurrentUser(adminUser);
        setCurrentUser(adminUser);
        return { success: true, message: "تم تسجيل الدخول كمدير النظام", isAdmin: true };
      }

      // Check pharmacy credentials
      const pharmacies = getPharmacies();
      const found = pharmacies.find(
        (p) => p.username.trim() === username.trim() && p.password === password
      );

      if (found) {
        saveCurrentUser(found);
        setCurrentUser(found);
        return { success: true, message: `مرحباً بك، ${found.pharmacyName}`, isAdmin: false };
      }

      return { success: false, message: "اسم المستخدم أو كلمة المرور غير صحيحة", isAdmin: false };
    },
    []
  );

  const register = useCallback((data: RegisterData): { success: boolean; message: string } => {
    const pharmacies = getPharmacies();

    // Check username uniqueness
    const exists = pharmacies.find(
      (p) => p.username.trim().toLowerCase() === data.username.trim().toLowerCase()
    );
    if (exists) {
      return { success: false, message: "اسم المستخدم مستخدم بالفعل، الرجاء اختيار اسم آخر" };
    }

    if (data.username.trim() === ADMIN_CREDENTIALS.username) {
      return { success: false, message: "اسم المستخدم محجوز، الرجاء اختيار اسم آخر" };
    }

    const newPharmacy: Pharmacy = {
      id: generateId("pharm"),
      pharmacyName: data.pharmacyName.trim(),
      username: data.username.trim(),
      password: data.password,
      phone: data.phone.trim(),
      accountType: "pharmacy",
      totalDebt: 0,
      totalPaid: 0,
      registeredAt: new Date().toISOString(),
    };

    setPharmacies([...pharmacies, newPharmacy]);
    saveCurrentUser(newPharmacy);
    setCurrentUser(newPharmacy);

    return { success: true, message: `تم إنشاء الحساب بنجاح! مرحباً بك، ${newPharmacy.pharmacyName}` };
  }, []);

  const logout = useCallback(() => {
    saveCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.CART);
    setCurrentUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ currentUser, isAdmin, isLoggedIn, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
