/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Employee } from '../../types';
import {
  validateEmployee,
  normalizeEmployeeVisibility,
  sortEmployeesByHierarchy,
} from '../../utils/orgChart';
import { resolvePublicImageUrl } from '../../utils/imageUrl';
import { ImageUploadField } from './ImageUploadField';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  Building2,
  GitFork,
  Search,
  Link as LinkIcon,
  Crown,
  Eye,
  EyeOff,
  Mail,
  UserCheck,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export const AdminTeam: React.FC = () => {
  const {
    employees,
    departments,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    backendConfig,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<
    'all' | 'team_visible' | 'org_visible' | 'partially_hidden' | 'public_email'
  >('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  // Form State
  const [formNameAr, setFormNameAr] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formJobTitleAr, setFormJobTitleAr] = useState('');
  const [formJobTitleEn, setFormJobTitleEn] = useState('');
  const [formDepartmentId, setFormDepartmentId] = useState('dept-it');
  const [formManagerId, setFormManagerId] = useState<string | null>('emp-ahmed-alabed');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formImageFileId, setFormImageFileId] = useState('');
  const [formImageAltAr, setFormImageAltAr] = useState('');
  const [formBioAr, setFormBioAr] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formIsConfirmed, setFormIsConfirmed] = useState(true);
  // 4 Visibility & Privacy Flags
  const [formShowOnTeamPage, setFormShowOnTeamPage] = useState(true);
  const [formShowOnOrgChart, setFormShowOnOrgChart] = useState(true);
  const [formShowPublicEmail, setFormShowPublicEmail] = useState(false);
  const [formShowPublicProfile, setFormShowPublicProfile] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Delete Confirmation State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const normalizedEmployees = useMemo(() => {
    return sortEmployeesByHierarchy(employees.map(normalizeEmployeeVisibility));
  }, [employees]);

  const counts = useMemo(() => {
    return {
      total: normalizedEmployees.length,
      teamVisible: normalizedEmployees.filter((e) => e.showOnTeamPage !== false).length,
      orgVisible: normalizedEmployees.filter((e) => e.showOnOrgChart !== false).length,
      partiallyHidden: normalizedEmployees.filter(
        (e) =>
          e.showOnTeamPage === false ||
          e.showOnOrgChart === false ||
          e.showPublicProfile === false
      ).length,
      publicEmail: normalizedEmployees.filter((e) => e.showPublicEmail === true).length,
    };
  }, [normalizedEmployees]);

  const openAddModal = () => {
    setEditingEmployee(null);
    setFormNameAr('');
    setFormNameEn('');
    setFormJobTitleAr('قيد التعيين');
    setFormJobTitleEn('Position to be assigned');
    setFormDepartmentId(departments[1]?.id || 'dept-it');
    setFormManagerId('emp-ahmed-alabed');
    setFormImageUrl('');
    setFormImageFileId('');
    setFormImageAltAr('');
    setFormBioAr('');
    setFormEmail('');
    setFormIsConfirmed(true);
    setFormShowOnTeamPage(true);
    setFormShowOnOrgChart(true);
    setFormShowPublicEmail(false);
    setFormShowPublicProfile(true);
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (rawEmp: Employee) => {
    const emp = normalizeEmployeeVisibility(rawEmp);
    setEditingEmployee(emp);
    setFormNameAr(emp.nameAr);
    setFormNameEn(emp.nameEn);
    setFormJobTitleAr(emp.jobTitleAr);
    setFormJobTitleEn(emp.jobTitleEn || '');
    setFormDepartmentId(emp.departmentId);
    setFormManagerId(emp.managerId);
    setFormImageUrl(emp.image_url || emp.avatarUrl || '');
    setFormImageFileId(emp.image_file_id || '');
    setFormImageAltAr(emp.image_alt_ar || `صورة ${emp.nameAr}`);
    setFormBioAr(emp.bioAr || '');
    setFormEmail(emp.email || '');
    setFormIsConfirmed(emp.isConfirmedPosition);
    setFormShowOnTeamPage(emp.showOnTeamPage !== false);
    setFormShowOnOrgChart(emp.showOnOrgChart !== false);
    setFormShowPublicEmail(emp.showPublicEmail === true);
    setFormShowPublicProfile(emp.showPublicProfile !== false);
    setErrors({});
    setIsModalOpen(true);
  };

  const handleQuickVisibilityToggle = (
    emp: Employee,
    field:
      | 'showOnTeamPage'
      | 'showOnOrgChart'
      | 'showPublicEmail'
      | 'showPublicProfile'
  ) => {
    const normalized = normalizeEmployeeVisibility(emp);
    const nextValue = !normalized[field];
    updateEmployee(emp.id, {
      [field]: nextValue,
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateEmployee({
      nameAr: formNameAr,
      nameEn: formNameEn,
      jobTitleAr: formJobTitleAr,
      departmentId: formDepartmentId,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    const initials =
      formNameAr
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('.') || 'س.م';

    const cleanImageUrl = formImageUrl.trim();
    const cleanFileId = formImageFileId.trim();
    const cleanAltAr = formImageAltAr.trim() || `صورة ${formNameAr.trim()}`;

    if (editingEmployee) {
      updateEmployee(editingEmployee.id, {
        nameAr: formNameAr.trim(),
        nameEn: formNameEn.trim(),
        jobTitleAr: formJobTitleAr.trim(),
        jobTitleEn: formJobTitleEn.trim() || formJobTitleAr.trim(),
        departmentId: formDepartmentId,
        managerId: formManagerId,
        avatarUrl: cleanImageUrl || '',
        image_url: cleanImageUrl || '',
        image_file_id: cleanFileId,
        image_alt_ar: cleanAltAr,
        initials,
        bioAr: formBioAr.trim(),
        email: formEmail.trim(),
        isConfirmedPosition: formIsConfirmed,
        showOnTeamPage: formShowOnTeamPage,
        showOnOrgChart: formShowOnOrgChart,
        showPublicEmail: formShowPublicEmail,
        showPublicProfile: formShowPublicProfile,
      });
    } else {
      addEmployee({
        nameAr: formNameAr.trim(),
        nameEn: formNameEn.trim(),
        jobTitleAr: formJobTitleAr.trim(),
        jobTitleEn: formJobTitleEn.trim() || 'Team Member',
        departmentId: formDepartmentId,
        managerId: formManagerId,
        avatarUrl: cleanImageUrl || '',
        image_url: cleanImageUrl || '',
        image_file_id: cleanFileId,
        image_alt_ar: cleanAltAr,
        initials,
        bioAr: formBioAr.trim(),
        email: formEmail.trim(),
        isConfirmedPosition: formIsConfirmed,
        showOnTeamPage: formShowOnTeamPage,
        showOnOrgChart: formShowOnOrgChart,
        showPublicEmail: formShowPublicEmail,
        showPublicProfile: formShowPublicProfile,
      });
    }

    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmId) {
      deleteEmployee(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const filtered = useMemo(() => {
    return normalizedEmployees.filter((emp) => {
      const s = searchTerm.toLowerCase();
      const matchesSearch =
        emp.nameAr.toLowerCase().includes(s) ||
        emp.nameEn.toLowerCase().includes(s) ||
        emp.jobTitleAr.toLowerCase().includes(s) ||
        (emp.jobTitleEn && emp.jobTitleEn.toLowerCase().includes(s));

      if (!matchesSearch) return false;

      if (visibilityFilter === 'team_visible') {
        return emp.showOnTeamPage !== false;
      }
      if (visibilityFilter === 'org_visible') {
        return emp.showOnOrgChart !== false;
      }
      if (visibilityFilter === 'partially_hidden') {
        return (
          emp.showOnTeamPage === false ||
          emp.showOnOrgChart === false ||
          emp.showPublicProfile === false
        );
      }
      if (visibilityFilter === 'public_email') {
        return emp.showPublicEmail === true;
      }
      return true;
    });
  }, [normalizedEmployees, searchTerm, visibilityFilter]);

  const getDeptName = (id: string) => {
    return departments.find((d) => d.id === id)?.nameAr || 'قسم عام';
  };

  const getManagerName = (managerId: string | null) => {
    if (!managerId) return 'رئيسي (لا يوجد مسؤول مباشر)';
    const m = employees.find((e) => e.id === managerId);
    return m ? m.nameAr : 'غير محدد';
  };

  return (
    <div className="space-y-6 text-right bg-white">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#142B4F]">
            إدارة كادر الفريق، الظهور، والخصوصية (Team)
          </h2>
          <p className="text-xs text-slate-500">
            إدارة سجلات الموظفين الـ {counts.total} المعتمدة، التحكم الفوري بالظهور في صفحة الفريق والهيكل التنظيمي، وحماية خصوصية البريد الشخصي دون حذف أي سجل.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="px-4 py-2.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة موظف جديد</span>
        </button>
      </div>

      {/* Safe Visibility & Privacy Guarantee Notice */}
      <div className="p-4 rounded-2xl bg-[#F0F6FD] border border-[#BFDBFE] flex items-start gap-3 text-xs text-[#142B4F]">
        <ShieldCheck className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <div className="font-bold text-[#2563EB]">
            مفاتيح التحكم بالظهور والخصوصية (حفظ آمن دون حذف السجلات):
          </div>
          <p>
            تعطيل أي من خيارات الظهور (<strong>صفحة الفريق</strong> أو <strong>الهيكل التنظيمي</strong> أو <strong>البطاقة التفصيلية</strong> أو <strong>البريد العام</strong>) يخفي العنصر من الواجهة العامة فقط مع الاحتفاظ الكامل بسجل الموظف وصورته وتبعيته الإدارية في قاعدة البيانات.
          </p>
        </div>
      </div>

      {/* Search & Visibility Filter Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-[#F8FAFC] p-3.5 rounded-2xl border border-[#E2E8F0]">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="البحث بالاسم أو المسمى الوظيفي..."
            className="w-full pr-10 pl-4 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white focus:outline-none focus:border-[#2563EB]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setVisibilityFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              visibilityFilter === 'all'
                ? 'bg-[#142B4F] text-white'
                : 'bg-white text-slate-600 border border-[#CBD5E1] hover:bg-slate-100'
            }`}
          >
            الكل ({counts.total})
          </button>
          <button
            type="button"
            onClick={() => setVisibilityFilter('team_visible')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              visibilityFilter === 'team_visible'
                ? 'bg-[#2563EB] text-white'
                : 'bg-white text-slate-600 border border-[#CBD5E1] hover:bg-slate-100'
            }`}
          >
            ظاهر في الفريق ({counts.teamVisible})
          </button>
          <button
            type="button"
            onClick={() => setVisibilityFilter('org_visible')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              visibilityFilter === 'org_visible'
                ? 'bg-[#2563EB] text-white'
                : 'bg-white text-slate-600 border border-[#CBD5E1] hover:bg-slate-100'
            }`}
          >
            ظاهر في الهيكل ({counts.orgVisible})
          </button>
          <button
            type="button"
            onClick={() => setVisibilityFilter('partially_hidden')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              visibilityFilter === 'partially_hidden'
                ? 'bg-amber-600 text-white'
                : 'bg-white text-slate-600 border border-[#CBD5E1] hover:bg-slate-100'
            }`}
          >
            مخفي جزئياً ({counts.partiallyHidden})
          </button>
          <button
            type="button"
            onClick={() => setVisibilityFilter('public_email')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              visibilityFilter === 'public_email'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-slate-600 border border-[#CBD5E1] hover:bg-slate-100'
            }`}
          >
            بريد عام مفعّل ({counts.publicEmail})
          </button>
        </div>
      </div>

      {/* Employee Cards Grid with Quick Visibility Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((emp) => {
          const isGeneralManager = emp.id === 'emp-ahmed-alabed';
          const isAdvisor = emp.departmentId === 'dept-exec-digital-advisory';
          const displayAvatar = resolvePublicImageUrl(
            emp.image_url || emp.avatarUrl,
            emp.image_file_id
          );
          const hasBrokenImg = brokenImages[emp.id];

          return (
            <div
              key={emp.id}
              data-testid={`admin-emp-card-${emp.id}`}
              className="bg-white rounded-2xl border border-[#CBD5E1] p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between relative overflow-hidden"
            >
              {isGeneralManager && (
                <div className="absolute top-0 right-0 bg-[#142B4F] text-white text-[9px] font-bold px-2.5 py-0.5 rounded-bl-lg flex items-center gap-1">
                  <Crown className="w-2.5 h-2.5 text-amber-300" />
                  <span>الرئيس التنفيذي</span>
                </div>
              )}

              {isAdvisor && (
                <div className="absolute top-0 right-0 bg-[#7C5CDE] text-white text-[9px] font-bold px-2.5 py-0.5 rounded-bl-lg flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-white" />
                  <span>مستشار تنفيذي</span>
                </div>
              )}

              <div>
                {/* Header row: Avatar + Name + Title */}
                <div className="flex items-start gap-3.5 mb-3">
                  <div className="w-16 h-16 rounded-xl bg-[#F5F8FC] border border-[#CBD5E1] text-[#2563EB] flex items-center justify-center font-bold text-base shrink-0 overflow-hidden shadow-2xs">
                    {displayAvatar && !hasBrokenImg ? (
                      <img
                        src={displayAvatar}
                        alt={emp.image_alt_ar || emp.nameAr}
                        onError={() =>
                          setBrokenImages((prev) => ({ ...prev, [emp.id]: true }))
                        }
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <span>{emp.initials}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-sm text-[#142B4F] truncate">
                        {emp.nameAr}
                      </h3>
                      {emp.isConfirmedPosition ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                          معتمد
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 shrink-0">
                          قيد التعيين
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium font-mono" dir="ltr">
                      {emp.nameEn}
                    </p>
                    <div className="text-xs font-bold text-[#2563EB] mt-1">
                      {emp.jobTitleAr}
                    </div>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-2 border-t border-[#F1F5F9]">
                  <div className="flex items-center gap-1 truncate">
                    <Building2 className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                    <span className="truncate">{getDeptName(emp.departmentId)}</span>
                  </div>
                  <div className="flex items-center gap-1 truncate">
                    <GitFork className="w-3.5 h-3.5 text-[#7C5CDE] shrink-0" />
                    <span className="truncate">{getManagerName(emp.managerId)}</span>
                  </div>
                </div>

                {/* 4 Independent Visibility & Privacy Toggles */}
                <div className="mt-3 pt-3 border-t border-[#F1F5F9] space-y-2">
                  <div className="text-[10px] font-bold text-slate-500">
                    إعدادات الظهور والخصوصية الفورية:
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Toggle 1: showOnTeamPage */}
                    <button
                      type="button"
                      data-testid={`toggle-showOnTeamPage-${emp.id}`}
                      onClick={() => handleQuickVisibilityToggle(emp, 'showOnTeamPage')}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                        emp.showOnTeamPage !== false
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-slate-100 border-slate-200 text-slate-500'
                      }`}
                    >
                      <span className="flex items-center gap-1 truncate">
                        {emp.showOnTeamPage !== false ? (
                          <Eye className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span className="truncate">صفحة الفريق</span>
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-white border">
                        {emp.showOnTeamPage !== false ? 'مفعّل' : 'مخفي'}
                      </span>
                    </button>

                    {/* Toggle 2: showOnOrgChart */}
                    <button
                      type="button"
                      data-testid={`toggle-showOnOrgChart-${emp.id}`}
                      onClick={() => handleQuickVisibilityToggle(emp, 'showOnOrgChart')}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                        emp.showOnOrgChart !== false
                          ? 'bg-blue-50 border-blue-200 text-blue-900'
                          : 'bg-slate-100 border-slate-200 text-slate-500'
                      }`}
                    >
                      <span className="flex items-center gap-1 truncate">
                        <GitFork
                          className={`w-3.5 h-3.5 shrink-0 ${
                            emp.showOnOrgChart !== false ? 'text-[#2563EB]' : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate">الهيكل التنظيمي</span>
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-white border">
                        {emp.showOnOrgChart !== false ? 'مفعّل' : 'مخفي'}
                      </span>
                    </button>

                    {/* Toggle 3: showPublicProfile */}
                    <button
                      type="button"
                      data-testid={`toggle-showPublicProfile-${emp.id}`}
                      onClick={() => handleQuickVisibilityToggle(emp, 'showPublicProfile')}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                        emp.showPublicProfile !== false
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                          : 'bg-slate-100 border-slate-200 text-slate-500'
                      }`}
                    >
                      <span className="flex items-center gap-1 truncate">
                        <UserCheck
                          className={`w-3.5 h-3.5 shrink-0 ${
                            emp.showPublicProfile !== false
                              ? 'text-indigo-600'
                              : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate">الملف التفصيلي</span>
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-white border">
                        {emp.showPublicProfile !== false ? 'مفعّل' : 'معطّل'}
                      </span>
                    </button>

                    {/* Toggle 4: showPublicEmail */}
                    <button
                      type="button"
                      data-testid={`toggle-showPublicEmail-${emp.id}`}
                      onClick={() => handleQuickVisibilityToggle(emp, 'showPublicEmail')}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                        emp.showPublicEmail === true
                          ? 'bg-amber-50 border-amber-300 text-amber-900'
                          : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                    >
                      <span className="flex items-center gap-1 truncate">
                        <Mail
                          className={`w-3.5 h-3.5 shrink-0 ${
                            emp.showPublicEmail === true ? 'text-amber-600' : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate">البريد للعامة</span>
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-white border">
                        {emp.showPublicEmail === true ? 'ظاهر' : 'محمي'}
                      </span>
                    </button>
                  </div>
                </div>

                {(emp.image_url || emp.avatarUrl) && (
                  <div
                    className="mt-2.5 text-[10px] text-slate-500 truncate flex items-center gap-1.5"
                    dir="ltr"
                  >
                    <LinkIcon className="w-3 h-3 text-[#2563EB] shrink-0" />
                    <span className="truncate">{emp.image_url || emp.avatarUrl}</span>
                    {emp.image_file_id && (
                      <span className="px-1.5 py-0.2 bg-blue-50 text-[#2563EB] rounded font-mono shrink-0">
                        {emp.image_file_id}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="pt-3 mt-3 border-t border-[#F1F5F9] flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono truncate" dir="ltr">
                  {emp.email || 'بدون بريد مسجل'}
                </span>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditModal(emp)}
                    className="px-3 py-1.5 text-xs font-bold text-[#142B4F] bg-[#F5F8FC] hover:bg-slate-100 border border-[#CBD5E1] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>تعديل شامل</span>
                  </button>

                  {!isGeneralManager && (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(emp.id)}
                      className="px-2.5 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
                      title="حذف الموظف نهائياً"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col border border-[#CBD5E1] overflow-hidden text-right">
            <div className="bg-[#F5F8FC] border-b border-[#E2E8F0] p-5 flex items-center justify-between">
              <h3 className="text-base font-bold text-[#142B4F]">
                {editingEmployee
                  ? `تعديل بيانات وإعدادات ظهور: ${editingEmployee.nameAr}`
                  : 'إضافة موظف جديد للكادر'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-[#142B4F] p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              <ImageUploadField
                labelAr="الصورة الشخصية للموظف (image_url / image_file_id)"
                entityType="team"
                entityId={editingEmployee?.id || 'new-employee'}
                imageUrl={formImageUrl}
                imageFileId={formImageFileId}
                imageAltAr={formImageAltAr}
                showAltInput={true}
                adminKey={backendConfig.adminApiKey || ''}
                onImageChange={({ imageUrl, imageFileId, imageAltAr }) => {
                  setFormImageUrl(imageUrl);
                  setFormImageFileId(imageFileId);
                  if (imageAltAr !== undefined) {
                    setFormImageAltAr(imageAltAr);
                  }
                  if (editingEmployee) {
                    setBrokenImages((prev) => ({
                      ...prev,
                      [editingEmployee.id]: false,
                    }));
                  }
                }}
              />

              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الاسم باللغة العربية *
                  </label>
                  <input
                    type="text"
                    required
                    value={formNameAr}
                    onChange={(e) => setFormNameAr(e.target.value)}
                    placeholder="مثال: د. أحمد العابد"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#CBD5E1] bg-white focus:outline-none focus:border-[#2563EB]"
                  />
                  {errors.nameAr && (
                    <span className="text-[11px] text-red-600">{errors.nameAr}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الاسم باللغة الإنجليزية *
                  </label>
                  <input
                    type="text"
                    required
                    value={formNameEn}
                    onChange={(e) => setFormNameEn(e.target.value)}
                    placeholder="e.g. Dr. Ahmad Al-Abed"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#CBD5E1] bg-white focus:outline-none focus:border-[#2563EB]"
                    dir="ltr"
                  />
                  {errors.nameEn && (
                    <span className="text-[11px] text-red-600">{errors.nameEn}</span>
                  )}
                </div>
              </div>

              {/* Job Titles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    المسمى الوظيفي بالعربية *
                  </label>
                  <input
                    type="text"
                    required
                    value={formJobTitleAr}
                    onChange={(e) => setFormJobTitleAr(e.target.value)}
                    placeholder="مثال: الرئيس التنفيذي / رئيس قسم..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#CBD5E1] bg-white focus:outline-none focus:border-[#2563EB]"
                  />
                  {errors.jobTitleAr && (
                    <span className="text-[11px] text-red-600">{errors.jobTitleAr}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    المسمى الوظيفي بالإنجليزية
                  </label>
                  <input
                    type="text"
                    value={formJobTitleEn}
                    onChange={(e) => setFormJobTitleEn(e.target.value)}
                    placeholder="e.g. Chief Executive Officer"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#CBD5E1] bg-white focus:outline-none focus:border-[#2563EB]"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Department & Manager */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    القسم التابع له *
                  </label>
                  <select
                    value={formDepartmentId}
                    onChange={(e) => setFormDepartmentId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#CBD5E1] bg-white focus:outline-none focus:border-[#2563EB]"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    المسؤول المباشر
                  </label>
                  <select
                    value={formManagerId || ''}
                    onChange={(e) => setFormManagerId(e.target.value ? e.target.value : null)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#CBD5E1] bg-white focus:outline-none focus:border-[#2563EB]"
                  >
                    <option value="">لا يوجد (رئيسي / الرئيس التنفيذي)</option>
                    {employees
                      .filter((e) => !editingEmployee || e.id !== editingEmployee.id)
                      .map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.nameAr} ({e.jobTitleAr})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Email & Confirmed Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    البريد الإلكتروني (محفوظ في السجل)
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="user@smartmasar.com"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#CBD5E1] bg-white focus:outline-none focus:border-[#2563EB]"
                    dir="ltr"
                  />
                </div>

                <div className="pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsConfirmed}
                      onChange={(e) => setFormIsConfirmed(e.target.checked)}
                      className="w-4 h-4 rounded text-[#2563EB] focus:ring-0"
                    />
                    <span className="text-xs font-bold text-[#142B4F]">
                      منصب معتمد رسمياً
                    </span>
                  </label>
                </div>
              </div>

              {/* 4 Independent Visibility & Privacy Checkboxes inside Modal */}
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] space-y-3">
                <div className="text-xs font-bold text-[#142B4F]">
                  خيارات الظهور والخصوصية المستقلة:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer p-2 rounded-lg bg-white border border-slate-200">
                    <input
                      type="checkbox"
                      checked={formShowOnTeamPage}
                      onChange={(e) => setFormShowOnTeamPage(e.target.checked)}
                      className="w-4 h-4 rounded text-[#2563EB]"
                    />
                    <span>إظهار في صفحة فريق العمل (showOnTeamPage)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer p-2 rounded-lg bg-white border border-slate-200">
                    <input
                      type="checkbox"
                      checked={formShowOnOrgChart}
                      onChange={(e) => setFormShowOnOrgChart(e.target.checked)}
                      className="w-4 h-4 rounded text-[#2563EB]"
                    />
                    <span>إظهار في الهيكل التنظيمي (showOnOrgChart)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer p-2 rounded-lg bg-white border border-slate-200">
                    <input
                      type="checkbox"
                      checked={formShowPublicProfile}
                      onChange={(e) => setFormShowPublicProfile(e.target.checked)}
                      className="w-4 h-4 rounded text-[#2563EB]"
                    />
                    <span>تفعيل البطاقة التفصيلية للزوار (showPublicProfile)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer p-2 rounded-lg bg-white border border-slate-200">
                    <input
                      type="checkbox"
                      checked={formShowPublicEmail}
                      onChange={(e) => setFormShowPublicEmail(e.target.checked)}
                      className="w-4 h-4 rounded text-[#2563EB]"
                    />
                    <span>إظهار البريد الإلكتروني للعامة (showPublicEmail)</span>
                  </label>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  نبذة مهنية موجزة (اختياري)
                </label>
                <textarea
                  rows={2}
                  value={formBioAr}
                  onChange={(e) => setFormBioAr(e.target.value)}
                  placeholder="ملاحظات أو نبذة مختصرة..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#CBD5E1] bg-white focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-lg cursor-pointer shadow-sm"
                >
                  حفظ بيانات الموظف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div
          role="alertdialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-right space-y-4 border border-[#CBD5E1]">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-[#142B4F]">تأكيد حذف الموظف نهائياً</h3>
              <p className="text-xs text-slate-500">
                ملاحظة: إذا كنت ترغب في إخفاء الموظف من الصفحات العامة فقط دون حذفه، استخدم مفاتيح الظهور بدلاً من الحذف النهائي.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer shadow-sm"
              >
                نعم، احذف السجل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
