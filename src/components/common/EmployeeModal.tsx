/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { EmployeeAvatar } from './EmployeeAvatar';
import {
  getEmployeeRoleCategory,
  normalizeEmployeeVisibility,
} from '../../utils/orgChart';
import {
  X,
  Building2,
  Mail,
  ShieldAlert,
  GitFork,
  Award,
  ExternalLink,
} from 'lucide-react';

export const EmployeeModal: React.FC = () => {
  const { selectedEmployee, setSelectedEmployee, departments, employees } = useApp();

  if (!selectedEmployee) return null;

  const normalized = normalizeEmployeeVisibility(selectedEmployee);

  // If public profile viewing is disabled for this employee, never render the modal
  if (normalized.showPublicProfile === false) {
    return null;
  }

  const department = departments.find((d) => d.id === normalized.departmentId);
  const manager = normalized.managerId
    ? employees.find((e) => e.id === normalized.managerId)
    : null;
  const roleCategory = getEmployeeRoleCategory(normalized);

  const roleCategoryLabelAr =
    roleCategory === 'executive'
      ? 'القيادة التنفيذية العليا • Executive Leadership'
      : roleCategory === 'advisor'
      ? 'منصب استشاري تنفيذي • Executive Advisory'
      : roleCategory === 'department_lead'
      ? 'قيادة إدارة / قسم • Department Leadership'
      : 'كادر تخصصي • Specialist Team';

  const canShowEmail =
    normalized.showPublicEmail === true &&
    Boolean(normalized.email && normalized.email.trim().length > 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="employee-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={() => setSelectedEmployee(null)}
    >
      <div
        className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-[#CBD5E1] overflow-hidden text-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Deep Navy */}
        <div className="bg-gradient-to-l from-[#0A192F] via-[#0F2547] to-[#1E3A8A] text-white p-6 relative border-b border-[#00D2FF]/30">
          <button
            type="button"
            onClick={() => setSelectedEmployee(null)}
            className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer border border-white/20"
            aria-label="إغلاق بطاقة الموظف"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Larger High-Clarity Avatar or Initials */}
            <EmployeeAvatar
              employee={normalized}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#0A192F] border-2 border-[#00D2FF] flex items-center justify-center text-2xl font-black text-[#00D2FF] shadow-lg overflow-hidden shrink-0"
            />

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#00D2FF]/15 border border-[#00D2FF]/40 text-[#00D2FF] text-[10px] font-bold">
                <Award className="w-3 h-3" />
                <span>{roleCategoryLabelAr}</span>
              </div>

              <h3 id="employee-modal-title" className="text-xl font-black text-white">
                {normalized.nameAr}
              </h3>
              <p className="text-xs text-slate-300 font-mono tracking-wide" dir="ltr">
                {normalized.nameEn}
              </p>
              <div className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-[#2563EB] text-white border border-[#00D2FF]/40 shadow-xs">
                {normalized.jobTitleAr}
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Bilingual Job Title Box */}
          {normalized.jobTitleEn && (
            <div className="p-3.5 rounded-2xl bg-[#F0F6FD] border border-[#BFDBFE] flex flex-col gap-0.5">
              <span className="text-[11px] font-bold text-slate-500">
                المسمى الوظيفي المعتمد (Official Job Title)
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#0A192F]">
                {normalized.jobTitleAr}
              </span>
              <span className="text-xs font-bold text-[#2563EB] font-mono" dir="ltr">
                {normalized.jobTitleEn}
              </span>
            </div>
          )}

          {/* Status info if unconfirmed */}
          {!normalized.isConfirmedPosition && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>تنويه تنظيمي:</strong> هذا العضو مسجل ضمن الكادر المؤسسي، والمسمى الوظيفي حالياً قيد التعيين.
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
            <div className="p-3.5 rounded-2xl border border-[#E2E8F0] bg-[#F8FBFF]">
              <span className="text-[11px] text-slate-500 block mb-1">القسم / الوحدة التنظيمية</span>
              <div className="flex items-center gap-2 font-bold text-[#0A192F]">
                <Building2 className="w-4 h-4 text-[#2563EB] shrink-0" />
                <span>{department?.nameAr || 'إدارة عامة'}</span>
              </div>
              {department?.nameEn && (
                <span className="text-[10px] text-slate-500 font-mono block mt-0.5" dir="ltr">
                  {department.nameEn}
                </span>
              )}
            </div>

            <div className="p-3.5 rounded-2xl border border-[#E2E8F0] bg-[#F8FBFF]">
              <span className="text-[11px] text-slate-500 block mb-1">المسؤول المباشر</span>
              <div className="flex items-center gap-2 font-bold text-[#0A192F]">
                <GitFork className="w-4 h-4 text-[#7C5CDE] shrink-0" />
                <span>{manager ? manager.nameAr : 'مجلس الإدارة / القيادة العليا'}</span>
              </div>
              {manager?.nameEn && (
                <span className="text-[10px] text-slate-500 font-mono block mt-0.5" dir="ltr">
                  {manager.nameEn}
                </span>
              )}
            </div>

            <div className="p-3.5 rounded-2xl border border-[#E2E8F0] bg-[#F8FBFF] sm:col-span-2">
              <span className="text-[11px] text-slate-500 block mb-1">قنوات التواصل والمراسلة</span>
              {canShowEmail ? (
                <a
                  href={`mailto:${normalized.email}`}
                  className="flex items-center gap-2 font-bold text-[#2563EB] hover:underline"
                  dir="ltr"
                >
                  <Mail className="w-4 h-4 text-[#2563EB] shrink-0" />
                  <span>{normalized.email}</span>
                </a>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>البريد المباشر غير معروض للعامة حفاظاً على الخصوصية</span>
                  </span>
                  <Link
                    to="/contact"
                    onClick={() => setSelectedEmployee(null)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#2563EB] hover:underline shrink-0"
                  >
                    <span>مراسلة المؤسسة</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Bio section if available */}
          {normalized.bioAr ? (
            <div>
              <h4 className="text-xs font-bold text-slate-500 mb-1">نبذة مهنية موجزة</h4>
              <p className="text-xs sm:text-sm text-[#0A192F] leading-relaxed p-3.5 bg-[#F0F6FD] rounded-2xl border border-[#E2E8F0]">
                {normalized.bioAr}
              </p>
            </div>
          ) : (
            <div className="text-xs text-slate-600 p-3.5 bg-[#F0F6FD] rounded-2xl border border-[#E2E8F0]">
              من الكفاءات المعتمدة في سجل كوادر شركة سمارت مسار ضمن {department?.nameAr || 'الهيكل المؤسسي'}.
            </div>
          )}

          {/* Action button */}
          <div className="pt-2 flex items-center justify-end">
            <button
              type="button"
              onClick={() => setSelectedEmployee(null)}
              className="px-6 py-2.5 text-xs font-bold bg-[#0A192F] hover:bg-[#2563EB] text-white rounded-xl transition-colors cursor-pointer"
            >
              إغلاق البطاقة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
