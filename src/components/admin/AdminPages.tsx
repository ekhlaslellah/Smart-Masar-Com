/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ImageUploadField } from './ImageUploadField';
import { resolvePublicImageUrl } from '../../utils/imageUrl';
import { FileText, ExternalLink, Image as ImageIcon, Layout } from 'lucide-react';

export const AdminPages: React.FC = () => {
  const { pages, updatePage, backendConfig } = useApp();

  return (
    <div className="space-y-6 text-right bg-white">
      {/* Header */}
      <div className="pb-4 border-b border-[#E2E8F0]">
        <h2 className="text-xl font-bold text-[#142B4F]">
          إدارة صور وعناوين صفحات الموقع (Pages Hero Images)
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          رفع وتخصيص صور الواجهة الرئيسية (Hero Banner) لكل صفحة من صفحات الموقع العامة، مع الحفظ التلقائي لحقول{' '}
          <code className="font-mono text-[#2563EB]">hero_image_url</code> و{' '}
          <code className="font-mono text-[#2563EB]">hero_image_file_id</code> في جدول{' '}
          <strong>Pages</strong> على Google Sheets.
        </p>
      </div>

      {/* Pages List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pages.map((page) => {
          const heroDisplayUrl = resolvePublicImageUrl(
            page.hero_image_url,
            page.hero_image_file_id
          );
          return (
            <div
              key={page.id}
              className="bg-white rounded-2xl border border-[#CBD5E1] shadow-2xs overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Hero Banner Preview */}
                <div className="h-36 bg-gradient-to-l from-[#0A192F] via-[#0E2347] to-[#1E3A8A] relative overflow-hidden flex items-center justify-center">
                  {heroDisplayUrl ? (
                    <>
                      <img
                        src={heroDisplayUrl}
                        alt={page.hero_image_alt_ar || page.titleAr}
                        className="w-full h-full object-cover opacity-85"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0A192F]/80 via-transparent to-transparent" />
                    </>
                  ) : (
                    <div className="text-center text-slate-300 space-y-1 px-4">
                      <Layout className="w-7 h-7 text-[#00D2FF] mx-auto" />
                      <span className="text-[11px] font-bold block">
                        التصميم الهندسي الافتراضي (لم يتم تخصيص صورة بانر)
                      </span>
                    </div>
                  )}

                  <div className="absolute bottom-3 right-4 left-4 flex items-center justify-between text-white">
                    <div>
                      <span className="text-xs font-black block">{page.titleAr}</span>
                      <span className="text-[10px] text-[#00D2FF] font-mono" dir="ltr">
                        Route: {page.slug}
                      </span>
                    </div>
                    <Link
                      to={page.slug}
                      className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[10px] font-bold flex items-center gap-1 backdrop-blur-xs"
                    >
                      <span>معاينة الصفحة</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {/* Page Title & Image Upload Controls */}
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        عنوان الصفحة بالعربية
                      </label>
                      <input
                        type="text"
                        value={page.titleAr}
                        onChange={(e) => updatePage(page.id, { titleAr: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#CBD5E1] bg-[#F5F8FC] focus:bg-white focus:outline-none focus:border-[#2563EB]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        العنوان الفرعي (Subtitle)
                      </label>
                      <input
                        type="text"
                        value={page.subtitleAr}
                        onChange={(e) => updatePage(page.id, { subtitleAr: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#CBD5E1] bg-[#F5F8FC] focus:bg-white focus:outline-none focus:border-[#2563EB]"
                      />
                    </div>
                  </div>

                  <ImageUploadField
                    labelAr={`صورة الواجهة (Hero Image) لصفحة: ${page.titleAr}`}
                    entityType="pages"
                    entityId={page.id}
                    imageUrl={page.hero_image_url || ''}
                    imageFileId={page.hero_image_file_id || ''}
                    imageAltAr={page.hero_image_alt_ar || page.titleAr}
                    showAltInput={true}
                    adminKey={backendConfig.adminApiKey || ''}
                    onImageChange={({ imageUrl: newUrl, imageFileId: newId, imageAltAr: newAlt }) =>
                      updatePage(page.id, {
                        hero_image_url: newUrl,
                        hero_image_file_id: newId,
                        hero_image_alt_ar: newAlt,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
