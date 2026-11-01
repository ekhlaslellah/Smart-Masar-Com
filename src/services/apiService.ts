/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CompanyProfile,
  Department,
  Employee,
  JobVacancy,
  PageMetadata,
  ServiceItem,
} from '../types';

export interface BackendConfig {
  webAppUrl: string;
  adminApiKey: string;
  sheetDbUrl?: string;
  driveFolderId?: string;
  isConfigured: boolean;
  lastSyncTime?: string;
}

export const DEFAULT_SHEETDB_ENDPOINT = 'https://sheetdb.io/api/v1/gnn52l70oflrp';

// In-memory runtime state only (zero localStorage / browser storage usage)
let runtimeBackendConfig: BackendConfig = {
  webAppUrl: '',
  adminApiKey: '',
  sheetDbUrl: DEFAULT_SHEETDB_ENDPOINT,
  driveFolderId: '',
  isConfigured: true,
};

export function getSavedBackendConfig(): BackendConfig {
  return { ...runtimeBackendConfig };
}

export function saveBackendConfig(config: BackendConfig): void {
  runtimeBackendConfig = {
    webAppUrl: config.webAppUrl || '',
    adminApiKey: config.adminApiKey || runtimeBackendConfig.adminApiKey || '',
    sheetDbUrl: config.sheetDbUrl || DEFAULT_SHEETDB_ENDPOINT,
    driveFolderId: config.driveFolderId || '',
    isConfigured: Boolean(config.isConfigured),
    lastSyncTime: config.lastSyncTime || runtimeBackendConfig.lastSyncTime,
  };
}

function parseClientJsonStringArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === 'string' && val.trim()) {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return val
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function resolveClientStaticImageUrl(imageUrl?: string | null, imageFileId?: string | null): string {
  const rawUrl = (imageUrl || '').trim();
  const rawFileId = (imageFileId || '').trim();
  if (!rawUrl && !rawFileId) return '';
  if (
    rawUrl.startsWith('/assets/') ||
    rawUrl.startsWith('data:image/') ||
    rawUrl.startsWith('blob:')
  ) {
    return rawUrl;
  }
  const fileDMatch = rawUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]{10,})/i);
  const lh3Match = rawUrl.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]{10,})/i);
  const proxyMatch = rawUrl.match(/\/api\/images\/drive\/([a-zA-Z0-9_-]{10,})/i);
  const driveId =
    (fileDMatch && fileDMatch[1]) ||
    (lh3Match && lh3Match[1]) ||
    (proxyMatch && proxyMatch[1]) ||
    (rawFileId && !rawFileId.startsWith('local-') ? rawFileId : null);

  if (driveId) {
    return `https://lh3.googleusercontent.com/d/${encodeURIComponent(driveId)}`;
  }
  return rawUrl;
}

/**
 * Directly queries public read-only worksheets from SheetDB when hosted on static HTML/CSS/JS hosting
 * without a Node.js backend. Never sends or exposes any admin keys or write credentials.
 */
