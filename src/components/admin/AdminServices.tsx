/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ServiceItem } from '../../types';
import { ImageUploadField } from './ImageUploadField';
import { resolvePublicImageUrl } from '../../utils/imageUrl';
import {
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  X,
  Cpu,
  Code,
  Share2,
  Sliders,
  CheckCircle2,
  Image as ImageIcon,
  AlertTriangle,
} from 'lucide-react';

export const AdminServices: React.FC = () => {
  const { services, updateService, addService, deleteService, backendConfig } = useApp();

  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state
  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [shortDescAr, setShortDescAr] = useState('');
  const [featuresText, setFeaturesText] = useState('');
  const [iconName, setIconName] = useState('Cpu');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFileId, setImageFileId] = useState('');
  const [imageAltAr, setImageAltAr] = useState('');

  const openAddModal = () => {
    setEditingService(null);
    setTitleAr('');
    setTitleEn('');
    setShortDescAr('');
    setFeaturesText('');
    setIconName('Cpu');
    setImageUrl('');
    setImageFileId('');
    setImageAltAr('');
    setIsModalOpen(true);
  };

  const openEditModal = (srv: ServiceItem) => {
    setEditingService(srv);
    setTitleAr(srv.titleAr);
    setTitleEn(srv.titleEn);
    setShortDescAr(srv.shortDescAr);
    setFeaturesText((srv.featuresAr || []).join('\n'));
    setIconName(srv.iconName || 'Cpu');
    setImageUrl(srv.image_url || '');
    setImageFileId(srv.image_file_id || '');
    setImageAltAr(srv.image_alt_ar || srv.titleAr);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleAr.trim() || !titleEn.trim()) return;

    const featuresAr = featuresText
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    if (editingService) {
      updateService(editingService.id, {
        titleAr: titleAr.trim(),
        titleEn: titleEn.trim(),
        shortDescAr: shortDescAr.trim(),
        featuresAr: featuresAr.length > 0 ? featuresAr : editingService.featuresAr,
        iconName,
        image_url: imageUrl.trim(),
        image_file_id: imageFileId.trim(),
        image_alt_ar: imageAltAr.trim() || titleAr.trim(),
      });
    } else {
      addService({
        titleAr: titleAr.trim(),
        titleEn: titleEn.trim(),
        shortDescAr: shortDescAr.trim(),
        featuresAr:
          featuresAr.length > 0 ? featuresAr : ['حلول تقنية متكاملة ومخصصة لاحتياجات الأعمال'],
        iconName,
        image_url: imageUrl.trim(),
        image_file_id: imageFileId.trim(),
        image_alt_ar: imageAltAr.trim() || titleAr.trim(),
      });
    }
    setIsModalOpen(false);
  };

  const getIconComponent = (name: string) => {
    switch (name) {
      case 'Cpu':
        return <Cpu className="w-5 h-5 text-[#2563EB]" />;
      case 'Code':
        return <Code className="w-5 h-5 text-[#2563EB]" />;
      case 'Share2':
        return <Share2 className="w-5 h-5 text-[#7C5CDE]" />;
      case 'Sliders':
        return <Sliders className="w-5 h-5 text-[#0284C7]" />;
      default:
        return <Sparkles className="w-5 h-5 text-[#2563EB]" />;
    }
  };

  return (
    <div className="space-y-6 text-right bg-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div>
          <h2 className="text-xl font-bold text-[#142B4F]">
            إدارة الخدمات التقنية وصورها (Services & Media)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            تعديل محاور الخدمات، رفع صور توضيحية لكل خدمة إلى Google Drive، وتحديث جدول Services في Google Sheets.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="px-4 py-2.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة خدمة تقنية جديدة</span>
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map((srv) => {
          const displayImg = resolvePublicImageUrl(srv.image_url, srv.image_file_id);
          return (
            <div
              key={srv.id}
              className="bg-white rounded-2xl border border-[#CBD5E1] shadow-2xs overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Service Image Banner or Placeholder */}
                <div className="h-44 bg-[#F5F8FC] border-b border-[#E2E8F0] relative overflow-hidden flex items-center justify-center">
                  {displayImg ? (
                    <img
                      src={displayImg}
                      alt={srv.image_alt_ar || srv.titleAr}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 space-y-1.5">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-[#CBD5E1] flex items-center justify-center shadow-2xs">
                        {getIconComponent(srv.iconName)}
                      </div>
                      <span className="text-[11px] font-bold text-slate-500">
                        لا توجد صورة مرفوعة — يتم عرض الأيقونة الافتراضية
                      </span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-[#0A192F]/80 backdrop-blur-xs text-white text-[10px] font-mono px-2.5 py-1 rounded-lg">
                    {srv.id}
                  </div>
                </div>

                {/* Service Content */}
                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="text-base font-bold text-[#142B4F]">{srv.titleAr}</h3>
                    <p className="text-[11px] text-[#2563EB] font-mono font-bold" dir="ltr">
                      {srv.titleEn}
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {srv.shortDescAr}
                  </p>

                  {/* Direct Quick Image Upload inside Card */}
                  <ImageUploadField
                    labelAr={`صورة الخدمة: ${srv.titleAr}`}
                    entityType="services"
                    entityId={srv.id}
                    imageUrl={srv.image_url || ''}
                    imageFileId={srv.image_file_id || ''}
                    imageAltAr={srv.image_alt_ar || srv.titleAr}
                    showAltInput={true}
                    adminKey={backendConfig.adminApiKey || ''}
                    onImageChange={({ imageUrl: newUrl, imageFileId: newId, imageAltAr: newAlt }) =>
                      updateService(srv.id, {
                        image_url: newUrl,
                        image_file_id: newId,
                        image_alt_ar: newAlt,
                      })
                    }
                  />
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="px-5 py-3.5 bg-[#F5F8FC] border-t border-[#E2E8F0] flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-semibold">
                  {srv.featuresAr.length} مخرجات مسجلة
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(srv)}
                    className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-[#142B4F] border border-[#CBD5E1] text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>تعديل النصوص والصورة</span>
                  </button>

                  {services.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(srv.id)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition-colors cursor-pointer"
                      title="حذف الخدمة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Service Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-[#CBD5E1] overflow-hidden text-right max-h-[90vh] flex flex-col">
            <div className="bg-[#F5F8FC] border-b border-[#E2E8F0] p-5 flex items-center justify-between">
              <h3 className="text-base font-bold text-[#142B4F]">
                {editingService ? `تعديل الخدمة: ${editingService.titleAr}` : 'إضافة خدمة تقنية جديدة'}
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
                labelAr="صورة الخدمة التوضيحية (image_url / image_file_id)"
                entityType="services"
                entityId={editingService?.id || 'new-service'}
                imageUrl={imageUrl}
                imageFileId={imageFileId}
                imageAltAr={imageAltAr}
                showAltInput={true}
                adminKey={backendConfig.adminApiKey || ''}
                onImageChange={({ imageUrl: u, imageFileId: id, imageAltAr: alt }) => {
                  setImageUrl(u);
                  setImageFileId(id);
                  if (alt !== undefined) setImageAltAr(alt);
                }}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    عنوان الخدمة بالعربية *
                  </label>
                  <input
                    type="text"
                    required
                    value={titleAr}
                    onChange={(e) => setTitleAr(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    عنوان الخدمة بالإنجليزية *
                  </label>
                  <input
                    type="text"
                    required
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الأيقونة الرمزية
                </label>
                <select
                  value={iconName}
                  onChange={(e) => setIconName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white"
                >
                  <option value="Cpu">معالج ذكي (Cpu)</option>
                  <option value="Code">برمجيات (Code)</option>
                  <option value="Share2">تحول رقمي (Share2)</option>
                  <option value="Sliders">أتمتة عمليات (Sliders)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الوصف المختصر للخدمة *
                </label>
                <textarea
                  rows={3}
                  required
                  value={shortDescAr}
                  onChange={(e) => setShortDescAr(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  أبرز المحاور والمخرجات (سطر لكل ميزة)
                </label>
                <textarea
                  rows={4}
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white leading-relaxed"
                />
              </div>

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
                  className="px-5 py-2 text-xs font-bold bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-lg cursor-pointer shadow-xs"
                >
                  حفظ بيانات الخدمة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Service Confirmation Modal */}
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
              <h3 className="text-base font-bold text-[#142B4F]">تأكيد حذف الخدمة</h3>
              <p className="text-xs text-slate-500">
                هل أنت متأكد من حذف هذه الخدمة من قائمة الخدمات؟
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
                onClick={() => {
                  deleteService(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer"
              >
                نعم، احذف الخدمة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
