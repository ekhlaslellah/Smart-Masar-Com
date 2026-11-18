/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeroImage } from '../common/PageHeroImage';
import {
  PhoneCall,
  Mail,
  MapPin,
  Clock,
  Send,
  ShieldAlert,
  ChevronLeft,
  ExternalLink,
  AlertCircle,
  Briefcase,
  CheckCircle2,
  Copy,
  RotateCcw,
  FileEdit,
  Building2,
} from 'lucide-react';

const OFFICIAL_RECRUITMENT_PORTAL_URL = 'https://smart-masar-recruitment.onrender.com/';

const INQUIRY_CATEGORIES = [
  {
    id: 'general',
    labelAr: 'استفسار عام عن المؤسسة والخدمات',
    subjectPrefixAr: 'استفسار عام',
  },
  {
    id: 'tech-consulting',
    labelAr: 'طلب استشارة تقنية أو مشروع تحول رقمي',
    subjectPrefixAr: 'طلب استشارة تقنية / تحول رقمي',
  },
  {
    id: 'ai-solutions',
    labelAr: 'حلول الذكاء الاصطناعي وأتمتة العمليات',
    subjectPrefixAr: 'استفسار حلول الذكاء الاصطناعي',
  },
  {
    id: 'partnership',
    labelAr: 'شراكة مؤسسية أو تعاون تدريبي وأكاديمي',
    subjectPrefixAr: 'شراكة وتعاون مؤسسي',
  },
  {
    id: 'careers-hr',
    labelAr: 'استفسار متعلق بالتوظيف والموارد البشرية',
    subjectPrefixAr: 'استفسار الموارد البشرية والتوظيف',
  },
] as const;

type InquiryCategoryId = (typeof INQUIRY_CATEGORIES)[number]['id'];

const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 80;
const EMAIL_MAX_LENGTH = 120;
const SUBJECT_MAX_LENGTH = 120;
const MESSAGE_MIN_LENGTH = 10;
const MESSAGE_MAX_LENGTH = 1500;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface FieldErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

