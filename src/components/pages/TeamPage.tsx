/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  filterTeam,
  getVisibleTeamEmployees,
  getEmployeeRoleCategory,
  normalizeEmployeeVisibility,
} from '../../utils/orgChart';
import { EmployeeAvatar } from '../common/EmployeeAvatar';
import { PageHeroImage } from '../common/PageHeroImage';
import {
  Users,
  Search,
  Building2,
  Mail,
  GitFork,
  ArrowLeft,
  Crown,
  ChevronLeft,
  Sparkles,
  Award,
  ShieldCheck,
  Lock,
} from 'lucide-react';

export const TeamPage: React.FC = () => {
  const { employees, departments, setSelectedEmployee } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedRoleCategory, setSelectedRoleCategory] = useState<
    'all' | 'executive_advisor' | 'department_lead' | 'specialist'
  >('all');

  // All employees visible on the public Team page (sorted by leadership hierarchy)
  const visibleEmployees = useMemo(() => {
    return getVisibleTeamEmployees(employees);
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return filterTeam(
      employees,
      searchTerm,
      selectedDept,
      selectedRoleCategory,
      true
    );
  }, [employees, searchTerm, selectedDept, selectedRoleCategory]);

  // Dynamic statistics derived strictly from visible Team records
  const teamStats = useMemo(() => {
    let executiveAndAdvisors = 0;
    let departmentLeads = 0;
    let specialists = 0;
    const deptIds = new Set<string>();

    visibleEmployees.forEach((emp) => {
      const cat = getEmployeeRoleCategory(emp, visibleEmployees);
      if (cat === 'executive' || cat === 'advisor') {
        executiveAndAdvisors += 1;
      } else if (cat === 'department_lead') {
        departmentLeads += 1;
      } else {
        specialists += 1;
      }
      if (emp.departmentId) {
        deptIds.add(emp.departmentId);
      }
    });

    return {
      totalVisible: visibleEmployees.length,
      executiveAndAdvisors,
      departmentLeads,
      specialists,
      representedDepartments: deptIds.size,
    };
  }, [visibleEmployees]);

  const getDeptName = (id: string) => {
    return departments.find((d) => d.id === id)?.nameAr || 'قسم عام';
  };

  const getManagerName = (managerId: string | null) => {
    if (!managerId) return null;
    const m = employees.find((e) => e.id === managerId);
    return m ? m.nameAr : null;
  };

  return (
    <div className="space-y-8 sm:space-y-12 text-right pb-8">
      {/* Header Banner - Deep Navy */}
      <section className="bg-gradient-to-l from-[#0A192F] via-[#0E2347] to-[#1E3A8A] text-white py-10 sm:py-14 border-b border-[#1E3A8A] relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, #00D2FF 0%, transparent 45%), radial-gradient(circle at 80% 70%, #2563EB 0%, transparent 50%)',
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-3">
            <Link to="/" className="hover:text-[#00D2FF] transition-colors">
              الرئيسية
            </Link>
            <ChevronLeft className="w-3.5 h-3.5 text-[#00D2FF]" />
            <span className="text-[#00D2FF]">فريق العمل • Leadership & Team</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#1E3A8A]/80 border border-[#00D2FF]/40 text-[#00D2FF] text-xs font-bold shadow-xs">
                <Users className="w-3.5 h-3.5" />
                <span>كادر سمارت مسار المعتمد • Official Team Directory</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                فريق العمل والقيادات التنفيذية
              </h1>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                يضم فريق سمارت مسار نخبة من القيادات التنفيذية والمستشارين ورؤساء الأقسام المتخصصين في التكنولوجيا والذكاء الاصطناعي والإدارة المؤسسية، مرتبين وفق التسلسل القيادي المعتمد في قاعدة البيانات.
              </p>

              {/* Dynamic Team Statistics Strip */}
              <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-[#0A192F]/80 border border-[#00D2FF]/30">
                  <div
                    className="text-xl font-black text-[#00D2FF]"
                    data-testid="team-stat-total-visible"
                  >
                    {teamStats.totalVisible}
                  </div>
                  <div className="text-[11px] text-slate-300 font-bold">
                    إجمالي الكوادر المعروضة
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#0A192F]/80 border border-[#00D2FF]/30">
                  <div
                    className="text-xl font-black text-[#00D2FF]"
                    data-testid="team-stat-executives-advisors"
                  >
                    {teamStats.executiveAndAdvisors}
                  </div>
                  <div className="text-[11px] text-slate-300 font-bold">
                    القيادة العليا والاستشارات
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#0A192F]/80 border border-[#00D2FF]/30">
                  <div
                    className="text-xl font-black text-[#00D2FF]"
                    data-testid="team-stat-dept-leads"
                  >
                    {teamStats.departmentLeads}
                  </div>
                  <div className="text-[11px] text-slate-300 font-bold">
                    رؤساء ومديرو الإدارات
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#0A192F]/80 border border-[#00D2FF]/30">
                  <div
                    className="text-xl font-black text-white"
                    data-testid="team-stat-departments"
                  >
                    {teamStats.representedDepartments}
                  </div>
                  <div className="text-[11px] text-slate-300 font-bold">
                    أقسام ووحدات ممثلة
                  </div>
                </div>
              </div>
            </div>

            <PageHeroImage pageId="page-team" />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Institutional Sync & Privacy Note */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#BFDBFE] shadow-2xs flex items-start gap-3.5 text-xs sm:text-sm text-[#0A192F]">
          <ShieldCheck className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-bold text-[#2563EB]">توحيد البيانات والخصوصية:</strong> تُستمد بطاقات هذه الصفحة مباشرة من جدول الكادر الرسمي (<strong>Team</strong>) وجدول الأقسام (<strong>Departments</strong>) مع مراعاة إعدادات الظهور والخصوصية المعتمدة لكل عضو.
          </div>
        </div>

        {/* Multi-Level Filter & Search Controls */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D6E4F0] shadow-2xs space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="البحث بالاسم أو المسمى الوظيفي (عربي / English)..."
                className="w-full pr-10 pl-4 py-2.5 text-xs rounded-xl border border-[#CBD5E1] bg-[#F0F6FD] focus:bg-white focus:outline-none focus:border-[#2563EB]"
                aria-label="البحث عن موظف"
              />
            </div>

            {/* Role Category Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedRoleCategory('all')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  selectedRoleCategory === 'all'
                    ? 'bg-[#0A192F] text-[#00D2FF] border border-[#00D2FF]/50 shadow-2xs'
                    : 'bg-[#F0F6FD] text-slate-700 border border-[#CBD5E1] hover:bg-slate-200'
                }`}
              >
                جميع المستويات ({teamStats.totalVisible})
              </button>
              <button
                type="button"
                onClick={() => setSelectedRoleCategory('executive_advisor')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  selectedRoleCategory === 'executive_advisor'
                    ? 'bg-[#0A192F] text-[#00D2FF] border border-[#00D2FF]/50 shadow-2xs'
                    : 'bg-[#F0F6FD] text-slate-700 border border-[#CBD5E1] hover:bg-slate-200'
                }`}
              >
                القيادة والاستشارات ({teamStats.executiveAndAdvisors})
              </button>
              <button
                type="button"
                onClick={() => setSelectedRoleCategory('department_lead')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  selectedRoleCategory === 'department_lead'
                    ? 'bg-[#0A192F] text-[#00D2FF] border border-[#00D2FF]/50 shadow-2xs'
                    : 'bg-[#F0F6FD] text-slate-700 border border-[#CBD5E1] hover:bg-slate-200'
                }`}
              >
                رؤساء ومديرو الإدارات ({teamStats.departmentLeads})
              </button>
              {teamStats.specialists > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedRoleCategory('specialist')}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    selectedRoleCategory === 'specialist'
                      ? 'bg-[#0A192F] text-[#00D2FF] border border-[#00D2FF]/50 shadow-2xs'
                      : 'bg-[#F0F6FD] text-slate-700 border border-[#CBD5E1] hover:bg-slate-200'
                  }`}
                >
                  الكوادر التخصصية ({teamStats.specialists})
                </button>
              )}
            </div>
          </div>

          {/* Department Filter Pills */}
          <div className="pt-3 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedDept('all')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                selectedDept === 'all'
                  ? 'bg-[#2563EB] text-white shadow-2xs'
                  : 'bg-[#F0F6FD] text-slate-700 border border-[#CBD5E1] hover:bg-slate-200'
              }`}
            >
              جميع الأقسام ({visibleEmployees.length})
            </button>
            {departments.map((dept) => {
              const count = visibleEmployees.filter(
                (e) => e.departmentId === dept.id
              ).length;
              if (count === 0) return null;
              return (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => setSelectedDept(dept.id)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    selectedDept === dept.id
                      ? 'bg-[#2563EB] text-white shadow-2xs'
                      : 'bg-[#F0F6FD] text-slate-700 border border-[#CBD5E1] hover:bg-slate-200'
                  }`}
                >
                  {dept.nameAr} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Upgraded Employee Profile Cards Grid */}
        {filteredEmployees.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-[#CBD5E1]">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">
              لا توجد نتائج مطابقة لبحثك
            </p>
            <p className="text-xs text-slate-500 mt-1">
              جرّب تغيير عبارة البحث أو إعادة ضبط فلاتر المستويات والأقسام.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmployees.map((rawEmp) => {
              const emp = normalizeEmployeeVisibility(rawEmp);
              const roleCategory = getEmployeeRoleCategory(emp, visibleEmployees);
              const isCeo = roleCategory === 'executive';
              const isAdvisor = roleCategory === 'advisor';
              const isDeptLead = roleCategory === 'department_lead';
              const canOpenProfile = emp.showPublicProfile !== false;
              const canShowEmail = emp.showPublicEmail === true && Boolean(emp.email);
              const managerName = getManagerName(emp.managerId);

              return (
                <div
                  key={emp.id}
                  data-testid={`team-card-${emp.id}`}
                  onClick={() => {
                    if (canOpenProfile) {
                      setSelectedEmployee(emp);
                    }
                  }}
                  className={`glass-card rounded-3xl p-6 flex flex-col justify-between text-right relative overflow-hidden transition-all duration-300 ${
                    canOpenProfile
                      ? 'cursor-pointer hover:-translate-y-1 hover:shadow-lg'
                      : 'cursor-default'
                  } ${
                    isCeo
                      ? 'border-2 border-[#2563EB] ring-2 ring-[#2563EB]/20 bg-gradient-to-b from-white to-[#F0F6FD]'
                      : isAdvisor
                      ? 'border-2 border-[#7C5CDE]/60 hover:border-[#7C5CDE] bg-gradient-to-b from-white to-[#F8F6FF]'
                      : 'border border-[#D6E4F0] hover:border-[#2563EB]'
                  }`}
                >
                  {/* Top Leadership / Role Ribbon */}
                  {isCeo && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-[#0A192F] via-[#1E3A8A] to-[#2563EB] text-white text-[10px] font-black px-4 py-1.5 rounded-bl-2xl flex items-center gap-1.5 shadow-sm">
                      <Crown className="w-3.5 h-3.5 text-amber-300" />
                      <span>الرئيس التنفيذي • القيادة العليا</span>
                    </div>
                  )}

                  {isAdvisor && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-[#7C5CDE] to-[#2563EB] text-white text-[10px] font-black px-4 py-1.5 rounded-bl-2xl flex items-center gap-1.5 shadow-sm">
                      <Sparkles className="w-3.5 h-3.5 text-[#00D2FF]" />
                      <span>مستشار تنفيذي • الإدارة العليا</span>
                    </div>
                  )}

                  {isDeptLead && (
                    <div className="absolute top-0 right-0 bg-[#EBF4FE] text-[#1E3A8A] border-b border-l border-[#BFDBFE] text-[10px] font-black px-3.5 py-1 rounded-bl-2xl flex items-center gap-1">
                      <Award className="w-3 h-3 text-[#2563EB]" />
                      <span>قيادة قسم / إدارة</span>
                    </div>
                  )}

                  <div>
                    {/* Portrait + Department Header */}
                    <div className="flex items-start gap-4 mb-5 pt-3">
                      <EmployeeAvatar
                        employee={emp}
                        className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center text-xl font-black shadow-md overflow-hidden shrink-0 border-2 transition-transform duration-300 ${
                          canOpenProfile ? 'group-hover:scale-105' : ''
                        } ${
                          isCeo
                            ? 'bg-[#0A192F] text-[#00D2FF] border-[#00D2FF]'
                            : isAdvisor
                            ? 'bg-[#1E1B4B] text-[#00D2FF] border-[#7C5CDE]'
                            : 'bg-gradient-to-br from-[#EBF4FE] to-[#DBEAFE] text-[#2563EB] border-[#93C5FD]'
                        }`}
                      />

                      <div className="flex-1 min-w-0 space-y-1.5 pt-1">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2563EB] bg-[#F0F6FD] border border-[#BFDBFE] px-2.5 py-0.5 rounded-lg">
                          <Building2 className="w-3 h-3 shrink-0" />
                          <span className="truncate">{getDeptName(emp.departmentId)}</span>
                        </span>

                        <h3 className="text-lg sm:text-xl font-black text-[#0A192F] leading-snug">
                          {emp.nameAr}
                        </h3>
                        <p
                          className="text-xs text-slate-500 font-bold font-mono truncate"
                          dir="ltr"
                        >
                          {emp.nameEn}
                        </p>

                        <div className="pt-0.5">
                          {emp.isConfirmedPosition ? (
                            <span className="inline-block text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                              منصب معتمد
                            </span>
                          ) : (
                            <span className="inline-block text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full">
                              قيد التعيين
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bilingual Job Titles Box */}
                    <div className="p-3.5 rounded-2xl bg-[#F0F6FD] border border-[#D6E4F0] mb-3.5 space-y-1">
                      <div className="text-xs sm:text-sm font-black text-[#0A192F]">
                        {emp.jobTitleAr}
                      </div>
                      {emp.jobTitleEn && (
                        <div
                          className="text-[11px] font-bold text-[#2563EB] font-mono"
                          dir="ltr"
                        >
                          {emp.jobTitleEn}
                        </div>
                      )}
                    </div>

                    {/* Reporting Line */}
                    {managerName && (
                      <div className="text-xs text-slate-600 flex items-center gap-1.5 mb-2.5 font-semibold">
                        <GitFork className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                        <span>المسؤول المباشر: {managerName}</span>
                      </div>
                    )}

                    {/* Bio snippet */}
                    {emp.bioAr ? (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {emp.bioAr}
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400">
                        عضو كادر معتمد في منظومة سمارت مسار.
                      </p>
                    )}
                  </div>

                  {/* Card Footer: Privacy-Safe Email / Contact & Profile Action */}
                  <div className="pt-4 mt-5 border-t border-[#E2E8F0] flex items-center justify-between gap-2 text-xs">
                    {canShowEmail ? (
                      <span
                        className="flex items-center gap-1.5 text-[11px] text-[#0A192F] font-mono truncate"
                        dir="ltr"
                        data-testid={`team-card-email-${emp.id}`}
                      >
                        <Mail className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                        <span className="truncate">{emp.email}</span>
                      </span>
                    ) : (
                      <span
                        className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold"
                        data-testid={`team-card-email-hidden-${emp.id}`}
                      >
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>التواصل عبر القنوات الرسمية</span>
                      </span>
                    )}

                    {canOpenProfile ? (
                      <span className="text-xs font-black text-[#2563EB] hover:underline shrink-0">
                        عرض البطاقة ‹
                      </span>
                    ) : (
                      <span
                        className="text-[11px] font-bold text-slate-400 flex items-center gap-1 shrink-0"
                        data-testid={`team-card-profile-disabled-${emp.id}`}
                      >
                        <Lock className="w-3 h-3" />
                        <span>بطاقة مختصرة</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Switch to Separate Org Chart Page */}
        <div className="p-6 rounded-2xl bg-white border border-[#CBD5E1] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#EBF4FE] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shadow-2xs">
              <GitFork className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#0A192F]">
                استكشف الهيكل التنظيمي التفاعلي المرتبط بقاعدة البيانات
              </h4>
              <p className="text-xs text-slate-500">
                تصفح التفرعات الهرمية، الوحدات الاستشارية، ومستويات التبعية الإدارية على صفحة الهيكل المستقلة.
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
