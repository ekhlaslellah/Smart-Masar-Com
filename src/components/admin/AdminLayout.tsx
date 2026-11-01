/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { NavLink, Link, Routes, Route } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  establishAdminSession,
  verifyAdminKeyOnServer,
  logoutAdminSession,
} from '../../services/apiService';
import { Logo } from '../common/Logo';
import { AdminOverview } from './AdminOverview';
import { AdminTeam } from './AdminTeam';
import { AdminOrg } from './AdminOrg';
import { AdminJobs } from './AdminJobs';
import { AdminServices } from './AdminServices';
import { AdminPages } from './AdminPages';
import { AdminSettings } from './AdminSettings';
import {
  LayoutDashboard,
  Users,
  GitFork,
  Briefcase,
  Settings,
  ArrowRight,
  Menu,
  X,
  Database,
  Sparkles,
  Layout,
  Lock,
  KeyRound,
  LogOut,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [authStatus, setAuthStatus] = useState<'checking' | 'unauthenticated' | 'authenticated'>('checking');
  const [loginKeyInput, setLoginKeyInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { backendConfig, setBackendConfig } = useApp();

  useEffect(() => {
    let mounted = true;
    establishAdminSession(backendConfig.adminApiKey).then((res) => {
      if (!mounted) return;
      if (res.authenticated) {
        setAuthStatus('authenticated');
      } else {
        setAuthStatus('unauthenticated');
      }
    });
    return () => {
      mounted = false;
    };
  }, [backendConfig.adminApiKey]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedKey = loginKeyInput.trim();
    if (!trimmedKey) {
      setLoginError('يرجى إدخال مفتاح صلاحية المسؤول للمتابعة.');
      return;
    }

    setIsVerifying(true);
    setLoginError('');
    const result = await verifyAdminKeyOnServer(trimmedKey);
    setIsVerifying(false);

    if (result.authenticated) {
      setBackendConfig({
        ...backendConfig,
        adminApiKey: trimmedKey,
        ...(result.config
          ? {
              webAppUrl: result.config.webAppUrl || backendConfig.webAppUrl,
              sheetDbUrl: result.config.sheetDbUrl || backendConfig.sheetDbUrl,
              driveFolderId: result.config.driveFolderId || backendConfig.driveFolderId,
              lastSyncTime: result.config.lastSyncTime || backendConfig.lastSyncTime,
            }
          : {}),
      });
      setLoginKeyInput('');
      setAuthStatus('authenticated');
    } else {
      setLoginError(result.error || 'مفتاح صلاحية المسؤول غير صحيح. يرجى التحقق والمحاولة مجدداً.');
    }
  };

  const handleAdminLogout = async () => {
    await logoutAdminSession();
    setBackendConfig({
      ...backendConfig,
      adminApiKey: '',
    });
    setAuthStatus('unauthenticated');
  };

  const navItems = [
    { to: '/admin', labelAr: 'نظرة عامة', icon: <LayoutDashboard className="w-4 h-4" />, end: true },
    { to: '/admin/team', labelAr: 'إدارة الفريق والصور', icon: <Users className="w-4 h-4" /> },
    { to: '/admin/services', labelAr: 'إدارة الخدمات وصورها', icon: <Sparkles className="w-4 h-4" /> },
    { to: '/admin/pages', labelAr: 'صور الصفحات (Hero)', icon: <Layout className="w-4 h-4" /> },
    { to: '/admin/organization', labelAr: 'الهيكل التنظيمي', icon: <GitFork className="w-4 h-4" /> },
    { to: '/admin/jobs', labelAr: 'إدارة الوظائف', icon: <Briefcase className="w-4 h-4" /> },
    { to: '/admin/settings', labelAr: 'إعدادات الموقع والشعار', icon: <Settings className="w-4 h-4" /> },
  ];

  if (authStatus === 'checking') {
    return (
      <div dir="rtl" className="min-h-screen bg-[#0A192F] text-white flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#1E3A8A] border border-[#00D2FF]/40 flex items-center justify-center mx-auto animate-pulse">
            <Lock className="w-6 h-6 text-[#00D2FF]" />
          </div>
          <p className="text-sm font-bold text-slate-200">جاري التحقق من جلسة صلاحيات الإدارة...</p>
        </div>
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-gradient-to-br from-[#0A192F] via-[#0F2547] to-[#1E3A8A] text-white flex flex-col justify-between p-4 sm:p-8"
      >
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <Logo size="md" variant="dark" />
          <Link
            to="/"
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <span>العودة إلى الموقع العام</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="max-w-md w-full mx-auto bg-white text-[#0A192F] rounded-3xl shadow-2xl border border-[#CBD5E1] overflow-hidden my-8">
          <div className="bg-[#0A192F] text-white p-6 border-b border-[#1E3A8A] text-right">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1E3A8A] border border-[#00D2FF]/40 text-[#00D2FF] text-[11px] font-bold mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>منطقة محمية بالمصادقة • Restricted Access</span>
            </div>
            <h1 className="text-xl font-black text-white">
              بوابة دخول الإدارة — Smart Masar
            </h1>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              يرجى إدخال مفتاح صلاحية المسؤول للتحقق من الهوية والوصول إلى لوحة إدارة المحتوى والهيكل التنظيمي.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="p-6 space-y-5 text-right">
            {loginError && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-bold flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="admin-access-key-input"
                className="block text-xs font-bold text-[#0A192F] mb-2"
              >
                مفتاح صلاحية المسؤول (Admin Access Key) *
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-access-key-input"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={loginKeyInput}
                  onChange={(e) => setLoginKeyInput(e.target.value)}
                  placeholder="أدخل مفتاح صلاحية المسؤول..."
                  className="w-full pr-10 pl-4 py-3 text-xs rounded-xl border border-[#CBD5E1] bg-[#F0F6FD] focus:bg-white focus:outline-none focus:border-[#2563EB] font-mono"
                  dir="ltr"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3 px-5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4 text-[#00D2FF]" />
              <span>{isVerifying ? 'جاري التحقق من الصلاحية...' : 'تسجيل الدخول إلى لوحة الإدارة'}</span>
            </button>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>جلسة محمية عبر الخادم (HttpOnly Session)</span>
              <Link to="/" className="font-bold text-[#2563EB] hover:underline">
                العودة للرئيسية
              </Link>
            </div>
          </form>
        </div>

        <div className="text-center text-xs text-slate-400">
          Smart Masar Administration Portal &copy; {new Date().getFullYear()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#142B4F] flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-white border-b border-[#E2E8F0] p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-1.5 rounded-lg bg-[#F5F8FC] border border-[#CBD5E1] text-[#142B4F]"
            aria-label={mobileSidebarOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="font-bold text-sm">لوحة الإدارة — سمارت مسار</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAdminLogout}
            className="text-xs bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>خروج</span>
          </button>
          <Link
            to="/"
            className="text-xs bg-[#2563EB] hover:bg-[#1d4ed8] text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 shadow-2xs"
          >
            <span>الموقع العام</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Sidebar (Desktop + Mobile Drawer) */}
      <aside
        className={`fixed md:sticky top-0 right-0 z-40 h-screen w-72 bg-[#F5F8FC] text-[#142B4F] border-l border-[#CBD5E1] flex flex-col justify-between transition-transform duration-200 md:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
            <Logo size="sm" variant="light" showTagline={false} />
            <span className="text-[10px] font-mono font-bold bg-[#F5F8FC] text-[#2563EB] border border-[#CBD5E1] px-2 py-0.5 rounded">
              ADMIN
            </span>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1.5 text-right">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileSidebarOpen(false)}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#2563EB] border border-[#CBD5E1] shadow-xs'
                      : 'text-slate-600 hover:bg-white hover:text-[#142B4F]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={isActive ? 'text-[#2563EB]' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span>{item.labelAr}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer: Backend status, Logout & Return to public site */}
        <div className="p-4 border-t border-[#E2E8F0] space-y-2.5 bg-white">
          <div className="p-2.5 bg-[#F5F8FC] rounded-xl border border-[#CBD5E1] text-[11px] space-y-1 text-right">
            <div className="flex items-center justify-between font-bold">
              <span className="text-slate-600 flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>التخزين السحابي:</span>
              </span>
              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded text-[10px]">
                Drive + SheetDB
              </span>
            </div>
            {backendConfig.lastSyncTime && (
              <p className="text-[10px] text-slate-400">
                آخر مزامنة: {backendConfig.lastSyncTime}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleAdminLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>تسجيل الخروج من الإدارة</span>
          </button>

          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#142B4F] hover:bg-[#2563EB] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            <span>العودة إلى الموقع العام</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </aside>

      {/* Main Admin Content Area */}
      <main className="flex-1 p-4 sm:p-8 lg:p-10 max-w-6xl mx-auto w-full bg-white">
        {/* Top Breadcrumb Bar */}
        <div className="hidden md:flex items-center justify-between pb-6 mb-8 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>لوحة الإدارة والتحكم</span>
            <span>/</span>
            <span className="font-bold text-[#142B4F]">Smart Masar Admin</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1.5"
            >
              <span>معاينة الموقع العام</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Admin Nested Routes */}
        <Routes>
          <Route path="/" element={<AdminOverview />} />
          <Route path="/team" element={<AdminTeam />} />
          <Route path="/services" element={<AdminServices />} />
          <Route path="/pages" element={<AdminPages />} />
          <Route path="/organization" element={<AdminOrg />} />
          <Route path="/jobs" element={<AdminJobs />} />
          <Route path="/settings" element={<AdminSettings />} />
        </Routes>
      </main>
    </div>
  );
};
