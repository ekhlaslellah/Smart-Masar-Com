/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import {
  INITIAL_COMPANY_PROFILE,
  INITIAL_DEPARTMENTS,
  INITIAL_EMPLOYEES,
  INITIAL_JOBS,
  INITIAL_PAGES,
  INITIAL_SERVICES,
} from './src/data/initialData';
import {
  CompanyProfile,
  Department,
  Employee,
  JobVacancy,
  PageMetadata,
  ServiceItem,
} from './src/types';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  DEFAULT_MAX_IMAGE_SIZE_BYTES,
  extractGoogleDriveFileId,
  resolvePublicImageUrl,
  sanitizeRecordForSheetPatch,
  preserveExistingImageFields,
} from './src/utils/imageUrl';
import {
  getConfiguredAdminKey,
  verifyAdminKeyConstantTime,
  createStatelessAdminSessionToken,
  isRequestAdminAuthenticated,
  buildAdminSessionSetCookie,
  buildAdminLogoutSetCookie,
} from './src/utils/adminAuth';
import {
  normalizeEmployeeVisibility,
  parseEmployeeBoolean,
} from './src/utils/orgChart';

dotenv.config();

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const __dirname =
  path.basename(MODULE_DIR) === 'api'
    ? path.resolve(MODULE_DIR, '..')
    : MODULE_DIR;

const PORT = Number(process.env.PORT) || 3000;
const LEGACY_SHEETDB_URL = 'https://sheetdb.io/api/v1/gnn52l70oflrp';
const DEFAULT_SHEETDB_URL =
  process.env.SHEETDB_API_URL || 'https://sheetdb.io/api/v1/9537p5ct7m308';
export const DEFAULT_SPREADSHEET_ID =
  process.env.GOOGLE_SPREADSHEET_ID ||
  '1-7tcV3S0YMuee7mpFvqtUj9SCsC1acb-_qrw5uqa1yE';

export const REQUIRED_WORKSHEETS = [
  'Team',
  'Services',
  'Pages',
  'SiteSettings',
  'Departments',
  'Jobs',
] as const;

export type WorksheetName = (typeof REQUIRED_WORKSHEETS)[number];

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
const PROJECT_ZIP_PATH = path.join(
  __dirname,
  'public',
  'smart-masar-complete-project.zip'
);
const STATIC_HOSTING_ZIP_PATH = path.join(
  __dirname,
  'public',
  'smart-masar-static-hosting.zip'
);

if (process.env.VERCEL_BUNDLE !== '1' && !process.env.VERCEL) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  } catch {
    // Ignore directory creation errors on read-only environments
  }
}

export interface ServerDatabase {
  profile: CompanyProfile;
  departments: Department[];
  employees: Employee[];
  jobs: JobVacancy[];
  services: ServiceItem[];
  pages: PageMetadata[];
  backendMeta: {
    webAppUrl: string;
    sheetDbUrl: string;
    spreadsheetId?: string;
    driveFolderId: string;
    servicesDriveFolderId?: string;
    lastSyncTime?: string;
    lastSheetDbStatus?: string;
    externalSource?: string;
    availableSheets?: string[];
    missingRequiredSheets?: string[];
  };
}

function resolveConfiguredSheetDbUrl(candidateUrl?: string): string {
  const trimmed = (candidateUrl || '').trim();
  if (!trimmed || trimmed === LEGACY_SHEETDB_URL) {
    return DEFAULT_SHEETDB_URL;
  }
  return trimmed;
}

function loadDatabase(): ServerDatabase {
  const candidateFiles = [
    DB_FILE,
    path.join(process.cwd(), 'data', 'db.json'),
  ];

  for (const filePath of candidateFiles) {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          profile: { ...INITIAL_COMPANY_PROFILE, ...(parsed.profile || {}) },
          departments: Array.isArray(parsed.departments)
            ? parsed.departments
            : INITIAL_DEPARTMENTS,
          employees: Array.isArray(parsed.employees)
            ? parsed.employees
            : INITIAL_EMPLOYEES,
          jobs: Array.isArray(parsed.jobs) ? parsed.jobs : INITIAL_JOBS,
          services: Array.isArray(parsed.services)
            ? parsed.services
            : INITIAL_SERVICES,
          pages: Array.isArray(parsed.pages) ? parsed.pages : INITIAL_PAGES,
          backendMeta: {
            webAppUrl:
              parsed.backendMeta?.webAppUrl ||
              process.env.GOOGLE_APPS_SCRIPT_URL ||
              '',
            sheetDbUrl: resolveConfiguredSheetDbUrl(
              parsed.backendMeta?.sheetDbUrl
            ),
            driveFolderId:
              parsed.backendMeta?.driveFolderId ||
              process.env.GOOGLE_DRIVE_FOLDER_ID ||
              '',
            lastSyncTime: parsed.backendMeta?.lastSyncTime,
            lastSheetDbStatus: parsed.backendMeta?.lastSheetDbStatus,
            externalSource: parsed.backendMeta?.externalSource,
            availableSheets: parsed.backendMeta?.availableSheets,
            missingRequiredSheets: parsed.backendMeta?.missingRequiredSheets,
          },
        };
      }
    } catch (err) {
      console.warn('Failed to load server db.json, trying fallback:', err);
    }
  }

  const initial: ServerDatabase = {
    profile: INITIAL_COMPANY_PROFILE,
    departments: INITIAL_DEPARTMENTS,
    employees: INITIAL_EMPLOYEES,
    jobs: INITIAL_JOBS,
    services: INITIAL_SERVICES,
    pages: INITIAL_PAGES,
    backendMeta: {
      webAppUrl: process.env.GOOGLE_APPS_SCRIPT_URL || '',
      sheetDbUrl: DEFAULT_SHEETDB_URL,
      driveFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID || '',
    },
  };
  saveDatabase(initial);
  return initial;
}

function saveDatabase(dbToSave: ServerDatabase): void {
  // On Vercel Serverless, project files are read-only and ephemeral (/tmp is not used).
  // All persistent changes are stored externally in Google Sheets (via SheetDB / Apps Script) and Google Drive.
  if (process.env.VERCEL_BUNDLE === '1' || process.env.VERCEL) {
    return;
  }
  try {
    const cleanBackendMeta = { ...dbToSave.backendMeta } as Record<string, unknown>;
    delete cleanBackendMeta.adminKey;
    const sanitized: ServerDatabase = {
      ...dbToSave,
      backendMeta: cleanBackendMeta as ServerDatabase['backendMeta'],
    };
    if (fs.existsSync(DATA_DIR)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(sanitized, null, 2), 'utf-8');
    }
  } catch {
    // Ignore local disk write error on read-only environments
  }
}

let db = loadDatabase();
let lastExternalHydrationMs = 0;
const EXTERNAL_HYDRATION_TTL_MS = 20_000;

/**
 * Verifies magic bytes of uploaded image buffer to ensure genuine JPG, PNG, or WebP.
 */
function verifyImageMagicBytes(buf: Buffer): { valid: boolean; detectedMime?: string } {
  if (!buf || buf.length < 12) return { valid: false };

  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { valid: true, detectedMime: 'image/jpeg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return { valid: true, detectedMime: 'image/png' };
  }

  // WebP: RIFF .... WEBP
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return { valid: true, detectedMime: 'image/webp' };
  }

  return { valid: false };
}

/**
 * Server-verified Admin Authorization Middleware.
 * Relies exclusively on `process.env.SMART_MASAR_ADMIN_KEY` and stateless HMAC session cookies.
 * Protects all write operations, Google Drive uploads, and SheetDB updates.
 */
function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authCheck = isRequestAdminAuthenticated({
    cookie: req.headers.cookie,
    'x-admin-key': req.headers['x-admin-key'],
    authorization: req.headers.authorization,
  });

  if (!authCheck.configured) {
    res.status(503).json({
      success: false,
      error:
        'غير مهيأ: يرجى ضبط متغير البيئة SMART_MASAR_ADMIN_KEY على الخادم لتفعيل مصادقة الإدارة.',
    });
    return;
  }

  if (!authCheck.authenticated) {
    res.status(401).json({
      success: false,
      error:
        'غير مصرح: يتطلب هذا الإجراء مصادقة المسؤول على الخادم (Server-Verified Admin Authorization).',
    });
    return;
  }
  next();
}

