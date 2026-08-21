// ============================================================
// pages/LoginPage.tsx — Unified Login & Registration Page
// ============================================================
import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";

interface LoginPageProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export default function LoginPage({ onNavigate }: LoginPageProps) {
  const { login, register, isLoggedIn, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPwd, setShowLoginPwd] = useState(false);

  const [regData, setRegData] = useState({
    pharmacyName: "",
    username: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [showRegPwd, setShowRegPwd] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      if (isAdmin) onNavigate("admin");
      else onNavigate("catalog");
    }
  }, [isLoggedIn, isAdmin, onNavigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    if (!loginUsername.trim() || !loginPassword) {
      setLoginError("الرجاء إدخال اسم المستخدم وكلمة المرور");
      return;
    }
    setLoginLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const result = login(loginUsername, loginPassword);
    setLoginLoading(false);
    if (result.success) {
      if (result.isAdmin) onNavigate("admin");
      else onNavigate("catalog");
    } else {
      setLoginError(result.message);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess("");

    if (!regData.pharmacyName.trim()) { setRegError("الرجاء إدخال اسم الصيدلية"); return; }
    if (!regData.username.trim()) { setRegError("الرجاء إدخال اسم المستخدم"); return; }
    if (regData.username.trim().length < 3) { setRegError("اسم المستخدم يجب أن يكون 3 أحرف على الأقل"); return; }
    if (!regData.password) { setRegError("الرجاء إدخال كلمة المرور"); return; }
    if (regData.password.length < 6) { setRegError("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return; }
    if (regData.password !== regData.confirmPassword) { setRegError("كلمة المرور وتأكيدها غير متطابقتين"); return; }
    if (!regData.phone.trim()) { setRegError("الرجاء إدخال رقم الهاتف"); return; }

    setRegLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    const result = register({
      pharmacyName: regData.pharmacyName,
      username: regData.username,
      password: regData.password,
      phone: regData.phone,
      accountType: "pharmacy",
    });
    setRegLoading(false);

    if (result.success) {
      setRegSuccess(result.message);
      setTimeout(() => onNavigate("catalog"), 1200);
    } else {
      setRegError(result.message);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4"
      style={{ fontFamily: "'Tajawal', sans-serif" }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-xl mb-4">
            <span className="text-3xl">💊</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900">Novex Pharma</h1>
          <p className="text-slate-500 mt-1 text-sm">مستودع الأدوية والتوزيع</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => { setActiveTab("login"); setLoginError(""); }}
              className={`flex-1 py-4 text-sm font-bold transition-colors ${
                activeTab === "login"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              تسجيل الدخول
            </button>
            <button
              onClick={() => { setActiveTab("register"); setRegError(""); setRegSuccess(""); }}
              className={`flex-1 py-4 text-sm font-bold transition-colors ${
                activeTab === "register"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              إنشاء حساب جديد
            </button>
          </div>

          <div className="p-6">
            {/* LOGIN FORM */}
            {activeTab === "login" && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    اسم المستخدم
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="أدخل اسم المستخدم"
                      className="w-full px-4 py-3 pr-10 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-slate-50 transition-all"
                      dir="rtl"
                    />
                    <svg className="absolute right-3 top-3.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    كلمة المرور
                  </label>
                  <div className="relative">
                    <input
                      type={showLoginPwd ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="أدخل كلمة المرور"
                      className="w-full px-4 py-3 pr-10 pl-10 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-slate-50 transition-all"
                      dir="rtl"
                    />
                    <svg className="absolute right-3 top-3.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <button
                      type="button"
                      onClick={() => setShowLoginPwd(!showLoginPwd)}
                      className="absolute left-3 top-3.5 text-slate-400 hover:text-slate-600"
                    >
                      {showLoginPwd ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {loginError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loginLoading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      جاري التحقق...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      تسجيل الدخول
                    </>
                  )}
                </button>
              </form>
            )}

            {/* REGISTER FORM */}
            {activeTab === "register" && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    اسم الصيدلية <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={regData.pharmacyName}
                    onChange={(e) => setRegData({ ...regData, pharmacyName: e.target.value })}
                    placeholder="مثال: صيدلية البشرى"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-slate-50"
                    dir="rtl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      اسم المستخدم <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={regData.username}
                      onChange={(e) => setRegData({ ...regData, username: e.target.value })}
                      placeholder="username"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-slate-50"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      رقم الهاتف <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={regData.phone}
                      onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                      placeholder="05xxxxxxxx"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-slate-50"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    كلمة المرور <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPwd ? "text" : "password"}
                      value={regData.password}
                      onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                      placeholder="6 أحرف على الأقل"
                      className="w-full px-4 py-3 pl-10 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-slate-50"
                      dir="rtl"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPwd(!showRegPwd)}
                      className="absolute left-3 top-3.5 text-slate-400 hover:text-slate-600"
                    >
                      {showRegPwd ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    تأكيد كلمة المرور <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={regData.confirmPassword}
                    onChange={(e) => setRegData({ ...regData, confirmPassword: e.target.value })}
                    placeholder="أعد إدخال كلمة المرور"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-slate-50"
                    dir="rtl"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span>🏥</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-blue-800">حساب صيدلية</div>
                    <div className="text-xs text-blue-600">يتيح لك طلب الأدوية وإرسال الإيصالات</div>
                  </div>
                </div>

                {regError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {regError}
                  </div>
                )}

                {regSuccess && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {regSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {regLoading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      جاري إنشاء الحساب...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      إنشاء الحساب
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          © 2024 Novex Pharma — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
} 