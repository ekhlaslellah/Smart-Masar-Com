/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import {
  Upload,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Loader2,
  HardDrive,
  Link as LinkIcon,
} from 'lucide-react';
import {
  validateImageFile,
  resolvePublicImageUrl,
  extractGoogleDriveFileId,
} from '../../utils/imageUrl';
import {
  uploadImageWithProgress,
  removeImageOnServer,
} from '../../services/apiService';

export interface ImageUploadFieldProps {
  labelAr: string;
  helperTextAr?: string;
  entityType: 'team' | 'services' | 'pages' | 'settings';
  entityId: string;
  imageUrl: string;
  imageFileId: string;
  imageAltAr?: string;
  showAltInput?: boolean;
  adminKey: string;
  onImageChange: (updates: {
    imageUrl: string;
    imageFileId: string;
    imageAltAr?: string;
  }) => void;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  labelAr,
  helperTextAr = 'الصيغ المدعومة: JPG, PNG, WebP (بحد أقصى 5 ميغابايت). تُرفع الصور إلى مجلد Google Drive وتُحفظ روابطها تلقائياً في Google Sheets.',
  entityType,
  entityId,
  imageUrl,
  imageFileId,
  imageAltAr = '',
  showAltInput = false,
  adminKey,
  onImageChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [imgLoadError, setImgLoadError] = useState(false);

  const effectiveDisplayUrl =
    localPreviewUrl || resolvePublicImageUrl(imageUrl, imageFileId);
  const hasExistingImage = Boolean(imageUrl || imageFileId || localPreviewUrl);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setStatusMsg(null);
    setImgLoadError(false);

    // 1. Validate format (JPG, PNG, WebP) and size before upload
    const validation = validateImageFile({
      name: file.name,
      type: file.type,
      size: file.size,
    });

