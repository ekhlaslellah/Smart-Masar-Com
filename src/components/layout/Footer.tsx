/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Logo } from '../common/Logo';
import { StaticExportModal } from '../common/StaticExportModal';
import {
  Mail,
  Phone,
  MapPin,
  ShieldAlert,
  Settings,
  ArrowUpRight,
  FolderArchive,
  FileCode2,
} from 'lucide-react';

export const Footer: React.FC = () => {
  const { profile } = useApp();
  const [exportModalOpen, setExportModalOpen] = useState(false);

  return (
    <footer className="bg-[#0A192F] text-white border-t border-[#1E3A8A] mt-auto">
      {/* Educational Disclaimer Banner */}
      <div className="bg-[#071324] border-b border-[#1E3A8A] py-3.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 text-xs sm:text-sm text-slate-300 text-center">
          <ShieldAlert className="w-4 h-4 text-[#00D2FF] shrink-0" />
          <span>
            <strong className="text-white">مشروع تعليمي وتدريبي:</strong> شركة سمارت مسار (Smart Masar) هي شركة افتراضية لأغراض التدريب والتطوير في تكنولوجيا الموارد البشرية، الاستقطاب الرقمي، والهياكل التنظيمية.
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10 text-right">
          {/* Col 1: Brand & Tagline */}
          <div className="space-y-4">
            <Logo size="md" variant="dark" showTagline={true} />
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {profile.aboutDescriptionAr}
            </p>
            <div className="inline-block px-3 py-1 bg-[#1E3A8A]/50 border border-[#00D2FF]/40 text-[#00D2FF] text-xs font-bold rounded-lg shadow-xs">
              {profile.taglineAr}
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white tracking-wide border-b border-[#1E3A8A] pb-2">
              صفحات المنصة والتنقل
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
              <li>
                <Link to="/" className="hover:text-[#00D2FF] transition-colors">
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#00D2FF] transition-colors">
                  من نحن ورؤيتنا
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-[#00D2FF] transition-colors">
                  خدماتنا وحلول الذكاء الاصطناعي
                </Link>
              </li>
              <li>
                <Link to="/team" className="hover:text-[#00D2FF] transition-colors">
                  فريق العمل والكوادر
                </Link>
              </li>
              <li>
                <Link to="/organization" className="hover:text-[#00D2FF] transition-colors">
                  الهيكل التنظيمي التفاعلي
                </Link>
              </li>
              <li>
                <Link to="/careers" className="hover:text-[#00D2FF] transition-colors">
                  فرص العمل وشاغر المحاسب
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#00D2FF] transition-colors">
                  تواصل معنا
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact & Headquarters */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white tracking-wide border-b border-[#1E3A8A] pb-2">
              المقر وقنوات الاتصال
            </h4>
            <div className="space-y-3 text-xs sm:text-sm text-slate-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#00D2FF] shrink-0 mt-0.5" />
                <span>{profile.locationAr}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#00D2FF] shrink-0" />
                <span dir="ltr">{profile.email}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#00D2FF] shrink-0" />
                <span dir="ltr">{profile.phone}</span>
              </div>
            </div>
          </div>

          {/* Col 4: Static Hosting Package & Separated Admin Link */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white tracking-wide border-b border-[#1E3A8A] pb-2">
              حزمة النشر والاستضافة الخارجية
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              تحميل النسخة الإنتاجية الجاهزة للرفع على أي استضافة تدعم HTML وCSS وJavaScript بدون الحاجة إلى Google Cloud Billing.
            </p>
            <button
              type="button"
              onClick={() => setExportModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-lg transition-colors shadow-md border border-[#00D2FF]/40 w-full cursor-pointer"
            >
              <FolderArchive className="w-4 h-4 text-[#00D2FF]" />
              <span>حزمة النشر الجاهزة (ZIP + README)</span>
            </button>
            <a
              href="/api/download-html"
              download="smart-masar.html"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#10203B] hover:bg-[#1E3A8A] text-[#00D2FF] text-xs font-bold rounded-lg transition-colors border border-[#00D2FF]/30 w-full"
            >
              <FileCode2 className="w-4 h-4" />
              <span>تحميل ملف HTML المستقل الموحد</span>
            </a>
            <div className="pt-1 border-t border-[#1E3A8A]/60">
              <Link
                to="/admin"
                className="inline-flex items-center justify-center gap-1.5 text-[11px] text-slate-400 hover:text-[#00D2FF] transition-colors w-full py-1"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>بوابة الإدارة المستقلة (/admin)</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-[#1E3A8A] flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <div>
            جميع الحقوق محفوظة &copy; {new Date().getFullYear()} شركة سمارت مسار (Smart Masar) — مشروع تعليمي تجريبي.
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Arial Typography</span>
            <span>·</span>
            <span>Multi-Page Architecture</span>
            <span>·</span>
            <span dir="ltr">Road S Identity</span>
          </div>
        </div>
      </div>

      <StaticExportModal isOpen={exportModalOpen} onClose={() => setExportModalOpen(false)} />
    </footer>
  );
};
