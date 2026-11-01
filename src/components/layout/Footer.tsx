/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Logo } from '../common/Logo';
import {
  Mail,
  Phone,
  MapPin,
  ShieldAlert,
  Sparkles,
  Clock,
} from 'lucide-react';

export const Footer: React.FC = () => {
  const { profile } = useApp();

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
              صفحات الموقع
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
                  فرص العمل والشواغر الوظيفية
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#00D2FF] transition-colors">
                  تواصل معنا
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Services & Solutions */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white tracking-wide border-b border-[#1E3A8A] pb-2">
              خدماتنا والحلول الذكية
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
              <li>
                <Link to="/services" className="hover:text-[#00D2FF] transition-colors flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#00D2FF] shrink-0" />
                  <span>حلول الذكاء الاصطناعي وتعلم الآلة</span>
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-[#00D2FF] transition-colors flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#00D2FF] shrink-0" />
                  <span>تطوير البرمجيات والمنصات السحابية</span>
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-[#00D2FF] transition-colors flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#00D2FF] shrink-0" />
                  <span>استشارات التحول الرقمي المؤسسي</span>
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-[#00D2FF] transition-colors flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#00D2FF] shrink-0" />
                  <span>أتمتة العمليات والإجراءات الذكية</span>
                </Link>
              </li>
              <li>
                <Link to="/careers" className="hover:text-[#00D2FF] transition-colors flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#00D2FF] shrink-0" />
                  <span>بوابة الاستقطاب والفرص الوظيفية</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Headquarters */}
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
                <a href={`mailto:${profile.email}`} className="hover:text-[#00D2FF] transition-colors" dir="ltr">
                  {profile.email}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#00D2FF] shrink-0" />
                <a href={`tel:${profile.phone}`} className="hover:text-[#00D2FF] transition-colors" dir="ltr">
                  {profile.phone}
                </a>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#00D2FF] shrink-0 mt-0.5" />
                <span>{profile.workingHoursAr}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-[#1E3A8A] flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <div>
            جميع الحقوق محفوظة &copy; {new Date().getFullYear()} شركة سمارت مسار (Smart Masar) — مشروع تعليمي تجريبي.
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span>{profile.taglineAr}</span>
            <span>·</span>
            <span dir="ltr">{profile.taglineEn}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