function parseJsonStringArray(val: unknown): string[] {
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

export interface WorksheetDiagnostic {
  exists: boolean;
  readOk: boolean;
  headersOk: boolean;
  status: number;
  rowCount: number;
  headers: string[];
}

/**
 * Safely tests SheetDB API connectivity across all 6 required worksheet tabs
 * (Team, Services, Pages, SiteSettings, Departments, Jobs), verifying both
 * read access and non-destructive write permission without mutating data or exposing credentials.
 */
async function checkSheetDbStatus(sheetDbUrl: string): Promise<{
  reachable: boolean;
  spreadsheetName?: string;
  spreadsheetId?: string;
  sheets?: string[];
  requiredSheets?: string[];
  missingSheets?: string[];
  worksheetChecks?: Record<string, WorksheetDiagnostic>;
  readAccess?: { ok: boolean; verifiedTabs: number; totalRows: number; detailAr: string };
  writeAccess?: { ok: boolean; status: number; method: string; detailAr: string };
  keys?: string[];
  isEmptyHeader?: boolean;
  messageAr: string;
}> {
  try {
    const cleanUrl = resolveConfiguredSheetDbUrl(sheetDbUrl).replace(/\/+$/, '');
    const [nameRes, sheetsRes, keysRes] = await Promise.all([
      fetch(`${cleanUrl}/name`),
      fetch(`${cleanUrl}/sheets`),
      fetch(`${cleanUrl}/keys`),
    ]);

    if (!sheetsRes.ok) {
      return {
        reachable: false,
        messageAr: `تعذر الوصول إلى نقطة نهاية SheetDB (HTTP ${sheetsRes.status}). تحقق من صحة الرابط وصلاحيات الوصول.`,
      };
    }

    const nameJson: any = nameRes.ok ? await nameRes.json().catch(() => ({})) : {};
    const sheetsJson: any = await sheetsRes.json().catch(() => ({}));
    const keysJson: any = await keysRes.json().catch(() => ({}));

    const spreadsheetName = nameJson?.name || 'Google Sheet';
    const sheets: string[] = Array.isArray(sheetsJson?.sheets) ? sheetsJson.sheets : [];
    const keys: string[] = Array.isArray(keysJson) ? keysJson : [];

    const missingSheets: string[] = [];
    const tabsWithoutHeaders: string[] = [];
    const worksheetChecks: Record<string, WorksheetDiagnostic> = {};
    let verifiedReadTabs = 0;
    let totalRowsAcrossTabs = 0;

    for (const reqSheet of REQUIRED_WORKSHEETS) {
      const existsInList = sheets.includes(reqSheet);
      if (!existsInList) {
        missingSheets.push(reqSheet);
        worksheetChecks[reqSheet] = {
          exists: false,
          readOk: false,
          headersOk: false,
          status: 404,
          rowCount: 0,
          headers: [],
        };
      } else {
        try {
          const sheetParam = `?sheet=${encodeURIComponent(reqSheet)}`;
          const [tabRes, tabKeysRes] = await Promise.all([
            fetch(`${cleanUrl}${sheetParam}`),
            fetch(`${cleanUrl}/keys${sheetParam}`),
          ]);

          const tabRows: any = tabRes.ok
            ? await tabRes.json().catch(() => [])
            : [];
          const tabKeysJson: any = await tabKeysRes.json().catch(() => []);
          const tabHeaders: string[] = Array.isArray(tabKeysJson)
            ? tabKeysJson.map(String)
            : [];
          const headersOk = tabKeysRes.ok && tabHeaders.length > 0 && !tabKeysJson?.error;
          const readOk = tabRes.ok && Array.isArray(tabRows);
          const rowCount = Array.isArray(tabRows) ? tabRows.length : 0;

          worksheetChecks[reqSheet] = {
            exists: true,
            readOk,
            headersOk,
            status: tabRes.status,
            rowCount,
            headers: tabHeaders,
          };

          if (readOk) {
            verifiedReadTabs += 1;
            totalRowsAcrossTabs += rowCount;
          } else {
            missingSheets.push(reqSheet);
          }
          if (!headersOk) {
            tabsWithoutHeaders.push(reqSheet);
          }
        } catch {
          worksheetChecks[reqSheet] = {
            exists: false,
            readOk: false,
            headersOk: false,
            status: 500,
            rowCount: 0,
            headers: [],
          };
          missingSheets.push(reqSheet);
        }
      }
    }

    // Safe non-destructive write permission probe:
    // Sends a PATCH for a guaranteed non-existent key (__smart_masar_connectivity_probe__) on SiteSettings.
    // SheetDB returns 200 {"updated":0} or 404 {"error":"No results found"} when PATCH write access is enabled,
    // without inserting, modifying, or deleting any row. If write access is disabled/blocked, it returns 401/403/405.
    let writeAccess = {
      ok: false,
      status: 0,
      method: 'PATCH (Non-Destructive Probe)',
      detailAr: 'لم يتم التحقق من صلاحية الكتابة بعد.',
    };

    if (sheets.includes('SiteSettings')) {
      try {
        const probeUrl = `${cleanUrl}/Key/__smart_masar_connectivity_probe__?sheet=SiteSettings`;
        const probeRes = await fetch(probeUrl, {
          method: 'PATCH',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data: { Value: 'probe' } }),
        });
        const probeJson: any = await probeRes.json().catch(() => ({}));
        const isNotFoundAfterWriteAuth =
          probeRes.status === 404 &&
          String(probeJson?.error || '')
            .toLowerCase()
            .includes('no results found');
        const writePermitted = probeRes.ok || isNotFoundAfterWriteAuth;

        writeAccess = {
          ok: writePermitted,
          status: probeRes.status,
          method: 'PATCH (Non-Destructive Probe)',
          detailAr: writePermitted
            ? 'صلاحية الكتابة والتحديث (POST / PATCH) مفعّلة ومتاحة دون أخطاء.'
            : `صلاحية الكتابة مقيدة أو مرفوضة من SheetDB (HTTP ${probeRes.status}: ${
                probeJson?.error || 'Write disabled'
              }).`,
        };
      } catch (probeErr: any) {
        writeAccess = {
          ok: false,
          status: 500,
          method: 'PATCH (Non-Destructive Probe)',
          detailAr: `تعذر اختبار صلاحية الكتابة: ${probeErr?.message || String(probeErr)}`,
        };
      }
    }

    const isEmptyHeader = tabsWithoutHeaders.length > 0;
    const readAccess = {
      ok: missingSheets.length === 0 && verifiedReadTabs === REQUIRED_WORKSHEETS.length,
      verifiedTabs: verifiedReadTabs,
      totalRows: totalRowsAcrossTabs,
      detailAr:
        verifiedReadTabs === REQUIRED_WORKSHEETS.length
          ? `صلاحية القراءة (GET) مفعّلة لجميع الأوراق الست (${verifiedReadTabs}/6) — إجمالي السجلات الحالية: ${totalRowsAcrossTabs} سجل.`
          : `تم التحقق من قراءة ${verifiedReadTabs} من أصل 6 أوراق مطلوبة.`,
    };

    db.backendMeta.availableSheets = sheets;
    db.backendMeta.missingRequiredSheets = missingSheets;

    if (missingSheets.length > 0 || isEmptyHeader) {
      return {
        reachable: true,
        spreadsheetName,
        sheets,
        requiredSheets: [...REQUIRED_WORKSHEETS],
        missingSheets,
        worksheetChecks,
        readAccess,
        writeAccess,
        keys,
        isEmptyHeader,
        messageAr: `متصل بـ SheetDB (ملف "${spreadsheetName}") — الأوراق المتوفرة: [${sheets.join(
          '، '
        )}]. الأوراق الناقصة أو غير المهيأة بالأعمدة: [${[
          ...new Set([...missingSheets, ...tabsWithoutHeaders]),
        ].join('، ')}]. يرجى التأكد من وجود الأوراق الست وعناوين الأعمدة في الصف الأول.`,
      };
    }

    const emptyDataNotice =
      totalRowsAcrossTabs === 0
        ? ' (ملاحظة: الأوراق الست مهيأة بعناوين الأعمدة الصحيحة ولكنها فارغة من السجلات حالياً — جاهزة لاستقبال البيانات المعتمدة).'
        : ` (إجمالي السجلات المحفوظة: ${totalRowsAcrossTabs} سجل).`;

    return {
      reachable: true,
      spreadsheetName,
      spreadsheetId: db.backendMeta.spreadsheetId || DEFAULT_SPREADSHEET_ID,
      sheets,
      requiredSheets: [...REQUIRED_WORKSHEETS],
      missingSheets: [],
      worksheetChecks,
      readAccess,
      writeAccess,
      keys,
      isEmptyHeader: false,
      messageAr: `متصل بنجاح بـ SheetDB (ملف "${spreadsheetName}" — Spreadsheet ID: ${
        db.backendMeta.spreadsheetId || DEFAULT_SPREADSHEET_ID
      }) — كافة الأوراق الست (${REQUIRED_WORKSHEETS.join(
        '، '
      )}) موجودة ومهيأة؛ القراءة: ${readAccess.ok ? 'متاحة (6/6)' : 'غير مكتملة'}، الكتابة: ${
        writeAccess.ok ? 'متاحة ومؤكدة' : 'غير مفعلة'
      }${emptyDataNotice}`,
    };
  } catch (err: any) {
    return {
      reachable: false,
      messageAr: `تعذر الاتصال بـ SheetDB: ${err?.message || String(err)}`,
    };
  }
}

/**
 * Hydrates server database (`db`) from the real external database (Google Apps Script or SheetDB)
 * whenever the external worksheets exist and contain records.
 * Never overwrites or seeds outdated demo records into an empty external database.
 */
