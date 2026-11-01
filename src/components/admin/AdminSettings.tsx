/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ImageUploadField } from './ImageUploadField';
import {
  fetchSheetDbDiagnostics,
  saveServerCloudConfig,
  DEFAULT_SHEETDB_ENDPOINT,
} from '../../services/apiService';
import {
  Save,
  RotateCcw,
  Download,
  Upload,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileCode,
  HardDrive,
} from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const {
    profile,
    updateProfile,
    resetToDefaults,
    exportDataJSON,
    importDataJSON,
    backendConfig,
    setBackendConfig,
    testBackend,
    syncWithGoogleSheets,
    fetchFromGoogleSheets,
    showToast,
  } = useApp();

  // Site Profile State
  const [taglineAr, setTaglineAr] = useState(profile.taglineAr);
  const [taglineEn, setTaglineEn] = useState(profile.taglineEn);
  const [aboutDescriptionAr, setAboutDescriptionAr] = useState(profile.aboutDescriptionAr);
  const [visionAr, setVisionAr] = useState(profile.visionAr);
  const [missionAr, setMissionAr] = useState(profile.missionAr);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [locationAr, setLocationAr] = useState(profile.locationAr);
  const [workingHoursAr, setWorkingHoursAr] = useState(profile.workingHoursAr);
  const [logoUrl, setLogoUrl] = useState(profile.logo_url || '');
  const [logoFileId, setLogoFileId] = useState(profile.logo_file_id || '');
  const [logoAltAr, setLogoAltAr] = useState(
    profile.logo_alt_ar || 'شعار شركة سمارت مسار - Smart Masar'
  );

  // Google Sheets, SheetDB & Google Drive Backend State
  const [webAppUrl, setWebAppUrl] = useState(backendConfig.webAppUrl);
  const [adminApiKey, setAdminApiKey] = useState(backendConfig.adminApiKey || '');
  const [sheetDbUrl, setSheetDbUrl] = useState(
    backendConfig.sheetDbUrl || DEFAULT_SHEETDB_ENDPOINT
  );
  const [driveFolderId, setDriveFolderId] = useState(
    backendConfig.driveFolderId || profile.drive_folder_id || ''
  );

  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isCheckingSheetDb, setIsCheckingSheetDb] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);

  // Backup & Reset State
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      taglineAr: taglineAr.trim(),
      taglineEn: taglineEn.trim(),
      aboutDescriptionAr: aboutDescriptionAr.trim(),
      visionAr: visionAr.trim(),
      missionAr: missionAr.trim(),
      email: email.trim(),
      phone: phone.trim(),
      locationAr: locationAr.trim(),
      workingHoursAr: workingHoursAr.trim(),
      logo_url: logoUrl.trim(),
      logo_file_id: logoFileId.trim(),
      logo_alt_ar: logoAltAr.trim(),
      drive_folder_id: driveFolderId.trim(),
    });
  };

  const handleSaveBackendConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const isConfigured = Boolean(adminApiKey.trim());
    setBackendConfig({
      webAppUrl: webAppUrl.trim(),
      adminApiKey: adminApiKey.trim(),
      sheetDbUrl: sheetDbUrl.trim() || DEFAULT_SHEETDB_ENDPOINT,
      driveFolderId: driveFolderId.trim(),
      isConfigured,
      lastSyncTime: backendConfig.lastSyncTime,
    });

    const serverRes = await saveServerCloudConfig(adminApiKey.trim(), {
      webAppUrl: webAppUrl.trim(),
      sheetDbUrl: sheetDbUrl.trim() || DEFAULT_SHEETDB_ENDPOINT,
      driveFolderId: driveFolderId.trim(),
    });

    setTestResult({
      success: serverRes.success,
      message: serverRes.message,
    });
    showToast('تم حفظ إعدادات Google Drive و SheetDB و Apps Script');
  };

  const handleCheckSheetDbStatus = async () => {
    setIsCheckingSheetDb(true);
    setTestResult(null);
    const diag = await fetchSheetDbDiagnostics(adminApiKey.trim());
    setTestResult({
      success: Boolean(diag.reachable),
      message: diag.messageAr,
    });
    setIsCheckingSheetDb(false);
  };

  const handleTestConnection = async () => {
    if (!webAppUrl.trim()) {
      setTestResult({
        success: false,
        message: 'يرجى إدخال رابط Google Apps Script Web App أولاً لفحصه، أو استخدم زر فحص SheetDB.',
      });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    const result = await testBackend(webAppUrl.trim());
    setTestResult(result);
    setIsTesting(false);
  };

  const handlePushToGoogleSheets = async () => {
    setIsSyncing(true);
    const result = await syncWithGoogleSheets();
    setTestResult(result);
    setIsSyncing(false);
  };

  const handlePullFromGoogleSheets = async () => {
    setIsFetching(true);
    const result = await fetchFromGoogleSheets();
    setTestResult(result);
    setIsFetching(false);
  };

  const handleExport = () => {
    const json = exportDataJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart-masar-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('تم تصدير ملف النسخة الاحتياطية بنجاح');
  };

  const handleImport = () => {
    if (!importJsonText.trim()) return;
    setImportError(null);
    const success = importDataJSON(importJsonText);
    if (!success) {
      setImportError('خطأ: تعذر قراءة بيانات ملف JSON، تأكد من صحة التنسيق.');
    } else {
      setImportJsonText('');
    }
  };

  return (
    <div className="space-y-8 text-right bg-white">
      <div>
        <h2 className="text-xl font-bold text-[#142B4F]">
          إعدادات الموقع، الشعار، وتكامل Google Drive & Sheets
        </h2>
        <p className="text-xs text-slate-500">
          رفع شعار الشركة الرسمي، ضبط مجلد Google Drive للصور، وربط SheetDB و Google Apps Script.
        </p>
      </div>

      {/* 
        Google Drive, SheetDB & Apps Script Backend Integration Card
      */}
      <div className="bg-white rounded-2xl border-2 border-[#2563EB]/30 shadow-2xs p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F1F5F9]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#F5F8FC] border border-[#CBD5E1] flex items-center justify-center text-[#2563EB]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#142B4F]">
                التخزين السحابي للصور والبيانات (Google Drive + SheetDB + Apps Script)
              </h3>
              <p className="text-[11px] text-slate-500">
                تُخزن ملفات الصور في Google Drive وتُحفظ روابط العرض المباشرة ومعرفات الملفات في Google Sheets.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowDocsModal(true)}
            className="px-3 py-1.5 bg-[#F5F8FC] hover:bg-slate-100 text-[#2563EB] border border-[#CBD5E1] text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>دليل إعداد Google Drive و Sheets</span>
          </button>
        </div>

        <form onSubmit={handleSaveBackendConfig} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رابط SheetDB API (لتخزين روابط الصور والبيانات)
              </label>
              <input
                type="url"
                value={sheetDbUrl}
                onChange={(e) => setSheetDbUrl(e.target.value)}
                placeholder="https://sheetdb.io/api/v1/gnn52l70oflrp"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-[#F5F8FC] focus:outline-none focus:border-[#2563EB] font-mono"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                معرف مجلد Google Drive للصور (Google Drive Folder ID)
              </label>
              <input
                type="text"
                value={driveFolderId}
                onChange={(e) => setDriveFolderId(e.target.value)}
                placeholder="مثال: 1AbCdEfGhIjKlMnOpQrStUvWxYz (أو يترك لإنشائه تلقائياً)"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-[#F5F8FC] focus:outline-none focus:border-[#2563EB] font-mono"
                dir="ltr"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رابط تطبيق Google Apps Script (لرفع الصور مباشرة إلى Google Drive)
              </label>
              <input
                type="url"
                value={webAppUrl}
                onChange={(e) => setWebAppUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-[#F5F8FC] focus:outline-none focus:border-[#2563EB] font-mono"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                مفتاح مصادقة المسؤول على الخادم (SMART_MASAR_ADMIN_KEY) *
              </label>
              <input
                type="password"
                value={adminApiKey}
                onChange={(e) => setAdminApiKey(e.target.value)}
                placeholder="أدخل مفتاح الأمان المعتمد في الخادم"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-[#F5F8FC] focus:outline-none focus:border-[#2563EB] font-mono"
                dir="ltr"
              />
            </div>
          </div>

          {/* Test connection results */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 leading-relaxed ${
                testResult.success
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-amber-50 text-amber-900 border-amber-200'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              حفظ إعدادات الربط السحابي
            </button>

            <button
              type="button"
              onClick={handleCheckSheetDbStatus}
              disabled={isCheckingSheetDb}
              className="px-4 py-2 bg-[#F5F8FC] hover:bg-slate-100 text-[#142B4F] border border-[#CBD5E1] text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <HardDrive
                className={`w-3.5 h-3.5 text-[#2563EB] ${
                  isCheckingSheetDb ? 'animate-spin' : ''
                }`}
              />
              <span>فحص اتصال SheetDB و Google Sheets</span>
            </button>

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || !webAppUrl}
              className="px-4 py-2 bg-[#F5F8FC] hover:bg-slate-100 text-[#142B4F] border border-[#CBD5E1] text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-[#2563EB] ${isTesting ? 'animate-spin' : ''}`}
              />
              <span>فحص Apps Script (Ping)</span>
            </button>

            <button
              type="button"
              onClick={handlePushToGoogleSheets}
              disabled={isSyncing}
              className="px-4 py-2 bg-[#F5F8FC] hover:bg-slate-100 text-[#142B4F] border border-[#CBD5E1] text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Upload
                className={`w-3.5 h-3.5 text-emerald-600 ${isSyncing ? 'animate-bounce' : ''}`}
              />
              <span>مزامنة ورفع البيانات</span>
            </button>

            <button
              type="button"
              onClick={handlePullFromGoogleSheets}
              disabled={isFetching}
              className="px-4 py-2 bg-[#F5F8FC] hover:bg-slate-100 text-[#142B4F] border border-[#CBD5E1] text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Download
                className={`w-3.5 h-3.5 text-[#7C5CDE] ${isFetching ? 'animate-bounce' : ''}`}
              />
              <span>تحديث البيانات</span>
            </button>
          </div>
        </form>
      </div>

      {/* Main Settings & Company Logo Form */}
      <form
        onSubmit={handleSaveProfile}
        className="bg-white rounded-2xl border border-[#CBD5E1] shadow-2xs p-6 sm:p-8 space-y-6"
      >
        <h3 className="text-sm font-bold text-[#142B4F] pb-2 border-b border-[#F1F5F9]">
          الشعار الرسمي للمؤسسة (SiteSettings: logo_url / logo_file_id)
        </h3>

        <ImageUploadField
          labelAr="شعار شركة سمارت مسار الرسمي (Company Logo)"
          helperTextAr="ارفع شعار الشركة بصيغة PNG أو WebP أو JPG. يتم حفظ الرابط في SiteSettings (logo_url و logo_file_id) وعرضه تلقائياً في ترويسة وتذييل الموقع."
          entityType="settings"
          entityId="site-logo"
          imageUrl={logoUrl}
          imageFileId={logoFileId}
          imageAltAr={logoAltAr}
          showAltInput={true}
          adminKey={adminApiKey || ''}
          onImageChange={({ imageUrl: newUrl, imageFileId: newId, imageAltAr: newAlt }) => {
            setLogoUrl(newUrl);
            setLogoFileId(newId);
            if (newAlt !== undefined) setLogoAltAr(newAlt);
            updateProfile({
              logo_url: newUrl,
              logo_file_id: newId,
              logo_alt_ar: newAlt || logoAltAr,
            });
          }}
        />

        <h3 className="text-sm font-bold text-[#142B4F] pt-2 pb-2 border-b border-[#F1F5F9]">
          الهوية والشعار اللفظي
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              الشعار اللفظي بالعربية (Arabic Tagline) *
            </label>
            <input
              type="text"
              required
              value={taglineAr}
              onChange={(e) => setTaglineAr(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              الشعار اللفظي بالإنجليزية (English Tagline) *
            </label>
            <input
              type="text"
              required
              value={taglineEn}
              onChange={(e) => setTaglineEn(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white"
              dir="ltr"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            نبذة تعريفية عامة عن سمارت مسار *
          </label>
          <textarea
            rows={3}
            required
            value={aboutDescriptionAr}
            onChange={(e) => setAboutDescriptionAr(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white leading-relaxed"
          />
        </div>

        <h3 className="text-sm font-bold text-[#142B4F] pt-4 pb-2 border-b border-[#F1F5F9]">
          الرؤية والرسالة المؤسسية
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              الرؤية (Vision) *
            </label>
            <textarea
              rows={3}
              required
              value={visionAr}
              onChange={(e) => setVisionAr(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              الرسالة (Mission) *
            </label>
            <textarea
              rows={3}
              required
              value={missionAr}
              onChange={(e) => setMissionAr(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white leading-relaxed"
            />
          </div>
        </div>

        <h3 className="text-sm font-bold text-[#142B4F] pt-4 pb-2 border-b border-[#F1F5F9]">
          بيانات الاتصال والمقر
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              البريد الإلكتروني الرسمي
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              هاتف الاستعلامات
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              الموقع الجغرافي والمقر
            </label>
            <input
              type="text"
              value={locationAr}
              onChange={(e) => setLocationAr(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ساعات الدوام
            </label>
            <input
              type="text"
              value={workingHoursAr}
              onChange={(e) => setWorkingHoursAr(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>حفظ إعدادات الموقع والشعار</span>
          </button>
        </div>
      </form>

      {/* Data Backup & Reset Card */}
      <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-2xs p-6 sm:p-8 space-y-6">
        <div>
          <h3 className="text-sm font-bold text-[#142B4F]">
            إدارة النسخ الاحتياطية واستعادة البيانات
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            تصدير جميع التعديلات كملف JSON لضمان حفظها خارجياً، أو استعادة الإعدادات التأسيسية للمشروع التدريبي.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {/* Export Ready Static Hosting ZIP */}
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-300 space-y-3">
            <span className="text-xs font-bold text-emerald-950 block">
              حزمة الاستضافة الخارجية الجاهزة (Static ZIP)
            </span>
            <p className="text-xs text-emerald-800">
              ملف index.html مع كافة ملفات CSS وJS والصور وملف README.md جاهز للرفع على أي استضافة بدون Google Cloud Billing.
            </p>
            <a
              href="/api/download-static-zip"
              download="smart-masar-static-hosting.zip"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>تحميل حزمة الاستضافة (ZIP)</span>
            </a>
          </div>

          {/* Export Complete Project ZIP */}
          <div className="p-4 rounded-xl bg-blue-50/60 border border-[#2563EB]/30 space-y-3">
            <span className="text-xs font-bold text-[#142B4F] block">
              المشروع البرمجي الكامل (Source ZIP)
            </span>
            <p className="text-xs text-slate-600">
              تنزيل الحزمة البرمجية الكاملة للمشروع (الواجهة، الخادم server.ts، كود Apps Script، وتعليمات النشر).
            </p>
            <a
              href="/api/download-project-zip"
              download="smart-masar-complete-project.zip"
              className="px-4 py-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>تنزيل ملف المشروع (ZIP)</span>
            </a>
          </div>

          {/* Export JSON */}
          <div className="p-4 rounded-xl bg-[#F5F8FC] border border-[#CBD5E1] space-y-3">
            <span className="text-xs font-bold text-[#142B4F] block">
              تصدير البيانات (Export JSON)
            </span>
            <p className="text-xs text-slate-600">
              قم بتنزيل ملف يحتوي على كافة الموظفين، الخدمات، الصفحات، والشواغر.
            </p>
            <button
              type="button"
              onClick={handleExport}
              className="px-4 py-2 bg-[#142B4F] hover:bg-[#2563EB] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>تنزيل ملف النسخة الاحتياطية</span>
            </button>
          </div>

          {/* Reset */}
          <div className="p-4 rounded-xl bg-red-50/50 border border-red-200 space-y-3">
            <span className="text-xs font-bold text-red-900 block">
              إعادة الضبط الافتراضي (Factory Reset)
            </span>
            <p className="text-xs text-red-700">
              استعادة قائمة الموظفين والشواغر الأولية المحددة في المشروع التدريبي.
            </p>
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>استعادة البيانات الافتراضية</span>
            </button>
          </div>
        </div>

        {/* JSON Import area */}
        <div className="p-4 rounded-xl bg-[#F5F8FC] border border-[#CBD5E1] space-y-3">
          <span className="text-xs font-bold text-[#142B4F] block">
            استيراد بيانات من كود JSON (Import)
          </span>
          <textarea
            rows={3}
            value={importJsonText}
            onChange={(e) => setImportJsonText(e.target.value)}
            placeholder="الصق هنا كود JSON لتطبيقه..."
            className="w-full p-2.5 text-xs font-mono rounded-lg border border-[#CBD5E1] bg-white"
            dir="ltr"
          />
          {importError && (
            <div className="text-xs text-red-600 font-bold">{importError}</div>
          )}
          <button
            type="button"
            onClick={handleImport}
            disabled={!importJsonText.trim()}
            className="px-4 py-2 bg-[#2563EB] hover:bg-[#1d4ed8] disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>تطبيق الاستيراد الآن</span>
          </button>
        </div>
      </div>

      {/* Docs & Schema Modal */}
      {showDocsModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-[#CBD5E1] text-right overflow-hidden">
            <div className="bg-[#F5F8FC] border-b border-[#E2E8F0] p-5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#142B4F] flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#2563EB]" />
                <span>دليل تهيئة مجلد Google Drive وجداول Google Sheets & SheetDB</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowDocsModal(false)}
                className="text-slate-400 hover:text-[#142B4F] p-1 rounded cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 font-semibold">
                الكود الكامل لرفع الصور إلى Google Drive وتهيئة الجداول موجود في:{' '}
                <code className="font-mono text-[#2563EB]">/backend/google-apps-script.js</code>
              </div>

              <h4 className="font-bold text-[#142B4F] text-sm">
                خطوات تفعيل رفع الصور إلى Google Drive وربط SheetDB:
              </h4>
              <ol className="list-decimal list-inside space-y-2 pr-2">
                <li>
                  افتح ملف Google Sheets المرتبط بـ SheetDB (
                  <code className="font-mono" dir="ltr">
                    مؤسسة Masar Smart
                  </code>
                  ).
                </li>
                <li>
                  من القائمة العلوية اختر: <strong>Extensions &gt; Apps Script</strong>.
                </li>
                <li>
                  الصق محتوى الملف{' '}
                  <code className="font-mono">/backend/google-apps-script.js</code> بالكامل داخل{' '}
                  <code className="font-mono">Code.gs</code>.
                </li>
                <li>
                  شغّل الدالة <code className="font-mono">initialSetup</code> مرة واحدة، ووافق على صلاحيات{' '}
                  <strong>SpreadsheetApp</strong> و <strong>DriveApp</strong>. ستقوم الدالة تلقائياً بإنشاء الأوراق الست وإنشاء مجلد مخصص في Google Drive باسم{' '}
                  <code className="font-mono">Smart Masar Website Images</code>.
                </li>
                <li>
                  في <strong>Project Settings &gt; Script Properties</strong>، يمكنك تحديد{' '}
                  <code className="font-mono">SMART_MASAR_ADMIN_KEY</code> و{' '}
                  <code className="font-mono">SMART_MASAR_DRIVE_FOLDER_ID</code>.
                </li>
                <li>
                  اختر <strong>Deploy &gt; New Deployment &gt; Web App</strong> (Execute as:{' '}
                  <strong>Me</strong>, Who has access: <strong>Anyone</strong>) وانسخ الرابط إلى خانة الإعدادات أعلاه.
                </li>
              </ol>

              <h4 className="font-bold text-[#142B4F] text-sm pt-2">
                أعمدة الصور المعتمدة في Google Sheets:
              </h4>
              <ul className="list-disc list-inside space-y-1 pr-2">
                <li>
                  <strong>Team:</strong> <code className="font-mono">image_url</code>,{' '}
                  <code className="font-mono">image_file_id</code>,{' '}
                  <code className="font-mono">image_alt_ar</code>
                </li>
                <li>
                  <strong>Services:</strong> <code className="font-mono">image_url</code>,{' '}
                  <code className="font-mono">image_file_id</code>,{' '}
                  <code className="font-mono">image_alt_ar</code>
                </li>
                <li>
                  <strong>Pages:</strong> <code className="font-mono">hero_image_url</code>,{' '}
                  <code className="font-mono">hero_image_file_id</code>
                </li>
                <li>
                  <strong>SiteSettings:</strong> <code className="font-mono">logo_url</code>,{' '}
                  <code className="font-mono">logo_file_id</code>
                </li>
              </ul>
            </div>

            <div className="p-4 bg-[#F5F8FC] border-t border-[#E2E8F0] flex justify-end">
              <button
                type="button"
                onClick={() => setShowDocsModal(false)}
                className="px-5 py-2 text-xs font-bold bg-[#142B4F] text-white rounded-lg cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div
          role="alertdialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-right space-y-4 border border-[#CBD5E1]">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-[#142B4F]">تأكيد استعادة البيانات</h3>
              <p className="text-xs text-slate-500">
                سيتم مسح أي إضافات وتعديلات جديدة واسترجاع الفريق والشواغر المبدئية فقط. هل تريد المتابعة؟
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={() => {
                  resetToDefaults();
                  setShowResetConfirm(false);
                }}
                className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer"
              >
                تأكيد الاستعادة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
