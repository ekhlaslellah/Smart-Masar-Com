/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import { getDepartmentStats } from '../../utils/orgChart';
import { EmployeeAvatar } from '../common/EmployeeAvatar';
import {
  GitFork,
  Building2,
} from 'lucide-react';

export const AdminOrg: React.FC = () => {
  const { employees, departments, updateEmployee, showToast } = useApp();

  const deptStats = getDepartmentStats(employees, departments);

  const handleManagerChange = (employeeId: string, newManagerId: string | null) => {
    updateEmployee(employeeId, { managerId: newManagerId });
    showToast('تم تحديث خط التبعية الإدارية بنجاح');
  };

  const handleDepartmentChange = (employeeId: string, newDeptId: string) => {
    updateEmployee(employeeId, { departmentId: newDeptId });
    showToast('تم نقل الموظف إلى القسم الجديد بنجاح');
  };

  return (
    <div className="space-y-8 text-right bg-white">
      <div>
        <h2 className="text-xl font-bold text-[#142B4F]">إدارة خطوط التبعية والهيكل التنظيمي</h2>
        <p className="text-xs text-slate-500">
          تعديل التبعيات الإدارية، نقل الموظفين بين الدوائر، وفحص توازن الأقسام.
        </p>
      </div>

      {/* Department Distribution Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {deptStats.map(({ department, count, confirmedCount }) => (
          <div
            key={department.id}
            className="p-4 rounded-2xl bg-white border border-[#CBD5E1] shadow-2xs flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-bold text-[#142B4F] block">
                {department.nameAr}
              </span>
              <span className="text-[11px] text-slate-400 font-semibold" dir="ltr">
                {department.nameEn}
              </span>
              <div className="mt-2 text-xs font-mono text-[#2563EB] font-bold">
                {count} أعضاء ({confirmedCount} معتمد)
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#F5F8FC] border border-[#CBD5E1] flex items-center justify-center text-[#2563EB]">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Reporting lines cards */}
      <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-2xs overflow-hidden">
        <div className="p-4 bg-[#F5F8FC] border-b border-[#E2E8F0]">
          <h3 className="text-sm font-bold text-[#142B4F] flex items-center gap-2">
            <GitFork className="w-4 h-4 text-[#2563EB]" />
            <span>جدول تحديد التبعية الإدارية والأقسام</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            تنعكس هذه التعديلات فورياً في المخطط الشجري التفاعلي لصفحة الهيكل التنظيمي العامة.
          </p>
        </div>

        <div className="divide-y divide-[#F1F5F9]">
          {employees.map((emp) => {
            const isRoot = emp.id === 'emp-ahmed-alabed';
            return (
              <div
                key={emp.id}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#F5F8FC]/50 transition-colors"
              >
                {/* Employee Info */}
                <div className="flex items-center gap-3">
                  <EmployeeAvatar
                    employee={emp}
                    className="w-10 h-10 rounded-xl bg-[#F5F8FC] border border-[#CBD5E1] text-[#2563EB] flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden shadow-2xs"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#142B4F]">{emp.nameAr}</span>
                      {isRoot && (
                        <span className="text-[9px] font-bold bg-[#142B4F] text-white px-1.5 py-0.2 rounded">
                          المدير العام
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500">{emp.jobTitleAr}</div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  {/* Department selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">القسم:</span>
                    <select
                      value={emp.departmentId}
                      onChange={(e) => handleDepartmentChange(emp.id, e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-[#CBD5E1] bg-white text-xs font-semibold focus:outline-none focus:border-[#2563EB]"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.nameAr}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Manager selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">المسؤول المباشر:</span>
                    {isRoot ? (
                      <span className="px-3 py-1.5 bg-[#F5F8FC] border border-[#CBD5E1] text-[#142B4F] rounded-lg font-bold text-xs">
                        القيادة العليا (رئيسي)
                      </span>
                    ) : (
                      <select
                        value={emp.managerId || ''}
                        onChange={(e) =>
                          handleManagerChange(emp.id, e.target.value ? e.target.value : null)
                        }
                        className="px-2.5 py-1.5 rounded-lg border border-[#CBD5E1] bg-white text-xs font-semibold focus:outline-none focus:border-[#2563EB]"
                      >
                        <option value="">لا يوجد مسؤول مباشر</option>
                        {employees
                          .filter((candidate) => candidate.id !== emp.id)
                          .map((candidate) => (
                            <option key={candidate.id} value={candidate.id}>
                              {candidate.nameAr} ({candidate.jobTitleAr})
                            </option>
                          ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