export async function fetchDirectSheetDbPublicData(
  sheetDbUrl: string = DEFAULT_SHEETDB_ENDPOINT
): Promise<{
  success: boolean;
  data?: {
    profile?: Partial<CompanyProfile>;
    departments?: Department[];
    employees?: Employee[];
    jobs?: JobVacancy[];
    services?: ServiceItem[];
    pages?: PageMetadata[];
  };
  availableSheets?: string[];
}> {
  try {
    const cleanUrl = sheetDbUrl.replace(/\/+$/, '');
    const sheetsRes = await fetch(`${cleanUrl}/sheets`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!sheetsRes.ok) return { success: false };
    const sheetsJson: any = await sheetsRes.json().catch(() => ({}));
    const availableSheets: string[] = Array.isArray(sheetsJson?.sheets)
      ? sheetsJson.sheets
      : [];

    const data: {
      profile?: Partial<CompanyProfile>;
      departments?: Department[];
      employees?: Employee[];
      jobs?: JobVacancy[];
      services?: ServiceItem[];
      pages?: PageMetadata[];
    } = {};
    let hydratedAny = false;

    if (availableSheets.includes('SiteSettings')) {
      const res = await fetch(`${cleanUrl}?sheet=SiteSettings`);
      if (res.ok) {
        const rows: any[] = await res.json().catch(() => []);
        if (Array.isArray(rows) && rows.length > 0) {
          const settingsObj: Record<string, any> = {};
          for (const r of rows) {
            if (r.Key) settingsObj[r.Key] = r.Value;
          }
          if (Object.keys(settingsObj).length > 0) {
            data.profile = settingsObj;
            hydratedAny = true;
          }
        }
      }
    }

    if (availableSheets.includes('Departments')) {
      const res = await fetch(`${cleanUrl}?sheet=Departments`);
      if (res.ok) {
        const rows: any[] = await res.json().catch(() => []);
        if (Array.isArray(rows) && rows.length > 0) {
          data.departments = rows as Department[];
          hydratedAny = true;
        }
      }
    }

    if (availableSheets.includes('Team')) {
      const res = await fetch(`${cleanUrl}?sheet=Team`);
      if (res.ok) {
        const rows: any[] = await res.json().catch(() => []);
        if (Array.isArray(rows) && rows.length > 0) {
          data.employees = rows.map((emp: any) => {
            const img = resolveClientStaticImageUrl(
              emp.image_url || emp.avatarUrl,
              emp.image_file_id
            );
            return {
              ...emp,
              isConfirmedPosition:
                emp.isConfirmedPosition === true ||
                String(emp.isConfirmedPosition).toLowerCase() === 'true',
              order: Number(emp.order) || 1,
              avatarUrl: img,
              image_url: img,
            };
          });
          hydratedAny = true;
        }
      }
    }

    if (availableSheets.includes('Services')) {
      const res = await fetch(`${cleanUrl}?sheet=Services`);
      if (res.ok) {
        const rows: any[] = await res.json().catch(() => []);
        if (Array.isArray(rows) && rows.length > 0) {
          data.services = rows.map((srv: any) => ({
            ...srv,
            featuresAr: parseClientJsonStringArray(srv.featuresAr),
            image_url: resolveClientStaticImageUrl(srv.image_url, srv.image_file_id),
          }));
          hydratedAny = true;
        }
      }
    }

    if (availableSheets.includes('Pages')) {
      const res = await fetch(`${cleanUrl}?sheet=Pages`);
      if (res.ok) {
        const rows: any[] = await res.json().catch(() => []);
        if (Array.isArray(rows) && rows.length > 0) {
          data.pages = rows.map((pg: any) => ({
            ...pg,
            hero_image_url: resolveClientStaticImageUrl(
              pg.hero_image_url,
              pg.hero_image_file_id
            ),
          }));
          hydratedAny = true;
        }
      }
    }

    if (availableSheets.includes('Jobs')) {
      const res = await fetch(`${cleanUrl}?sheet=Jobs`);
      if (res.ok) {
        const rows: any[] = await res.json().catch(() => []);
        if (Array.isArray(rows) && rows.length > 0) {
          data.jobs = rows.map((job: any) => ({
            ...job,
            responsibilitiesAr: parseClientJsonStringArray(job.responsibilitiesAr),
            qualificationsAr: parseClientJsonStringArray(job.qualificationsAr),
            accountingSkillsAr: parseClientJsonStringArray(job.accountingSkillsAr),
            softwareExperienceAr: parseClientJsonStringArray(job.softwareExperienceAr),
          }));
          hydratedAny = true;
        }
      }
    }

    return {
      success: hydratedAny,
      data: hydratedAny ? data : undefined,
      availableSheets,
    };
  } catch {
    return { success: false };
  }
}

/**
 * Fetches sanitized public data from the Express server (/api/public/data),
 * or falls back directly to read-only SheetDB API when hosted on external static HTML/CSS/JS hosting.
 */
