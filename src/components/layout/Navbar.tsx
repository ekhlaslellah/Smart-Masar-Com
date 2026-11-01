/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Logo } from '../common/Logo';
import { StaticExportModal } from '../common/StaticExportModal';
import {
  Menu,
  X,
  Briefcase,
  Users,
  GitFork,
  Sparkles,
  Info,
  PhoneCall,
  Home,
  ChevronLeft,
  Download,
  FolderArchive,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileDrawerOpen]);

  const navItems = [
    { to: '/', labelAr: 'الرئيسية', icon: Home, desc: 'البوابة التقنية والتعريفية' },
    { to: '/about', labelAr: 'من نحن', icon: Info, desc: 'الرؤية، الرسالة، والقيم' },
    { to: '/services', labelAr: 'خدماتنا', icon: Sparkles, desc: 'حلول الذكاء والبرمجيات' },
    { to: '/team', labelAr: 'فريق العمل', icon: Users, desc: 'الكوادر المؤسسية والخبرات' },
    { to: '/organization', labelAr: 'الهيكل التنظيمي', icon: GitFork, desc: 'المخطط الهرمي التفاعلي' },
    { to: '/careers', labelAr: 'الوظائف', icon: Briefcase, desc: 'شاغر محاسب عام والتقديم' },
    { to: '/contact', labelAr: 'تواصل معنا', icon: PhoneCall, desc: 'المقر وقنوات الاتصال' },
  ];

  return (
    <>
      {/* 
        PREMIUM DEEP NAVY HEADER:
        Compact mobile header with only the company logo and menu button.
        Desktop navigation links on xl screens. Admin Dashboard is strictly separated from public navigation.
      */}
      <header className="sticky top-0 z-40 bg-[#0A192F] text-white border-b border-[#1E3A8A]/70 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
            {/* Brand Zone with Approved Smart Masar Logo */}
            <Link
              to="/"
              className="flex items-center cursor-pointer text-right focus:outline-none transition-transform hover:opacity-95 shrink-0"
              aria-label="الانتقال إلى الصفحة الرئيسية - Smart Masar"
            >
              <Logo size="md" variant="dark" />
            </Link>

            {/* Desktop Navigation Links */}
            <nav
              aria-label="التنقل الرئيسي المكتبي"
              className="hidden xl:flex items-center gap-1.5"
            >
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={`px-3 py-2 text-xs 2xl:text-sm font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[#2563EB] text-white border border-[#00D2FF]/50 shadow-[0_0_14px_rgba(0,210,255,0.25)]'
                        : 'text-slate-200 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#00D2FF]' : 'text-slate-400'}`} />
                    <span>{item.labelAr}</span>
                  </NavLink>
                );
              })}

              <button
                type="button"
                onClick={() => setExportModalOpen(true)}
                className="mr-2 px-3 py-2 text-xs font-bold rounded-xl bg-[#13284C] hover:bg-[#1E3A8A] text-[#00D2FF] border border-[#00D2FF]/40 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                title="تحميل ملفات النشر للاستضافة الخارجية (ZIP / HTML)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ملفات النشر (ZIP)</span>
              </button>
            </nav>

            {/* Mobile Drawer Trigger (Hamburger Button Only) */}
            <div className="flex items-center xl:hidden">
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                className="w-11 h-11 flex items-center justify-center text-white bg-[#13284C] hover:bg-[#1E3A8A] rounded-xl transition-colors cursor-pointer border border-[#00D2FF]/30 shadow-xs"
                aria-label="فتح القائمة الجانبية"
              >
                <Menu className="w-6 h-6 text-[#00D2FF]" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 
        POLISHED RIGHT-SIDE NAVIGATION DRAWER:
        Smooth slide-over drawer from right with company branding, active highlight,
        card-style links, and backdrop overlay.
      */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 xl:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Container */}
          <div
            dir="rtl"
            className="fixed top-0 bottom-0 right-0 w-[85%] max-w-[340px] bg-[#0A192F] text-white shadow-2xl flex flex-col justify-between border-l border-[#1E3A8A] animate-in slide-in-from-right duration-300"
          >
            {/* Top Branding Header */}
            <div>
              <div className="p-4 bg-gradient-to-l from-[#1E3A8A] to-[#0A192F] border-b border-[#00D2FF]/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Logo size="sm" variant="dark" />
                </div>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#00D2FF]/10 text-[#00D2FF] hover:bg-[#00D2FF] hover:text-[#0A192F] flex items-center justify-center transition-colors border border-[#00D2FF]/40 cursor-pointer"
                  aria-label="إغلاق القائمة"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Actions Bar */}
              <div className="p-3 bg-[#0D1F3D] border-b border-[#1E3A8A] space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/careers"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-[#2563EB] text-white text-[11px] font-bold shadow-xs hover:bg-[#1D4ED8] transition-colors"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-[#00D2FF]" />
                    <span>شاغر المحاسب</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setMobileDrawerOpen(false);
                      setExportModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-[#1E3A8A] text-[#00D2FF] text-[11px] font-bold border border-[#00D2FF]/30 hover:bg-[#2563EB] hover:text-white transition-colors cursor-pointer"
                  >
                    <FolderArchive className="w-3.5 h-3.5" />
                    <span>حزمة النشر (ZIP)</span>
                  </button>
                </div>

                <a
                  href="/api/download-static-zip"
                  download="smart-masar-static-hosting.zip"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-[#14284B] text-[#00D2FF] text-[11px] font-bold border border-[#00D2FF]/20 hover:bg-[#1E3A8A] transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تحميل ملفات الاستضافة الجاهزة (ZIP)</span>
                </a>
              </div>

              {/* Navigation Links list */}
              <div className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-220px)]">
                <p className="text-[11px] font-bold text-slate-400 px-2 py-1">
                  صفحات المنصة والتنقل:
                </p>
                {navItems.map((item) => {
                  const isActive = location.pathname === item.to;
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileDrawerOpen(false)}
                      className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                        isActive
                          ? 'bg-[#1E3A8A] text-white border border-[#00D2FF] shadow-[0_0_15px_rgba(0,210,255,0.25)]'
                          : 'bg-[#0D1F3D]/60 text-slate-200 hover:bg-[#1E3A8A]/50 border border-[#1E3A8A]/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            isActive
                              ? 'bg-[#00D2FF] text-[#0A192F]'
                              : 'bg-[#1E3A8A]/60 text-[#00D2FF]'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className={`text-xs font-black ${isActive ? 'text-[#00D2FF]' : 'text-white'}`}>
                            {item.labelAr}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {item.desc}
                          </div>
                        </div>
                      </div>
                      <ChevronLeft className={`w-4 h-4 ${isActive ? 'text-[#00D2FF]' : 'text-slate-500'}`} />
                    </NavLink>
                  );
                })}
              </div>
            </div>

            {/* Bottom Drawer Info */}
            <div className="p-4 bg-[#071324] border-t border-[#1E3A8A] text-center text-xs text-slate-400">
              <p className="font-bold text-white mb-0.5">Smart Masar Technology</p>
              <p className="text-[10px] text-[#00D2FF]">نبتكر اليوم لنصنع فرص الغد</p>
            </div>
          </div>
        </div>
      )}

      {/* Static Hosting & Export Modal */}
      <StaticExportModal isOpen={exportModalOpen} onClose={() => setExportModalOpen(false)} />
    </>
  );
};
