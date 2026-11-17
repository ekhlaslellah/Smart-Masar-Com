/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;

export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const;

export const DEFAULT_MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface FileValidationInput {
  name: string;
  type: string;
  size: number;
}

export interface FileValidationResult {
  valid: boolean;
  errorAr?: string;
}

/**
 * Validates image format (JPG, PNG, WebP) and file size before upload.
 */
export function validateImageFile(
  file: FileValidationInput,
  maxSizeBytes: number = DEFAULT_MAX_IMAGE_SIZE_BYTES
): FileValidationResult {
  if (!file || !file.name) {
    return {
      valid: false,
      errorAr: 'يرجى اختيار ملف صورة صالح للرفع.',
    };
  }

  const lowerName = file.name.toLowerCase().trim();
  const hasValidExt = ALLOWED_IMAGE_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  const normalizedType = (file.type || '').toLowerCase().trim();
  const hasValidMime = ALLOWED_IMAGE_MIME_TYPES.includes(normalizedType as any);

  if (!hasValidMime && !hasValidExt) {
    return {
      valid: false,
      errorAr: 'صيغة الملف غير مدعومة. يرجى اختيار صورة بصيغة JPG أو PNG أو WebP فقط.',
    };
  }

  if (file.size <= 0) {
    return {
      valid: false,
      errorAr: 'ملف الصورة فارغ أو تالف.',
    };
  }

  if (file.size > maxSizeBytes) {
    const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, '');
    return {
      valid: false,
      errorAr: `حجم الصورة يتجاوز الحد المسموح به (${maxMb} ميغابايت). يرجى اختيار صورة أصغر حجماً.`,
    };
  }

  return { valid: true };
}

/**
 * Extracts a Google Drive File ID from common Google Drive sharing, view, open,
 * uc, thumbnail, or lh3.googleusercontent URLs.
 * Never assumes a sharing-page URL (/file/d/.../view) is a direct image URL.
 */
export function extractGoogleDriveFileId(urlOrId?: string | null): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();
  if (!trimmed) return null;

  // Do not match local paths or data URLs
  if (trimmed.startsWith('/') || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return null;
  }

  // Pattern 1: https://drive.google.com/file/d/{FILE_ID}/view...
  const fileDMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]{10,})/i);
  if (fileDMatch && fileDMatch[1]) {
    return fileDMatch[1];
  }

  // Pattern 2: https://lh3.googleusercontent.com/d/{FILE_ID}...
  const lh3Match = trimmed.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]{10,})/i);
  if (lh3Match && lh3Match[1]) {
    return lh3Match[1];
  }

  // Pattern 3: ?id={FILE_ID} or &id={FILE_ID} on drive.google.com or docs.google.com
  if (/drive\.google\.com|docs\.google\.com/i.test(trimmed)) {
    const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{10,})/i);
    if (idParamMatch && idParamMatch[1]) {
      return idParamMatch[1];
    }
  }

  // Pattern 4: /api/images/drive/{FILE_ID}
  const proxyMatch = trimmed.match(/\/api\/images\/drive\/([a-zA-Z0-9_-]{10,})/i);
  if (proxyMatch && proxyMatch[1]) {
    return proxyMatch[1];
  }

  return null;
}

/**
 * Converts a stored image URL or Google Drive File ID into a direct renderable URL.
 * - Converts Google Drive sharing links (/file/d/ID/view) to `/api/images/drive/ID`
 *   (or `https://lh3.googleusercontent.com/d/ID` when useServerProxy is false)
 *   so images render reliably in unauthenticated browser sessions without 3P cookie blocks.
 */
