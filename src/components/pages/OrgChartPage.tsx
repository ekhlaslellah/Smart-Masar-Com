/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Employee } from '../../types';
import {
  buildDynamicOrgStructure,
  filterDynamicOrgUnits,
  DynamicOrgDepartmentUnit,
  SMART_MASAR_ORG_STRUCTURE,
  getOrgStructureSummary,
  filterOrgDepartments,
  OrgDepartmentUnit,
  normalizeEmployeeVisibility,
} from '../../utils/orgChart';
import { EmployeeAvatar } from '../common/EmployeeAvatar';
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
  ShieldCheck,
  UserCheck,
  Mail,
  X,
  Briefcase,
  Layers,
  Sparkles,
  Award,
  Database,
  FlaskConical,
  Lock,
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
  showPublicEmail: boolean;
  bioAr: string;
  employeeRecord?: Employee;
  isTrainingSimulation?: boolean;
}

export const OrgChartPage: React.FC = () => {
  const { employees, departments } = useApp();
  const [viewMode, setViewMode] = useState<'live' | 'training'>('live');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMember, setSelectedMember] = useState<SelectedOrgMember | null>(null);

  // ============================================================================
  // 1. LIVE DATABASE ORG STRUCTURE (Derived strictly from Team + Departments)
  // ============================================================================
  const dynamicOrg = useMemo(() => {
    return buildDynamicOrgStructure(employees, departments);
  }, [employees, departments]);

  const filteredLiveAdvisoryUnits = useMemo(() => {
    return filterDynamicOrgUnits(dynamicOrg.advisoryUnits, searchQuery);
  }, [dynamicOrg.advisoryUnits, searchQuery]);

  const filteredLiveDeptUnits = useMemo(() => {
    return filterDynamicOrgUnits(dynamicOrg.departmentUnits, searchQuery);
  }, [dynamicOrg.departmentUnits, searchQuery]);

  const [expandedLiveDepts, setExpandedLiveDepts] = useState<Record<string, boolean>>({});

  const toggleLiveDept = (deptId: string) => {
    setExpandedLiveDepts((prev) => ({
      ...prev,
      [deptId]: !prev[deptId],
    }));
  };

  const setAllLiveDeptsExpanded = (expanded: boolean) => {
    const next: Record<string, boolean> = {};
    dynamicOrg.departmentUnits.forEach((u) => {
      next[u.department.id] = expanded;
    });
    setExpandedLiveDepts(next);
  };

  // ============================================================================
  // 2. SEPARATE TRAINING SIMULATION STRUCTURE (Kept isolated from official Team)
  // ============================================================================
  const trainingSummary = useMemo(
    () => getOrgStructureSummary(SMART_MASAR_ORG_STRUCTURE),
    []
  );

  const filteredTrainingDepts = useMemo(() => {
    return filterOrgDepartments(SMART_MASAR_ORG_STRUCTURE.departments, searchQuery);
  }, [searchQuery]);

  const [expandedTrainingDepts, setExpandedTrainingDepts] = useState<
    Record<string, boolean>
  >(() => {
    const initial: Record<string, boolean> = {};
    SMART_MASAR_ORG_STRUCTURE.departments.forEach((dept, idx) => {
      initial[dept.id] = idx < 3;
    });
    return initial;
  });

  const toggleTrainingDepartment = (deptId: string) => {
    setExpandedTrainingDepts((prev) => ({
      ...prev,
      [deptId]: !prev[deptId],
    }));
  };

  const setAllTrainingDepartmentsExpanded = (expanded: boolean) => {
    const next: Record<string, boolean> = {};
    SMART_MASAR_ORG_STRUCTURE.departments.forEach((dept) => {
      next[dept.id] = expanded;
    });
    setExpandedTrainingDepts(next);
  };

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(125, Math.max(75, prev + delta)));
  };

  const getDeptById = (deptId: string) => {
    return departments.find((d) => d.id === deptId);
  };

  const getManagerById = (managerId: string | null) => {
    if (!managerId) return null;
    return employees.find((e) => e.id === managerId) || null;
  };

  // Open Modal for a real employee from Team (respecting showPublicProfile & showPublicEmail)
  const openLiveEmployeeModal = (
    rawEmp: Employee,
    levelLabelAr: string,
    levelLabelEn: string
  ) => {
    const emp = normalizeEmployeeVisibility(rawEmp);
    if (emp.showPublicProfile === false) {
      return;
    }
    const dept = getDeptById(emp.departmentId);
    const manager = getManagerById(emp.managerId);

    setSelectedMember({
      nameEn: emp.nameEn,
      nameAr: emp.nameAr,
      titleEn: emp.jobTitleEn || emp.jobTitleAr,
      titleAr: emp.jobTitleAr,
      departmentNameAr: dept?.nameAr || 'الإدارة العامة',
      departmentNameEn: dept?.nameEn || 'General Management',
      reportsToAr: manager
        ? `${manager.nameAr} (${manager.jobTitleAr})`
        : 'مجلس الإدارة / القيادة العليا',
      reportsToEn: manager
        ? `${manager.nameEn} (${manager.jobTitleEn || manager.jobTitleAr})`
        : 'Board of Directors',
      levelLabelAr,
      levelLabelEn,
      initials: emp.initials,
      email: emp.showPublicEmail === true ? emp.email || '' : '',
      showPublicEmail: emp.showPublicEmail === true,
      bioAr: emp.bioAr || 'عضو كادر معتمد في الهيكل التنظيمي لشركة سمارت مسار.',
      employeeRecord: emp,
      isTrainingSimulation: false,
    });
  };

  // Open Modal for Training Simulation mode
  const openTrainingCeoModal = () => {
    const { ceo } = SMART_MASAR_ORG_STRUCTURE;
    const linked = employees.find((e) => e.id === ceo.linkedEmployeeId);
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
      showPublicEmail: true,
      bioAr: ceo.bioAr,
      employeeRecord: linked,
      isTrainingSimulation: true,
    });
  };

  const openTrainingHeadModal = (dept: OrgDepartmentUnit) => {
    const { ceo } = SMART_MASAR_ORG_STRUCTURE;
    const linked = employees.find((e) => e.id === dept.head.linkedEmployeeId);
    setSelectedMember({
      nameEn: dept.head.nameEn,
      nameAr: dept.head.nameAr,
      titleEn: dept.head.titleEn,
      titleAr: dept.head.titleAr,
      departmentNameAr: dept.departmentNameAr,
      departmentNameEn: dept.departmentNameEn,
      reportsToEn: `${ceo.nameEn} (${ceo.titleEn})`,
      reportsToAr: `${ceo.nameAr} (${ceo.titleAr})`,
      levelLabelAr: 'قيادات ورؤساء الأقسام (نموذج تدريبي)',
      levelLabelEn: 'Department Head',
      initials: dept.head.initials,
      email: dept.head.email,
      showPublicEmail: true,
      bioAr: dept.head.bioAr,
      employeeRecord: linked,
      isTrainingSimulation: true,
    });
  };

  const openTrainingStaffModal = (dept: OrgDepartmentUnit, staffIdx: 0 | 1) => {
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
      levelLabelAr: 'كادر تدريبي محاكي (غير مدرج في Team)',
      levelLabelEn: 'Simulated Training Staff',
      initials: member.initials,
      email: member.email,
      showPublicEmail: true,
      bioAr: member.bioAr,
      isTrainingSimulation: true,
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
            <span className="text-[#00D2FF]">
              الهيكل التنظيمي • Organizational Structure
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#1E3A8A]/80 border border-[#00D2FF]/40 text-[#00D2FF] text-xs font-bold shadow-xs">
                <GitFork className="w-3.5 h-3.5" />
                <span>
                  المخطط التنظيمي الهرمي التفاعلي • Interactive Organizational Chart
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                الهيكل التنظيمي لشركة سمارت مسار (Smart Masar)
              </h1>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                {viewMode === 'live'
                  ? 'يعرض هذا المخطط التفاعلي البنية القيادية والتنظيمية المعتمدة مباشرة من قاعدة البيانات (جداول Team و Departments)، شاملاً الرئيس التنفيذي، المستشارين التنفيذيين، ورؤساء ومديري الإدارات.'
                  : 'يعرض هذا الوضع المنفصل النموذج التدريبي المحاكي (شاملاً 18 اسماً تدريبياً افتراضياً) لأغراض العرض الأكاديمي دون خلطهم بسجلات الموظفين الفعليين في قاعدة البيانات.'}
              </p>

              {/* Dynamic Hierarchy Counters (Always reflecting the active mode clearly) */}
              {viewMode === 'live' ? (
                <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-[#0A192F]/80 border border-[#00D2FF]/30">
                    <div
                      className="text-xl font-black text-[#00D2FF]"
                      data-testid="org-stat-leadership"
                    >
                      {dynamicOrg.summary.totalExecutives +
                        dynamicOrg.summary.totalAdvisors}
                    </div>
                    <div className="text-[11px] text-slate-300 font-bold">
                      القيادة العليا والاستشارات
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0A192F]/80 border border-[#00D2FF]/30">
                    <div
                      className="text-xl font-black text-[#00D2FF]"
                      data-testid="org-stat-dept-leads"
                    >
                      {dynamicOrg.summary.totalDepartmentLeads}
                    </div>
                    <div className="text-[11px] text-slate-300 font-bold">
                      رؤساء ومديرو الإدارات
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0A192F]/80 border border-[#00D2FF]/30">
                    <div
                      className="text-xl font-black text-[#00D2FF]"
                      data-testid="org-stat-departments"
                    >
                      {dynamicOrg.summary.totalDepartments}
                    </div>
                    <div className="text-[11px] text-slate-300 font-bold">
                      إجمالي الأقسام والوحدات
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0A192F]/80 border border-[#00D2FF]/30">
                    <div
                      className="text-xl font-black text-white"
                      data-testid="org-stat-visible-members"
                    >
                      {dynamicOrg.summary.totalVisibleMembers}
                    </div>
                    <div className="text-[11px] text-slate-300 font-bold">
                      الكادر الفعلي الظاهر بالهيكل
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-[#0A192F]/80 border border-amber-400/40">
                    <div className="text-xl font-black text-amber-300">
                      {trainingSummary.totalExecutives}
                    </div>
                    <div className="text-[11px] text-slate-300 font-bold">
                      الرئيس التنفيذي (CEO)
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0A192F]/80 border border-amber-400/40">
                    <div className="text-xl font-black text-amber-300">
                      {trainingSummary.totalDepartmentHeads}
                    </div>
                    <div className="text-[11px] text-slate-300 font-bold">
                      رؤساء الأقسام (9 Heads)
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0A192F]/80 border border-amber-400/40">
                    <div className="text-xl font-black text-amber-300">
                      {trainingSummary.totalStaff}
                    </div>
                    <div className="text-[11px] text-slate-300 font-bold">
                      موظفون تدريبيون (محاكاة)
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0A192F]/80 border border-amber-400/40">
                    <div className="text-xl font-black text-white">
                      {trainingSummary.totalMembers}
                    </div>
                    <div className="text-[11px] text-slate-300 font-bold">
                      إجمالي النموذج التدريبي
                    </div>
                  </div>
                </div>
              )}
            </div>

            <PageHeroImage pageId="page-organization" />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Mode Switcher Bar: Official Database Structure vs Separated Training Simulation */}
        <div className="bg-white p-4 rounded-2xl border border-[#D6E4F0] shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-[#2563EB] shrink-0" />
            <div>
              <h2 className="text-xs sm:text-sm font-black text-[#0A192F]">
                مصدر بيانات المخطط التنظيمي المعروض
              </h2>
              <p className="text-[11px] text-slate-500">
                الهيكل الرسمي مرتبط مباشرة بجدولي Team و Departments، بينما يُحفظ النموذج التدريبي ذو الـ 18 موظفاً في وضع عرض مستقل تماماً.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#F0F6FD] p-1.5 rounded-xl border border-[#CBD5E1] shrink-0">
            <button
              type="button"
              data-testid="org-mode-live"
              onClick={() => setViewMode('live')}
              className={`px-3.5 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'live'
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'text-[#0A192F] hover:bg-white/70'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>الهيكل الرسمي الفعلي ({dynamicOrg.summary.totalVisibleMembers})</span>
            </button>

            <button
              type="button"
              data-testid="org-mode-training"
              onClick={() => setViewMode('training')}
              className={`px-3.5 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'training'
                  ? 'bg-[#0A192F] text-amber-300 shadow-xs'
                  : 'text-slate-600 hover:bg-white/70'
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              <span>النموذج التدريبي المحاكي (منفصل)</span>
            </button>
          </div>
        </div>

        {/* Contextual Disclosure Banner */}
        {viewMode === 'live' ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#BFDBFE] shadow-2xs flex items-start gap-3.5 text-xs sm:text-sm text-[#0A192F]">
            <ShieldCheck className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-bold text-[#2563EB]">
                تزامن مباشر مع قاعدة البيانات ولوحة الإدارة:
              </strong>{' '}
              جميع الأسماء والمسميات الوظيفية والصور الشخصية وعلاقات التبعية في هذا العرض مستمدة ديناميكياً من جدول <strong>Team</strong> وجدول <strong>Departments</strong>، وتستجيب فوراً لإعدادات الظهور والخصوصية (<code className="font-mono text-[#2563EB]">showOnOrgChart</code> و <code className="font-mono text-[#2563EB]">showPublicProfile</code> و <code className="font-mono text-[#2563EB]">showPublicEmail</code>).
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-300 shadow-2xs flex items-start gap-3.5 text-xs sm:text-sm text-amber-950">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-bold text-amber-800">
                وضع المحاكاة التدريبية المستقل (بيانات افتراضية غير مدرجة في جدول Team):
              </strong>{' '}
              يعرض هذا الوضع الموظفين الـ 18 التدريبيين تحت الأقسام التسعة لأغراض التوضيح الأكاديمي فقط، ولا يتم احتسابهم كموظفين فعليين ضمن إحصائيات الموقع أو جدول <strong>Team</strong> الرسمي.
            </div>
          </div>
        )}

        {/* Interactive Toolbar: Search, Expand/Collapse, and Zoom */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D6E4F0] shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم أو القسم أو المسمى الوظيفي..."
              aria-label="البحث في الهيكل التنظيمي"
              className="w-full pr-10 pl-4 py-2.5 text-xs rounded-xl border border-[#CBD5E1] bg-[#F0F6FD] focus:bg-white focus:outline-none focus:border-[#2563EB] text-[#0A192F]"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5">
            {viewMode === 'live' ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAllLiveDeptsExpanded(true)}
                  className="px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <ChevronDown className="w-4 h-4 text-[#00D2FF]" />
                  <span>توسيع تفاصيل الوحدات ({dynamicOrg.departmentUnits.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAllLiveDeptsExpanded(false)}
                  className="px-3.5 py-2 rounded-xl bg-[#0A192F] hover:bg-[#1E3A8A] text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <ChevronUp className="w-4 h-4 text-[#00D2FF]" />
                  <span>طي التفاصيل</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAllTrainingDepartmentsExpanded(true)}
                  className="px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <ChevronDown className="w-4 h-4 text-[#00D2FF]" />
                  <span>توسيع جميع الأقسام التدريبية (9)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAllTrainingDepartmentsExpanded(false)}
                  className="px-3.5 py-2 rounded-xl bg-[#0A192F] hover:bg-[#1E3A8A] text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <ChevronUp className="w-4 h-4 text-[#00D2FF]" />
                  <span>طي جميع الأقسام</span>
                </button>
              </div>
            )}

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

        {/* ==================================================================== */}
        {/* VIEW MODE 1: OFFICIAL LIVE DATABASE ORG CHART                        */}
        {/* ==================================================================== */}
        {viewMode === 'live' ? (
          <div className="bg-gradient-to-b from-white via-[#F8FBFF] to-[#F0F6FD] border border-[#D6E4F0] rounded-3xl p-4 sm:p-8 lg:p-10 shadow-2xs overflow-x-auto">
            <div
              className="transition-transform duration-200 origin-top flex flex-col items-center w-full"
              style={{ transform: `scale(${zoomLevel / 100})` }}
            >
              {/* LEVEL 1: CEO CARD */}
              {dynamicOrg.ceo && (
                <div className="w-full flex flex-col items-center">
                  <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#0A192F] text-[#00D2FF] border border-[#00D2FF]/50 text-[11px] font-black tracking-wide mb-3 shadow-sm">
                    <Crown className="w-3.5 h-3.5 text-[#00D2FF]" />
                    <span>المستوى القيادي الأول • Executive Leadership (CEO)</span>
                  </div>

                  <div
                    data-testid={`org-live-node-${dynamicOrg.ceo.id}`}
                    className="w-full max-w-2xl bg-gradient-to-l from-[#0A192F] via-[#0F2547] to-[#1E3A8A] text-white rounded-3xl p-6 sm:p-7 shadow-xl border-2 border-[#00D2FF] relative overflow-hidden"
                  >
                    <div
                      className="absolute -top-12 -left-12 w-36 h-36 rounded-full opacity-20 pointer-events-none"
                      style={{
                        background: 'radial-gradient(circle, #00D2FF 0%, transparent 70%)',
                      }}
                    />

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
                      <div className="flex items-center gap-4">
                        <EmployeeAvatar
                          employee={dynamicOrg.ceo}
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#071324] border-2 border-[#00D2FF] text-[#00D2FF] flex items-center justify-center text-xl sm:text-2xl font-black shrink-0 shadow-[0_0_20px_rgba(0,210,255,0.3)] overflow-hidden"
                        />

                        <div className="space-y-1">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#00D2FF]/15 border border-[#00D2FF]/40 text-[#00D2FF] text-[10px] font-bold">
                            <span>الإدارة العليا التنفيذية • Top Executive</span>
                          </div>
                          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                            {dynamicOrg.ceo.nameAr}
                          </h2>
                          <p
                            className="text-xs sm:text-sm font-bold text-[#00D2FF] font-mono"
                            dir="ltr"
                          >
                            {dynamicOrg.ceo.nameEn}
                          </p>
                        </div>
                      </div>

                      <div className="w-full sm:w-auto flex flex-col sm:items-end gap-1.5 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/15">
                        <span className="px-3.5 py-1.5 rounded-xl bg-[#2563EB] text-white border border-[#00D2FF]/60 text-xs sm:text-sm font-black shadow-xs inline-block">
                          {dynamicOrg.ceo.jobTitleAr}
                        </span>
                        <span
                          className="text-xs font-bold text-slate-200 font-mono"
                          dir="ltr"
                        >
                          {dynamicOrg.ceo.jobTitleEn}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 text-slate-200">
                        <Layers className="w-4 h-4 text-[#00D2FF]" />
                        <span>
                          يشرف مباشرة على {dynamicOrg.advisoryUnits.length} وحدة استشارية عليا و{' '}
                          {dynamicOrg.departmentUnits.length} إدارات وأقسام تنفيذية
                        </span>
                      </div>

                      {dynamicOrg.ceo.showPublicProfile !== false && (
                        <button
                          type="button"
                          onClick={() =>
                            openLiveEmployeeModal(
                              dynamicOrg.ceo!,
                              'الإدارة العليا التنفيذية',
                              'Chief Executive Officer'
                            )
                          }
                          className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold transition-colors cursor-pointer"
                        >
                          عرض البطاقة القيادية
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* LEVEL 1.5: EXECUTIVE ADVISORY UNITS (e.g., Eng. Razan Jaber) */}
              {/* ============================================================ */}
              {filteredLiveAdvisoryUnits.length > 0 && (
                <div className="w-full flex flex-col items-center">
                  <div className="w-1 h-8 bg-gradient-to-b from-[#00D2FF] to-[#7C5CDE]" />
                  <div className="px-4 py-1.5 rounded-full bg-[#1E1B4B] text-white border border-[#7C5CDE] text-[11px] font-bold shadow-sm flex items-center gap-2 mb-4">
                    <Sparkles className="w-3.5 h-3.5 text-[#00D2FF]" />
                    <span>
                      المستوى الاستشاري التنفيذي (Executive Advisory) — ارتباط مباشر بالرئيس التنفيذي
                    </span>
                  </div>

                  <div className="w-full max-w-3xl grid grid-cols-1 gap-4 mb-2">
                    {filteredLiveAdvisoryUnits.map((unit) => {
                      const advisor = unit.head;
                      if (!advisor) return null;
                      const canOpen = advisor.showPublicProfile !== false;

                      return (
                        <div
                          key={unit.department.id}
                          data-testid={`org-live-node-${advisor.id}`}
                          className="rounded-3xl bg-gradient-to-l from-[#1E1B4B] via-[#2E1065] to-[#1E3A8A] text-white p-5 sm:p-6 border-2 border-[#7C5CDE] shadow-lg relative overflow-hidden"
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <EmployeeAvatar
                                employee={advisor}
                                className="w-20 h-20 rounded-2xl bg-[#0F172A] border-2 border-[#00D2FF] text-[#00D2FF] flex items-center justify-center text-lg font-black shrink-0 overflow-hidden shadow-md"
                              />
                              <div className="space-y-1">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/10 border border-[#00D2FF]/40 text-[#00D2FF] text-[10px] font-bold">
                                  <Sparkles className="w-3 h-3" />
                                  <span>{unit.department.nameAr}</span>
                                </div>
                                <h3 className="text-lg sm:text-xl font-black text-white">
                                  {advisor.nameAr}
                                </h3>
                                <p
                                  className="text-xs font-bold text-[#00D2FF] font-mono"
                                  dir="ltr"
                                >
                                  {advisor.nameEn}
                                </p>
                                <p className="text-xs font-bold text-slate-200 pt-0.5">
                                  {advisor.jobTitleAr}
                                </p>
                                {advisor.jobTitleEn && (
                                  <p
                                    className="text-[11px] text-slate-300 font-mono"
                                    dir="ltr"
                                  >
                                    {advisor.jobTitleEn}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-white/15">
                              <span className="text-[11px] text-slate-200 flex items-center gap-1.5">
                                <GitFork className="w-3.5 h-3.5 text-[#00D2FF]" />
                                <span>ترتبط مباشرة بالرئيس التنفيذي</span>
                              </span>
                              {canOpen ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openLiveEmployeeModal(
                                      advisor,
                                      'المستشارون التنفيذيون • الإدارة العليا',
                                      'Executive Advisor'
                                    )
                                  }
                                  className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold transition-colors cursor-pointer"
                                >
                                  عرض البطاقة الاستشارية
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-300 flex items-center gap-1">
                                  <Lock className="w-3 h-3" />
                                  <span>ملف مختصر</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Connector Trunk to Department Heads & Governance */}
              <div className="flex flex-col items-center">
                <div className="w-1 h-10 bg-gradient-to-b from-[#7C5CDE] to-[#2563EB]" />
                <div className="px-4 py-1.5 rounded-full bg-[#0A192F] text-white border border-[#2563EB] text-[11px] font-bold shadow-sm flex items-center gap-2">
                  <GitFork className="w-3.5 h-3.5 text-[#00D2FF]" />
                  <span>
                    المستوى القيادي الثاني: إدارات وأقسام الشركة المعتمدة ({filteredLiveDeptUnits.length})
                  </span>
                </div>
                <div className="w-1 h-8 bg-[#2563EB]" />
              </div>

              <div className="hidden lg:block w-[92%] h-1 bg-gradient-to-r from-[#1E3A8A] via-[#00D2FF] to-[#1E3A8A] rounded-full relative mb-2">
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#00D2FF] border-2 border-[#0A192F] shadow-sm" />
              </div>

              {/* ============================================================ */}
              {/* LEVEL 2 & 3: LIVE DEPARTMENTS & GOVERNANCE UNITS             */}
              {/* ============================================================ */}
              {filteredLiveDeptUnits.length === 0 ? (
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
                    إظهار جميع الأقسام
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full pt-2">
                  {filteredLiveDeptUnits.map((unit: DynamicOrgDepartmentUnit) => {
                    const { department, code, head, members } = unit;
                    const isExpanded =
                      Boolean(expandedLiveDepts[department.id]) ||
                      Boolean(searchQuery.trim());
                    const canOpenHead = head ? head.showPublicProfile !== false : false;

                    return (
                      <div
                        key={department.id}
                        data-testid={
                          head ? `org-live-node-${head.id}` : `org-live-dept-${department.id}`
                        }
                        className="flex flex-col items-center w-full"
                      >
                        <div className="hidden lg:flex flex-col items-center">
                          <div className="w-0.5 h-5 bg-[#2563EB]" />
                          <div className="w-2.5 h-2.5 rounded-full bg-[#00D2FF] border-2 border-[#0A192F] -mt-1 mb-1" />
                        </div>

                        <div
                          className={`w-full rounded-2xl border transition-all duration-200 overflow-hidden shadow-2xs ${
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
                                {code}
                              </span>
                              <div className="truncate">
                                <h3 className="text-xs font-bold text-white truncate">
                                  {department.nameAr}
                                </h3>
                                <p
                                  className="text-[10px] text-[#00D2FF] font-mono truncate"
                                  dir="ltr"
                                >
                                  {department.nameEn}
                                </p>
                              </div>
                            </div>

                            <span className="px-2 py-0.5 rounded-md bg-[#2563EB]/30 border border-[#00D2FF]/30 text-[#00D2FF] text-[10px] font-bold shrink-0">
                              وحدة #{code}
                            </span>
                          </div>

                          {/* Department Lead Details Body */}
                          <div className="p-5 space-y-4">
                            {head ? (
                              <>
                                <div className="flex items-start gap-3.5">
                                  <button
                                    type="button"
                                    disabled={!canOpenHead}
                                    onClick={() =>
                                      canOpenHead &&
                                      openLiveEmployeeModal(
                                        head,
                                        'قيادات ورؤساء الإدارات والأقسام',
                                        'Department Lead'
                                      )
                                    }
                                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0A192F] to-[#1E3A8A] text-[#00D2FF] border border-[#00D2FF]/50 flex items-center justify-center text-sm font-black shrink-0 shadow-sm overflow-hidden ${
                                      canOpenHead ? 'cursor-pointer' : 'cursor-default'
                                    }`}
                                  >
                                    <EmployeeAvatar
                                      employee={head}
                                      className="w-full h-full flex items-center justify-center"
                                    />
                                  </button>

                                  <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="text-[10px] font-bold text-[#2563EB] bg-[#EBF4FE] border border-[#BFDBFE] px-2 py-0.5 rounded-md flex items-center gap-1">
                                        <Award className="w-3 h-3" />
                                        <span>قيادة القسم / الإدارة</span>
                                      </span>
                                    </div>

                                    <h4
                                      onClick={() =>
                                        canOpenHead &&
                                        openLiveEmployeeModal(
                                          head,
                                          'قيادات ورؤساء الإدارات والأقسام',
                                          'Department Lead'
                                        )
                                      }
                                      className={`text-base font-black text-[#0A192F] leading-snug ${
                                        canOpenHead
                                          ? 'hover:text-[#2563EB] transition-colors cursor-pointer'
                                          : ''
                                      }`}
                                    >
                                      {head.nameAr}
                                    </h4>

                                    <p
                                      className="text-xs font-bold text-slate-500 font-mono truncate"
                                      dir="ltr"
                                    >
                                      {head.nameEn}
                                    </p>
                                  </div>
                                </div>

                                {/* Bilingual Job Titles Box */}
                                <div className="p-3 rounded-xl bg-[#F0F6FD] border border-[#D6E4F0] space-y-1">
                                  <div className="text-xs font-black text-[#0A192F]">
                                    {head.jobTitleAr}
                                  </div>
                                  {head.jobTitleEn && (
                                    <div
                                      className="text-[11px] font-bold text-[#2563EB] leading-snug font-mono"
                                      dir="ltr"
                                    >
                                      {head.jobTitleEn}
                                    </div>
                                  )}
                                </div>
                              </>
                            ) : (
                              <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                                منصب قيادة القسم شاغر أو مخفي حالياً من العرض العام
                              </div>
                            )}

                            {/* Action Bar */}
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                              {head && canOpenHead ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openLiveEmployeeModal(
                                      head,
                                      'قيادات ورؤساء الإدارات والأقسام',
                                      'Department Lead'
                                    )
                                  }
                                  className="text-[11px] font-bold text-[#2563EB] hover:underline transition-colors cursor-pointer"
                                >
                                  البطاقة التفصيلية ‹
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                  <Lock className="w-3 h-3" />
                                  <span>بطاقة مختصرة</span>
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => toggleLiveDept(department.id)}
                                aria-expanded={isExpanded}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                  isExpanded
                                    ? 'bg-[#0A192F] text-[#00D2FF] border border-[#00D2FF]/50 shadow-2xs'
                                    : 'bg-[#EBF4FE] hover:bg-[#2563EB] text-[#2563EB] hover:text-white border border-[#BFDBFE]'
                                }`}
                              >
                                <Building2 className="w-3.5 h-3.5" />
                                <span>
                                  {isExpanded
                                    ? 'إخفاء اختصاص الوحدة'
                                    : members.length > 0
                                    ? `الكوادر التابعة (${members.length})`
                                    : 'اختصاص الوحدة'}
                                </span>
                                {isExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Expandable Unit Scope & Direct Reports from Team */}
                          {isExpanded && (
                            <div className="bg-[#F0F6FD] border-t border-[#CBD5E1] p-4 space-y-3 animate-in fade-in duration-150">
                              <div className="p-3 rounded-xl bg-white border border-[#D6E4F0] text-xs text-slate-600 leading-relaxed">
                                <span className="font-bold text-[#0A192F] block mb-1">
                                  نطاق عمل القسم:
                                </span>
                                {department.descriptionAr ||
                                  'وحدة تنظيمية معتمدة ضمن الهيكل الإداري والتنفيذي لشركة سمارت مسار.'}
                              </div>

                              {members.length > 0 && (
                                <div className="space-y-2">
                                  <div className="text-[11px] font-bold text-[#0A192F] flex items-center justify-between px-1">
                                    <span>الكوادر الفعلية التابعة للقسم:</span>
                                    <span className="font-mono text-[#2563EB]">
                                      {members.length}
                                    </span>
                                  </div>
                                  <div className="relative pr-4 border-r-2 border-[#2563EB]/50 space-y-2 mr-2">
                                    {members.map((member) => {
                                      const canOpenMember =
                                        member.showPublicProfile !== false;
                                      return (
                                        <div
                                          key={member.id}
                                          data-testid={`org-live-node-${member.id}`}
                                          onClick={() =>
                                            canOpenMember &&
                                            openLiveEmployeeModal(
                                              member,
                                              'الكوادر التخصصية والتنفيذية',
                                              'Department Specialist'
                                            )
                                          }
                                          className={`relative bg-white rounded-xl p-3 border border-[#CBD5E1] shadow-2xs flex items-center justify-between gap-3 ${
                                            canOpenMember
                                              ? 'hover:border-[#2563EB] cursor-pointer'
                                              : 'cursor-default'
                                          }`}
                                        >
                                          <div className="flex items-center gap-2.5 min-w-0">
                                            <EmployeeAvatar
                                              employee={member}
                                              className="w-10 h-10 rounded-xl bg-[#0A192F] text-[#00D2FF] flex items-center justify-center text-xs font-black shrink-0 overflow-hidden"
                                            />
                                            <div className="min-w-0">
                                              <div className="text-xs font-bold text-[#0A192F] truncate">
                                                {member.nameAr}
                                              </div>
                                              <div className="text-[11px] text-[#2563EB] truncate">
                                                {member.jobTitleAr}
                                              </div>
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
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ================================================================== */
          /* VIEW MODE 2: SEPARATE TRAINING SIMULATION CHART (18 Staff Isolated) */
          /* ================================================================== */
          <div className="bg-gradient-to-b from-white via-[#F8FBFF] to-[#F0F6FD] border border-amber-300 rounded-3xl p-4 sm:p-8 lg:p-10 shadow-2xs overflow-x-auto">
            <div
              className="transition-transform duration-200 origin-top flex flex-col items-center w-full"
              style={{ transform: `scale(${zoomLevel / 100})` }}
            >
              <div className="w-full flex flex-col items-center">
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-400/50 text-[11px] font-black tracking-wide mb-3 shadow-sm">
                  <FlaskConical className="w-3.5 h-3.5 text-amber-300" />
                  <span>وضع المحاكاة التدريبية المستقل • Training Simulation View</span>
                </div>

                {/* Training CEO Card */}
                <div className="w-full max-w-xl bg-gradient-to-l from-[#0A192F] via-[#0F2547] to-[#1E3A8A] text-white rounded-3xl p-6 sm:p-7 shadow-xl border-2 border-[#00D2FF] relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#071324] border-2 border-[#00D2FF] text-[#00D2FF] flex items-center justify-center text-xl sm:text-2xl font-black shrink-0 overflow-hidden">
                        <span dir="ltr">{SMART_MASAR_ORG_STRUCTURE.ceo.initials}</span>
                      </div>
                      <div className="space-y-1">
                        <h2
                          className="text-xl sm:text-2xl font-black text-white tracking-tight"
                          dir="ltr"
                        >
                          {SMART_MASAR_ORG_STRUCTURE.ceo.nameEn}
                        </h2>
                        <p className="text-xs sm:text-sm font-bold text-slate-200">
                          {SMART_MASAR_ORG_STRUCTURE.ceo.nameAr}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={openTrainingCeoModal}
                      className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-colors cursor-pointer"
                    >
                      عرض البطاقة
                    </button>
                  </div>
                </div>

                <div className="w-1 h-8 bg-[#2563EB] my-2" />
              </div>

              {/* 9 Training Departments + 18 Simulated Staff */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full pt-2">
                {filteredTrainingDepts.map((dept) => {
                  const isExpanded =
                    Boolean(expandedTrainingDepts[dept.id]) ||
                    Boolean(searchQuery.trim());

                  return (
                    <div
                      key={dept.id}
                      data-testid={`org-dept-card-${dept.code}`}
                      className="flex flex-col items-center w-full"
                    >
                      <div className="w-full rounded-2xl border bg-white border-[#CBD5E1] overflow-hidden shadow-2xs">
                        <div className="bg-[#0A192F] text-white px-4 py-3 border-b border-[#1E3A8A] flex items-center justify-between gap-2">
                          <span className="text-xs font-bold truncate">
                            {dept.code}. {dept.departmentNameAr}
                          </span>
                          <span className="text-[10px] text-amber-300 font-bold shrink-0">
                            نموذج تدريبي
                          </span>
                        </div>

                        <div className="p-5 space-y-3">
                          <div>
                            <h4
                              onClick={() => openTrainingHeadModal(dept)}
                              className="text-sm font-black text-[#0A192F] hover:text-[#2563EB] cursor-pointer"
                              dir="ltr"
                            >
                              {dept.head.nameEn}
                            </h4>
                            <p className="text-xs font-bold text-slate-600">
                              {dept.head.nameAr} — {dept.head.titleAr}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => toggleTrainingDepartment(dept.id)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#EBF4FE] text-[#2563EB] cursor-pointer"
                            >
                              {isExpanded
                                ? `إخفاء الكادر التدريبي (${dept.staff.length})`
                                : `عرض الكادر التدريبي (${dept.staff.length})`}
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="bg-amber-50/60 border-t border-amber-200 p-4 space-y-2.5">
                            {dept.staff.map((member, sIdx) => (
                              <div
                                key={member.id}
                                onClick={() => openTrainingStaffModal(dept, sIdx as 0 | 1)}
                                className="bg-white rounded-xl p-3 border border-amber-200 hover:border-amber-400 cursor-pointer"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span
                                    className="text-xs font-black text-[#0A192F]"
                                    dir="ltr"
                                  >
                                    {member.nameEn}
                                  </span>
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                                    سجل تدريبي محاكي
                                  </span>
                                </div>
                                <div className="text-[11px] font-bold text-slate-600 mt-0.5">
                                  {member.nameAr} — {member.titleAr}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Member Detail Modal (Privacy-Safe) */}
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
                {selectedMember.employeeRecord ? (
                  <EmployeeAvatar
                    employee={selectedMember.employeeRecord}
                    className="w-18 h-18 rounded-2xl bg-[#071324] border-2 border-[#00D2FF] flex items-center justify-center text-lg font-black text-[#00D2FF] shadow-md overflow-hidden shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-[#071324] border-2 border-[#00D2FF] flex items-center justify-center text-lg font-black text-[#00D2FF] shadow-md overflow-hidden shrink-0">
                    <span dir="ltr">{selectedMember.initials}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#00D2FF]/20 border border-[#00D2FF]/40 text-[#00D2FF] text-[10px] font-bold">
                    {selectedMember.levelLabelAr}
                  </span>
                  <h3
                    id="org-member-modal-title"
                    className="text-xl font-black text-white"
                  >
                    {selectedMember.nameAr}
                  </h3>
                  <p className="text-xs font-bold text-[#00D2FF] font-mono" dir="ltr">
                    {selectedMember.nameEn}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-[#F0F6FD] border border-[#BFDBFE] space-y-1">
                <span className="text-[11px] font-bold text-slate-500 block">
                  المسمى الوظيفي المعتمد (Job Title)
                </span>
                <div className="text-sm font-black text-[#0A192F]">
                  {selectedMember.titleAr}
                </div>
                <div className="text-xs font-bold text-[#2563EB] font-mono" dir="ltr">
                  {selectedMember.titleEn}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl border border-[#E2E8F0] bg-[#F8FBFF]">
                  <span className="text-[11px] text-slate-500 block mb-1">
                    القسم / الوحدة التنظيمية
                  </span>
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

                {selectedMember.showPublicEmail && selectedMember.email ? (
                  <div className="p-3.5 rounded-2xl border border-[#E2E8F0] bg-[#F8FBFF] sm:col-span-2">
                    <span className="text-[11px] text-slate-500 block mb-1">
                      البريد الإلكتروني المعتمد للتواصل
                    </span>
                    <div
                      className="font-semibold text-[#0A192F] flex items-center gap-2"
                      dir="ltr"
                    >
                      <Mail className="w-4 h-4 text-[#2563EB]" />
                      <span>{selectedMember.email}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl border border-[#E2E8F0] bg-[#F8FBFF] sm:col-span-2 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-0.5">
                        قنوات التواصل الرسمية
                      </span>
                      <span className="text-xs font-bold text-[#0A192F]">
                        البريد المباشر محمي وفق إعدادات الخصوصية المؤسسية
                      </span>
                    </div>
                    <Link
                      to="/contact"
                      onClick={() => setSelectedMember(null)}
                      className="px-3 py-1.5 rounded-xl bg-[#EBF4FE] text-[#2563EB] text-xs font-bold hover:bg-[#2563EB] hover:text-white transition-colors"
                    >
                      صفحة تواصل معنا
                    </Link>
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F0F6FD] border border-[#E2E8F0]">
                <span className="text-[11px] font-bold text-slate-500 block mb-1">
                  الاختصاص والمهام التنظيمية
                </span>
                <p className="text-xs text-[#0A192F] leading-relaxed">
                  {selectedMember.bioAr}
                </p>
              </div>

              {selectedMember.isTrainingSimulation && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    هذه البطاقة معروضة ضمن وضع المحاكاة التدريبية المستقل.
                  </span>
                </div>
              )}

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