    if (!validation.valid) {
      setErrorMsg(validation.errorAr || 'ملف الصورة غير صالح.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 2. Immediate local preview
    const objectUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(objectUrl);
    setIsUploading(true);
    setUploadProgress(5);

    // 3. Upload to backend (Google Drive + Server + SheetDB/Google Sheets)
    const response = await uploadImageWithProgress(
      {
        file,
        entityType,
        entityId: entityId || 'new-item',
        altAr: imageAltAr,
        previousFileId: imageFileId,
        adminKey,
      },
      (pct) => {
        setUploadProgress(pct);
      }
    );

    setIsUploading(false);

    if (response.success && response.imageUrl) {
      setLocalPreviewUrl(null);
      URL.revokeObjectURL(objectUrl);

      const newFileId = response.fileId || '';
      onImageChange({
        imageUrl: response.imageUrl,
        imageFileId: newFileId,
        imageAltAr,
      });

      const syncDetail = response.sheetSync?.synced
        ? 'وتم تحديث Google Sheets عبر SheetDB تلقائياً'
        : 'وتم حفظ الرابط في قاعدة بيانات الموقع';
      const driveDetail = response.driveUploaded
        ? `وتم الحفظ في Google Drive (معرف الملف: ${newFileId})`
        : '';

      setStatusMsg(`تم رفع الصورة بنجاح ${driveDetail} ${syncDetail}.`);
    } else {
      setLocalPreviewUrl(null);
      URL.revokeObjectURL(objectUrl);
      setErrorMsg(response.error || 'تعذر رفع الصورة، يرجى المحاولة مرة أخرى.');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleManualUrlChange = (rawInput: string) => {
    setErrorMsg(null);
    setStatusMsg(null);
    setImgLoadError(false);

    const extractedDriveId = extractGoogleDriveFileId(rawInput);
    const normalizedUrl = extractedDriveId
      ? resolvePublicImageUrl(rawInput, extractedDriveId)
      : rawInput;

    onImageChange({
      imageUrl: normalizedUrl,
      imageFileId: extractedDriveId || imageFileId,
      imageAltAr,
    });

    if (extractedDriveId && rawInput.includes('drive.google.com/file/d/')) {
      setStatusMsg(
        `تم تحويل رابط مشاركة Google Drive تلقائياً إلى رابط عرض مباشر (File ID: ${extractedDriveId}).`
      );
    }
  };

  const handleConfirmRemove = async () => {
    setIsRemoving(true);
    setErrorMsg(null);
    setStatusMsg(null);

    if (entityId && !entityId.startsWith('new-')) {
      await removeImageOnServer({
        entityType,
        entityId,
        fileId: imageFileId,
        adminKey,
      });
    }

    setLocalPreviewUrl(null);
    setImgLoadError(false);
    onImageChange({
      imageUrl: '',
      imageFileId: '',
      imageAltAr,
    });
    setIsRemoving(false);
    setShowRemoveConfirm(false);
    setStatusMsg('تم حذف الصورة وإزالة مرجعها بنجاح دون المساس ببقية بيانات السجل.');
  };

  return (
    <div className="p-4 bg-[#F5F8FC] border border-[#CBD5E1] rounded-2xl space-y-3 text-right">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <span className="text-xs font-bold text-[#142B4F] flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-[#2563EB]" />
          <span>{labelAr}</span>
        </span>
        {imageFileId && (
          <span
            className="text-[10px] font-mono bg-white border border-[#CBD5E1] text-slate-600 px-2 py-0.5 rounded-md inline-flex items-center gap-1"
            dir="ltr"
          >
            <HardDrive className="w-3 h-3 text-[#2563EB]" />
            <span>ID: {imageFileId}</span>
          </span>
        )}
      </div>

      <p className="text-[11px] text-slate-500 leading-relaxed">{helperTextAr}</p>

      {/* Main Preview & Upload Controls Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Image Preview Box */}
        <div className="w-24 h-24 rounded-2xl bg-white border-2 border-[#CBD5E1] flex items-center justify-center overflow-hidden shrink-0 shadow-2xs relative">
          {effectiveDisplayUrl && !imgLoadError ? (
            <img
              src={effectiveDisplayUrl}
              alt={imageAltAr || labelAr}
              onError={() => setImgLoadError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
              <ImageIcon className="w-7 h-7 text-slate-300 mb-1" />
              <span className="text-[9px] font-bold">
                {imgLoadError ? 'تعذر تحميل الصورة' : 'لا توجد صورة'}
              </span>
            </div>
          )}

          {isUploading && (
            <div className="absolute inset-0 bg-[#0A192F]/75 flex flex-col items-center justify-center text-white p-1">
              <Loader2 className="w-5 h-5 text-[#00D2FF] animate-spin mb-1" />
              <span className="text-[10px] font-mono font-bold">{uploadProgress}%</span>
            </div>
          )}
        </div>

        {/* Upload Buttons & Direct URL Input */}
        <div className="flex-1 w-full space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Hidden file input supporting JPG, PNG, WebP on desktop & mobile */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="hidden"
              data-testid={`file-input-${entityType}-${entityId}`}
            />

            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري الرفع ({uploadProgress}%)...</span>
                </>
              ) : hasExistingImage ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>استبدال الصورة (JPG / PNG / WebP)</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>رفع صورة من الجهاز</span>
                </>
              )}
            </button>

            {hasExistingImage && !isUploading && !showRemoveConfirm && (
              <button
                type="button"
                onClick={() => setShowRemoveConfirm(true)}
                className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>إزالة الصورة</span>
              </button>
            )}
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-l from-[#2563EB] to-[#00D2FF] h-full transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          {/* Direct URL or Google Drive Link Field */}
          <div className="relative">
            <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => handleManualUrlChange(e.target.value)}
              placeholder="أو الصق رابط صورة مباشر أو رابط مشاركة Google Drive..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#CBD5E1] bg-white focus:outline-none focus:border-[#2563EB] font-mono"
              dir="ltr"
            />
          </div>

          {/* Alt Text (Arabic) Input when enabled */}
          {showAltInput && (
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                النص البديل للصورة بالعربية (image_alt_ar — لدعم الوصول):
              </label>
              <input
                type="text"
                value={imageAltAr}
                onChange={(e) =>
                  onImageChange({
                    imageUrl,
                    imageFileId,
                    imageAltAr: e.target.value,
                  })
                }
                placeholder="وصف مختصر للصورة باللغة العربية..."
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#CBD5E1] bg-white focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          )}
        </div>
      </div>

      {/* In-UI Confirmation Prompt for Removing Image */}
      {showRemoveConfirm && (
        <div
          role="alertdialog"
          aria-label="تأكيد إزالة الصورة"
          className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in"
        >
          <div className="text-xs text-red-900 font-semibold">
            هل أنت متأكد من إزالة هذه الصورة؟ سيتم مسح رابط الصورة فقط مع الاحتفاظ بجميع بيانات السجل الأخرى.
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowRemoveConfirm(false)}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold rounded-lg cursor-pointer"
            >
              تراجع
            </button>
            <button
              type="button"
              disabled={isRemoving}
              onClick={handleConfirmRemove}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1"
            >
              {isRemoving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>تأكيد إزالة الصورة</span>
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Success / Status Message */}
      {statusMsg && !errorMsg && (
        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}
    </div>
  );
};
