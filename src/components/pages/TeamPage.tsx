/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { filterTeam } from '../../utils/orgChart';
import { EmployeeAvatar } from '../common/EmployeeAvatar';
import { PageHeroImage } from '../common/PageHeroImage';
import {
  Users,
  Search,
  Building2,
  Mail,
  GitFork,
  ArrowLeft,
  ShieldAlert,
  Crown,
  ChevronLeft,
} from 'lucide-react';

export const TeamPage: React.FC = () => {
  const { employees, departments, setSelectedEmployee } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');

  const filteredEmployees = useMemo(() => {
    return filterTeam(employees, searchTerm, selectedDept);
  }, [employees, searchTerm, selectedDept]);

  const getDeptName = (id: string) => {
    return departments.find((d) => d.id === id)?.nameAr || 'قسم عام';
  };

  const getManagerName = (managerId: string | null) => {
    if (!managerId) return null;
    const m = employees.find((e) => e.id === managerId);
    return m ? m.nameAr : null;
  };

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
            <span className="text-[#00D2FF]">فريق العمل</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E3A8A]/70 border border-[#00D2FF]/30 text-[#00D2FF] text-xs font-bold shadow-xs">
                <Users className="w-3.5 h-3.5" />
                <span>كادر سمارت مسار • Our Professional Team</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                فريق العمل والكوادر التأسيسية
              </h1>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                يضم فريق سمارت مسار نخبة من الكفاءات القيادية والمتخصصة في التكنولوجيا والذكاء الاصطناعي والإدارة، ونعمل معاً بروح التكامل لتحقيق التميز.
              </p>
            </div>

            <PageHeroImage pageId="page-team" />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Educational Note */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#BFDBFE] shadow-sm flex items-start gap-3.5 text-xs text-[#0A192F]">
          <ShieldAlert className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-bold text-[#2563EB]">إيضاح تنظيمي:</strong> تضم هذه الصفحة أسماء الكوادر التأسيسية الستة المعتمدة. الدكتور أحمد العابد في منصب المدير العام، وتظهر بقية الكوادر حالياً بحالة "قيد التعيين" ضمن مشروع الهيكلة التدريبية لحين اعتماد التوزيع النهائي للمسميات والمهام.
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D6E4F0] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="البحث بالاسم أو المسمى الوظيفي..."
              className="w-full pr-10 pl-4 py-2.5 text-xs rounded-xl border border-[#CBD5E1] bg-[#F0F6FD] focus:bg-white focus:outline-none focus:border-[#2563EB]"
              aria-label="البحث عن موظف"
            />
          </div>

          {/* Department Filter Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedDept('all')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                selectedDept === 'all'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'bg-[#F0F6FD] text-slate-700 border border-[#CBD5E1] hover:bg-slate-200'
              }`}
            >
              جميع الأقسام ({employees.length})
            </button>
            {departments.map((dept) => {
              const count = employees.filter((e) => e.departmentId === dept.id).length;
              return (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => setSelectedDept(dept.id)}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    selectedDept === dept.id
                      ? 'bg-[#2563EB] text-white shadow-sm'
                      : 'bg-[#F0F6FD] text-slate-700 border border-[#CBD5E1] hover:bg-slate-200'
                  }`}
                >
                  {dept.nameAr} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Attractive Employee Profile Cards Grid */}
        {filteredEmployees.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-[#CBD5E1]">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">لا توجد نتائج مطابقة لبحثك</p>
            <p className="text-xs text-slate-500 mt-1">جرّب تغيير عبارة البحث أو اختيار "جميع الأقسام".</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmployees.map((emp) => {
              const isGeneralManager = emp.id === 'emp-ahmed-alabed';
              const managerName = getManagerName(emp.managerId);

              return (
                <div
                  key={emp.id}
                  onClick={() => setSelectedEmployee(emp)}
                  className={`glass-card rounded-2xl p-6 flex flex-col justify-between cursor-pointer group text-right relative overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
                    isGeneralManager
                      ? 'border-[#2563EB] ring-2 ring-[#2563EB]/30'
                      : 'hover:border-[#2563EB]'
                  }`}
                >
                  {/* General Manager Distinctive Badge */}
                  {isGeneralManager && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-[#2563EB] to-[#1E3A8A] text-white text-[10px] font-black px-3.5 py-1.5 rounded-bl-xl flex items-center gap-1.5 shadow-sm">
                      <Crown className="w-3.5 h-3.5 text-amber-300" />
                      <span>المدير العام • القيادة العليا</span>
                    </div>
                  )}

                  <div>
                    {/* Top: Avatar & Department */}
                    <div className="flex items-start justify-between gap-4 mb-4 pt-1">
                      {/* Avatar Placeholder or Photo */}
                      <EmployeeAvatar
                        employee={emp}
                        className={`w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-black shadow-md overflow-hidden shrink-0 border transition-transform group-hover:scale-105 ${
                          isGeneralManager
                            ? 'bg-[#0A192F] text-[#00D2FF] border-[#00D2FF]/60'
                            : 'bg-gradient-to-br from-[#EBF4FE] to-[#DBEAFE] text-[#2563EB] border-[#BFDBFE]'
                        }`}
                      />

                      {/* Department Tag & Status */}
                      <div className="flex flex-col items-end">
                        <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-[#2563EB]" />
                          {getDeptName(emp.departmentId)}
                        </span>
                        {emp.isConfirmedPosition ? (
                          <span className="mt-1.5 text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                            منصب معتمد
                          </span>
                        ) : (
                          <span className="mt-1.5 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full">
                            قيد التعيين
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Name & Title */}
                    <h3 className="text-base sm:text-lg font-bold text-[#0A192F] group-hover:text-[#2563EB] transition-colors">
                      {emp.nameAr}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium mb-3 font-mono" dir="ltr">
                      {emp.nameEn}
                    </p>

                    <div className="text-xs font-bold text-[#2563EB] bg-[#EBF4FE] border border-[#BFDBFE] px-3 py-1 rounded-lg inline-block mb-3 shadow-2xs">
                      {emp.jobTitleAr}
                    </div>

                    {/* Reporting line */}
                    {managerName && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-2 font-medium">
                        <GitFork className="w-3.5 h-3.5 text-slate-400" />
                        <span>المسؤول المباشر: {managerName}</span>
                      </div>
                    )}

                    {emp.bioAr ? (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {emp.bioAr}
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">
                        عضو كادر أساسي — انقر لعرض تفاصيل الملف
                      </p>
                    )}
                  </div>

                  {/* Footer of card */}
                  <div className="pt-4 mt-5 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1 text-[11px]" dir="ltr">
                      <Mail className="w-3.5 h-3.5 text-[#2563EB]" />
                      {emp.email || 'team@smartmasar.edu'}
                    </span>
                    <span className="text-xs font-bold text-[#2563EB] group-hover:underline">
                      عرض البطاقة ‹
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Switch to Separate Org Chart Page */}
        <div className="p-6 rounded-2xl bg-white border border-[#CBD5E1] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#EBF4FE] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shadow-2xs">
              <GitFork className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#0A192F]">
                استكشف الهيكل التنظيمي التفاعلي الكامل
              </h4>
              <p className="text-xs text-slate-500">
                تصفح التفرعات الهرمية ومستويات التبعية الإدارية على صفحة الهيكل المستقلة.
              </p>
            </div>
          </div>
          <Link
            to="/organization"
            className="px-5 py-2.5 text-xs font-bold bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl transition-colors flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
          >
            <span>الانتقال للهيكل التنظيمي</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