export async function fetchServerPublicData(forceExternalRefresh = false): Promise<{
  success: boolean;
  isStaticHostFallback?: boolean;
  data?: {
    profile?: Partial<CompanyProfile>;
    departments?: Department[];
    employees?: Employee[];
    jobs?: JobVacancy[];
    services?: ServiceItem[];
    pages?: PageMetadata[];
  };
  meta?: {
    hasAppsScript: boolean;
    hasDriveFolder: boolean;
    sheetDbUrl?: string;
    lastSyncTime: string | null;
    externalSource?: string;
    availableSheets?: string[];
    missingRequiredSheets?: string[];
  };
}> {
  try {
    const query = forceExternalRefresh ? '?refresh=1' : '';
    const res = await fetch(`/api/public/data${query}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const json = await res.json();
      if (json.success && json.data) {
        if (json.meta?.sheetDbUrl) {
          runtimeBackendConfig.sheetDbUrl = json.meta.sheetDbUrl;
        }
        if (json.meta?.lastSyncTime) {
          runtimeBackendConfig.lastSyncTime = json.meta.lastSyncTime;
        }
        return { success: true, data: json.data, meta: json.meta };
      }
    }
  } catch {
    // Server endpoint not reachable (running on static HTML/CSS/JS hosting)
  }

  // Fallback for static hosting: query SheetDB directly in read-only mode
  const directRes = await fetchDirectSheetDbPublicData(
    runtimeBackendConfig.sheetDbUrl || DEFAULT_SHEETDB_ENDPOINT
  );
  if (directRes.success && directRes.data) {
    return {
      success: true,
      isStaticHostFallback: true,
      data: directRes.data,
      meta: {
        hasAppsScript: false,
        hasDriveFolder: false,
        sheetDbUrl: runtimeBackendConfig.sheetDbUrl || DEFAULT_SHEETDB_ENDPOINT,
        lastSyncTime: null,
        externalSource: 'sheetdb_static_client',
        availableSheets: directRes.availableSheets || [],
      },
    };
  }

  return { success: false, isStaticHostFallback: true };
}

/**
 * Establishes a server-verified HttpOnly admin session cookie.
 */
export async function establishAdminSession(adminKey?: string): Promise<{
  success: boolean;
  authenticated: boolean;
  error?: string;
}> {
  try {
    const res = await fetch('/api/admin/auth/session', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adminKey: adminKey || runtimeBackendConfig.adminApiKey || '',
      }),
    });
    const json = await res.json();
    if (json.config) {
      runtimeBackendConfig = {
        ...runtimeBackendConfig,
        webAppUrl: json.config.webAppUrl || runtimeBackendConfig.webAppUrl,
        sheetDbUrl: json.config.sheetDbUrl || runtimeBackendConfig.sheetDbUrl,
        driveFolderId: json.config.driveFolderId || runtimeBackendConfig.driveFolderId,
        lastSyncTime: json.config.lastSyncTime || runtimeBackendConfig.lastSyncTime,
      };
    }
    return {
      success: Boolean(json.success),
      authenticated: Boolean(json.authenticated),
      error: json.error,
    };
  } catch (e: any) {
    return {
      success: false,
      authenticated: false,
      error: e?.message || 'تعذر إنشاء جلسة المسؤول',
    };
  }
}

/**
 * Verifies the administrator key against the server.
 */
export async function verifyAdminKeyOnServer(adminKey: string): Promise<{
  success: boolean;
  authenticated: boolean;
  error?: string;
  config?: {
    webAppUrl: string;
    sheetDbUrl: string;
    driveFolderId: string;
    lastSyncTime?: string;
  };
}> {
  try {
    if (adminKey) {
      runtimeBackendConfig.adminApiKey = adminKey;
    }
    const res = await fetch('/api/admin/auth/verify', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminKey }),
    });
    const json = await res.json();
    if (json.config) {
      runtimeBackendConfig = {
        ...runtimeBackendConfig,
        webAppUrl: json.config.webAppUrl || '',
        sheetDbUrl: json.config.sheetDbUrl || DEFAULT_SHEETDB_ENDPOINT,
        driveFolderId: json.config.driveFolderId || '',
        lastSyncTime: json.config.lastSyncTime,
      };
    }
    return {
      success: Boolean(json.success),
      authenticated: Boolean(json.authenticated),
      error: json.error,
      config: json.config,
    };
  } catch (e: any) {
    return {
      success: false,
      authenticated: false,
      error: e?.message || 'تعذر الاتصال بخادم التحقق',
    };
  }
}

/**
 * Logs out the current administrator session and clears the server HttpOnly cookie.
 */
export async function logoutAdminSession(): Promise<void> {
  runtimeBackendConfig.adminApiKey = '';
  try {
    await fetch('/api/admin/auth/logout', {
      method: 'POST',
      credentials: 'same-origin',
    });
  } catch {
    // Ignore network error on logout
  }
}

/**
 * Queries SheetDB & Google Drive status via server-authenticated endpoint.
 */
export async function fetchSheetDbDiagnostics(adminKey: string): Promise<{
  success: boolean;
  reachable?: boolean;
  spreadsheetName?: string;
  sheets?: string[];
  requiredSheets?: string[];
  missingSheets?: string[];
  worksheetChecks?: Record<string, { exists: boolean; status: number; rowCount: number }>;
  keys?: string[];
  isEmptyHeader?: boolean;
  messageAr: string;
  sheetDbUrl?: string;
  webAppUrl?: string;
  driveFolderId?: string;
}> {
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    const keyToUse = adminKey || runtimeBackendConfig.adminApiKey;
    if (keyToUse) {
      headers['x-admin-key'] = keyToUse;
    }
    const res = await fetch('/api/admin/sheetdb-status', {
      method: 'GET',
      credentials: 'same-origin',
      headers,
    });
    const json = await res.json();
    if (!res.ok) {
      return {
        success: false,
        messageAr: json.error || `HTTP ${res.status}`,
      };
    }
    return json;
  } catch (e: any) {
    return {
      success: false,
      messageAr: `تعذر فحص حالة SheetDB: ${e?.message || String(e)}`,
    };
  }
}

/**
 * Saves Google Apps Script URL, Google Drive Folder ID, and SheetDB URL on the server.
 */
export async function saveServerCloudConfig(
  adminKey: string,
  config: {
    webAppUrl?: string;
    sheetDbUrl?: string;
    driveFolderId?: string;
    newAdminKey?: string;
  }
): Promise<{ success: boolean; message: string }> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const keyToUse = adminKey || runtimeBackendConfig.adminApiKey;
    if (keyToUse) {
      headers['x-admin-key'] = keyToUse;
    }
    const res = await fetch('/api/admin/config', {
      method: 'POST',
      credentials: 'same-origin',
      headers,
      body: JSON.stringify(config),
    });
    const json = await res.json();
    if (res.ok && json.success) {
      return { success: true, message: json.message || 'تم حفظ الإعدادات بنجاح' };
    }
    return { success: false, message: json.error || 'تعذر حفظ الإعدادات' };
  } catch (e: any) {
    return { success: false, message: e?.message || String(e) };
  }
}

export interface UploadImageRequest {
  file: File;
  entityType: 'team' | 'services' | 'pages' | 'settings';
  entityId: string;
  altAr?: string;
  previousFileId?: string;
  adminKey: string;
}

export interface UploadImageResponse {
  success: boolean;
  imageUrl?: string;
  fileId?: string;
  driveUploaded?: boolean;
  driveDirectUrl?: string | null;
  driveViewUrl?: string | null;
  driveNotice?: string | null;
  sheetSync?: { synced: boolean; detail: string };
  error?: string;
}

/**
 * Reads a File into base64 and uploads it to `/api/admin/upload-image` using XMLHttpRequest
 * so real upload progress (0% -> 100%) is reported accurately.
 */
export function uploadImageWithProgress(
  req: UploadImageRequest,
  onProgress?: (percent: number) => void
): Promise<UploadImageResponse> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onerror = () => {
      resolve({
        success: false,
        error: 'تعذر قراءة ملف الصورة من الجهاز.',
      });
    };

    reader.onload = () => {
      const base64Data = String(reader.result || '');
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/admin/upload-image', true);
      xhr.withCredentials = true;
      xhr.setRequestHeader('Content-Type', 'application/json');
      const keyToUse = req.adminKey || runtimeBackendConfig.adminApiKey;
      if (keyToUse) {
        xhr.setRequestHeader('x-admin-key', keyToUse);
      }

      if (xhr.upload && onProgress) {
        onProgress(10);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const pct = Math.min(95, Math.round((event.loaded / event.total) * 90) + 5);
            onProgress(pct);
          }
        };
      }

      xhr.onload = () => {
        if (onProgress) onProgress(100);
        try {
          const json = JSON.parse(xhr.responseText || '{}');
          if (xhr.status >= 200 && xhr.status < 300 && json.success) {
            resolve({
              success: true,
              imageUrl: json.imageUrl,
              fileId: json.fileId,
              driveUploaded: json.driveUploaded,
              driveDirectUrl: json.driveDirectUrl,
              driveViewUrl: json.driveViewUrl,
              driveNotice: json.driveNotice,
              sheetSync: json.sheetSync,
            });
          } else {
            resolve({
              success: false,
              error: json.error || `فشل الرفع (HTTP ${xhr.status})`,
            });
          }
        } catch {
          resolve({
            success: false,
            error: `استجابة غير صالحة من الخادم (HTTP ${xhr.status})`,
          });
        }
      };

      xhr.onerror = () => {
        resolve({
          success: false,
          error: 'انقطع الاتصال بالخادم أثناء رفع الصورة.',
        });
      };

      xhr.send(
        JSON.stringify({
          fileName: req.file.name,
          mimeType: req.file.type || 'image/png',
          base64Data,
          entityType: req.entityType,
          entityId: req.entityId,
          altAr: req.altAr || '',
          previousFileId: req.previousFileId || '',
        })
      );
    };

    reader.readAsDataURL(req.file);
  });
}

/**
 * Removes an image reference on the server and SheetDB without deleting unrelated record data.
 */
export async function removeImageOnServer(params: {
  entityType: 'team' | 'services' | 'pages' | 'settings';
  entityId: string;
  fileId?: string;
  adminKey: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const keyToUse = params.adminKey || runtimeBackendConfig.adminApiKey;
    if (keyToUse) {
      headers['x-admin-key'] = keyToUse;
    }
    const res = await fetch('/api/admin/remove-image', {
      method: 'POST',
      credentials: 'same-origin',
      headers,
      body: JSON.stringify({
        entityType: params.entityType,
        entityId: params.entityId,
        fileId: params.fileId || '',
      }),
    });
    const json = await res.json();
    if (res.ok && json.success) {
      return { success: true, message: json.message };
    }
    return { success: false, error: json.error || `HTTP ${res.status}` };
  } catch (e: any) {
    return { success: false, error: e?.message || String(e) };
  }
}

/**
 * Syncs full application state to the Express server database and external SheetDB / Apps Script.
 */
export async function syncStateToServer(
  adminKey: string,
  bundle: {
    profile: CompanyProfile;
    departments: Department[];
    employees: Employee[];
    jobs: JobVacancy[];
    services: ServiceItem[];
    pages: PageMetadata[];
  }
): Promise<{
  success: boolean;
  message?: string;
  externalSync?: { synced: boolean; detail: string };
}> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const keyToUse = adminKey || runtimeBackendConfig.adminApiKey;
    if (keyToUse) {
      headers['x-admin-key'] = keyToUse;
    }
    const res = await fetch('/api/admin/sync-state', {
      method: 'POST',
      credentials: 'same-origin',
      headers,
      body: JSON.stringify(bundle),
    });
    const json = await res.json();
    return {
      success: Boolean(res.ok && json.success),
      message: json.message || json.error,
      externalSync: json.externalSync,
    };
  } catch (e: any) {
    return { success: false, message: e?.message || String(e) };
  }
}

/**
 * Pings Google Apps Script Web App endpoint.
 */
export async function testBackendConnection(
  url: string
): Promise<{ success: boolean; message: string }> {
  if (!url || !url.startsWith('https://script.google.com/')) {
    return {
      success: false,
      message:
        'الرابط غير صالح. يجب أن يبدأ بـ https://script.google.com/macros/s/.../exec',
    };
  }

  try {
    const target = `${url}${url.includes('?') ? '&' : '?'}action=ping`;
    const res = await fetch(target, { method: 'GET', mode: 'cors' });
    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}`);
    }
    const data = await res.json();
    if (data.success && data.status === 'healthy') {
      return {
        success: true,
        message: 'الاتصال ناجح مع Google Apps Script Backend',
      };
    }
    return {
      success: false,
      message: data.error || 'استجابة غير متوقعة من الخادم',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `تعذر الاتصال بالخادم: ${err.message || err}`,
    };
  }
}

