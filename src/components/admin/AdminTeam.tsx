/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Employee } from '../../types';
import { validateEmployee } from '../../utils/orgChart';
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
  HardDrive,
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  // Form State
  const [formNameAr, setFormNameAr] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formJobTitleAr, setFormJobTitleAr] = useState('');
  const [formJobTitleEn, setFormJobTitleEn] = useState('');
  const [formDepartmentId, setFormDepartmentId] = useState('tech');
  const [formManagerId, setFormManagerId] = useState<string | null>('emp-ahmed-alabed');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formImageFileId, setFormImageFileId] = useState('');
  const [formImageAltAr, setFormImageAltAr] = useState('');
  const [formBioAr, setFormBioAr] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formIsConfirmed, setFormIsConfirmed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Delete Confirmation State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingEmployee(null);
    setFormNameAr('');
    setFormNameEn('');
    setFormJobTitleAr('قيد التعيين');
    setFormJobTitleEn('Position to be assigned');
    setFormDepartmentId(departments[1]?.id || 'tech');
    setFormManagerId('emp-ahmed-alabed');
    setFormImageUrl('');
    setFormImageFileId('');
    setFormImageAltAr('');
    setFormBioAr('');
    setFormEmail('');
    setFormIsConfirmed(false);
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
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
    setErrors({});
    setIsModalOpen(true);
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
        email:
          formEmail.trim() ||
          `${formNameEn.toLowerCase().replace(/\s+/g, '.')}@smartmasar.edu`,
        isConfirmedPosition: formIsConfirmed,
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
        email:
          formEmail.trim() ||
          `${formNameEn.toLowerCase().replace(/\s+/g, '.')}@smartmasar.edu`,
        isConfirmedPosition: formIsConfirmed,
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

  const filtered = employees.filter((emp) => {
    const s = searchTerm.toLowerCase();
    return (
      emp.nameAr.toLowerCase().includes(s) ||
      emp.nameEn.toLowerCase().includes(s) ||
      emp.jobTitleAr.toLowerCase().includes(s)
    );
  });

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
          <h2 className="text-xl font-bold text-[#142B4F]">إدارة كادر الفريق والصور الشخصية</h2>
          <p className="text-xs text-slate-500">
            إدارة ملفات الموظفين، رفع الصور الشخصية إلى Google Drive، وتحديث حقول{' '}
            <code className="font-mono text-[#2563EB]">image_url</code> و{' '}
            <code className="font-mono text-[#2563EB]">image_file_id</code> و{' '}
            <code className="font-mono text-[#2563EB]">image_alt_ar</code> في جدول{' '}
            <strong>Team</strong>.
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

      {/* Search box */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="البحث بالاسم أو المسمى الوظيفي..."
          className="w-full pr-10 pl-4 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-[#F5F8FC] focus:outline-none focus:border-[#2563EB]"
        />
      </div>

      {/* Mobile-Friendly Employee Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((emp) => {
          const isGeneralManager = emp.id === 'emp-ahmed-alabed';
          const displayAvatar = resolvePublicImageUrl(
            emp.image_url || emp.avatarUrl,
            emp.image_file_id
          );
          const hasBrokenImg = brokenImages[emp.id];

          return (
            <div
              key={emp.id}
              className="bg-white rounded-2xl border border-[#CBD5E1] p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between relative overflow-hidden"
            >
              {isGeneralManager && (
                <div className="absolute top-0 right-0 bg-[#142B4F] text-white text-[9px] font-bold px-2.5 py-0.5 rounded-bl-lg flex items-center gap-1">
                  <Crown className="w-2.5 h-2.5 text-amber-300" />
                  <span>المدير العام</span>
                </div>
              )}

              <div>
                {/* Header row: Avatar + Name + Title */}
                <div className="flex items-start gap-3.5 mb-3">
                  <div className="w-14 h-14 rounded-xl bg-[#F5F8FC] border border-[#CBD5E1] text-[#2563EB] flex items-center justify-center font-bold text-base shrink-0 overflow-hidden shadow-2xs">
                    {displayAvatar && !hasBrokenImg ? (
                      <img
                        src={displayAvatar}
                        alt={emp.image_alt_ar || emp.nameAr}
                        onError={() =>
                          setBrokenImages((prev) => ({ ...prev, [emp.id]: true }))
                        }
                        className="w-full h-full object-cover"
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
                    <p className="text-[11px] text-slate-400 font-medium" dir="ltr">
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

                {(emp.image_url || emp.avatarUrl) && (
                  <div
                    className="mt-2 text-[10px] text-slate-500 truncate flex items-center gap-1.5"
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
                <span className="text-[10px] text-slate-400" dir="ltr">
                  {emp.email}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditModal(emp)}
                    className="px-3 py-1.5 text-xs font-bold text-[#142B4F] bg-[#F5F8FC] hover:bg-slate-100 border border-[#CBD5E1] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>تعديل / رفع صورة</span>
                  </button>

                  {!isGeneralManager && (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(emp.id)}
                      className="px-2.5 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
                      title="حذف الموظف"
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

      {/* Add / Edit Mobile-Friendly Modal */}
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
                  ? `تعديل بيانات وصورة: ${editingEmployee.nameAr}`
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
              {/* Complete Image Upload, Preview, Replacement, and Removal Component */}
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
                    placeholder="e.g. Dr. Ahmed Alabed"
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
                    placeholder="مثال: المدير العام / قيد التعيين"
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
                    placeholder="e.g. General Manager / Position to be assigned"
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
                    <option value="">لا يوجد (رئيسي / المدير العام)</option>
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

              {/* Email & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    البريد الإلكتروني المهني
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="user@smartmasar.edu"
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
                      منصب معتمد رسمياً (إلغاء وضع "قيد التعيين")
                    </span>
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
              <h3 className="text-base font-bold text-[#142B4F]">تأكيد حذف الموظف</h3>
              <p className="text-xs text-slate-500">
                هل أنت متأكد من حذف هذا الموظف من سجلات سمارت مسار؟ سيتم نقل تبعية مرؤوسيه تلقائياً إلى المدير العام.
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
                نعم، احذف الموظف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
