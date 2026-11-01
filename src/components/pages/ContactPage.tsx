/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
} from 'lucide-react';

export const ContactPage: React.FC = () => {
  const { profile } = useApp();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [dispatched, setDispatched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setErrorMsg('يرجى ملء جميع الحقول الإلزامية المشار إليها بالنجمة (*)');
      return;
    }
    setErrorMsg('');
    setDispatched(true);

    // Honest direct action: generate real mailto link and trigger user's native email client
    const mailtoSubject = encodeURIComponent(
      formData.subject.trim() || 'استفسار عبر موقع سمارت مسار'
    );
    const mailtoBody = encodeURIComponent(
      `الاسم: ${formData.name}\nالبريد الإلكتروني: ${formData.email}\n\nالرسالة:\n${formData.message}`
    );
    const mailtoUrl = `mailto:${profile.email}?subject=${mailtoSubject}&body=${mailtoBody}`;

    // Trigger user mail client honestly
    window.location.href = mailtoUrl;
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
            <span className="text-[#00D2FF]">تواصل معنا</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E3A8A]/70 border border-[#00D2FF]/30 text-[#00D2FF] text-xs font-bold shadow-xs">
                <PhoneCall className="w-3.5 h-3.5" />
                <span>قنوات التواصل المؤسسي • Contact Channels</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                تواصل مع إدارة سمارت مسار
              </h1>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                يسعدنا تلقي استفساراتكم حول حلول التكنولوجيا، برامج التدريب، والشواغر الوظيفية عبر البريد الإلكتروني الرسمي أو الهاتف.
              </p>
            </div>

            <PageHeroImage pageId="page-contact" />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Contact Details & Info */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
              <h2 className="text-base sm:text-lg font-bold text-[#0A192F]">
                معلومات المقر والتواصل
              </h2>

              <div className="space-y-4 text-xs sm:text-sm">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#EBF4FE] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shrink-0 mt-0.5 shadow-2xs">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">العنوان والمقر</span>
                    <span className="font-semibold text-[#0A192F]">{profile.locationAr}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#EBF4FE] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shrink-0 shadow-2xs">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">البريد الإلكتروني الرسمي</span>
                    <a
                      href={`mailto:${profile.email}`}
                      className="font-bold text-[#2563EB] hover:underline"
                      dir="ltr"
                    >
                      {profile.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#EBF4FE] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shrink-0 shadow-2xs">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">هاتف الاستعلامات</span>
                    <a
                      href={`tel:${profile.phone}`}
                      className="font-bold text-[#0A192F] hover:text-[#2563EB]"
                      dir="ltr"
                    >
                      {profile.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#EBF4FE] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shrink-0 mt-0.5 shadow-2xs">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">ساعات العمل الرسمية</span>
                    <span className="font-semibold text-[#0A192F]">
                      {profile.workingHoursAr}
                    </span>
                  </div>
                </div>
              </div>

              {/* Direct Mail Action Button */}
              <div className="pt-2">
                <a
                  href={`mailto:${profile.email}?subject=${encodeURIComponent('استفسار إلى سمارت مسار')}`}
                  className="w-full py-3 px-4 rounded-xl bg-[#0A192F] hover:bg-[#10203B] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-[#1E3A8A] shadow-sm cursor-pointer"
                >
                  <Mail className="w-4 h-4 text-[#00D2FF]" />
                  <span>فتح تطبيق البريد لمراسلتنا مباشرة</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </div>
            </div>

            {/* Clear Status Notice */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#CBD5E1] shadow-2xs flex items-start gap-3 text-xs text-[#0A192F]">
              <ShieldAlert className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>إيضاح المصداقية والشفافية:</strong> لتقديم طلبات التوظيف الرسمية، يرجى استخدام صفحة <strong>الوظائف</strong> ثم الضغط على رابط استمارة Google Forms المعتمدة. نموذج المراسلة يقوم بفتح تطبيق بريدك مباشرة دون محاكاة تسليم وهمي.
              </div>
            </div>
          </div>

          {/* Contact Inquiry Form */}
          <div className="lg:col-span-7">
            <div className="glass-card rounded-3xl p-6 sm:p-8">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-6">
                <div>
                  <h2 className="text-lg font-bold text-[#0A192F]">
                    إعداد رسالة واستفسار مباشر
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    سيتم فتح تطبيق بريدك المفضل لإرسال الرسالة مباشرة إلى {profile.email}.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-[#2563EB] bg-[#EBF4FE] border border-[#BFDBFE] px-2.5 py-1 rounded-full">
                  مراسلة بريدية مباشرة
                </span>
              </div>

              {dispatched ? (
                <div className="p-6 text-right bg-[#EBF4FE] border border-[#BFDBFE] rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 font-bold text-[#2563EB]">
                    <AlertCircle className="w-5 h-5" />
                    <h3 className="text-sm font-bold">تم تحويل بيانات الرسالة إلى تطبيق بريدك</h3>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    تم تجهيز رسالتك وتوجيهها إلى برنامج البريد الإلكتروني الخاص بك للتأكيد والإرسال المباشر إلى <strong dir="ltr">{profile.email}</strong>.
                  </p>
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setDispatched(false)}
                      className="px-4 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer hover:bg-[#1D4ED8]"
                    >
                      كتابة رسالة أخرى
                    </button>
                    <a
                      href={`mailto:${profile.email}`}
                      className="text-xs font-bold text-[#2563EB] hover:underline"
                      dir="ltr"
                    >
                      {profile.email}
                    </a>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-right">
                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
                      {errorMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        الاسم الكامل *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="مثال: يزن خالد"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#CBD5E1] bg-[#F0F6FD] focus:bg-white focus:outline-none focus:border-[#2563EB]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        البريد الإلكتروني *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="name@example.com"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#CBD5E1] bg-[#F0F6FD] focus:bg-white focus:outline-none focus:border-[#2563EB]"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      موضوع الاستفسار
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="استفسار عام / حلول التكنولوجيا / التوظيف"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#CBD5E1] bg-[#F0F6FD] focus:bg-white focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      نص الرسالة *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="اكتب تفاصيل رسالتك أو استفسارك هنا..."
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#CBD5E1] bg-[#F0F6FD] focus:bg-white focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-6 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 border border-[#00D2FF]/30 cursor-pointer"
                    >
                      <Send className="w-4 h-4 text-[#00D2FF]" />
                      <span>فتح البريد وإرسال الرسالة</span>
                    </button>
                    <span className="text-[11px] text-slate-500 hidden sm:inline">
                      المستلم: {profile.email}
                    </span>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