async function hydrateFromExternalDatabase(force = false): Promise<void> {
  const now = Date.now();
  if (!force && now - lastExternalHydrationMs < EXTERNAL_HYDRATION_TTL_MS) {
    return;
  }
  lastExternalHydrationMs = now;

  // 1. Try Google Apps Script Web App (`?action=getPublicData`) if configured
  const webAppUrl = (db.backendMeta.webAppUrl || '').trim();
  if (webAppUrl && webAppUrl.startsWith('https://script.google.com/')) {
    try {
      const target = `${webAppUrl}${
        webAppUrl.includes('?') ? '&' : '?'
      }action=getPublicData`;
      const res = await fetch(target, { method: 'GET' });
      if (res.ok) {
        const json: any = await res.json().catch(() => ({}));
        if (json?.success && json?.data) {
          const d = json.data;
          if (d.profile && Object.keys(d.profile).length > 0) {
            db.profile = {
              ...db.profile,
              ...d.profile,
              logo_url: resolvePublicImageUrl(
                d.profile.logo_url,
                d.profile.logo_file_id
              ),
            };
          }
          if (Array.isArray(d.departments) && d.departments.length > 0) {
            db.departments = d.departments;
          }
          if (Array.isArray(d.employees) && d.employees.length > 0) {
            db.employees = d.employees.map((emp: any) => ({
              ...emp,
              isConfirmedPosition:
                emp.isConfirmedPosition === true ||
                String(emp.isConfirmedPosition).toLowerCase() === 'true',
              order: Number(emp.order) || 1,
              avatarUrl: resolvePublicImageUrl(
                emp.image_url || emp.avatarUrl,
                emp.image_file_id
              ),
              image_url: resolvePublicImageUrl(
                emp.image_url || emp.avatarUrl,
                emp.image_file_id
              ),
            }));
          }
          if (Array.isArray(d.services) && d.services.length > 0) {
            db.services = d.services.map((srv: any) => ({
              ...srv,
              featuresAr: parseJsonStringArray(srv.featuresAr),
              image_url: resolvePublicImageUrl(srv.image_url, srv.image_file_id),
            }));
          }
          if (Array.isArray(d.pages) && d.pages.length > 0) {
            db.pages = d.pages.map((pg: any) => ({
              ...pg,
              hero_image_url: resolvePublicImageUrl(
                pg.hero_image_url,
                pg.hero_image_file_id
              ),
            }));
          }
          if (Array.isArray(d.jobs) && d.jobs.length > 0) {
            db.jobs = d.jobs.map((job: any) => ({
              ...job,
              responsibilitiesAr: parseJsonStringArray(job.responsibilitiesAr),
              qualificationsAr: parseJsonStringArray(job.qualificationsAr),
              accountingSkillsAr: parseJsonStringArray(job.accountingSkillsAr),
              softwareExperienceAr: parseJsonStringArray(job.softwareExperienceAr),
            }));
          }
          db.backendMeta.externalSource = 'google_apps_script';
          saveDatabase(db);
          return;
        }
      }
    } catch {
      // Fall through to SheetDB check
    }
  }

  // 2. Query SheetDB (`https://sheetdb.io/api/v1/9537p5ct7m308`)
  const sheetDbUrl = resolveConfiguredSheetDbUrl(
    db.backendMeta.sheetDbUrl
  ).replace(/\/+$/, '');
  if (!sheetDbUrl) return;

  try {
    const sheetsRes = await fetch(`${sheetDbUrl}/sheets`);
    if (!sheetsRes.ok) return;
    const sheetsJson: any = await sheetsRes.json().catch(() => ({}));
    const availableSheets: string[] = Array.isArray(sheetsJson?.sheets)
      ? sheetsJson.sheets
      : [];
    const missingRequired = REQUIRED_WORKSHEETS.filter(
      (s) => !availableSheets.includes(s)
    );

    db.backendMeta.availableSheets = availableSheets;
    db.backendMeta.missingRequiredSheets = missingRequired;

    let hydratedAnyTab = false;

    if (availableSheets.includes('SiteSettings')) {
      const res = await fetch(`${sheetDbUrl}?sheet=SiteSettings`);
      if (res.ok) {
        const rows: any[] = await res.json().catch(() => []);
        if (Array.isArray(rows) && rows.length > 0) {
          const settingsObj: Record<string, any> = {};
          for (const r of rows) {
            if (r.Key) {
              if (r.Key === 'valuesAr') {
                try {
                  const parsedValues =
                    typeof r.Value === 'string' ? JSON.parse(r.Value) : r.Value;
                  if (Array.isArray(parsedValues) && parsedValues.length > 0) {
                    settingsObj.valuesAr = parsedValues;
                  }
                } catch {
                  // Preserve existing valuesAr array if JSON parse fails
                }
              } else {
                settingsObj[r.Key] = r.Value;
              }
            }
            if (r.logo_url) {
              settingsObj.logo_url = r.logo_url;
            }
            if (r.logo_file_id) {
              settingsObj.logo_file_id = r.logo_file_id;
            }
          }
          if (Object.keys(settingsObj).length > 0) {
            if (settingsObj.services_drive_folder_id) {
              db.backendMeta.servicesDriveFolderId = String(
                settingsObj.services_drive_folder_id
              );
            }
            if (settingsObj.google_spreadsheet_id) {
              db.backendMeta.spreadsheetId = String(
                settingsObj.google_spreadsheet_id
              );
            }
            const resolvedLogo = resolvePublicImageUrl(
              settingsObj.logo_url ?? db.profile.logo_url,
              settingsObj.logo_file_id ?? db.profile.logo_file_id
            );
            db.profile = {
              ...db.profile,
              ...settingsObj,
              valuesAr: Array.isArray(settingsObj.valuesAr)
                ? settingsObj.valuesAr
                : db.profile.valuesAr,
              logo_url: resolvedLogo,
            };
            hydratedAnyTab = true;
          }
        }
      }
    }

    if (availableSheets.includes('Departments')) {
      const res = await fetch(`${sheetDbUrl}?sheet=Departments`);
      if (res.ok) {
        const rows: any[] = await res.json().catch(() => []);
        if (Array.isArray(rows) && rows.length > 0) {
          db.departments = rows.map((d: any) => ({
            id: String(d.id || ''),
            nameAr: String(d.nameAr || ''),
            nameEn: String(d.nameEn || ''),
            iconName: String(d.iconName || 'Building2'),
            badgeBg: String(d.badgeBg || '#101B32'),
          }));
          hydratedAnyTab = true;
        }
      }
    }

    if (availableSheets.includes('Team')) {
      const res = await fetch(`${sheetDbUrl}?sheet=Team`);
      if (res.ok) {
        const rows: any[] = await res.json().catch(() => []);
        if (Array.isArray(rows) && rows.length > 0) {
          const existingMap = new Map<string, Employee>();
          (db.employees || []).forEach((e) => existingMap.set(e.id, e));
          const hasExplicitBool = (v: unknown) =>
            typeof v === 'boolean' ||
            (typeof v === 'string' && v.trim() !== '');

          db.employees = rows.map((emp: any) => {
            const prev = existingMap.get(String(emp.id || ''));
            return normalizeEmployeeVisibility({
              ...prev,
              ...emp,
              managerId:
                emp.managerId && String(emp.managerId).trim() !== ''
                  ? String(emp.managerId).trim()
                  : null,
              isConfirmedPosition: hasExplicitBool(emp.isConfirmedPosition)
                ? parseEmployeeBoolean(emp.isConfirmedPosition, true)
                : prev?.isConfirmedPosition ?? true,
              order: Number(emp.order) || prev?.order || 1,
              showOnTeamPage: hasExplicitBool(emp.showOnTeamPage)
                ? parseEmployeeBoolean(emp.showOnTeamPage, true)
                : prev?.showOnTeamPage ?? true,
              showOnOrgChart: hasExplicitBool(emp.showOnOrgChart)
                ? parseEmployeeBoolean(emp.showOnOrgChart, true)
                : prev?.showOnOrgChart ?? true,
              showPublicEmail: hasExplicitBool(emp.showPublicEmail)
                ? parseEmployeeBoolean(emp.showPublicEmail, false)
                : prev?.showPublicEmail ?? false,
              showPublicProfile: hasExplicitBool(emp.showPublicProfile)
                ? parseEmployeeBoolean(emp.showPublicProfile, true)
                : prev?.showPublicProfile ?? true,
              avatarUrl: resolvePublicImageUrl(
                emp.image_url || emp.avatarUrl,
                emp.image_file_id
              ),
              image_url: resolvePublicImageUrl(
                emp.image_url || emp.avatarUrl,
                emp.image_file_id
              ),
            });
          });
          hydratedAnyTab = true;
        }
      }
    }

    if (availableSheets.includes('Services')) {
      const res = await fetch(`${sheetDbUrl}?sheet=Services`);
      if (res.ok) {
        const rows: any[] = await res.json().catch(() => []);
        if (Array.isArray(rows) && rows.length > 0) {
          db.services = rows.map((srv: any) => ({
            ...srv,
            featuresAr: parseJsonStringArray(srv.featuresAr),
            image_url: resolvePublicImageUrl(srv.image_url, srv.image_file_id),
          }));
          hydratedAnyTab = true;
        }
      }
    }

    if (availableSheets.includes('Pages')) {
      const res = await fetch(`${sheetDbUrl}?sheet=Pages`);
      if (res.ok) {
        const rows: any[] = await res.json().catch(() => []);
        if (Array.isArray(rows) && rows.length > 0) {
          db.pages = rows.map((pg: any) => ({
            ...pg,
            hero_image_url: resolvePublicImageUrl(
              pg.hero_image_url,
              pg.hero_image_file_id
            ),
          }));
          hydratedAnyTab = true;
        }
      }
    }

    if (availableSheets.includes('Jobs')) {
      const res = await fetch(`${sheetDbUrl}?sheet=Jobs`);
      if (res.ok) {
        const rows: any[] = await res.json().catch(() => []);
        if (Array.isArray(rows) && rows.length > 0) {
          db.jobs = rows.map((job: any) => ({
            ...job,
            responsibilitiesAr: parseJsonStringArray(job.responsibilitiesAr),
            qualificationsAr: parseJsonStringArray(job.qualificationsAr),
            accountingSkillsAr: parseJsonStringArray(job.accountingSkillsAr),
            softwareExperienceAr: parseJsonStringArray(job.softwareExperienceAr),
          }));
          hydratedAnyTab = true;
        }
      }
    }

    db.backendMeta.externalSource = hydratedAnyTab
      ? 'sheetdb_live'
      : 'sheetdb_connected_empty_rows';
    saveDatabase(db);
  } catch {
    // Keep existing server db state if network call fails
  }
}

/**
 * Updates or inserts a record in SheetDB (https://sheetdb.io/api/v1/9537p5ct7m308) when the sheet tab & headers exist.
 * When `options.allowClearImages` is false (default), empty image fields (`image_url`, `avatarUrl`, `image_file_id`, etc.)
 * are omitted from the PATCH body so existing images in Google Sheets are never overwritten with empty strings.
 */
async function syncRecordToSheetDb(
  sheetName: WorksheetName,
  matchField: string,
  matchValue: string,
  recordData: Record<string, any>,
  options?: { allowClearImages?: boolean }
): Promise<{ synced: boolean; detail: string }> {
  const sheetDbUrl = resolveConfiguredSheetDbUrl(
    db.backendMeta.sheetDbUrl
  ).replace(/\/+$/, '');
  if (!sheetDbUrl) {
    return { synced: false, detail: 'لم يتم تكوين رابط SheetDB' };
  }

  try {
    const sheetsRes = await fetch(`${sheetDbUrl}/sheets`);
    if (!sheetsRes.ok) {
      return { synced: false, detail: `HTTP ${sheetsRes.status} من SheetDB` };
    }
    const sheetsJson: any = await sheetsRes.json().catch(() => ({}));
    const availableSheets: string[] = Array.isArray(sheetsJson?.sheets)
      ? sheetsJson.sheets
      : [];

    const hasTargetSheet = availableSheets.includes(sheetName);
    if (!hasTargetSheet) {
      return {
        synced: false,
        detail: `فشل الحفظ الدائم: الورقة "${sheetName}" غير موجودة في ملف Google Sheets المرتبط بـ SheetDB (الأوراق المتوفرة: ${availableSheets.join(
          ', '
        )}).`,
      };
    }

    const sheetQuery = `?sheet=${encodeURIComponent(sheetName)}`;

    // Check if the target sheet has headers initialized
    const keysRes = await fetch(`${sheetDbUrl}/keys${sheetQuery}`);
    const keysJson: any = await keysRes.json().catch(() => ({}));
    if (!keysRes.ok || keysJson?.error) {
      return {
        synced: false,
        detail: `فشل الحفظ الدائم: الورقة "${sheetName}" في Google Sheets تفتقر إلى عناوين الأعمدة في الصف الأول.`,
      };
    }

    const rawSanitizedPatchPayload = sanitizeRecordForSheetPatch(
      recordData,
      options
    );

    const sheetColumns: string[] = Array.isArray(keysJson)
      ? keysJson.map((k: any) => String(k))
      : [];

    const filterToSheetColumns = (payload: Record<string, any>) => {
      if (sheetColumns.length === 0) return payload;
      const filtered: Record<string, any> = {};
      for (const [k, v] of Object.entries(payload)) {
        if (sheetColumns.includes(k)) {
          filtered[k] = v;
        }
      }
      return filtered;
    };

    const sanitizedPatchPayload = filterToSheetColumns(rawSanitizedPatchPayload);
    const filteredPostRow = filterToSheetColumns(recordData);

    // Try PATCH first (updates existing row by matchField/matchValue without overwriting images with empty strings)
    const patchUrl = `${sheetDbUrl}/${encodeURIComponent(
      matchField
    )}/${encodeURIComponent(matchValue)}${sheetQuery}`;
    const patchRes = await fetch(patchUrl, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: sanitizedPatchPayload }),
    });

    const patchJson: any = await patchRes.json().catch(() => ({}));
    if (patchRes.ok && Number(patchJson?.updated) > 0) {
      db.backendMeta.lastSyncTime = new Date().toLocaleTimeString('ar-JO');
      saveDatabase(db);
      return {
        synced: true,
        detail: `تم تحديث السجل في Google Sheets عبر SheetDB (${sheetName})`,
      };
    }

    // If row didn't exist yet, POST to insert it
    const postUrl = `${sheetDbUrl}${sheetQuery}`;
    const postRes = await fetch(postUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: [filteredPostRow] }),
    });

    const postJson: any = await postRes.json().catch(() => ({}));
    if (postRes.ok && (Number(postJson?.created) > 0 || !postJson?.error)) {
      db.backendMeta.lastSyncTime = new Date().toLocaleTimeString('ar-JO');
      saveDatabase(db);
      return {
        synced: true,
        detail: `تمت إضافة السجل في Google Sheets عبر SheetDB (${sheetName})`,
      };
    }

    return {
      synced: false,
      detail: `رفض SheetDB كتابة السجل في "${sheetName}" (HTTP ${postRes.status}${
        postJson?.error ? `: ${postJson.error}` : ''
      })`,
    };
  } catch (err: any) {
    return {
      synced: false,
      detail: `تعذر تحديث SheetDB: ${err?.message || String(err)}`,
    };
  }
}

/**
 * Deletes a single record from a specific worksheet in SheetDB without touching other rows or tabs.
 */
async function deleteRecordFromSheetDb(
  sheetName: WorksheetName,
  matchField: string,
  matchValue: string
): Promise<{ synced: boolean; detail: string }> {
  const sheetDbUrl = resolveConfiguredSheetDbUrl(
    db.backendMeta.sheetDbUrl
  ).replace(/\/+$/, '');
  if (!sheetDbUrl) {
    return { synced: false, detail: 'لم يتم تكوين رابط SheetDB' };
  }

  try {
    const sheetQuery = `?sheet=${encodeURIComponent(sheetName)}`;
    const deleteUrl = `${sheetDbUrl}/${encodeURIComponent(
      matchField
    )}/${encodeURIComponent(matchValue)}${sheetQuery}`;
    const delRes = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    });
    const delJson: any = await delRes.json().catch(() => ({}));
    if (delRes.ok && !delJson?.error) {
      db.backendMeta.lastSyncTime = new Date().toLocaleTimeString('ar-JO');
      saveDatabase(db);
      return {
        synced: true,
        detail: `تم حذف السجل (${matchValue}) من ورقة ${sheetName} في Google Sheets عبر SheetDB.`,
      };
    }
    return {
      synced: false,
      detail: `فشل حذف السجل من "${sheetName}" في SheetDB (HTTP ${delRes.status}${
        delJson?.error ? `: ${delJson.error}` : ''
      })`,
    };
  } catch (err: any) {
    return {
      synced: false,
      detail: `تعذر حذف السجل من SheetDB: ${err?.message || String(err)}`,
    };
  }
}

