/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { resolvePublicImageUrl } from '../../utils/imageUrl';
import { DEFAULT_LOGO_PATH } from '../common/Logo';
import {
  ArrowLeft,
  Sparkles,
  Users,
  Briefcase,
  GitFork,
  ShieldCheck,
  PhoneCall,
  Info,
  Compass,
  CheckCircle2,
  Layers,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { profile, jobs, employees, departments, pages } = useApp();

  const activeJobs = jobs.filter((j) => j.status === 'active');
  const featuredJob = activeJobs[0] || jobs[0];

  const homePageMeta = pages.find((p) => p.id === 'page-home');
  const resolvedHeroUrl = resolvePublicImageUrl(
    homePageMeta?.hero_image_url,
    homePageMeta?.hero_image_file_id
  );
  const resolvedLogoUrl =
    resolvePublicImageUrl(profile.logo_url, profile.logo_file_id) || DEFAULT_LOGO_PATH;

  const [heroImgError, setHeroImgError] = useState(false);
  const [logoImgError, setLogoImgError] = useState(false);

  useEffect(() => {
    setHeroImgError(false);
  }, [resolvedHeroUrl]);

  useEffect(() => {
    setLogoImgError(false);
  }, [resolvedLogoUrl]);

  return (
    <div className="pb-12 sm:pb-16 space-y-12 sm:space-y-16 overflow-x-hidden">
      {/* 
        ========================================================================
        1. BRANDED HERO SECTION
        Combines a Deep Navy (#0A192F) structural frame with a luminous Ice Blue
        (#F0F6FD) & White (#FFFFFF) centerpiece card, Royal Blue (#2563EB) &
        Electric Cyan (#00D2FF) pathways, and the official Smart Masar identity.
        ========================================================================
      */}
      <section className="relative bg-gradient-to-b from-[#0A192F] via-[#0E2347] to-[#F0F6FD] pt-3 sm:pt-8 pb-4 sm:pb-10 px-3 sm:px-6 lg:px-8">
        {/* Subtle Deep Navy Top Backdrop Glow */}
        <div
          className="absolute top-0 inset-x-0 h-72 pointer-events-none overflow-hidden"
          aria-hidden="true"
        >
          <div className="absolute -top-20 right-1/4 w-96 h-96 rounded-full bg-[#00D2FF]/15 blur-3xl" />
          <div className="absolute top-10 left-1/4 w-80 h-80 rounded-full bg-[#2563EB]/25 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Luminous Architectural Hero Card */}
          <div className="relative rounded-[26px] sm:rounded-[36px] bg-gradient-to-b from-[#EBF4FE] via-[#F5F9FF] to-[#FFFFFF] border-2 border-[#00D2FF]/35 shadow-[0_20px_50px_rgba(10,25,47,0.18)] overflow-hidden p-4 sm:p-10 lg:p-12">
            {/* Background Flowing Pathway SVG Lines inside Hero Surface */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none opacity-60"
              viewBox="0 0 1200 700"
              fill="none"
              preserveAspectRatio="xMidYMid slice"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="heroCurve1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00D2FF" stopOpacity="0.35" />
                  <stop offset="50%" stopColor="#2563EB" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#7C5CDE" stopOpacity="0.25" />
                </linearGradient>
                <linearGradient id="heroCurve2" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#00D2FF" stopOpacity="0.08" />
                </linearGradient>
              </defs>
              <path
                d="M-80 140 C 260 280, 480 40, 820 190 C 1020 280, 1140 180, 1280 240"
                stroke="url(#heroCurve1)"
                strokeWidth="3"
              />
              <path
                d="M-80 200 C 280 340, 510 100, 850 250 C 1040 330, 1160 230, 1280 290"
                stroke="url(#heroCurve2)"
                strokeWidth="2"
                strokeDasharray="8 8"
              />
              <path
                d="M-60 560 C 320 440, 680 640, 1260 460"
                stroke="url(#heroCurve1)"
                strokeWidth="2"
              />
            </svg>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8 lg:gap-10 items-center">
              {/* 
                VISUAL COMPOSITION COLUMN (Top on mobile like JOR Tech reference, Left on desktop RTL)
                Original abstract visual composition inspired by connected pathways,
                innovation, and the Road-S logo (or uploaded page-home hero image when configured).
              */}
              <div className="lg:col-span-5 lg:order-2 flex flex-col items-center justify-center">
                {resolvedHeroUrl && !heroImgError ? (
                  <div className="relative w-full max-w-sm rounded-3xl overflow-hidden border-2 border-[#2563EB] shadow-[0_12px_36px_rgba(37,99,235,0.22)] bg-white">
                    <img
                      src={resolvedHeroUrl}
                      alt={homePageMeta?.hero_image_alt_ar || 'واجهة سمارت مسار الرئيسية'}
                      onError={() => setHeroImgError(true)}
                      className="w-full h-56 sm:h-72 object-cover"
                    />
                  </div>
                ) : (
                  <div className="relative w-52 h-52 sm:w-80 sm:h-80 lg:w-[370px] lg:h-[370px] flex items-center justify-center">
                    {/* Abstract Connected Pathways & Orbital Road-S SVG Composition */}
                    <svg
                      viewBox="0 0 400 400"
                      className="w-full h-full"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      role="img"
                      aria-label="تكوين بصري لمسارات الابتكار المترابطة وهوية سمارت مسار"
                    >
                      <defs>
                        <linearGradient id="orbitalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#00D2FF" />
                          <stop offset="55%" stopColor="#2563EB" />
                          <stop offset="100%" stopColor="#7C5CDE" />
                        </linearGradient>
                        <linearGradient id="roadRibbonGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#7C5CDE" />
                          <stop offset="45%" stopColor="#2563EB" />
                          <stop offset="100%" stopColor="#00D2FF" />
                        </linearGradient>
                        <linearGradient id="navyDepthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#0A192F" />
                          <stop offset="100%" stopColor="#1E3A8A" />
                        </linearGradient>
                        <filter id="softGlow" x="-15%" y="-15%" width="130%" height="130%">
                          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#2563EB" floodOpacity="0.18" />
                        </filter>
                      </defs>

                      {/* Outer Soft Ice-Blue Halo */}
                      <circle
                        cx="200"
                        cy="200"
                        r="178"
                        fill="#EBF4FE"
                        fillOpacity="0.65"
                      />

                      {/* Outer Dashed Orbital Pathway Ring */}
                      <circle
                        cx="200"
                        cy="200"
                        r="168"
                        stroke="#2563EB"
                        strokeOpacity="0.35"
                        strokeWidth="2"
                        strokeDasharray="7 7"
                      />

                      {/* Secondary Connected Tech Orbit Ring */}
                      <circle
                        cx="200"
                        cy="200"
                        r="142"
                        stroke="url(#orbitalGrad)"
                        strokeOpacity="0.45"
                        strokeWidth="2.5"
                      />

                      {/* Sweeping Left & Right Connected Pathway Wings */}
                      <path
                        d="M 24 165 C 85 215, 130 215, 195 195 C 265 175, 315 190, 376 235"
                        stroke="url(#orbitalGrad)"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 32 230 C 95 260, 145 245, 205 215 C 265 185, 315 210, 368 265"
                        stroke="#2563EB"
                        strokeOpacity="0.35"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />

                      {/* Stylized Road-S Trajectory Ribbon Behind Medallion */}
                      <path
                        d="M 268 68 C 215 58, 128 84, 132 142 C 136 196, 268 198, 268 256 C 268 312, 185 338, 122 326"
                        stroke="url(#navyDepthGrad)"
                        strokeWidth="26"
                        strokeLinecap="round"
                        filter="url(#softGlow)"
                      />
                      <path
                        d="M 268 68 C 215 58, 128 84, 132 142 C 136 196, 268 198, 268 256 C 268 312, 185 338, 122 326"
                        stroke="url(#roadRibbonGrad)"
                        strokeWidth="18"
                        strokeLinecap="round"
                      />
                      {/* Road-S Center Highway Dashed Line */}
                      <path
                        d="M 268 68 C 215 58, 128 84, 132 142 C 136 196, 268 198, 268 256 C 268 312, 185 338, 122 326"
                        stroke="#FFFFFF"
                        strokeWidth="3"
                        strokeDasharray="8 8"
                        strokeLinecap="round"
                      />

                      {/* Ascending Innovation Bars at Top of Trajectory */}
                      <rect x="176" y="42" width="10" height="22" rx="3" fill="#00D2FF" />
                      <rect x="192" y="32" width="11" height="32" rx="3" fill="#2563EB" />
                      <rect x="209" y="20" width="12" height="44" rx="3" fill="#0A192F" />

                      {/* Connected Pathway Nodes on Orbit */}
                      <g>
                        {/* Top Right Node */}
                        <circle cx="322" cy="102" r="14" fill="#0A192F" stroke="#00D2FF" strokeWidth="3" />
                        <circle cx="322" cy="102" r="5" fill="#00D2FF" />
                        {/* Bottom Left Node */}
                        <circle cx="78" cy="296" r="14" fill="#0A192F" stroke="#2563EB" strokeWidth="3" />
                        <circle cx="78" cy="296" r="5" fill="#00D2FF" />
                        {/* Top Left Accent Node */}
                        <circle cx="88" cy="108" r="10" fill="#2563EB" stroke="#FFFFFF" strokeWidth="3" />
                        {/* Bottom Right Accent Node */}
                        <circle cx="314" cy="294" r="11" fill="#7C5CDE" stroke="#FFFFFF" strokeWidth="3" />
                      </g>
                    </svg>

                    {/* Central Luminous Emblem Housing Approved Smart Masar Logo */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-34 h-34 sm:w-52 sm:h-52 lg:w-58 lg:h-58 rounded-full bg-white shadow-[0_12px_36px_rgba(37,99,235,0.22)] border-[3px] sm:border-4 border-[#2563EB] flex flex-col items-center justify-center p-2.5 sm:p-4 ring-4 sm:ring-8 ring-[#00D2FF]/15">
                        <img
                          src={!logoImgError ? resolvedLogoUrl : DEFAULT_LOGO_PATH}
                          alt={profile.logo_alt_ar || 'شعار شركة سمارت مسار - Smart Masar Logo'}
                          onError={() => setLogoImgError(true)}
                          className="w-28 sm:w-44 lg:w-48 h-auto object-contain"
                        />
                        <span
                          className="mt-0.5 sm:mt-1.5 text-[8px] sm:text-[10px] font-bold tracking-wider text-[#2563EB] uppercase"
                          dir="ltr"
                        >
                          Connected Innovation
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 
                BRAND IDENTITY, SLOGAN, DESCRIPTION & CTAs COLUMN
                (Centered on mobile for clean vertical hierarchy, Right-aligned on desktop RTL)
              */}
              <div className="lg:col-span-7 lg:order-1 text-center lg:text-right space-y-3 sm:space-y-5">
                {/* Prominent Company Name Lockup */}
                <div className="inline-flex flex-wrap items-center justify-center lg:justify-start gap-2 px-3.5 py-1 rounded-full bg-white border border-[#BFDBFE] shadow-xs">
                  <span className="text-xs sm:text-sm font-black text-[#0A192F]">
                    شركة سمارت مسار
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-xs sm:text-sm font-black text-[#2563EB]" dir="ltr">
                    Smart Masar
                  </span>
                </div>

                {/* Main Arabic Slogan & English Tagline */}
                <div className="space-y-1.5 sm:space-y-2.5">
                  <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-[#0A192F] leading-tight">
                    نبتكر اليوم{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-l from-[#2563EB] to-[#0099CC]">
                      لنصنع فرص الغد
                    </span>
                  </h1>
                  <p
                    className="text-[11px] sm:text-sm font-bold text-[#2563EB] tracking-wider"
                    dir="ltr"
                  >
                    {profile.taglineEn || 'Technology • AI • Innovation'}
                  </p>
                </div>

                {/* Concise Company Description */}
                <p className="text-xs sm:text-base lg:text-lg text-[#1E293B] leading-relaxed max-w-2xl mx-auto lg:mx-0 font-normal">
                  نعمل على تطوير حلول الذكاء الاصطناعي والبرمجيات المؤسسية المتقدمة وأتمتة مسارات العمل الرقمية، لتمكين المؤسسات والكفاءات الطموحة من قيادة المستقبل وبناء نمو مستدام.
                </p>

                {/* Primary & Secondary Calls to Action */}
                <div className="pt-1 sm:pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-2.5 sm:gap-4 max-w-md mx-auto lg:mx-0">
                  <Link
                    to="/services"
                    className="px-6 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-l from-[#2563EB] to-[#0284C7] hover:from-[#1D4ED8] hover:to-[#0369A1] text-white text-xs sm:text-base font-black shadow-[0_8px_24px_rgba(37,99,235,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D2FF] shrink-0" />
                    <span>استكشف خدماتنا التقنية</span>
                  </Link>

                  <Link
                    to="/careers"
                    className="px-6 py-2.5 sm:py-3.5 rounded-2xl bg-white hover:bg-[#F0F6FD] text-[#0A192F] border-2 border-[#BFDBFE] hover:border-[#2563EB] text-xs sm:text-base font-black shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Briefcase className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span>فرص العمل والانضمام للفريق</span>
                  </Link>
                </div>

                {/* Key Institutional Highlights Strip */}
                <div className="pt-4 border-t border-[#D6E4F0] grid grid-cols-3 gap-2 sm:gap-4 max-w-lg mx-auto lg:mx-0">
                  <div className="bg-white/90 border border-[#D6E4F0] rounded-xl p-2.5 text-center lg:text-right">
                    <div className="text-lg sm:text-xl font-black text-[#2563EB]">4</div>
                    <div className="text-[11px] sm:text-xs font-bold text-[#0A192F]">
                      محاور خدمات ذكية
                    </div>
                  </div>
                  <div className="bg-white/90 border border-[#D6E4F0] rounded-xl p-2.5 text-center lg:text-right">
                    <div className="text-lg sm:text-xl font-black text-[#0A192F]">
                      {employees.length}
                    </div>
                    <div className="text-[11px] sm:text-xs font-bold text-[#0A192F]">
                      كفاءات متخصصة
                    </div>
                  </div>
                  <div className="bg-white/90 border border-[#D6E4F0] rounded-xl p-2.5 text-center lg:text-right">
                    <div className="text-lg sm:text-xl font-black text-[#0284C7]">
                      {departments.length}
                    </div>
                    <div className="text-[11px] sm:text-xs font-bold text-[#0A192F]">
                      إدارات رئيسية
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        2. FOUR VISUALLY DISTINCTIVE NAVIGATION CARDS
        Linking directly to:
        - Services (/services)
        - Team (/team)
        - Organization (/organization)
        - Careers (/careers)
        Each card features a distinct visual composition, clear purpose, and
        direct route navigation without reproducing full internal page content.
        ========================================================================
      */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-right">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-black text-[#2563EB]">
              <Compass className="w-4 h-4" />
              <span>بوابات المنصة الرئيسية</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0A192F]">
              استكشف منظومة سمارت مسار
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md">
            انتقل مباشرة إلى الأقسام المتخصصة للتعرف على حلولنا التقنية، فريقنا، الهيكل التنظيمي، والشواغر المتاحة.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CARD 1: SERVICES (/services) — Royal Blue & Electric Cyan Theme */}
          <Link
            to="/services"
            className="group relative rounded-3xl bg-white border-2 border-[#D6E4F0] hover:border-[#2563EB] shadow-[0_8px_28px_rgba(10,25,47,0.05)] hover:shadow-[0_14px_34px_rgba(37,99,235,0.14)] transition-all duration-300 overflow-hidden flex flex-col justify-between p-6 sm:p-7 cursor-pointer"
          >
            {/* Top Decorative Pathway Header Strip */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#00D2FF] text-white flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <span
                    className="text-[11px] font-bold text-[#2563EB] tracking-wider block"
                    dir="ltr"
                  >
                    01 / SERVICES & AI
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-[#0A192F] group-hover:text-[#2563EB] transition-colors">
                    خدماتنا التقنية والذكاء الاصطناعي
                  </h3>
                </div>
              </div>

              {/* Custom Geometric Pathway Mini-Emblem */}
              <svg
                className="w-14 h-14 text-[#2563EB]/15 shrink-0 hidden sm:block"
                viewBox="0 0 56 56"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="28" cy="28" r="22" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                <path d="M14 36 C24 36, 24 20, 34 20 L42 20" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />
                <circle cx="42" cy="20" r="4" fill="#00D2FF" />
              </svg>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
              حلول متكاملة تشمل أنظمة الذكاء الاصطناعي، تطوير البرمجيات والمنصات السحابية، أتمتة العمليات، والاستشارات الرقمية للمؤسسات.
            </p>

            {/* Service Pillars Preview Grid */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              <div className="px-3 py-2 rounded-xl bg-[#F0F6FD] text-[#0A192F] text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                <span>حلول الذكاء الاصطناعي</span>
              </div>
              <div className="px-3 py-2 rounded-xl bg-[#F0F6FD] text-[#0A192F] text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                <span>تطوير البرمجيات</span>
              </div>
              <div className="px-3 py-2 rounded-xl bg-[#F0F6FD] text-[#0A192F] text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                <span>التحول الرقمي</span>
              </div>
              <div className="px-3 py-2 rounded-xl bg-[#F0F6FD] text-[#0A192F] text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                <span>الاستشارات التقنية</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm font-black text-[#2563EB]">
              <span>استعراض محفظة الخدمات</span>
              <span className="w-8 h-8 rounded-xl bg-[#EBF4FE] group-hover:bg-[#2563EB] group-hover:text-white flex items-center justify-center transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </span>
            </div>
          </Link>

          {/* CARD 2: TEAM (/team) — Deep Navy & Electric Cyan Theme */}
          <Link
            to="/team"
            className="group relative rounded-3xl bg-gradient-to-br from-[#0A192F] to-[#132B52] text-white border-2 border-[#1E3A8A] hover:border-[#00D2FF] shadow-[0_10px_30px_rgba(10,25,47,0.16)] transition-all duration-300 overflow-hidden flex flex-col justify-between p-6 sm:p-7 cursor-pointer"
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded-2xl bg-[#1E3A8A] border border-[#00D2FF]/40 text-[#00D2FF] flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <span
                    className="text-[11px] font-bold text-[#00D2FF] tracking-wider block"
                    dir="ltr"
                  >
                    02 / LEADERSHIP & TEAM
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-white group-hover:text-[#00D2FF] transition-colors">
                    فريق العمل والكفاءات
                  </h3>
                </div>
              </div>

              <span className="px-3 py-1 rounded-xl bg-white/10 border border-white/15 text-[#00D2FF] text-xs font-black shrink-0">
                {employees.length} كوادر
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-5">
              نخبة من الكفاءات القيادية والتنفيذية في مجالات التكنولوجيا، المالية، الموارد البشرية، والعمليات، والتسويق بقيادة د. أحمد العابد.
            </p>

            {/* Team Departments Summary */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              <div className="px-3 py-2 rounded-xl bg-white/8 border border-white/10 text-white text-xs font-bold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#00D2FF] shrink-0" />
                <span>القيادة والإدارة العليا</span>
              </div>
              <div className="px-3 py-2 rounded-xl bg-white/8 border border-white/10 text-white text-xs font-bold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#00D2FF] shrink-0" />
                <span>تكنولوجيا المعلومات</span>
              </div>
              <div className="px-3 py-2 rounded-xl bg-white/8 border border-white/10 text-white text-xs font-bold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#00D2FF] shrink-0" />
                <span>الإدارة المالية والموارد</span>
              </div>
              <div className="px-3 py-2 rounded-xl bg-white/8 border border-white/10 text-white text-xs font-bold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#00D2FF] shrink-0" />
                <span>العمليات والتسويق</span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/15 flex items-center justify-between text-xs sm:text-sm font-black text-[#00D2FF]">
              <span>تصفح بطاقات فريق العمل</span>
              <span className="w-8 h-8 rounded-xl bg-white/10 group-hover:bg-[#00D2FF] group-hover:text-[#0A192F] flex items-center justify-center transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </span>
            </div>
          </Link>

          {/* CARD 3: ORGANIZATION (/organization) — Soft Violet & Royal Blue Theme */}
          <Link
            to="/organization"
            className="group relative rounded-3xl bg-white border-2 border-[#D6E4F0] hover:border-[#7C5CDE] shadow-[0_8px_28px_rgba(10,25,47,0.05)] hover:shadow-[0_14px_34px_rgba(124,92,222,0.14)] transition-all duration-300 overflow-hidden flex flex-col justify-between p-6 sm:p-7 cursor-pointer"
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#7C5CDE] to-[#2563EB] text-white flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform">
                  <GitFork className="w-6 h-6" />
                </div>
                <div>
                  <span
                    className="text-[11px] font-bold text-[#7C5CDE] tracking-wider block"
                    dir="ltr"
                  >
                    03 / ORGANIZATION CHART
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-[#0A192F] group-hover:text-[#7C5CDE] transition-colors">
                    الهيكل التنظيمي التفاعلي
                  </h3>
                </div>
              </div>

              <span className="px-3 py-1 rounded-xl bg-[#F3EFFE] border border-[#DDD6FE] text-[#7C5CDE] text-xs font-black shrink-0">
                {departments.length} أقسام
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
              مخطط شجري تفاعلي يوضح التسلسل الإداري، خطوط التبعية، وتوزيع الإدارات الست مع إمكانية استعراض ملف كل موظف مباشرة.
            </p>

            {/* Visual Mini Hierarchy Diagram inside Card */}
            <div className="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 mb-6 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#7C5CDE]" />
                <span className="text-xs font-bold text-[#0A192F]">المدير العام</span>
              </div>
              <div className="h-0.5 flex-1 bg-gradient-to-l from-[#7C5CDE] to-[#2563EB] mx-2" />
              <div className="text-xs font-bold text-[#2563EB]">مديرو الإدارات</div>
              <div className="h-0.5 flex-1 bg-gradient-to-l from-[#2563EB] to-[#00D2FF] mx-2" />
              <div className="text-xs font-bold text-[#0A192F]">الفرق التنفيذية</div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm font-black text-[#7C5CDE]">
              <span>فتح المخطط التنظيمي التفاعلي</span>
              <span className="w-8 h-8 rounded-xl bg-[#F3EFFE] group-hover:bg-[#7C5CDE] group-hover:text-white flex items-center justify-center transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </span>
            </div>
          </Link>

          {/* CARD 4: CAREERS (/careers) — Ice Blue, Electric Cyan & Royal Blue Theme */}
          <Link
            to="/careers"
            className="group relative rounded-3xl bg-gradient-to-br from-[#F0F6FD] via-[#FFFFFF] to-[#E6F4FE] border-2 border-[#93C5FD] hover:border-[#0284C7] shadow-[0_8px_28px_rgba(37,99,235,0.08)] hover:shadow-[0_14px_34px_rgba(2,132,199,0.16)] transition-all duration-300 overflow-hidden flex flex-col justify-between p-6 sm:p-7 cursor-pointer"
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#0284C7] to-[#00D2FF] text-[#0A192F] flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <span
                    className="text-[11px] font-bold text-[#0284C7] tracking-wider block"
                    dir="ltr"
                  >
                    04 / CAREERS & VACANCIES
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-[#0A192F] group-hover:text-[#0284C7] transition-colors">
                    الوظائف والشواغر المتاحة
                  </h3>
                </div>
              </div>

              <span className="px-3 py-1 rounded-xl bg-[#0A192F] text-[#00D2FF] text-xs font-black shrink-0">
                {activeJobs.length} شاغر نشط
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-5">
              انضم إلى بيئة عمل محفزة؛ تتوفر شواغر نشطة تشمل{' '}
              <strong className="text-[#0A192F]">محاسب عام</strong> و{' '}
              <strong className="text-[#0A192F]">أخصائي موارد بشرية</strong> مع التقديم المباشر عبر رابط Google Forms المعتمد.
            </p>

            {/* Featured Vacancies Highlight Box */}
            <div className="rounded-2xl bg-white border border-[#BFDBFE] p-3.5 mb-6 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-black text-[#0A192F]">
                  محاسب عام (Accountant) • أخصائي موارد بشرية (HR Specialist)
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  المالية والمحاسبة (عمّان) • الموارد البشرية (العقبة)
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-[#EBF4FE] text-[#2563EB] text-[11px] font-bold shrink-0">
                متاح للتقديم
              </span>
            </div>

            <div className="pt-4 border-t border-[#BFDBFE]/60 flex items-center justify-between text-xs sm:text-sm font-black text-[#0284C7]">
              <span>استعراض الشواغر وتقديم الطلب</span>
              <span className="w-8 h-8 rounded-xl bg-white border border-[#93C5FD] group-hover:bg-[#0284C7] group-hover:text-white flex items-center justify-center transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* 
        ========================================================================
        3. CONCISE CORPORATE VALUES & DIRECT CONNECT BANNER
        Deep Navy structural section providing visual contrast and quick links
        to About (/about) and Contact (/contact).
        ========================================================================
      */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-right">
        <div className="rounded-3xl bg-gradient-to-l from-[#0A192F] via-[#0F2547] to-[#163363] text-white p-6 sm:p-10 border border-[#1E3A8A] shadow-xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#00D2FF]">
                <ShieldCheck className="w-4 h-4" />
                <span>القيم المؤسسية لسمارت مسار</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                نرتكز على الابتكار والمصداقية لبناء شراكات تقنية راسخة
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                تنطلق سمارت مسار من أربع ركائز أساسية تقود ثقافة العمل وتطوير الحلول الذكية في كافة مشاريعنا وإداراتنا.
              </p>

              <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="px-3.5 py-2.5 rounded-xl bg-white/8 border border-white/15 text-center">
                  <div className="text-xs sm:text-sm font-black text-[#00D2FF]">الابتكار</div>
                  <div className="text-[11px] text-slate-300 mt-0.5">حلول تقنية متجددة</div>
                </div>
                <div className="px-3.5 py-2.5 rounded-xl bg-white/8 border border-white/15 text-center">
                  <div className="text-xs sm:text-sm font-black text-[#00D2FF]">المصداقية</div>
                  <div className="text-[11px] text-slate-300 mt-0.5">التزام وجودة عالية</div>
                </div>
                <div className="px-3.5 py-2.5 rounded-xl bg-white/8 border border-white/15 text-center">
                  <div className="text-xs sm:text-sm font-black text-[#00D2FF]">التعاون</div>
                  <div className="text-[11px] text-slate-300 mt-0.5">تكامل فرق العمل</div>
                </div>
                <div className="px-3.5 py-2.5 rounded-xl bg-white/8 border border-white/15 text-center">
                  <div className="text-xs sm:text-sm font-black text-[#00D2FF]">التطوير المستمر</div>
                  <div className="text-[11px] text-slate-300 mt-0.5">تمكين الكفاءات</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-3">
              <Link
                to="/about"
                className="w-full py-3.5 px-6 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-black transition-all text-center flex items-center justify-center gap-2 shadow-md cursor-pointer border border-[#00D2FF]/40"
              >
                <Info className="w-4 h-4 text-[#00D2FF]" />
                <span>تعرّف على رؤيتنا ورسالتنا (من نحن)</span>
              </Link>
              <Link
                to="/contact"
                className="w-full py-3.5 px-6 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-black transition-all text-center flex items-center justify-center gap-2 border border-white/20 cursor-pointer"
              >
                <PhoneCall className="w-4 h-4 text-[#00D2FF]" />
                <span>تواصل مع الإدارة</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
