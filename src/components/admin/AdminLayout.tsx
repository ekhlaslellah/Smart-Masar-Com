/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { NavLink, Link, Routes, Route } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { establishAdminSession } from '../../services/apiService';
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
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isStaticHostOnly, setIsStaticHostOnly] = useState(false);
  const { backendConfig } = useApp();

  useEffect(() => {
    establishAdminSession(backendConfig.adminApiKey).then((res) => {
      if (!res.success && res.error && res.error.includes('تعذر إنشاء جلسة المسؤول')) {
        setIsStaticHostOnly(true);
      }
    });
  }, [backendConfig.adminApiKey]);

  const navItems = [
    { to: '/admin', labelAr: 'نظرة عامة', icon: <LayoutDashboard className="w-4 h-4" />, end: true },
    { to: '/admin/team', labelAr: 'إدارة الفريق والصور', icon: <Users className="w-4 h-4" /> },
    { to: '/admin/services', labelAr: 'إدارة الخدمات وصورها', icon: <Sparkles className="w-4 h-4" /> },
    { to: '/admin/pages', labelAr: 'صور الصفحات (Hero)', icon: <Layout className="w-4 h-4" /> },
    { to: '/admin/organization', labelAr: 'الهيكل التنظيمي', icon: <GitFork className="w-4 h-4" /> },
    { to: '/admin/jobs', labelAr: 'إدارة الوظائف', icon: <Briefcase className="w-4 h-4" /> },
    { to: '/admin/settings', labelAr: 'إعدادات الموقع والشعار', icon: <Settings className="w-4 h-4" /> },
  ];

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

        <Link
          to="/"
          className="text-xs bg-[#2563EB] hover:bg-[#1d4ed8] text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 shadow-2xs"
        >
          <span>الموقع العام</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
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

        {/* Sidebar Footer: Backend status & Return to public site */}
        <div className="p-4 border-t border-[#E2E8F0] space-y-3 bg-white">
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

          <Link
            to="/"
            className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1.5"
          >
            <span>معاينة الموقع العام</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isStaticHostOnly && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 leading-relaxed">
            <strong className="block mb-1">تنبيه معماري (وضع الاستضافة الثابتة HTML / CSS / JavaScript):</strong>
            يعمل الموقع العام حالياً بكفاءة كاملة مع القراءة المباشرة من Google Sheets عبر SheetDB دون أي مفاتيح سرية مكشوفة. لحفظ التعديلات الإدارية الدائمة أو رفع الصور إلى Google Drive دون كشف المفاتيح للجمهور، يلزم ربط رابط تطبيق الويب الخلفي المجاني (Google Apps Script Web App) في تبويب الإعدادات أو تشغيل خادم Node.js الخلفي.
          </div>
        )}

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