/**
 * Pushes full state bundle across all 6 worksheets (SiteSettings, Departments, Team, Services, Pages, Jobs)
 * to Google Apps Script (if configured) or SheetDB, and confirms every write succeeded.
 */
async function syncBundleToExternalDatabase(): Promise<{
  synced: boolean;
  detail: string;
}> {
  const webAppUrl = (db.backendMeta.webAppUrl || '').trim();
  if (webAppUrl && webAppUrl.startsWith('https://script.google.com/')) {
    try {
      const res = await fetch(webAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'syncAllData',
          apiKey: getConfiguredAdminKey(),
          data: {
            profile: db.profile,
            departments: db.departments,
            employees: db.employees,
            jobs: db.jobs,
            services: db.services,
            pages: db.pages,
          },
        }),
      });
      const json: any = await res.json().catch(() => ({}));
      if (res.ok && json?.success) {
        return {
          synced: true,
          detail: 'تمت مزامنة كافة الجداول الستة بنجاح مع Google Sheets عبر Apps Script.',
        };
      }
    } catch {
      // Fall through to SheetDB sync
    }
  }

  const sheetStatus = await checkSheetDbStatus(
    db.backendMeta.sheetDbUrl || DEFAULT_SHEETDB_URL
  );
  if (
    !sheetStatus.reachable ||
    (sheetStatus.missingSheets && sheetStatus.missingSheets.length > 0) ||
    sheetStatus.isEmptyHeader
  ) {
    return {
      synced: false,
      detail: sheetStatus.messageAr,
    };
  }

  if (sheetStatus.writeAccess && !sheetStatus.writeAccess.ok) {
    return {
      synced: false,
      detail: sheetStatus.writeAccess.detailAr,
    };
  }

  const failedWrites: string[] = [];

  // 1. Sync SiteSettings (Tab: SiteSettings — 4 columns: Key, Value, logo_url, logo_file_id)
  // Preserves all 19 original CompanyProfile keys + 3 cloud linkage keys = 22 total keys without losing any data.
  const settingsEntries: Array<{
    Key: string;
    Value: string;
    logo_url: string;
    logo_file_id: string;
  }> = [
    { Key: 'nameAr', Value: db.profile.nameAr || '', logo_url: '', logo_file_id: '' },
    { Key: 'nameEn', Value: db.profile.nameEn || '', logo_url: '', logo_file_id: '' },
    { Key: 'taglineAr', Value: db.profile.taglineAr || '', logo_url: '', logo_file_id: '' },
    { Key: 'taglineEn', Value: db.profile.taglineEn || '', logo_url: '', logo_file_id: '' },
    { Key: 'industryAr', Value: db.profile.industryAr || '', logo_url: '', logo_file_id: '' },
    { Key: 'industryEn', Value: db.profile.industryEn || '', logo_url: '', logo_file_id: '' },
    { Key: 'visionAr', Value: db.profile.visionAr || '', logo_url: '', logo_file_id: '' },
    { Key: 'missionAr', Value: db.profile.missionAr || '', logo_url: '', logo_file_id: '' },
    {
      Key: 'valuesAr',
      Value: JSON.stringify(db.profile.valuesAr || []),
      logo_url: '',
      logo_file_id: '',
    },
    {
      Key: 'aboutDescriptionAr',
      Value: db.profile.aboutDescriptionAr || '',
      logo_url: '',
      logo_file_id: '',
    },
    { Key: 'email', Value: db.profile.email || '', logo_url: '', logo_file_id: '' },
    { Key: 'phone', Value: db.profile.phone || '', logo_url: '', logo_file_id: '' },
    { Key: 'locationAr', Value: db.profile.locationAr || '', logo_url: '', logo_file_id: '' },
    {
      Key: 'workingHoursAr',
      Value: db.profile.workingHoursAr || '',
      logo_url: '',
      logo_file_id: '',
    },
    {
      Key: 'googleFormsPlaceholderUrl',
      Value: db.profile.googleFormsPlaceholderUrl || 'https://smart-masar-recruitment.onrender.com/',
      logo_url: '',
      logo_file_id: '',
    },
    {
      Key: 'logo_url',
      Value: db.profile.logo_url || '',
      logo_url: db.profile.logo_url || '',
      logo_file_id: db.profile.logo_file_id || '',
    },
    {
      Key: 'logo_file_id',
      Value: db.profile.logo_file_id || '',
      logo_url: db.profile.logo_url || '',
      logo_file_id: db.profile.logo_file_id || '',
    },
    { Key: 'logo_alt_ar', Value: db.profile.logo_alt_ar || '', logo_url: '', logo_file_id: '' },
    {
      Key: 'drive_folder_id',
      Value: db.profile.drive_folder_id || db.backendMeta.driveFolderId || '1ss80vbtewFJ09876Re5uIH2g3Xu7tB0l',
      logo_url: '',
      logo_file_id: '',
    },
    {
      Key: 'services_drive_folder_id',
      Value: db.backendMeta.servicesDriveFolderId || '1qS_b1gOnR66V9WoPxjgj69IoGn5Yc_f3',
      logo_url: '',
      logo_file_id: '',
    },
    {
      Key: 'google_spreadsheet_id',
      Value: db.backendMeta.spreadsheetId || DEFAULT_SPREADSHEET_ID,
      logo_url: '',
      logo_file_id: '',
    },
    {
      Key: 'sheetdb_endpoint',
      Value: resolveConfiguredSheetDbUrl(db.backendMeta.sheetDbUrl),
      logo_url: '',
      logo_file_id: '',
    },
  ];

  for (const item of settingsEntries) {
    const r = await syncRecordToSheetDb('SiteSettings', 'Key', item.Key, item);
    if (!r.synced) failedWrites.push(`SiteSettings(${item.Key}): ${r.detail}`);
  }

  // 2. Sync Departments (Tab: Departments — strictly 5 columns: id, nameAr, nameEn, iconName, badgeBg)
  for (const dept of db.departments) {
    const deptRow: Department = {
      id: dept.id,
      nameAr: dept.nameAr,
      nameEn: dept.nameEn,
      iconName: dept.iconName,
      badgeBg: dept.badgeBg,
    };
    const r = await syncRecordToSheetDb('Departments', 'id', dept.id, deptRow as any);
    if (!r.synced) failedWrites.push(`Departments(${dept.id}): ${r.detail}`);
  }

  // 3. Sync Team (Tab: Team)
  for (const emp of db.employees) {
    const r = await syncRecordToSheetDb('Team', 'id', emp.id, emp as any);
    if (!r.synced) failedWrites.push(`Team(${emp.id}): ${r.detail}`);
  }

  // 4. Sync Services (Tab: Services)
  for (const srv of db.services) {
    const r = await syncRecordToSheetDb('Services', 'id', srv.id, {
      ...srv,
      featuresAr: JSON.stringify(srv.featuresAr),
    });
    if (!r.synced) failedWrites.push(`Services(${srv.id}): ${r.detail}`);
  }

  // 5. Sync Pages (Tab: Pages)
  for (const pg of db.pages) {
    const r = await syncRecordToSheetDb('Pages', 'id', pg.id, pg as any);
    if (!r.synced) failedWrites.push(`Pages(${pg.id}): ${r.detail}`);
  }

  // 6. Sync Jobs (Tab: Jobs)
  for (const job of db.jobs) {
    const r = await syncRecordToSheetDb('Jobs', 'id', job.id, {
      ...job,
      responsibilitiesAr: JSON.stringify(job.responsibilitiesAr),
      qualificationsAr: JSON.stringify(job.qualificationsAr),
      accountingSkillsAr: JSON.stringify(job.accountingSkillsAr),
      softwareExperienceAr: JSON.stringify(job.softwareExperienceAr),
    });
    if (!r.synced) failedWrites.push(`Jobs(${job.id}): ${r.detail}`);
  }

  if (failedWrites.length > 0) {
    return {
      synced: false,
      detail: `فشل تأكيد حفظ بعض السجلات في Google Sheets عبر SheetDB: ${failedWrites[0]}`,
    };
  }

  db.backendMeta.lastSyncTime = new Date().toLocaleTimeString('ar-JO');
  db.backendMeta.externalSource = 'sheetdb_live';
  saveDatabase(db);

  return {
    synced: true,
    detail:
      'تمت مزامنة وتأكيد حفظ جميع الجداول الستة (Team, Services, Pages, SiteSettings, Departments, Jobs) في Google Sheets عبر SheetDB بنجاح.',
  };
}

/**
 * Uploads image to Google Drive via the configured Google Apps Script Web App (`uploadImageToDrive`).
 */
async function uploadToGoogleDriveViaAppsScript(params: {
  fileName: string;
  mimeType: string;
  base64Data: string;
  entityType: string;
  entityId: string;
  altAr?: string;
  previousFileId?: string;
}): Promise<{
  uploadedToDrive: boolean;
  driveFileId?: string;
  driveDirectUrl?: string;
  driveViewUrl?: string;
  error?: string;
}> {
  const webAppUrl = (db.backendMeta.webAppUrl || '').trim();
  if (!webAppUrl || !webAppUrl.startsWith('https://script.google.com/')) {
    return {
      uploadedToDrive: false,
      error:
        'التخزين الدائم للصور (Google Drive) غير متاح: لم يتم ضبط رابط Google Apps Script Web App بعد. لا يتم قبول روابط /uploads/ المحلية كبديل دائم.',
    };
  }

  const targetFolderId =
    params.entityType === 'services'
      ? db.backendMeta.servicesDriveFolderId ||
        '1qS_b1gOnR66V9WoPxjgj69IoGn5Yc_f3'
      : db.backendMeta.driveFolderId ||
        '1ss80vbtewFJ09876Re5uIH2g3Xu7tB0l';

  try {
    const res = await fetch(webAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'uploadImageToDrive',
        apiKey: getConfiguredAdminKey(),
        folderId: targetFolderId,
        fileName: params.fileName,
        mimeType: params.mimeType,
        base64Data: params.base64Data,
        entityType: params.entityType,
        entityId: params.entityId,
        altAr: params.altAr || '',
        previousFileId: params.previousFileId || '',
      }),
    });

    if (!res.ok) {
      return {
        uploadedToDrive: false,
        error: `فشل الاتصال بخدمة Google Drive عبر Apps Script (HTTP ${res.status})`,
      };
    }

    const json: any = await res.json().catch(() => ({}));
    if (json && json.success && json.fileId) {
      return {
        uploadedToDrive: true,
        driveFileId: String(json.fileId),
        driveDirectUrl:
          json.directUrl || `https://lh3.googleusercontent.com/d/${json.fileId}`,
        driveViewUrl:
          json.viewUrl || `https://drive.google.com/file/d/${json.fileId}/view`,
      };
    }

    return {
      uploadedToDrive: false,
      error: json?.error || 'لم يرجع Apps Script معرف ملف Google Drive الدائم',
    };
  } catch (err: any) {
    return {
      uploadedToDrive: false,
      error: err?.message || String(err),
    };
  }
}

export const apiApp = express();
apiApp.use(express.json({ limit: '12mb' }));

// Normalize request URLs when invoked via Vercel Serverless rewrites (/api/(.*) -> /api/index)
apiApp.use((req: Request, _res: Response, next: NextFunction) => {
  if (
    !req.url.startsWith('/api/') &&
    (req.url.startsWith('/admin/') ||
      req.url.startsWith('/public/') ||
      req.url.startsWith('/images/') ||
      req.url.startsWith('/download-'))
  ) {
    req.url = `/api${req.url}`;
  }
  next();
});

