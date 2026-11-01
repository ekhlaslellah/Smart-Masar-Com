/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  Users,
  Briefcase,
  Building2,
  GitFork,
  ArrowLeft,
  Settings,
  Sparkles,
  Database,
  Layout,
  Image as ImageIcon,
} from 'lucide-react';

export const AdminOverview: React.FC = () => {
  const { employees, jobs, departments, services, pages } = useApp();

  const activeJobsCount = jobs.filter((j) => j.status === 'active').length;
  const confirmedCount = employees.filter((e) => e.isConfirmedPosition).length;
  const unconfirmedCount = employees.length - confirmedCount;
  const uploadedImagesCount =
    employees.filter((e) => Boolean(e.image_url || e.avatarUrl)).length +
    services.filter((s) => Boolean(s.image_url)).length +
    pages.filter((p) => Boolean(p.hero_image_url)).length;

  return (
    <div className="space-y-8 text-right bg-white">
      {/* Welcome Banner */}
      <div className="bg-[#F5F8FC] border border-[#CBD5E1] p-6 sm:p-8 rounded-2xl relative overflow-hidden">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-white border border-[#CBD5E1] text-[#2563EB] text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>لوحة الإدارة والتحكم • Admin & Media Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#142B4F]">
            مرحباً بك في إدارة سمارت مسار
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            منصة متكاملة لإدارة كوادر الفريق، رفع وإدارة الصور عبر Google Drive و SheetDB، تحديث الهيكل التنظيمي، وإدارة الشواغر الوظيفية.
          </p>
        </div>
      </div>

      {/* Backend Status Notice */}
      <div className="p-4 rounded-xl bg-white border border-[#CBD5E1] text-xs text-[#142B4F] flex items-start gap-3 shadow-2xs">
        <Database className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>نظام إدارة ورفع الصور (Google Drive + Google Sheets / SheetDB):</strong> يمكنك رفع صور أعضاء الفريق، الخدمات التقنية، صور واجهات الصفحات (Hero Images)، وشعار الشركة بصيغ JPG أو PNG أو WebP مع معاينة فورية وتحديث تلقائي للروابط.
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Team members */}
        <div className="bg-white p-5 rounded-2xl border border-[#CBD5E1] shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-1">
              أعضاء الفريق
            </span>
            <div className="text-2xl font-black text-[#142B4F] font-mono">
              {employees.length}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {confirmedCount} معتمد · {unconfirmedCount} قيد التعيين
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#F5F8FC] border border-[#CBD5E1] flex items-center justify-center text-[#2563EB]">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Services & Pages */}
        <div className="bg-white p-5 rounded-2xl border border-[#CBD5E1] shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-1">
              الصور والوسائط المرفوعة
            </span>
            <div className="text-2xl font-black text-[#2563EB] font-mono">
              {uploadedImagesCount}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              الفريق، الخدمات، والصفحات
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#F5F8FC] border border-[#CBD5E1] flex items-center justify-center text-[#2563EB]">
            <ImageIcon className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Active Job Vacancies */}
        <div className="bg-white p-5 rounded-2xl border border-[#CBD5E1] shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-1">
              الشواغر النشطة
            </span>
            <div className="text-2xl font-black text-[#142B4F] font-mono">
              {activeJobsCount}
            </div>
            <span className="text-[11px] text-emerald-600 font-bold mt-1 block">
              متصلة بـ Google Forms
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#F5F8FC] border border-[#CBD5E1] flex items-center justify-center text-[#2563EB]">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Number of Departments */}
        <div className="bg-white p-5 rounded-2xl border border-[#CBD5E1] shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-1">
              الأقسام والدوائر
            </span>
            <div className="text-2xl font-black text-[#142B4F] font-mono">
              {departments.length}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {services.length} محاور خدمات
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#F5F8FC] border border-[#CBD5E1] flex items-center justify-center text-[#7C5CDE]">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-[#142B4F]">إجراءات الإدارة ورفع الصور المباشرة</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/admin/team"
            className="p-5 rounded-xl bg-white border border-[#CBD5E1] shadow-2xs hover:border-[#2563EB] hover:shadow-xs transition-all text-right flex items-start justify-between group"
          >
            <div>
              <div className="flex items-center gap-2 font-bold text-sm text-[#142B4F] group-hover:text-[#2563EB] mb-1">
                <Users className="w-4 h-4 text-[#2563EB]" />
                <span>إدارة الفريق وصور الموظفين</span>
              </div>
              <p className="text-xs text-slate-500">
                رفع وتحديث صور أعضاء الفريق، تعديل المسميات، وتحديث جدول Team.
              </p>
            </div>
            <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-[#2563EB] group-hover:-translate-x-1 transition-transform shrink-0 mt-1" />
          </Link>

          <Link
            to="/admin/services"
            className="p-5 rounded-xl bg-white border border-[#CBD5E1] shadow-2xs hover:border-[#2563EB] hover:shadow-xs transition-all text-right flex items-start justify-between group"
          >
            <div>
              <div className="flex items-center gap-2 font-bold text-sm text-[#142B4F] group-hover:text-[#2563EB] mb-1">
                <Sparkles className="w-4 h-4 text-[#2563EB]" />
                <span>إدارة الخدمات وصورها</span>
              </div>
              <p className="text-xs text-slate-500">
                رفع صور الخدمات التقنية وتحديث جدول Services في Google Sheets.
              </p>
            </div>
            <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-[#2563EB] group-hover:-translate-x-1 transition-transform shrink-0 mt-1" />
          </Link>

          <Link
            to="/admin/pages"
            className="p-5 rounded-xl bg-white border border-[#CBD5E1] shadow-2xs hover:border-[#2563EB] hover:shadow-xs transition-all text-right flex items-start justify-between group"
          >
            <div>
              <div className="flex items-center gap-2 font-bold text-sm text-[#142B4F] group-hover:text-[#2563EB] mb-1">
                <Layout className="w-4 h-4 text-[#2563EB]" />
                <span>إدارة صور الصفحات (Pages)</span>
              </div>
              <p className="text-xs text-slate-500">
                رفع واستبدال صور الـ Hero Banner لصفحات الموقع العامة.
              </p>
            </div>
            <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-[#2563EB] group-hover:-translate-x-1 transition-transform shrink-0 mt-1" />
          </Link>

          <Link
            to="/admin/jobs"
            className="p-5 rounded-xl bg-white border border-[#CBD5E1] shadow-2xs hover:border-[#2563EB] hover:shadow-xs transition-all text-right flex items-start justify-between group"
          >
            <div>
              <div className="flex items-center gap-2 font-bold text-sm text-[#142B4F] group-hover:text-[#2563EB] mb-1">
                <Briefcase className="w-4 h-4 text-[#2563EB]" />
                <span>إدارة الشواغر ورابط Google Forms</span>
              </div>
              <p className="text-xs text-slate-500">
                تعديل وصف شاغر المحاسب وتحديث رابط استمارة التقديم الخارجية.
              </p>
            </div>
            <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-[#2563EB] group-hover:-translate-x-1 transition-transform shrink-0 mt-1" />
          </Link>

          <Link
            to="/admin/organization"
            className="p-5 rounded-xl bg-white border border-[#CBD5E1] shadow-2xs hover:border-[#2563EB] hover:shadow-xs transition-all text-right flex items-start justify-between group"
          >
            <div>
              <div className="flex items-center gap-2 font-bold text-sm text-[#142B4F] group-hover:text-[#2563EB] mb-1">
                <GitFork className="w-4 h-4 text-[#7C5CDE]" />
                <span>مراجعة الهيكل التنظيمي والتبعية</span>
              </div>
              <p className="text-xs text-slate-500">
                فحص التسلسل الهرمي للمدير العام د. أحمد العابد وتوزيع الأقسام.
              </p>
            </div>
            <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-[#2563EB] group-hover:-translate-x-1 transition-transform shrink-0 mt-1" />
          </Link>

          <Link
            to="/admin/settings"
            className="p-5 rounded-xl bg-white border border-[#CBD5E1] shadow-2xs hover:border-[#2563EB] hover:shadow-xs transition-all text-right flex items-start justify-between group"
          >
            <div>
              <div className="flex items-center gap-2 font-bold text-sm text-[#142B4F] group-hover:text-[#2563EB] mb-1">
                <Settings className="w-4 h-4 text-[#2563EB]" />
                <span>إعدادات الموقع، الشعار، و Google Drive</span>
              </div>
              <p className="text-xs text-slate-500">
                رفع الشعار الرسمي، ضبط مجلد Google Drive، وربط SheetDB و Apps Script.
              </p>
            </div>
            <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-[#2563EB] group-hover:-translate-x-1 transition-transform shrink-0 mt-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};
