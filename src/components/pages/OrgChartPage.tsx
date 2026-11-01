/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { buildOrgTree } from '../../utils/orgChart';
import { EmployeeAvatar } from '../common/EmployeeAvatar';
import { PageHeroImage } from '../common/PageHeroImage';
import {
  GitFork,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Building2,
  Layers,
  Crown,
  Settings,
  ChevronLeft,
} from 'lucide-react';

export const OrgChartPage: React.FC = () => {
  const { employees, departments, setSelectedEmployee } = useApp();
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [viewMode, setViewMode] = useState<'tree' | 'departments'>('tree');

  const rootNode = buildOrgTree(employees, departments);

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(130, Math.max(70, prev + delta)));
  };

  const getDept = (deptId: string) => {
    return departments.find((d) => d.id === deptId);
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
            <span className="text-[#00D2FF]">الهيكل التنظيمي</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E3A8A]/70 border border-[#00D2FF]/30 text-[#00D2FF] text-xs font-bold shadow-xs">
                <GitFork className="w-3.5 h-3.5" />
                <span>الهيكل الإداري التفاعلي • Organizational Hierarchy</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                الهيكل التنظيمي لشركة سمارت مسار
              </h1>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                مخطط تسلسلي تفاعلي يوضح المستويات القيادية، الأقسام التخصصية، وخطوط التبعية الإدارية لكافة أعضاء الفريق. انقر على أي بطاقة لعرض الملف الشخصي الكامل.
              </p>
            </div>

            <PageHeroImage pageId="page-organization" />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Control Bar: View Mode, Zoom, and Legend */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D6E4F0] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          {/* View Mode Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-[#F0F6FD] rounded-xl border border-[#CBD5E1]">
            <button
              type="button"
              onClick={() => setViewMode('tree')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'tree'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-slate-600 hover:text-[#0A192F]'
              }`}
            >
              <GitFork className="w-4 h-4" />
              <span>المخطط الهرمي المتسلسل</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('departments')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'departments'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-slate-600 hover:text-[#0A192F]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>توزيع الأقسام والدوائر</span>
            </button>
          </div>

          {/* Legend */}
          <div className="hidden lg:flex items-center gap-4 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0A192F]" />
              <span>المدير العام</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>منصب معتمد</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>قيد التعيين</span>
            </div>
          </div>

          {/* Zoom & Admin Edit shortcut */}
          <div className="flex items-center gap-2">
            {viewMode === 'tree' && (
              <div className="flex items-center gap-1 bg-[#F0F6FD] p-1 rounded-xl border border-[#CBD5E1]">
                <button
                  type="button"
                  onClick={() => handleZoom(10)}
                  className="p-1.5 text-slate-600 hover:text-[#2563EB] rounded-lg hover:bg-white cursor-pointer"
                  aria-label="تكبير المخطط"
                  title="تكبير"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-bold px-2 text-slate-700">{zoomLevel}%</span>
                <button
                  type="button"
                  onClick={() => handleZoom(-10)}
                  className="p-1.5 text-slate-600 hover:text-[#2563EB] rounded-lg hover:bg-white cursor-pointer"
                  aria-label="تصغير المخطط"
                  title="تصغير"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(100)}
                  className="p-1.5 text-slate-600 hover:text-[#2563EB] rounded-lg hover:bg-white cursor-pointer"
                  aria-label="إعادة الضبط"
                  title="إعادة ضبط الحجم"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <Link
              to="/admin/organization"
              className="px-4 py-2 bg-white hover:bg-slate-50 text-[#0A192F] border border-[#CBD5E1] text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>تعديل التبعيات في الإدارة</span>
            </Link>
          </div>
        </div>

        {/* Main Interactive Canvas Area */}
        {viewMode === 'tree' ? (
          <div className="bg-white border border-[#D6E4F0] rounded-3xl p-6 sm:p-10 overflow-x-auto min-h-[550px] shadow-sm">
            <div
              className="transition-transform duration-200 origin-top flex flex-col items-center"
              style={{ transform: `scale(${zoomLevel / 100})` }}
            >
              {rootNode && (
                <div className="w-full flex flex-col items-center">
                  {/* Level 0: Dr. Ahmed Alabed (Root - General Manager) */}
                  <div className="relative flex flex-col items-center">
                    <div
                      onClick={() => setSelectedEmployee(rootNode)}
                      className="w-80 bg-white rounded-2xl p-5 shadow-md border-2 border-[#2563EB] hover:shadow-lg transition-all cursor-pointer group text-right relative"
                    >
                      <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-[#2563EB] to-[#1E3A8A] text-white text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                        <Crown className="w-3.5 h-3.5 text-amber-300" />
                        <span>المدير العام • القيادة العليا</span>
                      </div>

                      <div className="flex items-center gap-4 mt-1">
                        <EmployeeAvatar
                          employee={rootNode}
                          className="w-14 h-14 rounded-xl bg-[#0A192F] text-[#00D2FF] flex items-center justify-center text-lg font-black shrink-0 shadow-md overflow-hidden border border-[#00D2FF]/40"
                        />

                        <div>
                          <h3 className="text-base font-bold text-[#0A192F] group-hover:text-[#2563EB] transition-colors">
                            {rootNode.nameAr}
                          </h3>
                          <p className="text-[11px] text-slate-400 font-medium font-mono" dir="ltr">
                            {rootNode.nameEn}
                          </p>
                          <div className="mt-1 text-xs font-bold text-[#2563EB]">
                            {rootNode.jobTitleAr}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-slate-500">
                        <span>الإدارة العامة والتنفيذية</span>
                        <span className="text-[#2563EB] font-bold group-hover:underline">عرض الملف الشخصي ‹</span>
                      </div>
                    </div>

                    {/* Vertical Connector Line from GM */}
                    {rootNode.children.length > 0 && (
                      <div className="w-0.5 h-10 bg-[#2563EB]" />
                    )}
                  </div>

                  {/* Level 1: Horizontal Bar & Child Nodes */}
                  {rootNode.children.length > 0 && (
                    <div className="w-full flex flex-col items-center">
                      {/* Horizontal Connector Line */}
                      <div className="hidden md:block w-4/5 h-0.5 bg-[#2563EB] relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#00D2FF] border-2 border-[#2563EB]" />
                      </div>

                      {/* Children Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 pt-4 w-full justify-items-center">
                        {rootNode.children.map((childNode) => {
                          const dept = getDept(childNode.departmentId);
                          return (
                            <div
                              key={childNode.id}
                              className="flex flex-col items-center w-full max-w-[240px]"
                            >
                              {/* Stem connector */}
                              <div className="hidden md:block w-0.5 h-4 bg-[#2563EB]" />

                              <div
                                onClick={() => setSelectedEmployee(childNode)}
                                className="w-full bg-white rounded-2xl p-4 shadow-sm hover:shadow-md border border-[#CBD5E1] hover:border-[#2563EB] transition-all cursor-pointer group text-right flex flex-col justify-between"
                              >
                                <div>
                                  <div className="flex items-start justify-between gap-2 mb-3">
                                    <EmployeeAvatar
                                      employee={childNode}
                                      className="w-11 h-11 rounded-xl bg-[#EBF4FE] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center text-xs font-black shrink-0 overflow-hidden"
                                    />

                                    <div className="flex flex-col items-end">
                                      {childNode.isConfirmedPosition ? (
                                        <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                                          معتمد
                                        </span>
                                      ) : (
                                        <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                                          قيد التعيين
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <h4 className="text-sm font-bold text-[#0A192F] group-hover:text-[#2563EB] transition-colors">
                                    {childNode.nameAr}
                                  </h4>
                                  <p className="text-[10px] text-slate-400 font-mono" dir="ltr">
                                    {childNode.nameEn}
                                  </p>

                                  <div className="mt-2 text-xs font-bold text-[#0A192F] bg-[#F0F6FD] border border-[#E2E8F0] px-2 py-0.5 rounded-lg inline-block">
                                    {childNode.jobTitleAr}
                                  </div>
                                </div>

                                <div className="mt-3 pt-2.5 border-t border-[#F1F5F9] text-[10px] text-slate-500 flex items-center justify-between">
                                  <span className="truncate max-w-[120px]">
                                    {dept?.nameAr || 'قسم عام'}
                                  </span>
                                  <span className="text-[#2563EB] font-bold">تفاصيل ‹</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Departmental Clusters View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept) => {
              const deptMembers = employees.filter((e) => e.departmentId === dept.id);
              return (
                <div
                  key={dept.id}
                  className="glass-card rounded-2xl p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9] mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#EBF4FE] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-bold text-[#0A192F]">{dept.nameAr}</h3>
                      </div>
                      <span className="text-xs font-bold text-slate-500 font-mono">
                        {deptMembers.length} أعضاء
                      </span>
                    </div>

                    {deptMembers.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center italic">
                        لا يوجد أعضاء معينون حالياً في هذا القسم
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {deptMembers.map((emp) => (
                          <div
                            key={emp.id}
                            onClick={() => setSelectedEmployee(emp)}
                            className="p-3 rounded-xl bg-[#F0F6FD] hover:bg-slate-100 border border-[#E2E8F0] transition-colors cursor-pointer flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <EmployeeAvatar
                                employee={emp}
                                className="w-9 h-9 rounded-lg bg-white border border-[#CBD5E1] text-[#2563EB] flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden"
                              />
                              <div>
                                <div className="text-xs font-bold text-[#0A192F]">
                                  {emp.nameAr}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  {emp.jobTitleAr}
                                </div>
                              </div>
                            </div>

                            <div>
                              {emp.isConfirmedPosition ? (
                                <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                                  معتمد
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                                  قيد التعيين
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#F1F5F9] text-[11px] text-slate-400 flex items-center justify-between">
                    <span dir="ltr">{dept.nameEn}</span>
                    <span>التبعية: الإدارة العامة</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