/**
 * Fetches public data from Google Sheets backend.
 */
export async function fetchRemotePublicData(url: string): Promise<{
  success: boolean;
  data?: {
    profile: CompanyProfile;
    departments: Department[];
    employees: Employee[];
    jobs: JobVacancy[];
    services?: ServiceItem[];
    pages?: PageMetadata[];
  };
  error?: string;
}> {
  try {
    const target = `${url}${url.includes('?') ? '&' : '?'}action=getPublicData`;
    const res = await fetch(target, { method: 'GET', mode: 'cors' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.success && json.data) {
      return { success: true, data: json.data };
    }
    return {
      success: false,
      error: json.error || 'Failed to parse sheet data',
    };
  } catch (e: any) {
    return { success: false, error: e.message || String(e) };
  }
}

/**
 * Pushes all application data to Google Sheets via secure doPost.
 */
export async function syncAllToRemote(
  url: string,
  apiKey: string,
  bundle: {
    profile: CompanyProfile;
    departments: Department[];
    employees: Employee[];
    jobs: JobVacancy[];
    services?: ServiceItem[];
    pages?: PageMetadata[];
  }
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'syncAllData',
        apiKey,
        data: bundle,
      }),
    });

    const json = await res.json();
    if (json.success) {
      return {
        success: true,
        message: 'تمت مزامنة كافة الجداول والصور بنجاح مع Google Sheets',
      };
    }
    return { success: false, message: json.error || 'فشلت المزامنة' };
  } catch (e: any) {
    return {
      success: false,
      message: `خطأ أثناء المزامنة: ${e.message || e}`,
    };
  }
}