// Serve uploaded files directly from /public/uploads
apiApp.use(
  '/uploads',
  express.static(UPLOADS_DIR, {
    maxAge: '7d',
    etag: true,
  })
);

function registerApiRoutes(app: express.Express) {

  // ============================================================================
  // 1. PUBLIC API ENDPOINTS (Unauthenticated Read-Only)
  // ============================================================================

  /**
   * GET /api/public/data
   * Always refreshes from the persistent external database (SheetDB / Google Apps Script)
   * and returns sanitized public website records (no keys, no admin credentials).
   */
  app.get('/api/public/data', async (req: Request, res: Response) => {
    res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
    await hydrateFromExternalDatabase(true);

    const expectedKey = getConfiguredAdminKey();
    const authCheck = expectedKey
      ? isRequestAdminAuthenticated(
          {
            cookie: req.headers.cookie,
            'x-admin-key': req.headers['x-admin-key'],
            authorization: req.headers.authorization,
          },
          expectedKey
        )
      : { authenticated: false };

    const sanitizedEmployees = (db.employees || []).map((emp) => {
      const normalized = normalizeEmployeeVisibility(emp);
      if (authCheck.authenticated) {
        return normalized;
      }
      return {
        ...normalized,
        email: normalized.showPublicEmail ? normalized.email || '' : '',
      };
    });

    res.json({
      success: true,
      data: {
        profile: db.profile,
        departments: db.departments,
        employees: sanitizedEmployees,
        jobs: db.jobs,
        services: db.services,
        pages: db.pages,
      },
      meta: {
        hasAppsScript: Boolean(db.backendMeta.webAppUrl),
        hasDriveFolder: Boolean(db.backendMeta.driveFolderId),
        sheetDbUrl: resolveConfiguredSheetDbUrl(db.backendMeta.sheetDbUrl),
        lastSyncTime: db.backendMeta.lastSyncTime || null,
        externalSource:
          db.backendMeta.externalSource || 'sheetdb_connected_empty_rows',
        availableSheets: db.backendMeta.availableSheets || [],
        missingRequiredSheets:
          db.backendMeta.missingRequiredSheets || [...REQUIRED_WORKSHEETS],
      },
    });
  });

  /**
   * GET /api/download-static-zip (Admin-Authenticated Only)
   */
  app.get(
    '/api/download-static-zip',
    requireAdminAuth,
    (_req: Request, res: Response) => {
      if (!fs.existsSync(STATIC_HOSTING_ZIP_PATH)) {
        res.status(404).json({
          success: false,
          error: 'ملف حزمة الاستضافة الثابتة غير موجود حالياً على الخادم.',
        });
        return;
      }
      res.download(STATIC_HOSTING_ZIP_PATH, 'smart-masar-static-hosting.zip');
    }
  );

  /**
   * GET /api/download-project-zip (Admin-Authenticated Only)
   */
  app.get(
    '/api/download-project-zip',
    requireAdminAuth,
    (_req: Request, res: Response) => {
      if (!fs.existsSync(PROJECT_ZIP_PATH)) {
        res.status(404).json({
          success: false,
          error: 'ملف الأرشيف غير موجود حالياً على الخادم.',
        });
        return;
      }
      res.download(PROJECT_ZIP_PATH, 'smart-masar-complete-project.zip');
    }
  );

  /**
   * GET /api/download-html (Admin-Authenticated Only)
   */
  app.get(
    '/api/download-html',
    requireAdminAuth,
    (_req: Request, res: Response) => {
      const htmlPath = path.join(DATA_DIR, 'backups', 'smart-masar.html');
      if (!fs.existsSync(htmlPath)) {
        res.status(404).json({
          success: false,
          error: 'ملف HTML غير موجود حالياً على الخادم.',
        });
        return;
      }
      res.download(htmlPath, 'smart-masar.html');
    }
  );

  /**
   * GET /api/download-recovery-backup
   * Strictly protected by `requireAdminAuth` (Server-Verified Admin Authorization).
   * Serves the private recovery ZIP archive from `data/backups/smart-masar-recovery-backup.zip`
   * (never exposed in `public/`).
   */
  app.get(
    '/api/download-recovery-backup',
    requireAdminAuth,
    (_req: Request, res: Response) => {
      res.setHeader(
        'Cache-Control',
        'private, no-store, no-cache, must-revalidate'
      );
      const zipPath = path.join(
        DATA_DIR,
        'backups',
        'smart-masar-recovery-backup.zip'
      );
      if (fs.existsSync(zipPath)) {
        res.download(zipPath, 'smart-masar-recovery-backup.zip');
        return;
      }

      // Dynamically construct a valid PKZIP (store method) buffer in memory for serverless / git-ignored environments
      const jsonContent = Buffer.from(
        JSON.stringify(
          {
            generatedAt: new Date().toISOString(),
            sheetDbEndpoint: resolveConfiguredSheetDbUrl(db.backendMeta.sheetDbUrl),
            departments: db.departments,
            employees: db.employees,
            services: db.services,
            pages: db.pages,
            jobs: db.jobs,
          },
          null,
          2
        ),
        'utf-8'
      );
      const entryName = Buffer.from('smart-masar-recovery-bundle.json', 'utf-8');
      const localHeader = Buffer.alloc(30 + entryName.length);
      localHeader.writeUInt32LE(0x04034b50, 0); // Local file header signature
      localHeader.writeUInt16LE(20, 4); // Version needed
      localHeader.writeUInt32LE(jsonContent.length, 18); // Compressed size
      localHeader.writeUInt32LE(jsonContent.length, 22); // Uncompressed size
      localHeader.writeUInt16LE(entryName.length, 26); // File name length
      entryName.copy(localHeader, 30);

      const centralDir = Buffer.alloc(46 + entryName.length);
      centralDir.writeUInt32LE(0x02014b50, 0); // Central directory signature
      centralDir.writeUInt16LE(20, 4);
      centralDir.writeUInt16LE(20, 6);
      centralDir.writeUInt32LE(jsonContent.length, 20);
      centralDir.writeUInt32LE(jsonContent.length, 24);
      centralDir.writeUInt16LE(entryName.length, 28);
      entryName.copy(centralDir, 46);

      const eocd = Buffer.alloc(22);
      eocd.writeUInt32LE(0x06054b50, 0); // End of central directory signature
      eocd.writeUInt16LE(1, 8);
      eocd.writeUInt16LE(1, 10);
      eocd.writeUInt32LE(centralDir.length, 12);
      eocd.writeUInt32LE(localHeader.length + jsonContent.length, 16);

      const zipBuffer = Buffer.concat([localHeader, jsonContent, centralDir, eocd]);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="smart-masar-recovery-backup.zip"'
      );
      res.status(200).send(zipBuffer);
    }
  );

  /**
   * GET /api/download-recovery-json
   * Strictly protected by `requireAdminAuth` (Server-Verified Admin Authorization).
   * Serves the complete JSON recovery bundle from private `data/backups/` storage
   * (or generates it dynamically for the authenticated administrator).
   */
  app.get(
    '/api/download-recovery-json',
    requireAdminAuth,
    (_req: Request, res: Response) => {
      res.setHeader(
        'Cache-Control',
        'private, no-store, no-cache, must-revalidate'
      );
      const jsonPath = path.join(
        DATA_DIR,
        'backups',
        'smart-masar-recovery-bundle.json'
      );
      if (fs.existsSync(jsonPath)) {
        res.download(jsonPath, 'smart-masar-recovery-bundle.json');
        return;
      }

      const manifestPath = path.join(
        DATA_DIR,
        'backups',
        'recoverable-images-manifest.json'
      );
      const reviewPath = path.join(DATA_DIR, 'org-staff-review.json');
      const manifest = fs.existsSync(manifestPath)
        ? JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
        : null;
      const orgStaffReview = fs.existsSync(reviewPath)
        ? JSON.parse(fs.readFileSync(reviewPath, 'utf-8'))
        : null;

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="smart-masar-recovery-bundle.json"'
      );
      res.send(
        JSON.stringify(
          {
            generatedAt: new Date().toISOString(),
            spreadsheetId: db.backendMeta.spreadsheetId || DEFAULT_SPREADSHEET_ID,
            sheetDbEndpoint: resolveConfiguredSheetDbUrl(
              db.backendMeta.sheetDbUrl
            ),
            worksheetsReadyForMigration: {
              Departments: db.departments,
              Team: db.employees,
              Services: db.services,
              Pages: db.pages,
              Jobs: db.jobs,
              Profile: db.profile,
            },
            orgStaffReview,
            recoverableImagesManifest: manifest,
          },
          null,
          2
        )
      );
    }
  );

  /**
   * POST /api/admin/backup-to-drive
   * Strictly protected by `requireAdminAuth`.
   * Pushes the complete JSON recovery backup to a strictly PRIVATE Google Drive folder
   * (`DriveApp.Access.PRIVATE`) via Google Apps Script (`action: 'savePrivateBackupToDrive'`).
   */
  app.post(
    '/api/admin/backup-to-drive',
    requireAdminAuth,
    async (_req: Request, res: Response) => {
      const webAppUrl = (db.backendMeta.webAppUrl || '').trim();
      if (!webAppUrl || !webAppUrl.startsWith('https://script.google.com/')) {
        res.status(502).json({
          success: false,
          error:
            'تعذر رفع النسخة الاحتياطية الخاصة إلى Google Drive: لم يتم ضبط رابط Google Apps Script Web App في إعدادات الخادم بعد.',
        });
        return;
      }

      try {
        const jsonPath = path.join(
          DATA_DIR,
          'backups',
          'smart-masar-recovery-bundle.json'
        );
        const backupPayload = fs.existsSync(jsonPath)
          ? JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
          : {
              generatedAt: new Date().toISOString(),
              spreadsheetId:
                db.backendMeta.spreadsheetId || DEFAULT_SPREADSHEET_ID,
              data: db,
            };

        const upstream = await fetch(webAppUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'savePrivateBackupToDrive',
            apiKey: getConfiguredAdminKey(),
            fileName: `smart-masar-private-backup-${Date.now()}.json`,
            backupData: backupPayload,
          }),
        });

        const json: any = await upstream.json().catch(() => ({}));
        if (!upstream.ok || !json?.success) {
          res.status(502).json({
            success: false,
            error:
              json?.error ||
              `فشل حفظ النسخة الاحتياطية الخاصة في Google Drive (HTTP ${upstream.status})`,
          });
          return;
        }

        res.json({
          success: true,
          message:
            'تم حفظ النسخة الاحتياطية بنجاح داخل مجلد خاص (Private) في Google Drive يقتصر الوصول إليه على المسؤول المخوّل فقط.',
          fileId: json.fileId,
          folderId: json.folderId,
          accessLevel: json.accessLevel || 'PRIVATE',
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: `تعذر رفع النسخة الاحتياطية إلى Google Drive: ${
            err?.message || String(err)
          }`,
        });
      }
    }
  );

  /**
   * GET /api/images/drive/:fileId
   * Server-side image delivery proxy for Google Drive files.
   * Serves ONLY validated image binaries by fileId — never exposes directory listings or JSON backups.
   */
  app.get('/api/images/drive/:fileId', async (req: Request, res: Response) => {
    const fileId = String(req.params.fileId || '').trim();
    if (!fileId || !/^[a-zA-Z0-9_-]{6,120}$/.test(fileId)) {
      res.status(400).send('Invalid file ID');
      return;
    }

    // 1. Check if we have a verified local copy in private /data/backups/drive-images or /public/uploads
    const candidateCacheDirs = [
      path.join(DATA_DIR, 'backups', 'drive-images', 'employees'),
      path.join(DATA_DIR, 'backups', 'drive-images', 'services'),
      UPLOADS_DIR,
    ];
    for (const dir of candidateCacheDirs) {
      if (fs.existsSync(dir)) {
        const matches = fs.readdirSync(dir).filter((f) => f.includes(fileId));
        if (matches.length > 0) {
          const filePath = path.join(dir, matches[0]);
          res.setHeader('Cache-Control', 'public, max-age=86400');
          res.sendFile(filePath);
          return;
        }
      }
    }

    // 2. Otherwise fetch from Google Drive public endpoints on the server
    const candidateUrls = [
      `https://lh3.googleusercontent.com/d/${encodeURIComponent(fileId)}`,
      `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w1600`,
      `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`,
    ];

    for (const targetUrl of candidateUrls) {
      try {
        const upstream = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'SmartMasarImageProxy/1.0',
            Accept: 'image/webp,image/png,image/jpeg,image/*,*/*;q=0.8',
          },
          redirect: 'follow',
        });

        const contentType = upstream.headers.get('content-type') || '';
        if (upstream.ok && contentType.startsWith('image/')) {
          const arrayBuffer = await upstream.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          res.setHeader('Content-Type', contentType);
          res.setHeader('Cache-Control', 'public, max-age=3600');
          res.send(buffer);
          return;
        }
      } catch {
        // Try next candidate URL
      }
    }

    res.status(404).json({
      success: false,
      error:
        'تعذر جلب الصورة من Google Drive. تأكد من ضبط صلاحية الملف في Google Drive على "أي شخص لديه الرابط (Anyone with the link)".',
    });
  });

  // ============================================================================
  // 2. ADMIN AUTHENTICATION & CONFIGURATION ENDPOINTS
  // ============================================================================

  /**
   * GET & POST /api/admin/auth/session
   * Checks whether the client already holds a valid server-verified HttpOnly admin session cookie,
   * or verifies a provided adminKey against process.env.SMART_MASAR_ADMIN_KEY.
   * Never auto-authenticates unauthenticated requests.
   */
  const handleSessionCheck = (req: Request, res: Response) => {
    try {
      const expectedKey = getConfiguredAdminKey();
      const rawAdminKey =
        req.body && typeof req.body.adminKey === 'string'
          ? req.body.adminKey.trim()
          : '';

      if (!expectedKey) {
        res.status(rawAdminKey ? 503 : 200).json({
          success: false,
          authenticated: false,
          configured: false,
          error:
            'متغير البيئة SMART_MASAR_ADMIN_KEY غير مضبوط على الخادم. يرجى إضافته في إعدادات البيئة (Vercel Environment Variables أو .env).',
        });
        return;
      }

      const authCheck = isRequestAdminAuthenticated(
        {
          cookie: req.headers.cookie,
          'x-admin-key': req.headers['x-admin-key'],
          authorization: req.headers.authorization,
        },
        expectedKey
      );

      const isKeyValid =
        rawAdminKey.length > 0 &&
        verifyAdminKeyConstantTime(rawAdminKey, expectedKey);

      if (authCheck.authenticated || isKeyValid) {
        const token = createStatelessAdminSessionToken(expectedKey);
        res.setHeader('Set-Cookie', buildAdminSessionSetCookie(token));
        res.status(200).json({
          success: true,
          authenticated: true,
          configured: true,
          config: {
            webAppUrl: db.backendMeta.webAppUrl,
            sheetDbUrl: resolveConfiguredSheetDbUrl(db.backendMeta.sheetDbUrl),
            driveFolderId: db.backendMeta.driveFolderId,
            lastSyncTime: db.backendMeta.lastSyncTime,
          },
        });
        return;
      }

      res.status(200).json({
        success: false,
        authenticated: false,
        configured: true,
        error: 'يرجى تسجيل الدخول باستخدام مفتاح صلاحية المسؤول المعتمد للوصول إلى لوحة الإدارة.',
      });
    } catch {
      res.status(200).json({
        success: false,
        authenticated: false,
        configured: Boolean(getConfiguredAdminKey()),
      });
    }
  };

  app.get('/api/admin/auth/session', handleSessionCheck);
  app.post('/api/admin/auth/session', handleSessionCheck);

  /**
   * POST /api/admin/auth/logout
   * Clears the HttpOnly admin session cookie.
   */
  app.post('/api/admin/auth/logout', (_req: Request, res: Response) => {
    res.setHeader('Set-Cookie', buildAdminLogoutSetCookie());
    res.json({
      success: true,
      authenticated: false,
    });
  });

  /**
   * POST /api/admin/auth/verify
   * Verifies administrator secret key exclusively against process.env.SMART_MASAR_ADMIN_KEY
   * and sets a stateless HMAC-signed HttpOnly session cookie.
   */
  app.post('/api/admin/auth/verify', (req: Request, res: Response) => {
    const expectedKey = getConfiguredAdminKey();
    if (!expectedKey) {
      res.status(503).json({
        success: false,
        authenticated: false,
        configured: false,
        error:
          'متغير البيئة SMART_MASAR_ADMIN_KEY غير مضبوط على الخادم. يرجى إضافته في إعدادات البيئة (Vercel Environment Variables أو .env).',
      });
      return;
    }

    const { adminKey } = req.body || {};
    const authCheck = isRequestAdminAuthenticated(
      {
        cookie: req.headers.cookie,
        'x-admin-key': req.headers['x-admin-key'],
        authorization: req.headers.authorization,
      },
      expectedKey
    );

    const isKeyValid =
      typeof adminKey === 'string' &&
      adminKey.trim().length > 0 &&
      verifyAdminKeyConstantTime(adminKey, expectedKey);

    if ((typeof adminKey === 'string' && isKeyValid) || (!adminKey && authCheck.authenticated)) {
      const token = createStatelessAdminSessionToken(expectedKey);
      res.setHeader('Set-Cookie', buildAdminSessionSetCookie(token));
      res.json({
        success: true,
        authenticated: true,
        configured: true,
        config: {
          webAppUrl: db.backendMeta.webAppUrl,
          sheetDbUrl: resolveConfiguredSheetDbUrl(db.backendMeta.sheetDbUrl),
          driveFolderId: db.backendMeta.driveFolderId,
          lastSyncTime: db.backendMeta.lastSyncTime,
        },
      });
      return;
    }

    res.status(401).json({
      success: false,
      authenticated: false,
      configured: true,
      error: 'مفتاح صلاحية المسؤول غير صحيح.',
    });
  });

  /**
   * GET /api/admin/sheetdb-status
   * Checks live connection to SheetDB (https://sheetdb.io/api/v1/9537p5ct7m308) & all 6 required worksheets.
   */
  app.get(
    '/api/admin/sheetdb-status',
    requireAdminAuth,
    async (_req: Request, res: Response) => {
      const targetUrl = resolveConfiguredSheetDbUrl(db.backendMeta.sheetDbUrl);
      const status = await checkSheetDbStatus(targetUrl);
      db.backendMeta.lastSheetDbStatus = status.messageAr;
      saveDatabase(db);
      res.json({
        success: true,
        sheetDbUrl: targetUrl,
        webAppUrl: db.backendMeta.webAppUrl || '',
        driveFolderId: db.backendMeta.driveFolderId || '',
        ...status,
      });
    }
  );

  /**
   * POST /api/admin/config
   * Updates server-side Google Apps Script URL, Google Drive folder ID, or SheetDB URL.
   * Never accepts or persists admin keys in db.json (admin key comes exclusively from SMART_MASAR_ADMIN_KEY).
   */
  app.post('/api/admin/config', requireAdminAuth, (req: Request, res: Response) => {
    const { webAppUrl, sheetDbUrl, driveFolderId } = req.body || {};
    if (typeof webAppUrl === 'string') {
      db.backendMeta.webAppUrl = webAppUrl.trim();
    }
    if (typeof sheetDbUrl === 'string' && sheetDbUrl.trim()) {
      db.backendMeta.sheetDbUrl = resolveConfiguredSheetDbUrl(sheetDbUrl);
    }
    if (typeof driveFolderId === 'string') {
      db.backendMeta.driveFolderId = driveFolderId.trim();
      db.profile.drive_folder_id = driveFolderId.trim();
    }
    saveDatabase(db);
    res.json({
      success: true,
      message: 'تم حفظ إعدادات الربط السحابي ومجلد Google Drive في الخادم بنجاح.',
      config: {
        webAppUrl: db.backendMeta.webAppUrl,
        sheetDbUrl: resolveConfiguredSheetDbUrl(db.backendMeta.sheetDbUrl),
        driveFolderId: db.backendMeta.driveFolderId,
        lastSyncTime: db.backendMeta.lastSyncTime,
      },
    });
  });

  // ============================================================================
  // 3. SECURE IMAGE UPLOAD, REPLACEMENT & REMOVAL ENDPOINTS
  // ============================================================================

  /**
   * POST /api/admin/upload-image
   * Validates image format (JPG, PNG, WebP) and size, uploads to Google Drive
   * via Google Apps Script, and updates the corresponding Google Sheets / SheetDB record.
   * Fails explicitly if Google Drive persistent storage is unavailable — never returns
   * fake /uploads/ links as permanent uploads.
   */
  app.post(
    '/api/admin/upload-image',
    requireAdminAuth,
    async (req: Request, res: Response) => {
      try {
        const {
          fileName,
          mimeType,
          base64Data,
          entityType,
          entityId,
          altAr,
          previousFileId,
        } = req.body || {};

        if (!fileName || !base64Data || !entityType) {
          res.status(400).json({
            success: false,
            error:
              'بيانات الصورة غير مكتملة (fileName, base64Data, entityType مطلوبة).',
          });
          return;
        }

        const normalizedMime = String(mimeType || '').toLowerCase().trim();
        if (!ALLOWED_IMAGE_MIME_TYPES.includes(normalizedMime as any)) {
          res.status(400).json({
            success: false,
            error:
              'صيغة الصورة غير مدعومة. يسمح فقط برفع ملفات JPG أو PNG أو WebP.',
          });
          return;
        }

        // Strip data URL prefix if present
        const cleanBase64 = String(base64Data).replace(
          /^data:image\/[a-zA-Z0-9.+-]+;base64,/,
          ''
        );
        const imageBuffer = Buffer.from(cleanBase64, 'base64');

        if (imageBuffer.length <= 0) {
          res.status(400).json({
            success: false,
            error: 'ملف الصورة المرفوع فارغ أو تالف.',
          });
          return;
        }

        if (imageBuffer.length > DEFAULT_MAX_IMAGE_SIZE_BYTES) {
          res.status(400).json({
            success: false,
            error: 'حجم الصورة يتجاوز الحد الأقصى المسموح به (5 ميغابايت).',
          });
          return;
        }

        // Verify binary magic bytes
        const magicCheck = verifyImageMagicBytes(imageBuffer);
        if (!magicCheck.valid) {
          res.status(400).json({
            success: false,
            error:
              'محتوى الملف لا يطابق صورة حقيقية بصيغة JPG أو PNG أو WebP.',
          });
          return;
        }

        const extMap: Record<string, string> = {
          'image/jpeg': '.jpg',
          'image/png': '.png',
          'image/webp': '.webp',
        };
        const ext = extMap[magicCheck.detectedMime || normalizedMime] || '.png';
        const safeEntity = String(entityType)
          .replace(/[^a-zA-Z0-9_-]/g, '')
          .toLowerCase();
        const safeId = String(entityId || 'default')
          .replace(/[^a-zA-Z0-9_-]/g, '')
          .toLowerCase();
        const timestamp = Date.now();

        // 1. Require upload to Google Drive persistent storage via Apps Script
        const driveResult = await uploadToGoogleDriveViaAppsScript({
          fileName: `${safeEntity}-${safeId}-${timestamp}${ext}`,
          mimeType: magicCheck.detectedMime || normalizedMime,
          base64Data: cleanBase64,
          entityType: safeEntity,
          entityId: safeId,
          altAr,
          previousFileId,
        });

        if (
          !driveResult.uploadedToDrive ||
          !driveResult.driveFileId ||
          !driveResult.driveDirectUrl
        ) {
          res.status(502).json({
            success: false,
            driveUploaded: false,
            error:
              driveResult.error ||
              'فشل رفع الصورة: التخزين الدائم في Google Drive غير متاح حالياً. يرجى ضبط رابط Google Apps Script ومعرف مجلد Google Drive في الإعدادات.',
          });
          return;
        }

        const fileId = driveResult.driveFileId;
        const publicDisplayUrl = resolvePublicImageUrl(
          driveResult.driveDirectUrl,
          fileId
        );

        // Cache the newly uploaded image in private data/backups/drive-images when filesystem is writable
        if (process.env.VERCEL_BUNDLE !== '1' && !process.env.VERCEL) {
          try {
            const subFolder =
              safeEntity === 'services' ? 'services' : 'employees';
            const cacheDir = path.join(
              DATA_DIR,
              'backups',
              'drive-images',
              subFolder
            );
            fs.mkdirSync(cacheDir, { recursive: true });
            fs.writeFileSync(
              path.join(cacheDir, `${fileId}_${safeEntity}-${safeId}${ext}`),
              imageBuffer
            );
          } catch {
            // Ignore local cache write errors on read-only environments
          }
        }

        // 2. Persist image URL and fileId in the corresponding Google Sheets / SheetDB worksheet
        let sheetSyncResult = { synced: false, detail: '' };

        if (entityType === 'team') {
          const empIndex = db.employees.findIndex((e) => e.id === entityId);
          if (empIndex !== -1) {
            const emp = db.employees[empIndex];
            const updatedEmp: Employee = {
              ...emp,
              avatarUrl: publicDisplayUrl,
              image_url: publicDisplayUrl,
              image_file_id: fileId,
              image_alt_ar: altAr || emp.image_alt_ar || `صورة ${emp.nameAr}`,
            };
            db.employees[empIndex] = updatedEmp;
            saveDatabase(db);
            sheetSyncResult = await syncRecordToSheetDb(
              'Team',
              'id',
              updatedEmp.id,
              updatedEmp
            );
          } else {
            sheetSyncResult = {
              synced: true,
              detail: 'تم رفع الصورة إلى Google Drive؛ سيتم ربطها بالسجل عند حفظ بيانات الموظف.',
            };
          }
        } else if (entityType === 'services') {
          const srvIndex = db.services.findIndex((s) => s.id === entityId);
          if (srvIndex !== -1) {
            const srv = db.services[srvIndex];
            const updatedSrv: ServiceItem = {
              ...srv,
              image_url: publicDisplayUrl,
              image_file_id: fileId,
              image_alt_ar: altAr || srv.image_alt_ar || srv.titleAr,
            };
            db.services[srvIndex] = updatedSrv;
            saveDatabase(db);
            sheetSyncResult = await syncRecordToSheetDb(
              'Services',
              'id',
              updatedSrv.id,
              {
                ...updatedSrv,
                featuresAr: JSON.stringify(updatedSrv.featuresAr),
              }
            );
          } else {
            sheetSyncResult = {
              synced: true,
              detail: 'تم رفع الصورة إلى Google Drive؛ سيتم ربطها بالخدمة عند الحفظ.',
            };
          }
        } else if (entityType === 'pages') {
          const pageIndex = db.pages.findIndex((p) => p.id === entityId);
          if (pageIndex !== -1) {
            const pg = db.pages[pageIndex];
            const updatedPage: PageMetadata = {
              ...pg,
              hero_image_url: publicDisplayUrl,
              hero_image_file_id: fileId,
              hero_image_alt_ar: altAr || pg.hero_image_alt_ar || pg.titleAr,
            };
            db.pages[pageIndex] = updatedPage;
            saveDatabase(db);
            sheetSyncResult = await syncRecordToSheetDb(
              'Pages',
              'id',
              updatedPage.id,
              updatedPage
            );
          }
        } else if (entityType === 'settings') {
          db.profile = {
            ...db.profile,
            logo_url: publicDisplayUrl,
            logo_file_id: fileId,
            logo_alt_ar:
              altAr || db.profile.logo_alt_ar || 'شعار شركة سمارت مسار - Smart Masar',
          };
          saveDatabase(db);
          sheetSyncResult = await syncRecordToSheetDb(
            'SiteSettings',
            'Key',
            'logo_url',
            {
              Key: 'logo_url',
              Value: publicDisplayUrl,
              logo_url: publicDisplayUrl,
              logo_file_id: fileId,
            }
          );
        }

        if (!sheetSyncResult.synced) {
          res.status(502).json({
            success: false,
            driveUploaded: true,
            fileId,
            driveDirectUrl: driveResult.driveDirectUrl,
            sheetSync: sheetSyncResult,
            error: `تم رفع الصورة إلى Google Drive ولكن فشل حفظ الرابط في قاعدة البيانات الدائمة (SheetDB): ${sheetSyncResult.detail}`,
          });
          return;
        }

        res.json({
          success: true,
          imageUrl: publicDisplayUrl,
          fileId,
          driveUploaded: true,
          driveDirectUrl: driveResult.driveDirectUrl,
          driveViewUrl: driveResult.driveViewUrl || null,
          driveNotice: null,
          sheetSync: sheetSyncResult,
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: `فشل رفع الصورة: ${err?.message || String(err)}`,
        });
      }
    }
  );

  /**
   * POST /api/admin/remove-image
   * Removes an image reference from a record and confirms the update in SheetDB.
   */
  app.post(
    '/api/admin/remove-image',
    requireAdminAuth,
    async (req: Request, res: Response) => {
      try {
        const { entityType, entityId, fileId } = req.body || {};
        if (!entityType) {
          res.status(400).json({
            success: false,
            error: 'نوع السجل (entityType) مطلوب لحذف الصورة.',
          });
          return;
        }

        // Remove local cached file in non-Vercel dev environment if present
        if (
          fileId &&
          process.env.VERCEL_BUNDLE !== '1' &&
          !process.env.VERCEL &&
          fs.existsSync(UPLOADS_DIR)
        ) {
          const matchingFiles = fs
            .readdirSync(UPLOADS_DIR)
            .filter((f) => f.startsWith(String(fileId)));
          for (const f of matchingFiles) {
            try {
              fs.unlinkSync(path.join(UPLOADS_DIR, f));
            } catch {
              // ignore cleanup errors
            }
          }
        }

        let sheetSyncResult = { synced: false, detail: '' };

        if (entityType === 'team') {
          const idx = db.employees.findIndex((e) => e.id === entityId);
          if (idx !== -1) {
            db.employees[idx] = {
              ...db.employees[idx],
              avatarUrl: '',
              image_url: '',
              image_file_id: '',
            };
            saveDatabase(db);
            sheetSyncResult = await syncRecordToSheetDb(
              'Team',
              'id',
              db.employees[idx].id,
              db.employees[idx],
              { allowClearImages: true }
            );
          }
        } else if (entityType === 'services') {
          const idx = db.services.findIndex((s) => s.id === entityId);
          if (idx !== -1) {
            db.services[idx] = {
              ...db.services[idx],
              image_url: '',
              image_file_id: '',
            };
            saveDatabase(db);
            sheetSyncResult = await syncRecordToSheetDb(
              'Services',
              'id',
              db.services[idx].id,
              {
                ...db.services[idx],
                featuresAr: JSON.stringify(db.services[idx].featuresAr),
              },
              { allowClearImages: true }
            );
          }
        } else if (entityType === 'pages') {
          const idx = db.pages.findIndex((p) => p.id === entityId);
          if (idx !== -1) {
            db.pages[idx] = {
              ...db.pages[idx],
              hero_image_url: '',
              hero_image_file_id: '',
            };
            saveDatabase(db);
            sheetSyncResult = await syncRecordToSheetDb(
              'Pages',
              'id',
              db.pages[idx].id,
              db.pages[idx],
              { allowClearImages: true }
            );
          }
        } else if (entityType === 'settings') {
          db.profile = {
            ...db.profile,
            logo_url: '',
            logo_file_id: '',
          };
          saveDatabase(db);
          sheetSyncResult = await syncRecordToSheetDb(
            'SiteSettings',
            'Key',
            'logo_url',
            {
              Key: 'logo_url',
              Value: '',
              logo_url: '',
              logo_file_id: '',
            },
            { allowClearImages: true }
          );
        }

        if (!sheetSyncResult.synced) {
          res.status(502).json({
            success: false,
            error: `فشل تأكيد إزالة الصورة في قاعدة البيانات الدائمة (SheetDB): ${sheetSyncResult.detail}`,
            sheetSync: sheetSyncResult,
          });
          return;
        }

        res.json({
          success: true,
          message:
            'تمت إزالة الصورة وتحديث السجل في قاعدة البيانات الدائمة (Google Sheets) بنجاح.',
          sheetSync: sheetSyncResult,
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: `تعذر حذف الصورة: ${err?.message || String(err)}`,
        });
      }
    }
  );

  /**
   * POST /api/admin/record
   * Single-record mutation endpoint (upsert or delete) so modifying a single employee,
   * service, job, page, or setting only writes/deletes that exact row in SheetDB
   * instead of overwriting all 6 worksheets.
   * Never overwrites existing image links with empty strings unless `allowClearImages: true`.
   */
  app.post(
    '/api/admin/record',
    requireAdminAuth,
    async (req: Request, res: Response) => {
      try {
        const {
          entityType,
          operation = 'upsert',
          recordId,
          record,
          allowClearImages = false,
        } = req.body || {};

        if (!entityType) {
          res.status(400).json({
            success: false,
            error: 'نوع السجل (entityType) مطلوب.',
          });
          return;
        }

        let externalSync = { synced: false, detail: '' };

        if (entityType === 'team') {
          if (operation === 'delete') {
            const targetId = String(recordId || record?.id || '').trim();
            if (!targetId || targetId === 'emp-ahmed-alabed') {
              res.status(400).json({
                success: false,
                error: 'لا يمكن حذف الرئيس التنفيذي أو معرف السجل غير صالح.',
              });
              return;
            }
            db.employees = db.employees
              .filter((e) => e.id !== targetId)
              .map((e) =>
                e.managerId === targetId
                  ? { ...e, managerId: 'emp-ahmed-alabed' }
                  : e
              );
            saveDatabase(db);
            externalSync = await deleteRecordFromSheetDb('Team', 'id', targetId);
          } else {
            const incoming = record as Employee;
            const existing = db.employees.find((e) => e.id === incoming.id);
            const preserved = preserveExistingImageFields(incoming, existing, {
              allowClearImages: Boolean(allowClearImages),
            });
            const normalizedUrl = resolvePublicImageUrl(
              preserved.image_url || preserved.avatarUrl,
              preserved.image_file_id
            );
            const extractedId =
              preserved.image_file_id ||
              extractGoogleDriveFileId(
                preserved.image_url || preserved.avatarUrl
              ) ||
              '';
            const finalEmp: Employee = normalizeEmployeeVisibility({
              ...existing,
              ...preserved,
              avatarUrl: normalizedUrl,
              image_url: normalizedUrl,
              image_file_id: extractedId,
            });
            const idx = db.employees.findIndex((e) => e.id === finalEmp.id);
            if (idx !== -1) {
              db.employees[idx] = finalEmp;
            } else {
              db.employees.push(finalEmp);
            }
            saveDatabase(db);

            // Check if only visibility/privacy flags changed or if localOnly is requested
            const coreFields: Array<keyof Employee> = [
              'nameAr',
              'nameEn',
              'jobTitleAr',
              'jobTitleEn',
              'departmentId',
              'managerId',
              'avatarUrl',
              'image_url',
              'image_file_id',
              'image_alt_ar',
              'initials',
              'bioAr',
              'email',
              'isConfirmedPosition',
              'order',
            ];
            const onlyVisibilityChanged =
              Boolean(existing) &&
              coreFields.every(
                (field) =>
                  String(existing![field] ?? '') ===
                  String(finalEmp[field] ?? '')
              );

            if (req.body?.localOnly === true || onlyVisibilityChanged) {
              externalSync = {
                synced: true,
                detail:
                  'تم حفظ إعدادات الظهور والخصوصية للموظف محلياً بنجاح (جاهزة للمزامنة مع Google Sheets عند اعتماد مخطط الأعمدة).',
              };
            } else {
              externalSync = await syncRecordToSheetDb(
                'Team',
                'id',
                finalEmp.id,
                finalEmp as any,
                { allowClearImages: Boolean(allowClearImages) }
              );
            }
          }
        } else if (entityType === 'services') {
          if (operation === 'delete') {
            const targetId = String(recordId || record?.id || '').trim();
            db.services = db.services.filter((s) => s.id !== targetId);
            saveDatabase(db);
            externalSync = await deleteRecordFromSheetDb(
              'Services',
              'id',
              targetId
            );
          } else {
            const incoming = record as ServiceItem;
            const existing = db.services.find((s) => s.id === incoming.id);
            const preserved = preserveExistingImageFields(incoming, existing, {
              allowClearImages: Boolean(allowClearImages),
            });
            const normalizedUrl = resolvePublicImageUrl(
              preserved.image_url,
              preserved.image_file_id
            );
            const extractedId =
              preserved.image_file_id ||
              extractGoogleDriveFileId(preserved.image_url) ||
              '';
            const finalSrv: ServiceItem = {
              ...preserved,
              image_url: normalizedUrl,
              image_file_id: extractedId,
            };
            const idx = db.services.findIndex((s) => s.id === finalSrv.id);
            if (idx !== -1) {
              db.services[idx] = finalSrv;
            } else {
              db.services.push(finalSrv);
            }
            saveDatabase(db);
            externalSync = await syncRecordToSheetDb(
              'Services',
              'id',
              finalSrv.id,
              {
                ...finalSrv,
                featuresAr: JSON.stringify(finalSrv.featuresAr || []),
              },
              { allowClearImages: Boolean(allowClearImages) }
            );
          }
        } else if (entityType === 'jobs') {
          if (operation === 'delete') {
            const targetId = String(recordId || record?.id || '').trim();
            db.jobs = db.jobs.filter((j) => j.id !== targetId);
            saveDatabase(db);
            externalSync = await deleteRecordFromSheetDb('Jobs', 'id', targetId);
          } else {
            const finalJob = record as JobVacancy;
            const idx = db.jobs.findIndex((j) => j.id === finalJob.id);
            if (idx !== -1) {
              db.jobs[idx] = finalJob;
            } else {
              db.jobs.unshift(finalJob);
            }
            saveDatabase(db);
            externalSync = await syncRecordToSheetDb('Jobs', 'id', finalJob.id, {
              ...finalJob,
              responsibilitiesAr: JSON.stringify(
                finalJob.responsibilitiesAr || []
              ),
              qualificationsAr: JSON.stringify(finalJob.qualificationsAr || []),
              accountingSkillsAr: JSON.stringify(
                finalJob.accountingSkillsAr || []
              ),
              softwareExperienceAr: JSON.stringify(
                finalJob.softwareExperienceAr || []
              ),
            });
          }
        } else if (entityType === 'pages') {
          const incoming = record as PageMetadata;
          const existing = db.pages.find((p) => p.id === incoming.id);
          const preserved = preserveExistingImageFields(incoming, existing, {
            allowClearImages: Boolean(allowClearImages),
          });
          const normalizedUrl = resolvePublicImageUrl(
            preserved.hero_image_url,
            preserved.hero_image_file_id
          );
          const extractedId =
            preserved.hero_image_file_id ||
            extractGoogleDriveFileId(preserved.hero_image_url) ||
            '';
          const finalPage: PageMetadata = {
            ...preserved,
            hero_image_url: normalizedUrl,
            hero_image_file_id: extractedId,
          };
          const idx = db.pages.findIndex((p) => p.id === finalPage.id);
          if (idx !== -1) {
            db.pages[idx] = finalPage;
          } else {
            db.pages.push(finalPage);
          }
          saveDatabase(db);
          externalSync = await syncRecordToSheetDb(
            'Pages',
            'id',
            finalPage.id,
            finalPage as any,
            { allowClearImages: Boolean(allowClearImages) }
          );
        }

        if (!externalSync.synced) {
          res.status(502).json({
            success: false,
            error: externalSync.detail,
            message: externalSync.detail,
            externalSync,
          });
          return;
        }

        res.json({
          success: true,
          message: externalSync.detail,
          externalSync,
          data: {
            profile: db.profile,
            departments: db.departments,
            employees: db.employees,
            jobs: db.jobs,
            services: db.services,
            pages: db.pages,
          },
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: err?.message || String(err),
        });
      }
    }
  );

  /**
   * POST /api/admin/sync-state
   * Persists full state changes (employees, jobs, services, pages, profile, departments)
   * across all 6 worksheets in Google Sheets (via SheetDB or Apps Script).
   * Preserves existing non-empty image URLs unless `allowClearImages: true`.
   */
  app.post(
    '/api/admin/sync-state',
    requireAdminAuth,
    async (req: Request, res: Response) => {
      try {
        const {
          profile,
          departments,
          employees,
          jobs,
          services,
          pages,
          allowClearImages = false,
        } = req.body || {};

        if (profile) {
          db.profile = preserveExistingImageFields(
            { ...db.profile, ...profile },
            db.profile,
            { allowClearImages: Boolean(allowClearImages) }
          );
        }
        if (Array.isArray(departments)) db.departments = departments;
        if (Array.isArray(employees)) {
          const existingMap = new Map(db.employees.map((e) => [e.id, e]));
          db.employees = employees.map((emp: Employee) => {
            const preserved = preserveExistingImageFields(
              emp,
              existingMap.get(emp.id),
              { allowClearImages: Boolean(allowClearImages) }
            );
            const normalizedUrl = resolvePublicImageUrl(
              preserved.image_url || preserved.avatarUrl,
              preserved.image_file_id
            );
            const extractedId =
              preserved.image_file_id ||
              extractGoogleDriveFileId(
                preserved.image_url || preserved.avatarUrl
              ) ||
              '';
            return {
              ...preserved,
              avatarUrl: normalizedUrl,
              image_url: normalizedUrl,
              image_file_id: extractedId,
            };
          });
        }
        if (Array.isArray(jobs)) db.jobs = jobs;
        if (Array.isArray(services)) {
          const existingMap = new Map(db.services.map((s) => [s.id, s]));
          db.services = services.map((srv: ServiceItem) => {
            const preserved = preserveExistingImageFields(
              srv,
              existingMap.get(srv.id),
              { allowClearImages: Boolean(allowClearImages) }
            );
            const normalizedUrl = resolvePublicImageUrl(
              preserved.image_url,
              preserved.image_file_id
            );
            const extractedId =
              preserved.image_file_id ||
              extractGoogleDriveFileId(preserved.image_url) ||
              '';
            return {
              ...preserved,
              image_url: normalizedUrl,
              image_file_id: extractedId,
            };
          });
        }
        if (Array.isArray(pages)) {
          const existingMap = new Map(db.pages.map((p) => [p.id, p]));
          db.pages = pages.map((pg: PageMetadata) => {
            const preserved = preserveExistingImageFields(
              pg,
              existingMap.get(pg.id),
              { allowClearImages: Boolean(allowClearImages) }
            );
            const normalizedUrl = resolvePublicImageUrl(
              preserved.hero_image_url,
              preserved.hero_image_file_id
            );
            const extractedId =
              preserved.hero_image_file_id ||
              extractGoogleDriveFileId(preserved.hero_image_url) ||
              '';
            return {
              ...preserved,
              hero_image_url: normalizedUrl,
              hero_image_file_id: extractedId,
            };
          });
        }

        const externalSync = await syncBundleToExternalDatabase();

        if (!externalSync.synced) {
          res.status(502).json({
            success: false,
            error:
              externalSync.detail ||
              'فشل تأكيد الحفظ في قاعدة البيانات الدائمة (SheetDB / Google Sheets).',
            message:
              externalSync.detail ||
              'فشل تأكيد الحفظ في قاعدة البيانات الدائمة (SheetDB / Google Sheets).',
            externalSync,
          });
          return;
        }

        db.backendMeta.lastSyncTime = new Date().toLocaleTimeString('ar-JO');
        saveDatabase(db);

        res.json({
          success: true,
          message: externalSync.detail,
          externalSync,
          data: {
            profile: db.profile,
            departments: db.departments,
            employees: db.employees,
            jobs: db.jobs,
            services: db.services,
            pages: db.pages,
          },
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: err?.message || String(err),
        });
      }
    }
  );

  /**
   * POST /api/admin/reset
   * Resets database to initial educational defaults.
   */
  app.post('/api/admin/reset', requireAdminAuth, (_req: Request, res: Response) => {
    db = {
      profile: INITIAL_COMPANY_PROFILE,
      departments: INITIAL_DEPARTMENTS,
      employees: INITIAL_EMPLOYEES,
      jobs: INITIAL_JOBS,
      services: INITIAL_SERVICES,
      pages: INITIAL_PAGES,
      backendMeta: db.backendMeta,
    };
    saveDatabase(db);
    res.json({
      success: true,
      message: 'تمت استعادة البيانات الافتراضية بنجاح.',
      data: {
        profile: db.profile,
        departments: db.departments,
        employees: db.employees,
        jobs: db.jobs,
        services: db.services,
        pages: db.pages,
      },
    });
  });

}

registerApiRoutes(apiApp);

async function startServer() {
  if (process.env.VERCEL_BUNDLE === '1') {
    return;
  }
  // ============================================================================
  // 4. VITE DEV MIDDLEWARE OR PRODUCTION STATIC ASSETS
  // ============================================================================
  const distPath = path.join(__dirname, 'dist');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(distPath);

  if (isProd) {
    apiApp.use(express.static(distPath));
    apiApp.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false, watch: null },
      appType: 'spa',
    });
    apiApp.use(vite.middlewares);
  }

  apiApp.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Masar server running on http://0.0.0.0:${PORT}`);
  });
}

if (
  process.env.VERCEL_BUNDLE !== '1' &&
  !process.env.VERCEL &&
  !process.env.AWS_LAMBDA_FUNCTION_NAME &&
  path.basename(MODULE_DIR) !== 'api' &&
  process.env.SMART_MASAR_NO_LISTEN !== '1'
) {
  startServer();
}

export default apiApp;




