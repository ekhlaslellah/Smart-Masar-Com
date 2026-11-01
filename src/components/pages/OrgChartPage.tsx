/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  SMART_MASAR_ORG_STRUCTURE,
  getOrgStructureSummary,
  filterOrgDepartments,
  OrgDepartmentUnit,
} from '../../utils/orgChart';
import { PageHeroImage } from '../common/PageHeroImage';
import {
  GitFork,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Building2,
  Crown,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Users,
  Search,
  ShieldAlert,
  UserCheck,
  Mail,
  X,
  Briefcase,
  Layers,
} from 'lucide-react';

interface SelectedOrgMember {
  nameEn: string;
  nameAr: string;
  titleEn: string;
  titleAr: string;
  departmentNameAr: string;
  departmentNameEn: string;
  reportsToEn: string;
  reportsToAr: string;
  levelLabelAr: string;
  levelLabelEn: string;
  initials: string;
  email: string;
  bioAr: string;
  avatarUrl?: string;
}

export const OrgChartPage: React.FC = () => {
  const { employees } = useApp();
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMember, setSelectedMember] = useState<SelectedOrgMember | null>(null);

  // Expandable state for the 9 departments (first 3 expanded by default so visitors immediately see the 3-level hierarchy)
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    SMART_MASAR_ORG_STRUCTURE.departments.forEach((dept, idx) => {
      initial[dept.id] = idx < 3;
    });
    return initial;
  });

  const summary = useMemo(() => getOrgStructureSummary(SMART_MASAR_ORG_STRUCTURE), []);

  const filteredDepartments = useMemo(() => {
    return filterOrgDepartments(SMART_MASAR_ORG_STRUCTURE.departments, searchQuery);
  }, [searchQuery]);

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(125, Math.max(75, prev + delta)));
  };

  const toggleDepartment = (deptId: string) => {
    setExpandedDepts((prev) => ({
      ...prev,
      [deptId]: !prev[deptId],
    }));
  };

  const setAllDepartmentsExpanded = (expanded: boolean) => {
    const next: Record<string, boolean> = {};
    SMART_MASAR_ORG_STRUCTURE.departments.forEach((dept) => {
      next[dept.id] = expanded;
    });
    setExpandedDepts(next);
  };

  const expandedCount = useMemo(() => {
    return SMART_MASAR_ORG_STRUCTURE.departments.filter((d) => expandedDepts[d.id]).length;
  }, [expandedDepts]);

  // Helper to resolve uploaded avatar if linked to an existing employee record
  const getLinkedAvatarUrl = (linkedEmployeeId?: string): string | undefined => {
    if (!linkedEmployeeId) return undefined;
    const found = employees.find((e) => e.id === linkedEmployeeId);
    return found?.avatarUrl ? found.avatarUrl : undefined;
  };

  const { ceo } = SMART_MASAR_ORG_STRUCTURE;
  const ceoAvatarUrl = getLinkedAvatarUrl(ceo.linkedEmployeeId);

  const openCeoModal = () => {
    setSelectedMember({
      nameEn: ceo.nameEn,
      nameAr: ceo.nameAr,
      titleEn: ceo.titleEn,
      titleAr: ceo.titleAr,
      departmentNameAr: ceo.departmentNameAr,
      departmentNameEn: ceo.departmentNameEn,
      reportsToEn: 'Board of Directors',
      reportsToAr: 'مجلس الإدارة',
      levelLabelAr: 'الإدارة العليا التنفيذية',
      levelLabelEn: 'Executive Leadership (CEO)',
      initials: ceo.initials,
      email: ceo.email,
      bioAr: ceo.bioAr,
      avatarUrl: ceoAvatarUrl,
    });
  };

  const openHeadModal = (dept: OrgDepartmentUnit) => {
    setSelectedMember({
      nameEn: dept.head.nameEn,
      nameAr: dept.head.nameAr,
      titleEn: dept.head.titleEn,
      titleAr: dept.head.titleAr,
      departmentNameAr: dept.departmentNameAr,
      departmentNameEn: dept.departmentNameEn,
      reportsToEn: `${ceo.nameEn} (${ceo.titleEn})`,
      reportsToAr: `${ceo.nameAr} (${ceo.titleAr})`,
      levelLabelAr: 'قيادات ورؤساء الأقسام',
      levelLabelEn: 'Department Head',
      initials: dept.head.initials,
      email: dept.head.email,
      bioAr: dept.head.bioAr,
      avatarUrl: getLinkedAvatarUrl(dept.head.linkedEmployeeId),
    });
  };

  const openStaffModal = (dept: OrgDepartmentUnit, staffIdx: 0 | 1) => {
    const member = dept.staff[staffIdx];
    setSelectedMember({
      nameEn: member.nameEn,
      nameAr: member.nameAr,
      titleEn: member.titleEn,
      titleAr: member.titleAr,
      departmentNameAr: dept.departmentNameAr,
      departmentNameEn: dept.departmentNameEn,
      reportsToEn: `${dept.head.nameEn} (${dept.head.titleEn})`,
      reportsToAr: `${dept.head.nameAr} (${dept.head.titleAr})`,
      levelLabelAr: 'الكوادر التخصصية والتنفيذية',
      levelLabelEn: 'Department Specialist / Staff',
      initials: member.initials,
      email: member.email,
      bioAr: member.bioAr,
    });
  };

  return (
    <div className="space-y-8 sm:space-y-10 text-right pb-8">
      {/* Header Banner - Deep Navy & Electric Cyan Brand Identity */}
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
            <span className="text-[#00D2FF]">الهيكل التنظيمي • Organizational Structure</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#1E3A8A]/80 border border-[#00D2FF]/40 text-[#00D2FF] text-xs font-bold shadow-xs">
                <GitFork className="w-3.5 h-3.5" />
                <span>المخطط التنظيمي الهرمي التفاعلي • Interactive Organizational Chart</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                الهيكل التنظيمي لشركة سمارت مسار (Smart Masar)
              </h1>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                يوضح هذا المخطط الهرمي التفاعلي هيكلية القيادة العليا برئاسة الرئيس التنفيذي (CEO)، ورؤساء الأقسام التسعة، والفرق التخصصية التابعة لكل قسم. يمكنك توسيع أو طي بطاقة كل قسم لاستعراض الموظفين التابعين له.
              </p>

              {/* Quick Hierarchy Counters */}
              <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-[#0A192F]/80 border border-[#00D2FF]/30">
                  <div className="text-xl font-black text-[#00D2FF]">{summary.totalExecutives}</div>
                  <div className="text-[11px] text-slate-300 font-bold">الرئيس التنفيذي (CEO)</div>
                </div>
                <div className="p-3 rounded-xl bg-[#0A192F]/80 border border-[#00D2FF]/30">
                  <div className="text-xl font-black text-[#00D2FF]">
                    {summary.totalDepartmentHeads}
                  </div>
                  <div className="text-[11px] text-slate-300 font-bold">
                    رؤساء الأقسام (Heads)
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#0A192F]/80 border border-[#00D2FF]/30">
                  <div className="text-xl font-black text-[#00D2FF]">{summary.totalStaff}</div>
                  <div className="text-[11px] text-slate-300 font-bold">
                    موظفو الأقسام (Staff)
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#0A192F]/80 border border-[#00D2FF]/30">
                  <div className="text-xl font-black text-white">{summary.totalMembers}</div>
                  <div className="text-[11px] text-slate-300 font-bold">
                    إجمالي الكادر التنظيمي
                  </div>
                </div>
              </div>
            </div>

            <PageHeroImage pageId="page-organization" />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Mandatory Educational & Fictional Data Disclosure */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#BFDBFE] shadow-xs flex items-start gap-3.5 text-xs sm:text-sm text-[#0A192F]">
          <ShieldAlert className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-bold text-[#2563EB]">
              تنويه تعليمي (بيانات افتراضية لأغراض المشروع التدريبي):
            </strong>{' '}
            جميع الأسماء والمناصب الإدارية والمسميات الوظيفية الواردة في هذا الهيكل التنظيمي — بما في ذلك الإدارة العليا، رؤساء الأقسام التسعة، والموظفون التابعون لكل قسم — هي{' '}
            <strong>بيانات افتراضية محاكية</strong> مصممة حصرياً لأغراض المشروع التعليمي والتدريبي لشركة سمارت مسار (Smart Masar).
          </div>
        </div>

        {/* Interactive Toolbar: Search, Expand/Collapse All, and Zoom */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D6E4F0] shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم أو المسمى الوظيفي (بالعربية أو الإنجليزية)..."
              aria-label="البحث في الهيكل التنظيمي"
              className="w-full pr-10 pl-4 py-2.5 text-xs rounded-xl border border-[#CBD5E1] bg-[#F0F6FD] focus:bg-white focus:outline-none focus:border-[#2563EB] text-[#0A192F]"
            />
          </div>

          {/* Expand / Collapse All & Zoom Controls */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAllDepartmentsExpanded(true)}
                className="px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <ChevronDown className="w-4 h-4 text-[#00D2FF]" />
                <span>توسيع جميع الأقسام (9)</span>
              </button>

              <button
                type="button"
                onClick={() => setAllDepartmentsExpanded(false)}
                className="px-3.5 py-2 rounded-xl bg-[#0A192F] hover:bg-[#1E3A8A] text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <ChevronUp className="w-4 h-4 text-[#00D2FF]" />
                <span>طي جميع الأقسام</span>
              </button>
            </div>

            {/* Zoom Control */}
            <div className="hidden md:flex items-center gap-1 bg-[#F0F6FD] p-1 rounded-xl border border-[#CBD5E1]">
              <button
                type="button"
                onClick={() => handleZoom(10)}
                className="p-1.5 text-slate-600 hover:text-[#2563EB] rounded-lg hover:bg-white cursor-pointer"
                aria-label="تكبير المخطط"
                title="تكبير"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold px-2 text-[#0A192F]">
                {zoomLevel}%
              </span>
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
          </div>
        </div>

        {/* Main Interactive Hierarchical Chart Container */}
        <div className="bg-gradient-to-b from-white via-[#F8FBFF] to-[#F0F6FD] border border-[#D6E4F0] rounded-3xl p-4 sm:p-8 lg:p-10 shadow-sm overflow-x-auto">
          <div
            className="transition-transform duration-200 origin-top flex flex-col items-center w-full"
            style={{ transform: `scale(${zoomLevel / 100})` }}
          >
            {/* ============================================================ */}
            {/* LEVEL 1: EXECUTIVE LEADERSHIP — CHIEF EXECUTIVE OFFICER (CEO) */}
            {/* ============================================================ */}
            <div className="w-full flex flex-col items-center">
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#0A192F] text-[#00D2FF] border border-[#00D2FF]/50 text-[11px] font-black tracking-wide mb-3 shadow-sm">
                <Crown className="w-3.5 h-3.5 text-[#00D2FF]" />
                <span>المستوى القيادي الأول • Executive Management (CEO)</span>
              </div>

              <div className="w-full max-w-xl bg-gradient-to-l from-[#0A192F] via-[#0F2547] to-[#1E3A8A] text-white rounded-3xl p-6 sm:p-7 shadow-xl border-2 border-[#00D2FF] relative overflow-hidden">
                {/* Subtle Cyan Glow */}
                <div
                  className="absolute -top-12 -left-12 w-36 h-36 rounded-full opacity-20 pointer-events-none"
                  style={{ background: 'radial-gradient(circle, #00D2FF 0%, transparent 70%)' }}
                />

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
                  <div className="flex items-center gap-4">
                    {/* CEO Avatar / Initials */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#071324] border-2 border-[#00D2FF] text-[#00D2FF] flex items-center justify-center text-xl sm:text-2xl font-black shrink-0 shadow-[0_0_20px_rgba(0,210,255,0.3)] overflow-hidden">
                      {ceoAvatarUrl ? (
                        <img
                          src={ceoAvatarUrl}
                          alt={ceo.nameEn}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span dir="ltr">{ceo.initials}</span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#00D2FF]/15 border border-[#00D2FF]/40 text-[#00D2FF] text-[10px] font-bold">
                        <span>الإدارة العليا • Top Executive</span>
                      </div>
                      <h2
                        className="text-xl sm:text-2xl font-black text-white tracking-tight"
                        dir="ltr"
                      >
                        {ceo.nameEn}
                      </h2>
                      <p className="text-xs sm:text-sm font-bold text-slate-200">{ceo.nameAr}</p>
                    </div>
                  </div>

                  <div className="w-full sm:w-auto flex flex-col sm:items-end gap-1.5 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/15">
                    <span
                      className="px-3.5 py-1.5 rounded-xl bg-[#2563EB] text-white border border-[#00D2FF]/60 text-xs sm:text-sm font-black shadow-xs inline-block"
                      dir="ltr"
                    >
                      {ceo.titleEn}
                    </span>
                    <span className="text-xs font-bold text-[#00D2FF]">
                      {ceo.titleAr} — {ceo.departmentNameAr}
                    </span>
                  </div>
                </div>

                {/* CEO Card Footer Actions */}
                <div className="mt-5 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Layers className="w-4 h-4 text-[#00D2FF]" />
                    <span>يشرف مباشرة على 9 أقسام رئيسية و18 كادراً تخصصياً</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={openCeoModal}
                      className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold transition-colors cursor-pointer"
                    >
                      عرض البطاقة القيادية
                    </button>
                  </div>
                </div>
              </div>

              {/* Vertical Connector Trunk from CEO to Department Heads */}
              <div className="flex flex-col items-center">
                <div className="w-1 h-10 bg-gradient-to-b from-[#00D2FF] to-[#2563EB]" />
                <div className="px-4 py-1.5 rounded-full bg-[#0A192F] text-white border border-[#2563EB] text-[11px] font-bold shadow-sm flex items-center gap-2">
                  <GitFork className="w-3.5 h-3.5 text-[#00D2FF]" />
                  <span>
                    المستوى القيادي الثاني: رؤساء الأقسام التسعة (9 Department Heads) —{' '}
                    <span className="text-[#00D2FF]">{expandedCount} أقسام موسّعة حالياً</span>
                  </span>
                </div>
                <div className="w-1 h-8 bg-[#2563EB]" />
              </div>

              {/* Horizontal Tree Distribution Line on Desktop */}
              <div className="hidden lg:block w-[92%] h-1 bg-gradient-to-r from-[#1E3A8A] via-[#00D2FF] to-[#1E3A8A] rounded-full relative mb-2">
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#00D2FF] border-2 border-[#0A192F] shadow-sm" />
              </div>
            </div>

            {/* ============================================================ */}
            {/* LEVEL 2 & LEVEL 3: 9 DEPARTMENT HEADS + 2 STAFF UNDER EACH   */}
            {/* ============================================================ */}
            {filteredDepartments.length === 0 ? (
              <div className="w-full max-w-lg p-10 text-center bg-white rounded-2xl border border-dashed border-[#CBD5E1] my-6">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-[#0A192F]">
                  لا توجد أقسام أو كوادر مطابقة لعبارة البحث "{searchQuery}"
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-3 px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold cursor-pointer"
                >
                  إظهار جميع الأقسام التسعة
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full pt-2">
                {filteredDepartments.map((dept) => {
                  const isExpanded = Boolean(expandedDepts[dept.id]) || Boolean(searchQuery.trim());
                  const headAvatarUrl = getLinkedAvatarUrl(dept.head.linkedEmployeeId);

                  return (
                    <div
                      key={dept.id}
                      data-testid={`org-dept-card-${dept.code}`}
                      className="flex flex-col items-center w-full"
                    >
                      {/* Vertical Branch Connector from Horizontal Trunk */}
                      <div className="hidden lg:flex flex-col items-center">
                        <div className="w-0.5 h-5 bg-[#2563EB]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#00D2FF] border-2 border-[#0A192F] -mt-1 mb-1" />
                      </div>

                      {/* Department Head Card (Level 2) */}
                      <div
                        className={`w-full rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm ${
                          isExpanded
                            ? 'bg-white border-[#2563EB] ring-2 ring-[#2563EB]/15 shadow-md'
                            : 'bg-white border-[#CBD5E1] hover:border-[#2563EB]'
                        }`}
                      >
                        {/* Top Navy Header Strip */}
                        <div className="bg-[#0A192F] text-white px-4 py-3 border-b border-[#1E3A8A] flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-6 h-6 rounded-lg bg-[#1E3A8A] border border-[#00D2FF]/50 text-[#00D2FF] text-[11px] font-black flex items-center justify-center shrink-0 font-mono"
                              dir="ltr"
                            >
                              {dept.code}
                            </span>
                            <div className="truncate">
                              <h3 className="text-xs font-bold text-white truncate">
                                {dept.departmentNameAr}
                              </h3>
                              <p
                                className="text-[10px] text-[#00D2FF] font-mono truncate"
                                dir="ltr"
                              >
                                {dept.departmentNameEn}
                              </p>
                            </div>
                          </div>

                          <span className="px-2 py-0.5 rounded-md bg-[#2563EB]/30 border border-[#00D2FF]/30 text-[#00D2FF] text-[10px] font-bold shrink-0">
                            قسم #{dept.code}
                          </span>
                        </div>

                        {/* Department Head Details Body */}
                        <div className="p-5 space-y-4">
                          <div className="flex items-start gap-3.5">
                            {/* Avatar / Initials */}
                            <button
                              type="button"
                              onClick={() => openHeadModal(dept)}
                              className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#0A192F] to-[#1E3A8A] text-[#00D2FF] border border-[#00D2FF]/50 flex items-center justify-center text-sm font-black shrink-0 shadow-sm overflow-hidden cursor-pointer"
                              title="عرض البطاقة التفصيلية لرئيسة القسم"
                            >
                              {headAvatarUrl ? (
                                <img
                                  src={headAvatarUrl}
                                  alt={dept.head.nameEn}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span dir="ltr">{dept.head.initials}</span>
                              )}
                            </button>

                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] font-bold text-[#2563EB] bg-[#EBF4FE] border border-[#BFDBFE] px-2 py-0.5 rounded-md">
                                  رئيسة القسم • Dept Head
                                </span>
                              </div>

                              {/* English Name Prominent */}
                              <h4
                                onClick={() => openHeadModal(dept)}
                                className="text-base font-black text-[#0A192F] hover:text-[#2563EB] transition-colors cursor-pointer leading-snug"
                                dir="ltr"
                              >
                                {dept.head.nameEn}
                              </h4>

                              {/* Arabic Name */}
                              <p className="text-xs font-bold text-slate-600">
                                {dept.head.nameAr}
                              </p>
                            </div>
                          </div>

                          {/* Bilingual Job Titles Box */}
                          <div className="p-3 rounded-xl bg-[#F0F6FD] border border-[#D6E4F0] space-y-1">
                            <div
                              className="text-xs font-black text-[#2563EB] leading-snug"
                              dir="ltr"
                            >
                              {dept.head.titleEn}
                            </div>
                            <div className="text-xs font-bold text-[#0A192F]">
                              {dept.head.titleAr}
                            </div>
                          </div>

                          {/* Reporting Line & Expand/Collapse Action Bar */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => openHeadModal(dept)}
                              className="text-[11px] font-bold text-slate-500 hover:text-[#2563EB] transition-colors cursor-pointer"
                            >
                              التفاصيل ‹
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleDepartment(dept.id)}
                              aria-expanded={isExpanded}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                isExpanded
                                  ? 'bg-[#0A192F] text-[#00D2FF] border border-[#00D2FF]/50 shadow-2xs'
                                  : 'bg-[#EBF4FE] hover:bg-[#2563EB] text-[#2563EB] hover:text-white border border-[#BFDBFE]'
                              }`}
                            >
                              <Users className="w-3.5 h-3.5" />
                              <span>
                                {isExpanded
                                  ? `إخفاء موظفي القسم (${dept.staff.length})`
                                  : `عرض موظفي القسم (${dept.staff.length})`}
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* ======================================================== */}
                        {/* LEVEL 3: EXPANDABLE SUBORDINATE STAFF (2 EMPLOYEES)      */}
                        {/* ======================================================== */}
                        {isExpanded && (
                          <div className="bg-[#F0F6FD] border-t border-[#CBD5E1] p-4 space-y-3 animate-in fade-in duration-150">
                            <div className="flex items-center justify-between text-[11px] font-bold text-[#0A192F] px-1">
                              <span className="flex items-center gap-1.5">
                                <GitFork className="w-3.5 h-3.5 text-[#2563EB]" />
                                <span>الموظفون التابعون للقسم (Team Members)</span>
                              </span>
                              <span
                                className="text-[10px] font-mono text-[#2563EB]"
                                dir="ltr"
                              >
                                {dept.staff.length} Staff
                              </span>
                            </div>

                            {/* Subordinate Staff Cards Connected by Hierarchy Line */}
                            <div className="relative pr-4 border-r-2 border-[#2563EB]/50 space-y-2.5 mr-2">
                              {dept.staff.map((member, sIdx) => (
                                <div
                                  key={member.id}
                                  onClick={() => openStaffModal(dept, sIdx as 0 | 1)}
                                  className="relative bg-white hover:bg-[#F8FBFF] rounded-xl p-3.5 border border-[#CBD5E1] hover:border-[#2563EB] shadow-2xs transition-all cursor-pointer group"
                                >
                                  {/* Horizontal Stem Connector */}
                                  <span className="absolute top-1/2 -right-4 w-3.5 h-0.5 bg-[#2563EB]/60" />
                                  <span className="absolute top-1/2 -right-[19px] -translate-y-1/2 w-2 h-2 rounded-full bg-[#00D2FF] border border-[#0A192F]" />

                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-2.5 min-w-0">
                                      <div
                                        className="w-9 h-9 rounded-xl bg-[#0A192F] text-[#00D2FF] border border-[#00D2FF]/40 flex items-center justify-center text-xs font-black shrink-0 font-mono"
                                        dir="ltr"
                                      >
                                        {member.initials}
                                      </div>

                                      <div className="min-w-0 space-y-0.5">
                                        <div
                                          className="text-xs sm:text-sm font-black text-[#0A192F] group-hover:text-[#2563EB] transition-colors"
                                          dir="ltr"
                                        >
                                          {member.nameEn}
                                        </div>
                                        <div className="text-[11px] font-bold text-slate-600">
                                          {member.nameAr}
                                        </div>
                                      </div>
                                    </div>

                                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[9px] font-bold shrink-0">
                                      كادر القسم
                                    </span>
                                  </div>

                                  {/* Bilingual Staff Job Titles */}
                                  <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-0.5">
                                    <div
                                      className="text-[11px] font-bold text-[#2563EB]"
                                      dir="ltr"
                                    >
                                      {member.titleEn}
                                    </div>
                                    <div className="text-[11px] font-semibold text-[#0A192F]">
                                      {member.titleAr}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Complete Summary Table / Quick Reference Directory */}
        <section className="bg-white border border-[#D6E4F0] rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-[#0A192F] flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#2563EB]" />
                <span>دليل الأقسام القيادية التسعة في سمارت مسار (Department Heads Directory)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ملخص مرجعي سريع لرؤساء الأقسام والمسميات المعتمدة باللغتين العربية والإنجليزية.
              </p>
            </div>
            <span className="text-xs font-bold text-[#2563EB] bg-[#F0F6FD] px-3 py-1.5 rounded-xl border border-[#BFDBFE]">
              الإدارة العليا: Dr. Ahmad Al-Abed — CEO
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SMART_MASAR_ORG_STRUCTURE.departments.map((dept) => (
              <div
                key={dept.id}
                onClick={() => {
                  setExpandedDepts((prev) => ({ ...prev, [dept.id]: true }));
                  openHeadModal(dept);
                }}
                className="p-3.5 rounded-2xl bg-[#F0F6FD] hover:bg-[#EBF4FE] border border-[#D6E4F0] transition-colors cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-xs font-black text-[#0A192F]" dir="ltr">
                    {dept.code}. {dept.head.nameEn}
                  </div>
                  <div className="text-[11px] font-bold text-[#2563EB] truncate" dir="ltr">
                    {dept.head.titleEn}
                  </div>
                  <div className="text-[11px] text-slate-600 truncate">{dept.head.titleAr}</div>
                </div>
                <span className="text-[10px] font-bold text-[#0A192F] bg-white px-2.5 py-1 rounded-lg border border-[#CBD5E1] shrink-0">
                  +2 موظفين
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Member Detail Modal (For CEO, Department Heads, and Subordinate Staff) */}
      {selectedMember && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="org-member-modal-title"
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedMember(null)}
        >
          <div
            className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-[#CBD5E1] overflow-hidden text-right"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Deep Navy */}
            <div className="bg-gradient-to-l from-[#0A192F] to-[#1E3A8A] text-white p-6 relative border-b border-[#00D2FF]/40">
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer border border-white/20"
                aria-label="إغلاق البطاقة"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#071324] border-2 border-[#00D2FF] flex items-center justify-center text-lg font-black text-[#00D2FF] shadow-md overflow-hidden shrink-0">
                  {selectedMember.avatarUrl ? (
                    <img
                      src={selectedMember.avatarUrl}
                      alt={selectedMember.nameEn}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span dir="ltr">{selectedMember.initials}</span>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#00D2FF]/20 border border-[#00D2FF]/40 text-[#00D2FF] text-[10px] font-bold">
                    {selectedMember.levelLabelAr} • {selectedMember.levelLabelEn}
                  </span>
                  <h3
                    id="org-member-modal-title"
                    className="text-xl font-black text-white"
                    dir="ltr"
                  >
                    {selectedMember.nameEn}
                  </h3>
                  <p className="text-xs font-bold text-slate-200">{selectedMember.nameAr}</p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Bilingual Job Titles */}
              <div className="p-4 rounded-2xl bg-[#F0F6FD] border border-[#BFDBFE] space-y-1">
                <span className="text-[11px] font-bold text-slate-500 block">
                  المسمى الوظيفي المعتمد (Job Title)
                </span>
                <div className="text-sm font-black text-[#2563EB]" dir="ltr">
                  {selectedMember.titleEn}
                </div>
                <div className="text-xs sm:text-sm font-bold text-[#0A192F]">
                  {selectedMember.titleAr}
                </div>
              </div>

              {/* Department & Reporting Line */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl border border-[#E2E8F0] bg-[#F8FBFF]">
                  <span className="text-[11px] text-slate-500 block mb-1">القسم التابع له</span>
                  <div className="font-bold text-[#0A192F] flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span>{selectedMember.departmentNameAr}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5" dir="ltr">
                    {selectedMember.departmentNameEn}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl border border-[#E2E8F0] bg-[#F8FBFF]">
                  <span className="text-[11px] text-slate-500 block mb-1">
                    المسؤول المباشر (Reports To)
                  </span>
                  <div className="font-bold text-[#0A192F] flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span>{selectedMember.reportsToAr}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5" dir="ltr">
                    {selectedMember.reportsToEn}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl border border-[#E2E8F0] bg-[#F8FBFF] sm:col-span-2">
                  <span className="text-[11px] text-slate-500 block mb-1">
                    البريد المؤسسي الافتراضي
                  </span>
                  <div className="font-semibold text-[#0A192F] flex items-center gap-2" dir="ltr">
                    <Mail className="w-4 h-4 text-[#2563EB]" />
                    <span>{selectedMember.email}</span>
                  </div>
                </div>
              </div>

              {/* Role Summary */}
              <div className="p-3.5 rounded-2xl bg-[#F0F6FD] border border-[#E2E8F0]">
                <span className="text-[11px] font-bold text-slate-500 block mb-1">
                  الاختصاص والمهام التنظيمية
                </span>
                <p className="text-xs text-[#0A192F] leading-relaxed">{selectedMember.bioAr}</p>
              </div>

              {/* Training Project Disclaimer inside Modal */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  بيانات هذه البطاقة افتراضية ومخصصة لأغراض المشروع التدريبي لشركة سمارت مسار.
                </span>
              </div>

              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedMember(null)}
                  className="px-6 py-2.5 rounded-xl bg-[#0A192F] hover:bg-[#2563EB] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  إغلاق البطاقة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
