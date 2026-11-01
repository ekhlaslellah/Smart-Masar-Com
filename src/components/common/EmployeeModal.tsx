/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import { EmployeeAvatar } from './EmployeeAvatar';
import { X, Building2, Mail, ShieldAlert, GitFork, Link as LinkIcon } from 'lucide-react';

export const EmployeeModal: React.FC = () => {
  const { selectedEmployee, setSelectedEmployee, departments, employees } = useApp();

  if (!selectedEmployee) return null;

  const department = departments.find((d) => d.id === selectedEmployee.departmentId);
  const manager = employees.find((e) => e.id === selectedEmployee.managerId);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="employee-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-[#CBD5E1] overflow-hidden text-right">
        {/* Header - Deep Navy */}
        <div className="bg-gradient-to-l from-[#0A192F] to-[#1E3A8A] text-white p-6 relative border-b border-[#00D2FF]/30">
          <button
            type="button"
            onClick={() => setSelectedEmployee(null)}
            className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer border border-white/20"
            aria-label="إغلاق بطاقة الموظف"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-4">
            {/* Avatar or Placeholder */}
            <EmployeeAvatar
              employee={selectedEmployee}
              className="w-16 h-16 rounded-2xl bg-[#0A192F] border-2 border-[#00D2FF] flex items-center justify-center text-xl font-black text-[#00D2FF] shadow-md overflow-hidden shrink-0"
            />

            <div>
              <h3 id="employee-modal-title" className="text-xl font-bold text-white">
                {selectedEmployee.nameAr}
              </h3>
              <p className="text-xs text-slate-300 font-mono tracking-wide mt-0.5" dir="ltr">
                {selectedEmployee.nameEn}
              </p>
              <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-0.5 rounded-full text-xs font-bold bg-[#00D2FF] text-[#0A192F] shadow-xs">
                {selectedEmployee.jobTitleAr}
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Status info */}
          {!selectedEmployee.isConfirmedPosition && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>تنويه تنظيمي:</strong> هذا العضو من الكوادر التأسيسية المسجلة، والمسمى الوظيفي والمهام المحددة حالياً "قيد التعيين" ضمن مشروع الهيكلة التدريبية لحين اعتماد التوزيع النهائي في لوحة الإدارة.
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
            <div className="p-3.5 rounded-2xl border border-[#E2E8F0] bg-[#F0F6FD]">
              <span className="text-[11px] text-slate-500 block mb-1">القسم المؤسسي</span>
              <div className="flex items-center gap-2 font-bold text-[#0A192F]">
                <Building2 className="w-4 h-4 text-[#2563EB]" />
                <span>{department?.nameAr || 'غير محدد'}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl border border-[#E2E8F0] bg-[#F0F6FD]">
              <span className="text-[11px] text-slate-500 block mb-1">المسؤول المباشر</span>
              <div className="flex items-center gap-2 font-bold text-[#0A192F]">
                <GitFork className="w-4 h-4 text-[#7C5CDE]" />
                <span>{manager ? manager.nameAr : 'مجلس الإدارة / رئيسي'}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl border border-[#E2E8F0] bg-[#F0F6FD] sm:col-span-2">
              <span className="text-[11px] text-slate-500 block mb-1">البريد المؤسسي</span>
              <div className="flex items-center gap-2 font-semibold text-[#0A192F]" dir="ltr">
                <Mail className="w-4 h-4 text-[#2563EB]" />
                <span>{selectedEmployee.email || 'team@smartmasar.edu'}</span>
              </div>
            </div>

            {selectedEmployee.avatarUrl && (
              <div className="p-3.5 rounded-2xl border border-[#E2E8F0] bg-[#F0F6FD] sm:col-span-2">
                <span className="text-[11px] text-slate-500 block mb-1">رابط الصورة المسجل (Image URL)</span>
                <div className="flex items-center gap-1.5 text-xs text-slate-700 truncate" dir="ltr">
                  <LinkIcon className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                  <span className="truncate">{selectedEmployee.avatarUrl}</span>
                </div>
              </div>
            )}
          </div>

          {/* Bio section if available */}
          {selectedEmployee.bioAr ? (
            <div>
              <h4 className="text-xs font-bold text-slate-500 mb-1">نبذة مهنية موجزة</h4>
              <p className="text-xs sm:text-sm text-[#0A192F] leading-relaxed p-3.5 bg-[#F0F6FD] rounded-2xl border border-[#E2E8F0]">
                {selectedEmployee.bioAr}
              </p>
            </div>
          ) : (
            <div className="text-xs text-slate-400 p-3 bg-[#F0F6FD] rounded-2xl border border-dashed border-[#CBD5E1]">
              لم يتم تدوين نبذة إضافية لهذا الموظف (يمكن تعديل النبذة عبر لوحة الإدارة).
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