export const ContactPage: React.FC = () => {
  const { profile } = useApp();

  // Dynamic values strictly from SiteSettings (profile) with safe empty checks
  const companyNameAr = (profile.nameAr || 'سمارت مسار').trim();
  const companyEmail = (profile.email || '').trim();
  const companyPhone = (profile.phone || '').trim();
  const companyLocationAr = (profile.locationAr || '').trim();
  const companyWorkingHoursAr = (profile.workingHoursAr || '').trim();
  const recruitmentPortalUrl =
    (profile.googleFormsPlaceholderUrl || '').trim() || OFFICIAL_RECRUITMENT_PORTAL_URL;

  const hasValidRecipientEmail = EMAIL_REGEX.test(companyEmail);

  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    inquiryType: InquiryCategoryId;
    subject: string;
    message: string;
  }>({
    name: '',
    email: '',
    inquiryType: 'general',
    subject: '',
    message: '',
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formErrorSummary, setFormErrorSummary] = useState<string>('');
  const [draftPrepared, setDraftPrepared] = useState<boolean>(false);
  const [copiedState, setCopiedState] = useState<'none' | 'message' | 'email'>('none');

  const selectedCategory = useMemo(
    () =>
      INQUIRY_CATEGORIES.find((cat) => cat.id === formData.inquiryType) || INQUIRY_CATEGORIES[0],
    [formData.inquiryType]
  );

  const composedSubject = useMemo(() => {
    const customSubject = formData.subject.trim();
    if (customSubject) {
      return `${selectedCategory.subjectPrefixAr}: ${customSubject}`;
    }
    return `${selectedCategory.subjectPrefixAr} — عبر موقع ${companyNameAr}`;
  }, [formData.subject, selectedCategory.subjectPrefixAr, companyNameAr]);

  const composedBodyText = useMemo(() => {
    return [
      `إلى إدارة ${companyNameAr} المحترمين،`,
      '',
      `نوع الاستفسار: ${selectedCategory.labelAr}`,
      `الاسم الكامل: ${formData.name.trim()}`,
      `البريد الإلكتروني للرد: ${formData.email.trim()}`,
      formData.subject.trim() ? `الموضوع التفصيلي: ${formData.subject.trim()}` : null,
      '',
      'نص الرسالة:',
      formData.message.trim(),
    ]
      .filter((line): line is string => line !== null)
      .join('\n');
  }, [
    companyNameAr,
    selectedCategory.labelAr,
    formData.name,
    formData.email,
    formData.subject,
    formData.message,
  ]);

  const mailtoHref = useMemo(() => {
    if (!hasValidRecipientEmail) return '';
    return `mailto:${companyEmail}?subject=${encodeURIComponent(
      composedSubject
    )}&body=${encodeURIComponent(composedBodyText)}`;
  }, [hasValidRecipientEmail, companyEmail, composedSubject, composedBodyText]);

  const validateFields = (): FieldErrors => {
    const errors: FieldErrors = {};
    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedSubject = formData.subject.trim();
    const trimmedMessage = formData.message.trim();

    if (!trimmedName) {
      errors.name = 'يرجى إدخال الاسم الكامل.';
    } else if (trimmedName.length < NAME_MIN_LENGTH) {
      errors.name = `يجب أن يتكون الاسم من حرفين (${NAME_MIN_LENGTH}) على الأقل.`;
    } else if (trimmedName.length > NAME_MAX_LENGTH) {
      errors.name = `الاسم طويل جداً (الحد الأقصى ${NAME_MAX_LENGTH} حرفاً).`;
    }

    if (!trimmedEmail) {
      errors.email = 'يرجى إدخال البريد الإلكتروني ليتمكن الفريق من الرد عليك.';
    } else if (!EMAIL_REGEX.test(trimmedEmail) || trimmedEmail.length > EMAIL_MAX_LENGTH) {
      errors.email = 'يرجى إدخال عنوان بريد إلكتروني صحيح (مثال: name@domain.com).';
    }

    if (trimmedSubject.length > SUBJECT_MAX_LENGTH) {
      errors.subject = `عنوان الموضوع لا يتجاوز ${SUBJECT_MAX_LENGTH} حرفاً.`;
    }

    if (!trimmedMessage) {
      errors.message = 'يرجى كتابة تفاصيل رسالتك أو استفسارك.';
    } else if (trimmedMessage.length < MESSAGE_MIN_LENGTH) {
      errors.message = `يرجى كتابة رسالة واضحة لا تقل عن ${MESSAGE_MIN_LENGTH} أحرف.`;
    } else if (trimmedMessage.length > MESSAGE_MAX_LENGTH) {
      errors.message = `تجاوزت الرسالة الحد الأقصى المسموح (${MESSAGE_MAX_LENGTH} حرفاً).`;
    }

    return errors;
  };

  const handleFieldChange = <K extends keyof typeof formData>(
    field: K,
    value: (typeof formData)[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field in fieldErrors) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field as keyof FieldErrors];
        return next;
      });
    }
    if (formErrorSummary) {
      setFormErrorSummary('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateFields();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormErrorSummary('يرجى مراجعة الحقول المظللة وتصحيح الأخطاء قبل المتابعة.');
      return;
    }

    if (!hasValidRecipientEmail) {
      setFormErrorSummary(
        'عنوان البريد الرسمي للمؤسسة غير مضبوط حالياً في إعدادات الموقع (SiteSettings).'
      );
      return;
    }

    setFieldErrors({});
    setFormErrorSummary('');
    setDraftPrepared(true);

    // Open user's default mail client with pre-populated subject and body.
    // Note: Preparing a mailto draft does NOT transmit the email from a server.
    window.location.href = mailtoHref;
  };

  const handleCopyText = async (textToCopy: string, type: 'message' | 'email') => {
    if (!textToCopy || typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedState(type);
      window.setTimeout(() => {
        setCopiedState((prev) => (prev === type ? 'none' : prev));
      }, 2500);
    } catch {
      // Ignore clipboard permission errors silently
    }
  };

  const handleResetForm = () => {
    setFormData({
      name: '',
      email: '',
      inquiryType: 'general',
      subject: '',
      message: '',
    });
    setFieldErrors({});
    setFormErrorSummary('');
    setDraftPrepared(false);
    setCopiedState('none');
  };

  return (
    <div dir="rtl" className="space-y-8 sm:space-y-12 text-right pb-8">
      {/* 1. Streamlined Top Header Banner — High Readability Across Mobile, iPad & Desktop */}
      <section className="bg-gradient-to-l from-[#0A192F] via-[#0E2347] to-[#1E3A8A] text-white py-8 sm:py-12 lg:py-14 border-b border-[#1E3A8A] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Breadcrumbs */}
          <nav
            aria-label="مسار التنقل"
            className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-4"
          >
            <Link
              to="/"
              className="hover:text-[#00D2FF] transition-colors focus-visible:outline-2 focus-visible:outline-[#00D2FF] rounded"
            >
              الرئيسية
            </Link>
            <ChevronLeft className="w-3.5 h-3.5 text-[#00D2FF] shrink-0" aria-hidden="true" />
            <span className="text-[#00D2FF]" aria-current="page">
              تواصل معنا
            </span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-10">
            <div className="max-w-3xl space-y-3">
              <p className="text-xs sm:text-sm font-bold text-[#00D2FF] tracking-wide">
                قنوات التواصل المؤسسي · Official Contact Channels
              </p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-snug">
                تواصل مع إدارة {companyNameAr}
              </h1>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-2xl">
                نسعد باستقبال استفساراتكم حول الحلول التقنية، مشاريع التحول الرقمي، والشراكات المؤسسية عبر القنوات الرسمية المعتمدة في إعدادات المؤسسة، أو التقديم المباشر للشواغر عبر بوابة التوظيف الرسمية.
              </p>
            </div>

            <div className="shrink-0 self-start lg:self-center">
              <PageHeroImage pageId="contact" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        {/* Top Grid: Contact Channel Cards (from SiteSettings) + Dedicated Recruitment Portal Banner */}
        <section aria-labelledby="contact-channels-heading" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h2
                id="contact-channels-heading"
                className="text-lg sm:text-xl font-black text-[#0A192F]"
              >
                بيانات الاتصال والمقر الرسمي
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                تُقرأ جميع بيانات التواصل أدناه ديناميكياً من إعدادات المؤسسة المعتمدة (SiteSettings).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Official Email */}
            <div className="bg-white rounded-2xl border border-[#CBD5E1] p-5 flex flex-col justify-between gap-4 shadow-2xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-500">البريد الإلكتروني الرسمي</span>
                  <div className="w-9 h-9 rounded-xl bg-[#EBF4FE] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shrink-0">
                    <Mail className="w-4 h-4" aria-hidden="true" />
                  </div>
                </div>
                {companyEmail ? (
                  <a
                    href={`mailto:${companyEmail}`}
                    dir="ltr"
                    className="block text-sm sm:text-base font-black text-[#2563EB] hover:underline break-all text-right"
                  >
                    {companyEmail}
                  </a>
                ) : (
                  <p className="text-xs font-semibold text-amber-700">
                    غير محدد في إعدادات الموقع حالياً
                  </p>
                )}
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                <span>للمراسلات الرسمية والاستفسارات</span>
                {companyEmail && (
                  <button
                    type="button"
                    onClick={() => handleCopyText(companyEmail, 'email')}
                    className="inline-flex items-center gap-1 font-bold text-[#2563EB] hover:text-[#1D4ED8] cursor-pointer"
                  >
                    <Copy className="w-3 h-3" aria-hidden="true" />
                    <span>{copiedState === 'email' ? 'تم النسخ' : 'نسخ'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Card 2: Phone */}
            <div className="bg-white rounded-2xl border border-[#CBD5E1] p-5 flex flex-col justify-between gap-4 shadow-2xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-500">هاتف الاستعلامات</span>
                  <div className="w-9 h-9 rounded-xl bg-[#EBF4FE] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shrink-0">
                    <PhoneCall className="w-4 h-4" aria-hidden="true" />
                  </div>
                </div>
                {companyPhone ? (
                  <a
                    href={`tel:${companyPhone.replace(/\s+/g, '')}`}
                    dir="ltr"
                    className="block text-sm sm:text-base font-black text-[#0A192F] hover:text-[#2563EB] transition-colors tabular-nums text-right"
                  >
                    {companyPhone}
                  </a>
                ) : (
                  <p className="text-xs font-semibold text-amber-700">
                    غير محدد في إعدادات الموقع حالياً
                  </p>
                )}
              </div>
              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                الاتصال المباشر خلال ساعات الدوام الرسمي
              </div>
            </div>

            {/* Card 3: Location / Headquarters */}
            <div className="bg-white rounded-2xl border border-[#CBD5E1] p-5 flex flex-col justify-between gap-4 shadow-2xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-500">العنوان والمقر</span>
                  <div className="w-9 h-9 rounded-xl bg-[#EBF4FE] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shrink-0">
                    <MapPin className="w-4 h-4" aria-hidden="true" />
                  </div>
                </div>
                {companyLocationAr ? (
                  <p className="text-xs sm:text-sm font-bold text-[#0A192F] leading-relaxed">
                    {companyLocationAr}
                  </p>
                ) : (
                  <p className="text-xs font-semibold text-amber-700">
                    غير محدد في إعدادات الموقع حالياً
                  </p>
                )}
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-500">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                <span>المقر الإداري والتشغيلي</span>
              </div>
            </div>

            {/* Card 4: Working Hours */}
            <div className="bg-white rounded-2xl border border-[#CBD5E1] p-5 flex flex-col justify-between gap-4 shadow-2xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-500">ساعات العمل الرسمية</span>
                  <div className="w-9 h-9 rounded-xl bg-[#EBF4FE] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shrink-0">
                    <Clock className="w-4 h-4" aria-hidden="true" />
                  </div>
                </div>
                {companyWorkingHoursAr ? (
                  <p className="text-xs sm:text-sm font-bold text-[#0A192F] leading-relaxed">
                    {companyWorkingHoursAr}
                  </p>
                ) : (
                  <p className="text-xs font-semibold text-amber-700">
                    غير محددة في إعدادات الموقع حالياً
                  </p>
                )}
              </div>
              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                بتوقيت المملكة الأردنية الهاشمية
              </div>
            </div>
          </div>
        </section>

        {/* 3. Main Split Grid: Inquiry Draft Form (Right/Primary in RTL) + Recruitment & Transparency Sidebar (Left in RTL) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Inquiry Form Column (7 cols on Desktop) */}
          <section
            aria-labelledby="contact-form-heading"
            className="lg:col-span-7 bg-white rounded-3xl border border-[#CBD5E1] p-6 sm:p-8 shadow-xs space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E2E8F0]">
              <div>
                <h2
                  id="contact-form-heading"
                  className="text-lg sm:text-xl font-black text-[#0A192F]"
                >
                  إعداد مسودة مراسلة رسمية
                </h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  يُجهّز هذا النموذج رسالتك ويفتح تطبيق البريد الإلكتروني لديك لإرسالها إلى{' '}
                  <span dir="ltr" className="font-bold text-[#0A192F]">
                    {companyEmail || 'البريد الرسمي'}
                  </span>
                  .
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500 shrink-0">
                عبر تطبيق البريد (mailto)
              </span>
            </div>

            {/* Honest Pre-Submission Notice */}
            <div className="p-4 rounded-2xl bg-[#F0F6FD] border border-[#BFDBFE] text-xs text-[#0A192F] flex items-start gap-3">
              <ShieldAlert
                className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="leading-relaxed">
                <strong className="font-bold block mb-0.5">
                  توضيح آلية الإرسال (شفافية تامة):
                </strong>
                النقر على زر «تجهيز الرسالة وفتح تطبيق البريد» يقوم بتعبئة عنوان الرسالة ومحتواها تلقائياً داخل برنامج البريد الإلكتروني في جهازك،{' '}
                <strong>ولا يعني أن الرسالة قد وصلت تلقائياً</strong>؛ إذ يلزم الضغط على زر «إرسال / Send» داخل تطبيق بريدك لإتمام الإرسال الفعلي.
              </div>
            </div>

            {draftPrepared ? (
              /* Accurate Post-Preparation State (Never claims server delivery!) */
              <div
                role="status"
                aria-live="polite"
                className="p-6 rounded-2xl bg-[#F8FAFC] border-2 border-[#2563EB] space-y-5"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EBF4FE] text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-[#0A192F]">
                      تم تجهيز مسودة الرسالة لفتحها في تطبيق البريد لديك
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      يرجى التحقق من نافذة تطبيق البريد الإلكتروني التي فُتحت على جهازك والضغط على{' '}
                      <strong>«إرسال / Send»</strong> لتصل الرسالة فعلياً إلى{' '}
                      <strong dir="ltr" className="text-[#2563EB]">
                        {companyEmail}
                      </strong>
                      . إذا لم يفتح تطبيق البريد تلقائياً، يمكنك استخدام الأزرار أدناه:
                    </p>
                  </div>
                </div>

                {/* Preview of Prepared Draft */}
                <div className="p-4 rounded-xl bg-white border border-[#CBD5E1] space-y-2 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <span className="font-bold text-slate-500">معاينة المسودة المجهّزة:</span>
                    <span dir="ltr" className="font-mono text-slate-600">
                      To: {companyEmail}
                    </span>
                  </div>
                  <div className="font-bold text-[#0A192F]">الموضوع: {composedSubject}</div>
                  <pre className="whitespace-pre-wrap font-sans text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200/80 leading-relaxed max-h-48 overflow-y-auto">
                    {composedBodyText}
                  </pre>
                </div>

                {/* Action Controls in Prepared State */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {mailtoHref && (
                    <a
                      href={mailtoHref}
                      className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-colors inline-flex items-center gap-2 shadow-xs cursor-pointer"
                    >
                      <Mail className="w-4 h-4" aria-hidden="true" />
                      <span>فتح تطبيق البريد مرة أخرى</span>
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      handleCopyText(
                        `المستلم: ${companyEmail}\nالموضوع: ${composedSubject}\n\n${composedBodyText}`,
                        'message'
                      )
                    }
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-[#0A192F] border border-[#CBD5E1] text-xs font-bold transition-colors inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Copy className="w-4 h-4 text-[#2563EB]" aria-hidden="true" />
                    <span>
                      {copiedState === 'message'
                        ? '✓ تم نسخ نص الرسالة بالكامل'
                        : 'نسخ نص الرسالة والبريد'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDraftPrepared(false)}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-[#CBD5E1] text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileEdit className="w-4 h-4 text-slate-500" aria-hidden="true" />
                    <span>تعديل الرسالة</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="px-4 py-2.5 rounded-xl text-slate-600 hover:text-[#0A192F] hover:bg-slate-100 text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>بدء رسالة جديدة</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {formErrorSummary && (
                  <div
                    role="alert"
                    className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 font-bold flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" aria-hidden="true" />
                    <span>{formErrorSummary}</span>
                  </div>
                )}

                {/* Inquiry Type Selector */}
                <div>
                  <label
                    htmlFor="contact-inquiry-type"
                    className="block text-xs font-bold text-[#0A192F] mb-1.5"
                  >
                    نوع الاستفسار *
                  </label>
                  <select
                    id="contact-inquiry-type"
                    value={formData.inquiryType}
                    onChange={(e) =>
                      handleFieldChange('inquiryType', e.target.value as InquiryCategoryId)
                    }
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0A192F] font-semibold focus:bg-white focus:outline-none focus:border-[#2563EB]"
                  >
                    {INQUIRY_CATEGORIES.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.labelAr}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Name & Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="contact-full-name"
                        className="text-xs font-bold text-[#0A192F]"
                      >
                        الاسم الكامل *
                      </label>
                      <span className="text-[11px] text-slate-400 tabular-nums">
                        {formData.name.length}/{NAME_MAX_LENGTH}
                      </span>
                    </div>
                    <input
                      id="contact-full-name"
                      type="text"
                      required
                      maxLength={NAME_MAX_LENGTH}
                      autoComplete="name"
                      aria-invalid={Boolean(fieldErrors.name)}
                      aria-describedby={fieldErrors.name ? 'contact-name-error' : undefined}
                      value={formData.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      placeholder="الاسم الثنائي أو الكامل"
                      className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-[#F8FAFC] focus:bg-white focus:outline-none transition-colors ${
                        fieldErrors.name
                          ? 'border-red-400 focus:border-red-600'
                          : 'border-[#CBD5E1] focus:border-[#2563EB]'
                      }`}
                    />
                    {fieldErrors.name && (
                      <p
                        id="contact-name-error"
                        role="alert"
                        className="mt-1 text-[11px] font-bold text-red-600"
                      >
                        {fieldErrors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="contact-email" className="text-xs font-bold text-[#0A192F]">
                        البريد الإلكتروني للرد *
                      </label>
                      <span className="text-[11px] text-slate-400 tabular-nums">
                        {formData.email.length}/{EMAIL_MAX_LENGTH}
                      </span>
                    </div>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      maxLength={EMAIL_MAX_LENGTH}
                      autoComplete="email"
                      dir="ltr"
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={fieldErrors.email ? 'contact-email-error' : undefined}
                      value={formData.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      placeholder="name@example.com"
                      className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-[#F8FAFC] focus:bg-white focus:outline-none transition-colors text-left ${
                        fieldErrors.email
                          ? 'border-red-400 focus:border-red-600'
                          : 'border-[#CBD5E1] focus:border-[#2563EB]'
                      }`}
                    />
                    {fieldErrors.email && (
                      <p
                        id="contact-email-error"
                        role="alert"
                        className="mt-1 text-[11px] font-bold text-red-600"
                      >
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Custom Subject (Optional) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="contact-subject" className="text-xs font-bold text-[#0A192F]">
                      عنوان الموضوع التفصيلي <span className="text-slate-400 font-normal">(اختياري)</span>
                    </label>
                    <span className="text-[11px] text-slate-400 tabular-nums">
                      {formData.subject.length}/{SUBJECT_MAX_LENGTH}
                    </span>
                  </div>
                  <input
                    id="contact-subject"
                    type="text"
                    maxLength={SUBJECT_MAX_LENGTH}
                    aria-invalid={Boolean(fieldErrors.subject)}
                    aria-describedby={fieldErrors.subject ? 'contact-subject-error' : undefined}
                    value={formData.subject}
                    onChange={(e) => handleFieldChange('subject', e.target.value)}
                    placeholder={`مثال: ${selectedCategory.subjectPrefixAr}`}
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-[#F8FAFC] focus:bg-white focus:outline-none transition-colors ${
                      fieldErrors.subject
                        ? 'border-red-400 focus:border-red-600'
                        : 'border-[#CBD5E1] focus:border-[#2563EB]'
                    }`}
                  />
                  {fieldErrors.subject && (
                    <p
                      id="contact-subject-error"
                      role="alert"
                      className="mt-1 text-[11px] font-bold text-red-600"
                    >
                      {fieldErrors.subject}
                    </p>
                  )}
                </div>

                {/* Message Body */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="contact-message" className="text-xs font-bold text-[#0A192F]">
                      نص الرسالة والتفاصيل *
                    </label>
                    <span
                      className={`text-[11px] tabular-nums ${
                        formData.message.length > MESSAGE_MAX_LENGTH
                          ? 'text-red-600 font-bold'
                          : 'text-slate-400'
                      }`}
                    >
                      {formData.message.length}/{MESSAGE_MAX_LENGTH}
                    </span>
                  </div>
                  <textarea
                    id="contact-message"
                    required
                    rows={5}
                    maxLength={MESSAGE_MAX_LENGTH}
                    aria-invalid={Boolean(fieldErrors.message)}
                    aria-describedby={fieldErrors.message ? 'contact-message-error' : undefined}
                    value={formData.message}
                    onChange={(e) => handleFieldChange('message', e.target.value)}
                    placeholder="اكتب تفاصيل استفسارك أو متطلبات مشروعك بوضوح..."
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-[#F8FAFC] focus:bg-white focus:outline-none transition-colors leading-relaxed ${
                      fieldErrors.message
                        ? 'border-red-400 focus:border-red-600'
                        : 'border-[#CBD5E1] focus:border-[#2563EB]'
                    }`}
                  />
                  {fieldErrors.message && (
                    <p
                      id="contact-message-error"
                      role="alert"
                      className="mt-1 text-[11px] font-bold text-red-600"
                    >
                      {fieldErrors.message}
                    </p>
                  )}
                </div>

                {/* Submit Bar */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <button
                    type="submit"
                    disabled={!hasValidRecipientEmail}
                    className="w-full sm:w-auto px-6 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4 text-[#00D2FF]" aria-hidden="true" />
                    <span>تجهيز الرسالة وفتح تطبيق البريد</span>
                  </button>

                  {companyEmail && (
                    <span className="text-[11px] text-slate-500">
                      تُوجّه المسودة إلى:{' '}
                      <strong dir="ltr" className="text-[#0A192F]">
                        {companyEmail}
                      </strong>
                    </span>
                  )}
                </div>
              </form>
            )}
          </section>

          {/* Secondary Column (5 cols on Desktop): Official Recruitment Portal Card & Direct Mail Action */}
          <aside className="lg:col-span-5 space-y-6">
            {/* Official Recruitment Portal Card */}
            <div className="rounded-3xl bg-gradient-to-br from-[#0A192F] via-[#0F2547] to-[#1E3A8A] text-white p-6 sm:p-7 border border-[#1E3A8A] shadow-md space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#1E3A8A] border border-[#00D2FF]/40 flex items-center justify-center text-[#00D2FF] shrink-0">
                  <Briefcase className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-[#00D2FF] block">
                    Recruitment Portal · بوابة التوظيف الرسمية
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    التقديم على الشواغر الوظيفية
                  </h3>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                لا يتم استقبال طلبات التوظيف أو السير الذاتية عبر نموذج المراسلة العام. للتقديم الرسمي على الشواغر المتاحة واختبارات التقييم الوظيفي، يرجى الانتقال إلى بوابة التوظيف الرسمية المعتمدة لشركة {companyNameAr}.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <a
                  href={recruitmentPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-[#00D2FF]/40 shadow-xs cursor-pointer text-center"
                >
                  <span>فتح بوابة التوظيف الرسمية</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                </a>

                <Link
                  to="/careers"
                  className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-white/20 text-center"
                >
                  <span>استعراض الشواغر</span>
                  <ChevronLeft className="w-3.5 h-3.5 text-[#00D2FF]" aria-hidden="true" />
                </Link>
              </div>
            </div>

            {/* Quick Direct Email Card */}
            <div className="bg-white rounded-3xl border border-[#CBD5E1] p-6 sm:p-7 space-y-4 shadow-2xs">
              <h3 className="text-sm sm:text-base font-black text-[#0A192F]">
                مراسلة سريعة بدون تعبئة النموذج
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                يمكنك فتح برنامج البريد الإلكتروني الافتراضي لديك مباشرة لإرسال رسالة حرة إلى فريق {companyNameAr}، أو الاطلاع على خدماتنا التقنية قبل التواصل.
              </p>

              <div className="space-y-2.5 pt-1">
                {hasValidRecipientEmail && (
                  <a
                    href={`mailto:${companyEmail}?subject=${encodeURIComponent(
                      `استفسار إلى ${companyNameAr}`
                    )}`}
                    className="w-full py-3 px-4 rounded-xl bg-[#0A192F] hover:bg-[#142B4F] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Mail className="w-4 h-4 text-[#00D2FF]" aria-hidden="true" />
                    <span>فتح تطبيق البريد مباشرة</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-300" aria-hidden="true" />
                  </a>
                )}

                <Link
                  to="/services"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#F8FAFC] hover:bg-slate-100 text-[#0A192F] border border-[#CBD5E1] text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>تصفح الخدمات والحلول التقنية</span>
                  <ChevronLeft className="w-3.5 h-3.5 text-[#2563EB]" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
