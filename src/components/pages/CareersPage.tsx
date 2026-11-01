/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { JobVacancy } from '../../types';
import { PageHeroImage } from '../common/PageHeroImage';
import {
  Briefcase,
  CheckCircle2,
  ExternalLink,
  Users,
  Award,
  Sparkles,
  FileSpreadsheet,
  Cpu,
  ShieldCheck,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Settings,
  ChevronLeft,
  MapPin,
  Clock,
  Plus,
} from 'lucide-react';

export const CareersPage: React.FC = () => {
  const { jobs } = useApp();

  // Active vacancies list
  const activeJobs = jobs.filter((j) => j.status === 'active');
  const displayJobs = activeJobs.length > 0 ? activeJobs : jobs;

  // Selected vacancy for viewing details
  const [selectedJobId, setSelectedJobId] = useState<string>(displayJobs[0]?.id || '');
  const currentJob: JobVacancy | undefined =
    displayJobs.find((j) => j.id === selectedJobId) || displayJobs[0];

  // Accordion / Collapsible state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    responsibilities: true,
    qualifications: true,
    accountingSkills: true,
    softwareExperience: true,
    instructions: true,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAll = (open: boolean) => {
    setOpenSections({
      responsibilities: open,
      qualifications: open,
      accountingSkills: open,
      softwareExperience: open,
      instructions: open,
    });
  };

  const isPlaceholderUrl =
    !currentJob?.googleFormsUrl ||
    currentJob.googleFormsUrl.includes('placeholder') ||
    currentJob.googleFormsUrl === '';

  return (
    <div className="space-y-8 sm:space-y-12 text-right">
      {/* Header Banner - Deep Navy */}
      <section className="bg-gradient-to-l from-[#0A192F] via-[#0E2347] to-[#1E3A8A] text-white py-10 sm:py-14 border-b border-[#1E3A8A] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-3">
            <Link to="/" className="hover:text-[#00D2FF] transition-colors">
              الرئيسية
            </Link>
            <ChevronLeft className="w-3.5 h-3.5 text-[#00D2FF]" />
            <span className="text-[#00D2FF]">فرص العمل والتوظيف</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E3A8A]/70 border border-[#00D2FF]/30 text-[#00D2FF] text-xs font-bold shadow-xs">
                <Briefcase className="w-3.5 h-3.5" />
                <span>بوابة الاستقطاب والتوظيف • Careers Portal</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                فرص العمل وبناء المسار المهني مع سمارت مسار
              </h1>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                نستقطب الكفاءات الطموحة الراغبة في المساهمة في قطاع التكنولوجيا والذكاء الاصطناعي والإدارة المالية الحديثة. تعرّف على الشواغر المتاحة وتقدم بطلبك مباشرة عبر Google Forms.
              </p>
            </div>

            {/* Quick Admin Action & Optional Page Hero Image */}
            <div className="shrink-0 flex flex-col items-end gap-4">
              <Link
                to="/admin/jobs"
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#00D2FF] border border-[#00D2FF]/40 text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4 text-[#00D2FF]" />
                <span>إضافة / إدارة الشواغر</span>
              </Link>
              <PageHeroImage pageId="page-careers" />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Vacancy Selector Tabs / Cards (Shown when multiple vacancies exist) */}
        {jobs.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-bold text-[#0A192F] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                <span>الشواغر الوظيفية المتاحة ({jobs.length})</span>
              </h2>
              <span className="text-xs text-slate-500">اختر الوظيفة لمعاينة تفاصيلها والتقديم</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {jobs.map((job) => {
                const isSelected = job.id === currentJob?.id;
                return (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => setSelectedJobId(job.id)}
                    className={`p-4 rounded-2xl text-right transition-all border cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#EBF4FE] border-[#2563EB] shadow-md ring-2 ring-[#2563EB]/20'
                        : 'bg-white hover:bg-slate-50 border-[#CBD5E1] shadow-2xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                            job.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {job.status === 'active' ? 'متاح للتقديم' : 'مغلق'}
                        </span>
                        <span className="text-[11px] font-bold text-[#2563EB]">
                          {job.departmentNameAr}
                        </span>
                      </div>

                      <h3
                        className={`text-sm sm:text-base font-black ${
                          isSelected ? 'text-[#2563EB]' : 'text-[#0A192F]'
                        }`}
                      >
                        {job.titleAr}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5" dir="ltr">
                        {job.titleEn}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{job.locationAr}</span>
                      </span>
                      <span className="font-semibold text-[#2563EB]">عرض التفاصيل ←</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Selected Vacancy Detailed View */}
        {currentJob ? (
          <section className="glass-card rounded-3xl overflow-hidden shadow-sm">
            {/* Card Title & Meta Header */}
            <div className="bg-[#F0F6FD] border-b border-[#D6E4F0] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#0A192F] text-white">
                    شاغر رقم {displayJobs.findIndex((j) => j.id === currentJob.id) + 1}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#2563EB] text-white">
                    {currentJob.departmentNameAr}
                  </span>
                  {currentJob.status === 'active' ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      التقديم متاح حالياً
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
                      مغلق مؤقتاً
                    </span>
                  )}
                  {currentJob.experienceLevelAr && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-[#1E3A8A]">
                      {currentJob.experienceLevelAr}
                    </span>
                  )}
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-[#0A192F]">
                  {currentJob.titleAr}
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-slate-500 font-mono" dir="ltr">
                  {currentJob.titleEn} — {currentJob.departmentId.toUpperCase()}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>{currentJob.locationAr}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>{currentJob.employmentTypeAr}</span>
                  </span>
                  <span className="text-slate-400">نشر في: {currentJob.postedDate}</span>
                </div>
              </div>

              {/* Quick Actions: Apply Now to Google Forms */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <a
                  href={currentJob.googleFormsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-center border border-[#00D2FF]/40 cursor-pointer"
                >
                  <span>تقديم الطلب الآن (Apply Now)</span>
                  <ExternalLink className="w-4 h-4" />
                </a>

                <Link
                  to="/admin/jobs"
                  className="px-4 py-3 bg-white hover:bg-slate-50 text-[#0A192F] border border-[#CBD5E1] text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  title="تعديل رابط Google Forms والشاغر"
                >
                  <Settings className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>تعديل الشاغر بالإدارة</span>
                </Link>
              </div>
            </div>

            {/* Google Forms Notice Box */}
            <div className="mx-6 sm:mx-8 mt-6 p-4 sm:p-5 rounded-2xl bg-[#F0F6FD] border border-[#BFDBFE] text-xs text-[#0A192F] space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-[#2563EB]">
                <HelpCircle className="w-4 h-4 shrink-0" />
                <span>آلية التقديم الرقمية عبر استمارة Google Forms:</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                يتم التقديم لهذا الشاغر عبر <strong>نموذج Google Forms المعتمد</strong> لضمان سلاسة وسرعة معالجة الطلبات. الرابط المباشر للتقديم:
                <br />
                <code
                  className="inline-block mt-1.5 p-1.5 bg-white border border-[#CBD5E1] rounded-lg text-[11px] text-[#0A192F] break-all select-all font-mono"
                  dir="ltr"
                >
                  {currentJob.googleFormsUrl}
                </code>
                {isPlaceholderUrl && (
                  <span className="block mt-1 font-semibold text-amber-800">
                    (رابط تجريبي معتمد — يمكن للمسؤول تحديثه إلى رابط الاستمارة الفعلي عبر لوحة الإدارة).
                  </span>
                )}
              </p>
            </div>

            {/* Accordion Controls Bar */}
            <div className="mx-6 sm:mx-8 mt-6 flex items-center justify-between text-xs text-slate-500 border-b border-[#E2E8F0] pb-3">
              <span className="font-semibold text-slate-700">الأقسام والشروط التفصيلية للشاغر:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleAll(true)}
                  className="hover:text-[#2563EB] font-bold cursor-pointer"
                >
                  فتح الكل
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => toggleAll(false)}
                  className="hover:text-[#2563EB] font-bold cursor-pointer"
                >
                  طي الكل
                </button>
              </div>
            </div>

            {/* Job Details Content - Accordion Sections */}
            <div className="p-6 sm:p-8 space-y-4">
              {/* 1. Job Summary */}
              <div className="p-5 rounded-2xl bg-[#F0F6FD] border border-[#D6E4F0]">
                <h3 className="text-sm font-bold text-[#0A192F] mb-2 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                  <span>الوصف العام للشاغر (Job Summary)</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  {currentJob.summaryAr}
                </p>
              </div>

              {/* 2. Responsibilities (Collapsible Accordion) */}
              {currentJob.responsibilitiesAr && currentJob.responsibilitiesAr.length > 0 && (
                <div className="rounded-2xl border border-[#CBD5E1] overflow-hidden bg-white shadow-2xs">
                  <button
                    type="button"
                    onClick={() => toggleSection('responsibilities')}
                    className="w-full p-4 hover:bg-[#F0F6FD] transition-colors flex items-center justify-between font-bold text-sm text-[#0A192F] cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                      <span>المهام والمسؤوليات الرئيسية (Responsibilities)</span>
                    </div>
                    {openSections.responsibilities ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </button>

                  {openSections.responsibilities && (
                    <div className="p-4 bg-[#F0F6FD] border-t border-[#E2E8F0] grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in duration-150">
                      {currentJob.responsibilitiesAr.map((resp, i) => (
                        <div
                          key={i}
                          className="p-3.5 rounded-xl border border-[#E2E8F0] bg-white flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed shadow-2xs"
                        >
                          <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                          <span>{resp}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 3. Qualifications (Collapsible Accordion) */}
              {currentJob.qualificationsAr && currentJob.qualificationsAr.length > 0 && (
                <div className="rounded-2xl border border-[#CBD5E1] overflow-hidden bg-white shadow-2xs">
                  <button
                    type="button"
                    onClick={() => toggleSection('qualifications')}
                    className="w-full p-4 hover:bg-[#F0F6FD] transition-colors flex items-center justify-between font-bold text-sm text-[#0A192F] cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#7C5CDE]" />
                      <span>المؤهلات والشروط المطلوبة (Required Qualifications)</span>
                    </div>
                    {openSections.qualifications ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </button>

                  {openSections.qualifications && (
                    <div className="p-4 bg-[#F0F6FD] border-t border-[#E2E8F0] space-y-2 animate-in fade-in duration-150">
                      {currentJob.qualificationsAr.map((qual, i) => (
                        <div
                          key={i}
                          className="p-3.5 rounded-xl border border-[#E2E8F0] bg-white flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed shadow-2xs"
                        >
                          <CheckCircle2 className="w-4 h-4 text-[#7C5CDE] shrink-0 mt-0.5" />
                          <span>{qual}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 4. Core Skills & Expertise (Collapsible Accordion) */}
              {currentJob.accountingSkillsAr && currentJob.accountingSkillsAr.length > 0 && (
                <div className="rounded-2xl border border-[#CBD5E1] overflow-hidden bg-white shadow-2xs">
                  <button
                    type="button"
                    onClick={() => toggleSection('accountingSkills')}
                    className="w-full p-4 hover:bg-[#F0F6FD] transition-colors flex items-center justify-between font-bold text-sm text-[#0A192F] cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-[#2563EB]" />
                      <span>المهارات التخصصية والفنية المتقدمة</span>
                    </div>
                    {openSections.accountingSkills ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </button>

                  {openSections.accountingSkills && (
                    <div className="p-4 bg-[#F0F6FD] border-t border-[#E2E8F0] space-y-2 animate-in fade-in duration-150">
                      {currentJob.accountingSkillsAr.map((skill, sIdx) => (
                        <div
                          key={sIdx}
                          className="p-3.5 rounded-xl border border-[#E2E8F0] bg-white flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed shadow-2xs"
                        >
                          <span className="w-2 h-2 rounded-full bg-[#2563EB] shrink-0 mt-1.5" />
                          <span>{skill}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 5. Software & Tools Experience (Collapsible Accordion) */}
              {currentJob.softwareExperienceAr && currentJob.softwareExperienceAr.length > 0 && (
                <div className="rounded-2xl border border-[#CBD5E1] overflow-hidden bg-white shadow-2xs">
                  <button
                    type="button"
                    onClick={() => toggleSection('softwareExperience')}
                    className="w-full p-4 hover:bg-[#F0F6FD] transition-colors flex items-center justify-between font-bold text-sm text-[#0A192F] cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-[#00D2FF]" />
                      <span>الخبرة في البرمجيات والأنظمة والأدوات</span>
                    </div>
                    {openSections.softwareExperience ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </button>

                  {openSections.softwareExperience && (
                    <div className="p-4 bg-[#F0F6FD] border-t border-[#E2E8F0] space-y-2 animate-in fade-in duration-150">
                      {currentJob.softwareExperienceAr.map((sw, swIdx) => (
                        <div
                          key={swIdx}
                          className="p-3.5 rounded-xl border border-[#E2E8F0] bg-white flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed shadow-2xs"
                        >
                          <span className="w-2 h-2 rounded-full bg-[#00D2FF] shrink-0 mt-1.5" />
                          <span>{sw}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 6. Application Instructions (Collapsible Accordion) */}
              {currentJob.applicationInstructionsAr && (
                <div className="rounded-2xl border border-[#CBD5E1] overflow-hidden bg-white shadow-2xs">
                  <button
                    type="button"
                    onClick={() => toggleSection('instructions')}
                    className="w-full p-4 hover:bg-[#F0F6FD] transition-colors flex items-center justify-between font-bold text-sm text-[#0A192F] cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                      <span>إرشادات وخطوات تقديم الطلب (Application Instructions)</span>
                    </div>
                    {openSections.instructions ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </button>

                  {openSections.instructions && (
                    <div className="p-5 bg-[#F0F6FD] border-t border-[#E2E8F0] space-y-4 animate-in fade-in duration-150">
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                        {currentJob.applicationInstructionsAr}
                      </p>
                      <div className="pt-2">
                        <a
                          href={currentJob.googleFormsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-6 py-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer border border-[#00D2FF]/40"
                        >
                          <span>فتح استمارة التقديم على Google Forms</span>
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        ) : (
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-[#CBD5E1]">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">لا توجد شواغر نشطة حالياً</p>
          </div>
        )}

        {/* Employer Branding Section: لماذا العمل مع Smart Masar؟ */}
        <section className="glass-card rounded-3xl p-6 sm:p-10 space-y-6">
          <div>
            <span className="text-xs font-bold text-[#2563EB] tracking-wide block mb-1">
              العلامة المؤسسية لصاحب العمل • Employer Branding
            </span>
            <h2 className="text-2xl font-bold text-[#0A192F]">
              لماذا العمل مع Smart Masar؟
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              نسعى لتوفير بيئة احترافية تلهم الكفاءات وتمكنهم من المساهمة الفاعلة في صياغة الحلول التكنولوجية الذكية.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-[#F0F6FD] border border-[#E2E8F0]">
              <div className="w-11 h-11 rounded-xl bg-white border border-[#CBD5E1] flex items-center justify-center text-[#2563EB] mb-4 shadow-2xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#0A192F] mb-1">الابتكار والريادة</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                المشاركة في مشاريع رائدة تعتمد على الذكاء الاصطناعي وأحدث التقنيات السحابية.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F0F6FD] border border-[#E2E8F0]">
              <div className="w-11 h-11 rounded-xl bg-white border border-[#CBD5E1] flex items-center justify-center text-[#2563EB] mb-4 shadow-2xs">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#0A192F] mb-1">روح الفريق والتكامل</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                ثقافة تعاونية قائمة على الاحترام المتبادل، مشاركة المعرفة، والتشجيع المستمر.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F0F6FD] border border-[#E2E8F0]">
              <div className="w-11 h-11 rounded-xl bg-white border border-[#CBD5E1] flex items-center justify-center text-[#7C5CDE] mb-4 shadow-2xs">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#0A192F] mb-1">التطوير المهني المتواصل</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                برامج صقل المهارات ودورات تدريبية مستمرة تواكب أحدث المعايير الدولية.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F0F6FD] border border-[#E2E8F0]">
              <div className="w-11 h-11 rounded-xl bg-white border border-[#CBD5E1] flex items-center justify-center text-[#00D2FF] mb-4 shadow-2xs">
                <Cpu className="w-5 h-5 text-[#2563EB]" />
              </div>
              <h3 className="text-sm font-bold text-[#0A192F] mb-1">التعرض التقني المتقدم</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                التعامل مع بيئات هندسية متطورة ومنصات أتمتة ترفع من كفاءتك وخبرتك السوقية.
              </p>
            </div>
          </div>
        </section>

        {/* Employee Referrals Section: برنامج تزكية المرشحين */}
        <section className="bg-white border border-[#CBD5E1] rounded-3xl p-6 sm:p-10 space-y-4 shadow-sm">
          <div className="max-w-3xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#EBF4FE] border border-[#BFDBFE] text-[#2563EB] text-xs font-bold rounded-full">
              <Users className="w-3.5 h-3.5" />
              <span>برنامج التزكية الداخلي • Employee Referral Program</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0A192F]">
              برنامج تزكية المرشحين المؤهلين
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              يتيح هذا البرنامج لكوادر سمارت مسار ترشيح وتزكية أصحاب الكفاءات العالية لشواغرنا الحالية والمستقبلية. نثمن مساهمة موظفينا في جذب أفضل المواهب لأسرتنا المهنية.
            </p>
          </div>

          {/* Clear Fairness Disclaimer */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#F0F6FD] border border-[#CBD5E1] text-xs text-[#0A192F] space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-[#2563EB]">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>مبادئ العدالة والنزاهة وتكافؤ الفرص:</span>
            </div>
            <p className="leading-relaxed text-slate-600">
              <strong>تنويه هام:</strong> تزكية الموظف لمرشح معين هي خطوة تشجيعية، <strong>ولا تضمن التعيين بأي شكل من الأشكال</strong>. يخضع جميع المترشحين — سواء تقدموا ذاتياً أو عبر التزكية — لنفس مسطرة التقييم الدقيقة، مراجعة السير الذاتية، والاختبارات والمقابلات الفنية، لضمان أعلى معايير الشفافية واختيار الأجدر.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
