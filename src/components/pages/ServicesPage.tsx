/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { INITIAL_SERVICES } from '../../data/initialData';
import { ServiceItem } from '../../types';
import { resolvePublicImageUrl } from '../../utils/imageUrl';
import { PageHeroImage } from '../common/PageHeroImage';
import {
  Cpu,
  Code,
  Share2,
  Sliders,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  ChevronLeft,
  Workflow,
} from 'lucide-react';

const ServiceCard: React.FC<{ service: ServiceItem; index: number }> = ({ service, index }) => {
  const resolvedImageUrl = resolvePublicImageUrl(service.image_url, service.image_file_id);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [resolvedImageUrl]);

  const getServiceIcon = (name: string) => {
    switch (name) {
      case 'Cpu':
        return <Cpu className="w-6 h-6 text-[#00D2FF]" />;
      case 'Code':
        return <Code className="w-6 h-6 text-[#2563EB]" />;
      case 'Share2':
        return <Share2 className="w-6 h-6 text-[#7C5CDE]" />;
      case 'Sliders':
        return <Sliders className="w-6 h-6 text-[#0284C7]" />;
      default:
        return <Sparkles className="w-6 h-6 text-[#00D2FF]" />;
    }
  };

  const showUploadedImage = Boolean(resolvedImageUrl) && !imgError;

  return (
    <div className="glass-card rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 group">
      <div>
        {showUploadedImage && (
          <div className="mb-5 rounded-2xl overflow-hidden border border-[#BFDBFE] bg-[#F0F6FD] h-44 sm:h-48 relative shadow-xs">
            <img
              src={resolvedImageUrl}
              alt={service.image_alt_ar || service.titleAr}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
              loading="lazy"
            />
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#0A192F] border border-[#1E3A8A] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            {getServiceIcon(service.iconName)}
          </div>
          <span className="text-sm font-black text-[#2563EB] font-mono px-3 py-1 rounded-lg bg-[#EBF4FE] border border-[#BFDBFE]">
            0{index + 1}
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-[#0A192F] mb-1">
          {service.titleAr}
        </h2>
        <p className="text-xs font-bold text-[#2563EB] mb-4 font-mono" dir="ltr">
          {service.titleEn}
        </p>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
          {service.shortDescAr}
        </p>

        <div className="space-y-3 pt-5 border-t border-[#E2E8F0]">
          <h3 className="text-xs font-bold text-[#0A192F] mb-2 flex items-center gap-1.5">
            <Workflow className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>أبرز المحاور والمخرجات:</span>
          </h3>
          {service.featuresAr.map((feat, fIdx) => (
            <div
              key={fIdx}
              className="flex items-start gap-2.5 text-xs text-slate-700 font-medium"
            >
              <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
              <span>{feat}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400">Smart Masar Technology</span>
        <Link
          to="/contact"
          className="px-4 py-2 rounded-xl bg-[#EBF4FE] hover:bg-[#2563EB] text-[#2563EB] hover:text-white border border-[#BFDBFE] text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer"
        >
          <span>طلب استشارة تقنية</span>
          <ArrowLeft className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

export const ServicesPage: React.FC = () => {
  const { services, pages } = useApp();
  const displayServices = services && services.length > 0 ? services : INITIAL_SERVICES;
  const pageMeta = pages.find((p) => p.id === 'page-services');

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
            <span className="text-[#00D2FF]">خدماتنا التقنية</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E3A8A]/70 border border-[#00D2FF]/30 text-[#00D2FF] text-xs font-bold shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>محفظة الحلول والمنتجات المؤسسية</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {pageMeta?.titleAr || 'حلول متقدمة في الذكاء الاصطناعي وهندسة التحول الرقمي'}
              </h1>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                {pageMeta?.subtitleAr ||
                  'نطور باقة متكاملة من الحلول البرمجية الذكية لرفع كفاءة المنشآت، تسريع دورات العمل، وتطوير المنتجات الرقمية الحديثة.'}
              </p>
            </div>

            <PageHeroImage pageId="page-services" />
          </div>
        </div>
      </section>

      {/* Professional Service Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {displayServices.map((service, index) => (
            <ServiceCard key={service.id} service={service} index={index} />
          ))}
        </div>

        {/* Integration Banner */}
        <div className="bg-gradient-to-l from-[#0A192F] to-[#1E3A8A] text-white rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-[#00D2FF]/30 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#00D2FF]/20 border border-[#00D2FF]/40 flex items-center justify-center text-[#00D2FF] shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                تكامل حلول الذكاء الاصطناعي مع الأنظمة المحاسبية والإدارية
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                نضمن التوافق الكامل مع قواعد البيانات السحابية وبرمجيات تخطيط الموارد ERP وسجلات العمليات المالية.
              </p>
            </div>
          </div>
          <Link
            to="/careers"
            className="px-6 py-3 bg-[#00D2FF] hover:bg-[#38bdf8] text-[#0A192F] text-xs font-black rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
          >
            شواغر العمل التقنية والمحاسبية
          </Link>
        </div>
      </div>
    </div>
  );
};