export function resolvePublicImageUrl(
  imageUrl?: string | null,
  imageFileId?: string | null,
  options: { useServerProxy?: boolean } = { useServerProxy: true }
): string {
  const rawUrl = (imageUrl || '').trim();
  const rawFileId = (imageFileId || '').trim();

  // If rawUrl is a local upload path, static asset, or data URL, return directly
  if (
    rawUrl.startsWith('/uploads/') ||
    rawUrl.startsWith('/assets/') ||
    rawUrl.startsWith('data:image/') ||
    rawUrl.startsWith('blob:')
  ) {
    return rawUrl;
  }

  // Check if rawUrl is a Google Drive URL
  const extractedDriveId = extractGoogleDriveFileId(rawUrl);
  const driveId = extractedDriveId || (rawFileId && !rawFileId.startsWith('local-') ? rawFileId : null);

  if (driveId) {
    if (options.useServerProxy !== false) {
      return `/api/images/drive/${encodeURIComponent(driveId)}`;
    }
    return `https://lh3.googleusercontent.com/d/${encodeURIComponent(driveId)}`;
  }

  return rawUrl;
}

/**
 * Generates direct Google Drive image URL variants for storage and fallback.
 */
export function buildGoogleDriveDirectUrls(fileId: string): {
  proxyUrl: string;
  lh3Url: string;
  thumbnailUrl: string;
  viewUrl: string;
} {
  const cleanId = fileId.trim();
  return {
    proxyUrl: `/api/images/drive/${encodeURIComponent(cleanId)}`,
    lh3Url: `https://lh3.googleusercontent.com/d/${encodeURIComponent(cleanId)}`,
    thumbnailUrl: `https://drive.google.com/thumbnail?id=${encodeURIComponent(cleanId)}&sz=w1600`,
    viewUrl: `https://drive.google.com/file/d/${encodeURIComponent(cleanId)}/view`,
  };
}

export const IMAGE_COLUMN_NAMES = [
  'image_url',
  'avatarUrl',
  'image_file_id',
  'hero_image_url',
  'hero_image_file_id',
  'logo_url',
  'logo_file_id',
] as const;

/**
 * Strips empty image fields from a SheetDB PATCH payload when `allowClearImages` is false
 * so that editing text fields on a record never overwrites existing image links in Google Sheets with `""`.
 * When `allowClearImages` is true (explicit image deletion action), empty strings are kept to clear the columns.
 */
export function sanitizeRecordForSheetPatch(
  recordData: Record<string, any>,
  options?: { allowClearImages?: boolean }
): Record<string, any> {
  if (options?.allowClearImages) {
    return { ...recordData };
  }

  const sanitized: Record<string, any> = {};
  for (const [key, val] of Object.entries(recordData)) {
    if ((IMAGE_COLUMN_NAMES as readonly string[]).includes(key)) {
      if (typeof val === 'string' && val.trim().length > 0) {
        sanitized[key] = val.trim();
      }
      continue;
    }
    // In SiteSettings, if Key === 'logo_url' and Value is empty, do not overwrite Value with '' unless allowClearImages
    if (
      key === 'Value' &&
      recordData.Key === 'logo_url' &&
      (val === '' || val === null || val === undefined)
    ) {
      continue;
    }
    sanitized[key] = val;
  }

  return sanitized;
}

/**
 * Preserves existing non-empty image fields on a record when merging incoming updates,
 * unless `allowClearImages` is explicitly true or a new non-empty image value is provided.
 */
export function preserveExistingImageFields<T extends Record<string, any>>(
  incoming: T,
  existing?: T | null,
  options?: { allowClearImages?: boolean }
): T {
  if (!existing || options?.allowClearImages) {
    return { ...incoming };
  }

  const merged: Record<string, any> = { ...incoming };
  for (const col of IMAGE_COLUMN_NAMES) {
    if (col in existing || col in incoming) {
      const incomingVal = typeof incoming[col] === 'string' ? incoming[col].trim() : '';
      const existingVal = typeof existing[col] === 'string' ? existing[col].trim() : '';
      if (!incomingVal && existingVal) {
        merged[col] = existingVal;
      }
    }
  }

  return merged as T;
}

