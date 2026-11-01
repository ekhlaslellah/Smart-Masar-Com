/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Download,
  FileCode2,
  FolderArchive,
  CheckCircle2,
  Server,
  Globe,
  ShieldCheck,
  Database,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';

interface StaticExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StaticExportModal: React.FC<StaticExportModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'downloads' | 'steps' | 'matrix'>('downloads');
  const [copiedCmd, setCopiedCmd] = useState(false);

  if (!isOpen) return null;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText('https://sheetdb.io/api/v1/gnn52l70oflrp');
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="static-export-title"
      className="fixed inset-0 z-50 bg-[#0A192F]/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in"
      onClick={onClose}
    >
      <div
        dir="rtl"
        className="bg-white text-[#142B4F] rounded-2xl shadow-2xl border border-[#CBD5E1] max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden text-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-[#0A192F] text-white border-b border-[#1E3A8A] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#2563EB] border border-[#00D2FF]/40 flex items-center justify-center shrink-0 shadow-md">
              <Globe className="w-6 h-6 text-[#00D2FF]" />
            </div>
            <div>
              <span className="inline-block text-[11px] font-bold text-[#00D2FF] bg-[#1E3A8A]/70 px-2.5 py-0.5 rounded-md border border-[#00D2FF]/30 mb-1">
                جاهز للنشر الخارجي بدون Google Cloud Billing
              </span>
              <h2 id="static-export-title" className="text-base sm:text-lg font-black text-white">
                حزمة النشر على استضافة خارجية (HTML / CSS / JavaScript)
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-[#F0F6FD] px-5 pt-3 border-b border-[#CBD5E1] flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('downloads')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'downloads'
                ? 'bg-white text-[#2563EB] border-[#CBD5E1] -mb-px shadow-2xs'
                : 'bg-transparent text-slate-600 border-transparent hover:text-[#142B4F]'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>1. تحميل الملفات الجاهزة للنشر</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('steps')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'steps'
                ? 'bg-white text-[#2563EB] border-[#CBD5E1] -mb-px shadow-2xs'
                : 'bg-transparent text-slate-600 border-transparent hover:text-[#142B4F]'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>2. خطوات الرفع والنشر خطوة بخطوة (README)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'matrix'
                ? 'bg-white text-[#2563EB] border-[#CBD5E1] -mb-px shadow-2xs'
                : 'bg-transparent text-slate-600 border-transparent hover:text-[#142B4F]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>3. ما يعمل على الاستضافة الثابتة مقابل الخادم</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-white">
          {activeTab === 'downloads' && (
            <div className="space-y-6">
              {/* Primary Recommended Download: Static Production Build ZIP */}
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-l from-[#0A192F] to-[#13284C] text-white border border-[#2563EB] shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#00D2FF]/15 border border-[#00D2FF]/40 text-[#00D2FF] text-[11px] font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>الخيار الموصى به للرفع على أي استضافة خارجية</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-white">
                      حزمة النشر الإنتاجية الجاهزة (Production Static Hosting ZIP)
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                      تحتوي على ملف <code className="text-[#00D2FF] font-mono">index.html</code> في الجذر، مجلد{' '}
                      <code className="text-[#00D2FF] font-mono">assets/</code> (كافة ملفات CSS وJavaScript المجمعة والشعارات)، النسخة المستقلة{' '}
                      <code className="text-[#00D2FF] font-mono">smart-masar.html</code>، ملفات التوجيه التلقائي (<code className="font-mono">.htaccess</code>,{' '}
                      <code className="font-mono">_redirects</code>, <code className="font-mono">vercel.json</code>, <code className="font-mono">404.html</code>)، ودليل{' '}
                      <code className="text-[#00D2FF] font-mono">README.md</code>.
                    </p>
                  </div>

                  <a
                    href="/api/download-static-zip"
                    download="smart-masar-static-hosting.zip"
                    className="px-5 py-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-black rounded-xl shadow-lg border border-[#00D2FF]/50 transition-all flex items-center justify-center gap-2.5 shrink-0 cursor-pointer"
                  >
                    <FolderArchive className="w-5 h-5 text-[#00D2FF]" />
                    <span>تحميل حزمة الاستضافة (ZIP)</span>
                  </a>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-white/10 text-[11px] text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00D2FF] shrink-0" />
                    <span>7 صفحات كاملة ومتجاوبة</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00D2FF] shrink-0" />
                    <span>ربط قرائي مباشر مع SheetDB</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00D2FF] shrink-0" />
                    <span>خالية 100% من المفاتيح السرية</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00D2FF] shrink-0" />
                    <span>تعمل بدون Google Cloud Billing</span>
                  </div>
                </div>
              </div>

              {/* Secondary Download Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Option 2: Standalone Single HTML File */}
                <div className="p-5 rounded-2xl bg-[#F0F6FD] border border-[#CBD5E1] flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[#142B4F] font-black text-sm">
                      <FileCode2 className="w-5 h-5 text-[#2563EB]" />
                      <span>النسخة المستقلة في ملف واحد (Standalone HTML)</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      ملف <code className="font-mono font-bold text-[#142B4F]">smart-masar.html</code> موحد يجمع الهيكل، التنسيقات (CSS)، البرمجة التفاعلية (JS)، شعار Road-S، والربط القرائي مع SheetDB داخل ملف واحد يعمل مباشرة في أي متصفح أو استضافة بسيطة.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <a
                      href="/api/download-html"
                      download="smart-masar.html"
                      className="flex-1 px-4 py-2.5 bg-[#142B4F] hover:bg-[#2563EB] text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4 text-[#00D2FF]" />
                      <span>تنزيل ملف smart-masar.html</span>
                    </a>
                    <a
                      href="/smart-masar.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2.5 bg-white hover:bg-slate-100 text-[#142B4F] border border-[#CBD5E1] text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <span>معاينة</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Option 3: Full Source Code + Backend ZIP */}
                <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[#142B4F] font-black text-sm">
                      <Server className="w-5 h-5 text-[#7C5CDE]" />
                      <span>المشروع البرمجي الكامل مع الخادم (Full-Stack Source ZIP)</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      يحتوي على الكود المصدري الكامل (<code className="font-mono">src/</code>، الخادم{' '}
                      <code className="font-mono">server.ts</code>، وسكربت{' '}
                      <code className="font-mono">backend/google-apps-script.js</code>) لمن يرغب بتشغيل خادم Node.js خاص به لاحقاً.
                    </p>
                  </div>
                  <div className="pt-2">
                    <a
                      href="/api/download-project-zip"
                      download="smart-masar-complete-project.zip"
                      className="w-full px-4 py-2.5 bg-white hover:bg-[#F0F6FD] text-[#142B4F] border border-[#CBD5E1] text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4 text-[#2563EB]" />
                      <span>تنزيل الكود المصدري الكامل (Source ZIP)</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* SheetDB Live Connection Info Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-[#CBD5E1] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Database className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-700">
                    <span className="font-bold text-[#142B4F]">الربط المباشر بقاعدة بيانات Google Sheets عبر SheetDB: </span>
                    يتصل الموقع العام تلقائياً بالرابط العام للقراءة فقط دون كشف أي مفاتيح إدارة.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="px-3 py-1.5 bg-white hover:bg-[#F0F6FD] border border-[#CBD5E1] rounded-lg text-[11px] font-mono text-[#142B4F] flex items-center gap-1.5 shrink-0 self-end sm:self-center cursor-pointer"
                >
                  {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#2563EB]" />}
                  <span>https://sheetdb.io/api/v1/gnn52l70oflrp</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'steps' && (
            <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <div className="p-4 rounded-xl bg-[#F0F6FD] border border-[#2563EB]/30">
                <h3 className="font-black text-[#142B4F] text-sm mb-1">
                  كيف ترفع الموقع ليصبح متاحاً برابط عام مجاناً؟
                </h3>
                <p className="text-xs text-slate-600">
                  بعد تحميل ملف <strong>smart-masar-static-hosting.zip</strong> وفك الضغط عنه، اختر إحدى الطرق التالية:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-[#CBD5E1] bg-white space-y-2">
                  <div className="font-black text-[#2563EB] text-sm">
                    الطريقة 1: Netlify Drop أو Cloudflare Pages (الأسرع)
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600">
                    <li>فك ضغط ملف <code className="font-mono">smart-masar-static-hosting.zip</code> في مجلد على جهازك.</li>
                    <li>افتح موقع <code className="font-mono">app.netlify.com/drop</code> في المتصفح.</li>
                    <li>اسحب المجلد وأفلته داخل الصفحة.</li>
                    <li>سيتم نشر الموقع فوراً برابط HTTPS عام يعمل على جميع الهواتف والحواسيب.</li>
                  </ol>
                </div>

                <div className="p-4 rounded-xl border border-[#CBD5E1] bg-white space-y-2">
                  <div className="font-black text-[#2563EB] text-sm">
                    الطريقة 2: استضافة GitHub Pages المجانية
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600">
                    <li>أنشئ مستودعاً عاماً (Public Repository) على GitHub.</li>
                    <li>ارفع جميع الملفات الموجودة داخل الحزمة (<code className="font-mono">index.html</code>، مجلد <code className="font-mono">assets/</code>، <code className="font-mono">404.html</code>، إلخ).</li>
                    <li>من <strong>Settings &rarr; Pages</strong> اختر الفرع <code className="font-mono">main</code> واضغط Save.</li>
                    <li>سيعمل الموقع بالكامل مع دعم جميع المسارات الفرعية بفضل ملف <code className="font-mono">404.html</code> المدمج.</li>
                  </ol>
                </div>

                <div className="p-4 rounded-xl border border-[#CBD5E1] bg-white space-y-2">
                  <div className="font-black text-[#2563EB] text-sm">
                    الطريقة 3: استضافة cPanel / Hostinger / Apache
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600">
                    <li>افتح <strong>File Manager</strong> في لوحة cPanel وانتقل إلى مجلد <code className="font-mono">public_html</code>.</li>
                    <li>ارفع ملف <code className="font-mono">smart-masar-static-hosting.zip</code> وفك الضغط عنه داخل <code className="font-mono">public_html</code>.</li>
                    <li>يتكفل ملف <code className="font-mono">.htaccess</code> المرفق بتشغيل جميع روابط الصفحات (<code className="font-mono">/about</code>, <code className="font-mono">/careers</code>) تلقائياً.</li>
                  </ol>
                </div>

                <div className="p-4 rounded-xl border border-[#CBD5E1] bg-white space-y-2">
                  <div className="font-black text-[#2563EB] text-sm">
                    الطريقة 4: رفع ملف HTML المستقل الواحد
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600">
                    <li>إذا كنت تستخدم استضافة بسيطة تدعم ملفاً واحداً فقط، استخدم ملف <code className="font-mono">smart-masar.html</code>.</li>
                    <li>أعد تسميته إلى <code className="font-mono">index.html</code> وارفعه بمفرده؛ فهو يضم كل الصفحات والتصميم والبيانات ذاتياً.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'matrix' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 leading-relaxed">
                <strong>توضيح هندسي صادق (الشفافية والأمان):</strong> تم فصل الموقع العام عن مفاتيح الإدارة السرية بحيث لا يحتوي ملف <code className="font-mono">index.html</code> أو ملفات JavaScript العامة على أي كلمات مرور أو مفاتيح إدارة. يوضح الجدول التالي بدقة ما يعمل على استضافة HTML/CSS/JS الثابتة وما يتطلب خادماً خلفياً:
              </div>

              <div className="overflow-x-auto border border-[#CBD5E1] rounded-xl">
                <table className="w-full text-right text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#0A192F] text-white">
                      <th className="p-3 border-b border-[#1E3A8A]">الميزة / الوظيفة</th>
                      <th className="p-3 border-b border-[#1E3A8A]">العمل على استضافة HTML/CSS/JS</th>
                      <th className="p-3 border-b border-[#1E3A8A]">التفاصيل التقنية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    <tr className="bg-white">
                      <td className="p-3 font-bold text-[#142B4F]">جميع الصفحات الـ 7 والهوية البصرية</td>
                      <td className="p-3 text-emerald-700 font-bold">تعمل بالكامل 100%</td>
                      <td className="p-3 text-slate-600">تعمل الرئيسية، من نحن، الخدمات، الفريق، الهيكل التنظيمي، الوظائف، والتواصل مع التجاوب الكامل للهاتف (390px).</td>
                    </tr>
                    <tr className="bg-[#F8FAFC]">
                      <td className="p-3 font-bold text-[#142B4F]">سجلات الموظفين الـ 6 والأقسام الـ 5 وشاغر المحاسب</td>
                      <td className="p-3 text-emerald-700 font-bold">تعمل بالكامل 100%</td>
                      <td className="p-3 text-slate-600">مدمجة داخل الحزمة وتظهر فوراً، مع عمل رابط التقديم عبر Google Forms بشكل مباشر.</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="p-3 font-bold text-[#142B4F]">قراءة البيانات المحدثة من Google Sheets (SheetDB)</td>
                      <td className="p-3 text-emerald-700 font-bold">تعمل تلقائياً (قراءة عامة)</td>
                      <td className="p-3 text-slate-600">يجلب الموقع العام البيانات المنشورة مباشرة من SheetDB في وضع القراءة دون الحاجة لخادم Node.js.</td>
                    </tr>
                    <tr className="bg-[#F8FAFC]">
                      <td className="p-3 font-bold text-[#142B4F]">حماية مفاتيح الإدارة وعزل الموقع العام</td>
                      <td className="p-3 text-emerald-700 font-bold">مؤمّنة 100%</td>
                      <td className="p-3 text-slate-600">لا توجد أي مفاتيح سرية أو صلاحيات كتابة مكشوفة في كود HTML/JS المرفوع للاستضافة العامة.</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="p-3 font-bold text-[#142B4F]">حفظ تعديلات الإدارة الدائمة ورفع الصور إلى Google Drive</td>
                      <td className="p-3 text-amber-700 font-bold">تحتاج خدمة خلفية (Apps Script أو Node.js)</td>
                      <td className="p-3 text-slate-600">الاستضافة الثابتة لا تملك قرص تخزين خادمي للرفع. لتفعيل الرفع والحفظ مجاناً بدون Google Cloud Billing، يتم نشر ملف <code className="font-mono">backend/google-apps-script.js</code> كـ Web App مجاني في حساب Google.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-[#F8FAFC] border-t border-[#CBD5E1] flex items-center justify-between gap-4">
          <div className="text-[11px] text-slate-500">
            Smart Masar | سمارت مسار — حزمة النشر الخارجي المستقلة
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/api/download-static-zip"
              download="smart-masar-static-hosting.zip"
              className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تحميل ZIP الجاهز للرفع</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-[#142B4F] text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
