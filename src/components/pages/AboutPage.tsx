/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeroImage } from '../common/PageHeroImage';
import {
  Compass,
  Target,
  Sparkles,
  ShieldCheck,
  Users,
  TrendingUp,
  Lightbulb,
  Building2,
  ShieldAlert,
  ArrowLeft,
  ChevronLeft,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { profile } = useApp();

  const getValueIcon = (name: string) => {
    switch (name) {
      case 'Lightbulb':
        return <Lightbulb className="w-5 h-5 text-[#2563EB]" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5 text-[#2563EB]" />;
      case 'Users':
        return <Users className="w-5 h-5 text-[#7C5CDE]" />;
      case 'TrendingUp':
        return <TrendingUp className="w-5 h-5 text-[#00D2FF]" />;
      default:
        return <Sparkles className="w-5 h-5 text-[#2563EB]" />;
    }
  };

  return (
    <div className="space-y-8 sm:space-y-12 text-right">
      {/* 
        Visual Header Banner: Deep Navy with glowing path accents & Breadcrumbs
      */}
      <section className="bg-gradient-to-l from-[#0A192F] via-[#0E2347] to-[#1E3A8A] text-white py-10 sm:py-14 border-b border-[#1E3A8A] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-3">
            <Link to="/" className="hover:text-[#00D2FF] transition-colors">
              الرئيسية
            </Link>
            <ChevronLeft className="w-3.5 h-3.5 text-[#00D2FF]" />
            <span className="text-[#00D2FF]">عن الشركة (من نحن)</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E3A8A]/70 border border-[#00D2FF]/30 text-[#00D2FF] text-xs font-bold shadow-xs">
                <Building2 className="w-3.5 h-3.5" />
                <span>هوية سمارت مسار ورسالتها</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                نبتكر الحلول الذكية لنصنع آفاق الغد
              </h1>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                {profile.aboutDescriptionAr}
              </p>
            </div>

            <PageHeroImage pageId="page-about" />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
        {/* Educational Notice Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#BFDBFE] shadow-sm flex items-start gap-3.5 text-xs text-[#0A192F]">
          <ShieldAlert className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-bold text-[#2563EB]">تنويه إيضاحي للمشروع التعليمي:</strong> شركة سمارت مسار (Smart Masar) هي شركة افتراضية لأغراض التدريب والتطوير في تكنولوجيا الموارد البشرية، الاستقطاب الرقمي، وبناء الهياكل التنظيمية للشركات التكنولوجية. لا تضم الشركة شركاء أو اعتمادات تجارية سابقة مفبركة، والهدف هو توفير بيئة تجريبية حية ومكتملة المزايا.
          </div>
        </div>

        {/* Vision & Mission Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Vision */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#00D2FF] flex items-center justify-center text-white mb-5 shadow-md">
              <Compass className="w-6 h-6" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0A192F] mb-3">
              رؤيتنا (Our Vision)
            </h2>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-semibold">
              "{profile.visionAr}"
            </p>
          </div>

          {/* Mission */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#7C5CDE] to-[#2563EB] flex items-center justify-center text-white mb-5 shadow-md">
              <Target className="w-6 h-6" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0A192F] mb-3">
              رسالتنا (Our Mission)
            </h2>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-semibold">
              "{profile.missionAr}"
            </p>
          </div>
        </div>

        {/* Core Values Section */}
        <div className="space-y-6">
          <div>
            <span className="text-xs font-bold text-[#2563EB] tracking-wide block mb-1">
              المبادئ التوجيهية
            </span>
            <h2 className="text-2xl font-bold text-[#0A192F]">
              قيمنا الجوهرية (Core Values)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {profile.valuesAr.map((val, idx) => (
              <div
                key={idx}
                className="glass-card rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-11 h-11 rounded-xl bg-[#EBF4FE] border border-[#BFDBFE] flex items-center justify-center mb-4">
                  {getValueIcon(val.icon)}
                </div>
                <h3 className="text-base font-bold text-[#0A192F] mb-2">
                  {val.titleAr}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {val.descriptionAr}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Quick Strip */}
        <div className="p-6 rounded-2xl bg-white border border-[#CBD5E1] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-[#0A192F]">تعرف على الكوادر التنظيمية والخدمات</h3>
            <p className="text-xs text-slate-500">استكشف بطاقات أعضاء الفريق، الهيكل الإداري، والخدمات التقنية.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/services"
              className="px-4 py-2.5 bg-[#F0F6FD] hover:bg-[#E2E8F0] text-[#0A192F] border border-[#CBD5E1] text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              خدماتنا
            </Link>
            <Link
              to="/team"
              className="px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>فريق العمل</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
