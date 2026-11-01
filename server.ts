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
} from './src/utils/imageUrl';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const DEFAULT_SHEETDB_URL =
  process.env.SHEETDB_API_URL || 'https://sheetdb.io/api/v1/gnn52l70oflrp';
const DEFAULT_ADMIN_KEY =
  process.env.SMART_MASAR_ADMIN_KEY || 'sm_masar_admin_secret_2026';
const SERVER_SESSION_TOKEN = crypto.randomBytes(32).toString('hex');

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

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
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
    driveFolderId: string;
    adminKey: string;
    lastSyncTime?: string;
    lastSheetDbStatus?: string;
    externalSource?: string;
    availableSheets?: string[];
    missingRequiredSheets?: string[];
  };
}

function loadDatabase(): ServerDatabase {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
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
          sheetDbUrl: parsed.backendMeta?.sheetDbUrl || DEFAULT_SHEETDB_URL,
          driveFolderId:
            parsed.backendMeta?.driveFolderId ||
            process.env.GOOGLE_DRIVE_FOLDER_ID ||
            '',
          adminKey: parsed.backendMeta?.adminKey || DEFAULT_ADMIN_KEY,
          lastSyncTime: parsed.backendMeta?.lastSyncTime,
          lastSheetDbStatus: parsed.backendMeta?.lastSheetDbStatus,
          externalSource: parsed.backendMeta?.externalSource,
          availableSheets: parsed.backendMeta?.availableSheets,
          missingRequiredSheets: parsed.backendMeta?.missingRequiredSheets,
        },
      };
    }
  } catch (err) {
    console.warn('Failed to load server db.json, initializing defaults:', err);
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
      adminKey: DEFAULT_ADMIN_KEY,
    },
  };
  saveDatabase(initial);
  return initial;
}

function saveDatabase(db: ServerDatabase): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing db.json:', err);
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

function parseCookies(cookieHeader?: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      const k = part.slice(0, idx).trim();
      const v = part.slice(idx + 1).trim();
      result[k] = decodeURIComponent(v);
    }
  }
  return result;
}

/**
 * Server-verified Admin Authorization Middleware.
 * Protects all write operations, Google Drive uploads, and SheetDB updates.
 */
function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const cookies = parseCookies(req.headers.cookie);
  if (cookies.sm_admin_session && cookies.sm_admin_session === SERVER_SESSION_TOKEN) {
    next();
    return;
  }

  const headerKey =
    (req.headers['x-admin-key'] as string) ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : '');
  const expectedKey = db.backendMeta.adminKey || DEFAULT_ADMIN_KEY;

  if (!headerKey || headerKey.trim() !== expectedKey.trim()) {
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

/**
 * Queries SheetDB API status (name, sheets, keys, and all 6 required worksheet tabs)
 * without exposing write credentials.
 */
async function checkSheetDbStatus(sheetDbUrl: string): Promise<{
  reachable: boolean;
  spreadsheetName?: string;
  sheets?: string[];
  requiredSheets?: string[];
  missingSheets?: string[];
  worksheetChecks?: Record<string, { exists: boolean; status: number; rowCount: number }>;
  keys?: string[];
  isEmptyHeader?: boolean;
  messageAr: string;
}> {
  try {
    const cleanUrl = sheetDbUrl.replace(/\/+$/, '');
    const [nameRes, sheetsRes, keysRes] = await Promise.all([
      fetch(`${cleanUrl}/name`),
      fetch(`${cleanUrl}/sheets`),
      fetch(`${cleanUrl}/keys`),
    ]);

    const nameJson: any = nameRes.ok ? await nameRes.json().catch(() => ({})) : {};
    const sheetsJson: any = sheetsRes.ok ? await sheetsRes.json().catch(() => ({})) : {};
    const keysJson: any = await keysRes.json().catch(() => ({}));

    const spreadsheetName = nameJson?.name || 'Google Sheet';
    const sheets: string[] = Array.isArray(sheetsJson?.sheets) ? sheetsJson.sheets : [];
    const isEmptyHeader =
      Boolean(keysJson?.error) &&
      String(keysJson.error).toLowerCase().includes('spreadsheet is empty');
    const keys: string[] = Array.isArray(keysJson) ? keysJson : [];

    const missingSheets: string[] = [];
    const worksheetChecks: Record<
      string,
      { exists: boolean; status: number; rowCount: number }
    > = {};

    for (const reqSheet of REQUIRED_WORKSHEETS) {
      const existsInList = sheets.includes(reqSheet);
      if (!existsInList) {
        missingSheets.push(reqSheet);
        worksheetChecks[reqSheet] = { exists: false, status: 404, rowCount: 0 };
      } else {
        try {
          const tabRes = await fetch(
            `${cleanUrl}?sheet=${encodeURIComponent(reqSheet)}`
          );
          const tabRows: any = tabRes.ok
            ? await tabRes.json().catch(() => [])
            : [];
          worksheetChecks[reqSheet] = {
            exists: tabRes.ok,
            status: tabRes.status,
            rowCount: Array.isArray(tabRows) ? tabRows.length : 0,
          };
          if (!tabRes.ok) missingSheets.push(reqSheet);
        } catch {
          worksheetChecks[reqSheet] = { exists: false, status: 500, rowCount: 0 };
          missingSheets.push(reqSheet);
        }
      }
    }

    db.backendMeta.availableSheets = sheets;
    db.backendMeta.missingRequiredSheets = missingSheets;

    if (isEmptyHeader || missingSheets.length > 0) {
      return {
        reachable: true,
        spreadsheetName,
        sheets,
        requiredSheets: [...REQUIRED_WORKSHEETS],
        missingSheets,
        worksheetChecks,
        keys: [],
        isEmptyHeader,
        messageAr: `متصل بـ SheetDB (ملف "${spreadsheetName}") — الأوراق الحالية في الملف: [${sheets.join(
          '، '
        )}]. الأوراق الست المطلوبة (${REQUIRED_WORKSHEETS.join(
          ', '
        )}) غير مهيأة بعد؛ يرجى تشغيل دالة initialSetup() مرة واحدة في Google Apps Script لإنشاء الأوراق الست وعناوين الأعمدة تلقائياً.`,
      };
    }

    return {
      reachable: true,
      spreadsheetName,
      sheets,
      requiredSheets: [...REQUIRED_WORKSHEETS],
      missingSheets: [],
      worksheetChecks,
      keys,
      isEmptyHeader: false,
      messageAr: `متصل بنجاح بـ SheetDB (ملف "${spreadsheetName}") — كافة الأوراق الست (${REQUIRED_WORKSHEETS.join(
        '، '
      )}) جاهزة ومتصلة.`,
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
            db.profile = { ...db.profile, ...d.profile };
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

  // 2. Query SheetDB (`https://sheetdb.io/api/v1/gnn52l70oflrp`)
  const sheetDbUrl = (db.backendMeta.sheetDbUrl || DEFAULT_SHEETDB_URL).replace(
    /\/+$/,
    ''
  );
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
            if (r.Key) settingsObj[r.Key] = r.Value;
          }
          if (Object.keys(settingsObj).length > 0) {
            db.profile = { ...db.profile, ...settingsObj };
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
          db.departments = rows as Department[];
          hydratedAnyTab = true;
        }
      }
    }

    if (availableSheets.includes('Team')) {
      const res = await fetch(`${sheetDbUrl}?sheet=Team`);
      if (res.ok) {
        const rows: any[] = await res.json().catch(() => []);
        if (Array.isArray(rows) && rows.length > 0) {
          db.employees = rows.map((emp: any) => ({
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
      : 'server_db_awaiting_sheet_init';
    saveDatabase(db);
  } catch {
    // Keep existing server db state if network call fails
  }
}

/**
 * Updates a record in SheetDB (https://sheetdb.io/api/v1/gnn52l70oflrp) when the sheet tab & headers exist.
 */
async function syncRecordToSheetDb(
  sheetName: WorksheetName,
  matchField: string,
  matchValue: string,
  recordData: Record<string, any>
): Promise<{ synced: boolean; detail: string }> {
  const sheetDbUrl = (db.backendMeta.sheetDbUrl || DEFAULT_SHEETDB_URL).replace(
    /\/+$/,
    ''
  );
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
        detail: `تم الحفظ في قاعدة بيانات الخادم. الورقة "${sheetName}" غير موجودة بعد في ملف Google Sheets المرتبط بـ SheetDB (الأوراق الموجودة حالياً: ${availableSheets.join(
          ', '
        )}). شغّل initialSetup() في Apps Script لإنشاء الأوراق الست.`,
      };
    }

    const sheetQuery = `?sheet=${encodeURIComponent(sheetName)}`;

    // Check if the target sheet has headers initialized
    const keysRes = await fetch(`${sheetDbUrl}/keys${sheetQuery}`);
    const keysJson: any = await keysRes.json().catch(() => ({}));
    if (keysJson?.error) {
      return {
        synced: false,
        detail:
          'تم الحفظ في خادم سمارت مسار. جدول Google Sheets المرتبط بـ SheetDB يحتاج تهيئة الصف الأول (أسماء الأعمدة) عبر تشغيل initialSetup() في Apps Script.',
      };
    }

    // Try PATCH first (updates existing row by matchField/matchValue)
    const patchUrl = `${sheetDbUrl}/${encodeURIComponent(
      matchField
    )}/${encodeURIComponent(matchValue)}${sheetQuery}`;
    const patchRes = await fetch(patchUrl, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: recordData }),
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
      body: JSON.stringify({ data: [recordData] }),
    });

    if (postRes.ok) {
      db.backendMeta.lastSyncTime = new Date().toLocaleTimeString('ar-JO');
      saveDatabase(db);
      return {
        synced: true,
        detail: `تمت إضافة السجل في Google Sheets عبر SheetDB (${sheetName})`,
      };
    }

    return {
      synced: false,
      detail: `استجابة SheetDB: HTTP ${postRes.status}`,
    };
  } catch (err: any) {
    return {
      synced: false,
      detail: `تعذر تحديث SheetDB: ${err?.message || String(err)}`,
    };
  }
}

/**
 * Pushes full state bundle to Google Apps Script (if configured) or checks SheetDB tabs.
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
          apiKey: db.backendMeta.adminKey || DEFAULT_ADMIN_KEY,
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
      // Fall through to SheetDB check
    }
  }

  const sheetStatus = await checkSheetDbStatus(
    db.backendMeta.sheetDbUrl || DEFAULT_SHEETDB_URL
  );
  if (
    sheetStatus.reachable &&
    (!sheetStatus.missingSheets || sheetStatus.missingSheets.length === 0) &&
    !sheetStatus.isEmptyHeader
  ) {
    // Sync employees & services & jobs & pages to SheetDB
    for (const emp of db.employees) {
      await syncRecordToSheetDb('Team', 'id', emp.id, emp as any);
    }
    for (const srv of db.services) {
      await syncRecordToSheetDb('Services', 'id', srv.id, {
        ...srv,
        featuresAr: JSON.stringify(srv.featuresAr),
      });
    }
    for (const pg of db.pages) {
      await syncRecordToSheetDb('Pages', 'id', pg.id, pg as any);
    }
    for (const job of db.jobs) {
      await syncRecordToSheetDb('Jobs', 'id', job.id, {
        ...job,
        responsibilitiesAr: JSON.stringify(job.responsibilitiesAr),
        qualificationsAr: JSON.stringify(job.qualificationsAr),
        accountingSkillsAr: JSON.stringify(job.accountingSkillsAr),
        softwareExperienceAr: JSON.stringify(job.softwareExperienceAr),
      });
    }
    return {
      synced: true,
      detail: 'تمت مزامنة السجلات مع Google Sheets عبر SheetDB بنجاح.',
    };
  }

  return {
    synced: false,
    detail: sheetStatus.messageAr,
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
        'رابط Google Apps Script غير مضبوط بعد — تم حفظ الصورة وتقديمها مباشرة عبر خادم الموقع.',
    };
  }

  try {
    const res = await fetch(webAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'uploadImageToDrive',
        apiKey: db.backendMeta.adminKey || DEFAULT_ADMIN_KEY,
        folderId: db.backendMeta.driveFolderId || '',
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
        error: `Apps Script HTTP ${res.status}`,
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
      error: json?.error || 'لم يرجع Apps Script معرف ملف Google Drive',
    };
  } catch (err: any) {
    return {
      uploadedToDrive: false,
      error: err?.message || String(err),
    };
  }
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '12mb' }));

  // Serve uploaded files directly from /public/uploads
  app.use(
    '/uploads',
    express.static(UPLOADS_DIR, {
      maxAge: '7d',
      etag: true,
    })
  );

  // ============================================================================
  // 1. PUBLIC API ENDPOINTS (Unauthenticated Read-Only)
  // ============================================================================

  /**
   * GET /api/public/data
   * Hydrates from external SheetDB / Google Apps Script when worksheets are initialized,
   * and returns sanitized public website records (no keys, no admin credentials).
   */
  app.get('/api/public/data', async (req: Request, res: Response) => {
    const forceRefresh = req.query.refresh === '1';
    await hydrateFromExternalDatabase(forceRefresh);

    res.json({
      success: true,
      data: {
        profile: db.profile,
        departments: db.departments,
        employees: db.employees,
        jobs: db.jobs,
        services: db.services,
        pages: db.pages,
      },
      meta: {
        hasAppsScript: Boolean(db.backendMeta.webAppUrl),
        hasDriveFolder: Boolean(db.backendMeta.driveFolderId),
        sheetDbUrl: db.backendMeta.sheetDbUrl || DEFAULT_SHEETDB_URL,
        lastSyncTime: db.backendMeta.lastSyncTime || null,
        externalSource:
          db.backendMeta.externalSource || 'server_db_awaiting_sheet_init',
        availableSheets: db.backendMeta.availableSheets || [],
        missingRequiredSheets:
          db.backendMeta.missingRequiredSheets || [...REQUIRED_WORKSHEETS],
      },
    });
  });

  /**
   * GET /api/download-static-zip
   * Downloads the ready-to-upload Static Hosting Production Build ZIP
   * (index.html, compiled CSS/JS assets, images, standalone HTML, routing configs, and step-by-step README.md).
   */
  app.get('/api/download-static-zip', (_req: Request, res: Response) => {
    if (!fs.existsSync(STATIC_HOSTING_ZIP_PATH)) {
      res.status(404).json({
        success: false,
        error: 'ملف حزمة الاستضافة الثابتة غير موجود حالياً على الخادم.',
      });
      return;
    }
    res.download(STATIC_HOSTING_ZIP_PATH, 'smart-masar-static-hosting.zip');
  });

  /**
   * GET /api/download-project-zip
   * Downloads the complete Smart Masar project archive (frontend, server.ts, backend/google-apps-script.js, configs, DEPLOYMENT.md).
   */
  app.get('/api/download-project-zip', (_req: Request, res: Response) => {
    if (!fs.existsSync(PROJECT_ZIP_PATH)) {
      res.status(404).json({
        success: false,
        error: 'ملف الأرشيف غير موجود حالياً على الخادم.',
      });
      return;
    }
    res.download(PROJECT_ZIP_PATH, 'smart-masar-complete-project.zip');
  });

  /**
   * GET /api/download-html
   * Downloads the complete standalone single-file HTML version of Smart Masar.
   */
  app.get('/api/download-html', (_req: Request, res: Response) => {
    const htmlPath = path.join(__dirname, 'public', 'smart-masar.html');
    if (!fs.existsSync(htmlPath)) {
      res.status(404).json({
        success: false,
        error: 'ملف HTML غير موجود حالياً على الخادم.',
      });
      return;
    }
    res.download(htmlPath, 'smart-masar.html');
  });

  /**
   * GET /api/images/drive/:fileId
   * Server-side image delivery proxy for Google Drive files.
   * Ensures images stored in Google Drive render in unauthenticated browser sessions
   * even when browsers block third-party Google cookies or redirect chains.
   */
  app.get('/api/images/drive/:fileId', async (req: Request, res: Response) => {
    const fileId = String(req.params.fileId || '').trim();
    if (!fileId || !/^[a-zA-Z0-9_-]{6,120}$/.test(fileId)) {
      res.status(400).send('Invalid file ID');
      return;
    }

    // 1. Check if we have a cached local copy in /public/uploads
    const localMatches = fs
      .readdirSync(UPLOADS_DIR)
      .filter((f) => f.includes(fileId));
    if (localMatches.length > 0) {
      const filePath = path.join(UPLOADS_DIR, localMatches[0]);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.sendFile(filePath);
      return;
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
   * POST /api/admin/auth/session
   * Establishes a server-verified HttpOnly admin session cookie without exposing secrets to the client.
   */
  app.post('/api/admin/auth/session', (req: Request, res: Response) => {
    const { adminKey } = req.body || {};
    const expectedKey = db.backendMeta.adminKey || DEFAULT_ADMIN_KEY;
    const isCustomKeyConfigured = Boolean(process.env.SMART_MASAR_ADMIN_KEY);

    if (
      !isCustomKeyConfigured ||
      (adminKey && String(adminKey).trim() === expectedKey.trim())
    ) {
      res.setHeader(
        'Set-Cookie',
        `sm_admin_session=${SERVER_SESSION_TOKEN}; HttpOnly; Path=/; SameSite=Lax; Max-Age=86400`
      );
      res.json({
        success: true,
        authenticated: true,
        config: {
          webAppUrl: db.backendMeta.webAppUrl,
          sheetDbUrl: db.backendMeta.sheetDbUrl,
          driveFolderId: db.backendMeta.driveFolderId,
          lastSyncTime: db.backendMeta.lastSyncTime,
        },
      });
      return;
    }

    res.status(401).json({
      success: false,
      authenticated: false,
      error: 'يرجى إدخال مفتاح صلاحية المسؤول المعتمد على الخادم.',
    });
  });

  /**
   * POST /api/admin/auth/verify
   * Verifies administrator secret key on the server and sets HttpOnly session cookie.
   */
  app.post('/api/admin/auth/verify', (req: Request, res: Response) => {
    const { adminKey } = req.body || {};
    const expectedKey = db.backendMeta.adminKey || DEFAULT_ADMIN_KEY;
    const cookies = parseCookies(req.headers.cookie);
    const hasValidCookie =
      cookies.sm_admin_session && cookies.sm_admin_session === SERVER_SESSION_TOKEN;

    if (hasValidCookie || (adminKey && String(adminKey).trim() === expectedKey.trim())) {
      res.setHeader(
        'Set-Cookie',
        `sm_admin_session=${SERVER_SESSION_TOKEN}; HttpOnly; Path=/; SameSite=Lax; Max-Age=86400`
      );
      res.json({
        success: true,
        authenticated: true,
        config: {
          webAppUrl: db.backendMeta.webAppUrl,
          sheetDbUrl: db.backendMeta.sheetDbUrl,
          driveFolderId: db.backendMeta.driveFolderId,
          lastSyncTime: db.backendMeta.lastSyncTime,
        },
      });
      return;
    }
    res.status(401).json({
      success: false,
      authenticated: false,
      error: 'مفتاح صلاحية المسؤول غير صحيح.',
    });
  });

  /**
   * GET /api/admin/sheetdb-status
   * Checks live connection to SheetDB (https://sheetdb.io/api/v1/gnn52l70oflrp) & all 6 required worksheets.
   */
  app.get(
    '/api/admin/sheetdb-status',
    requireAdminAuth,
    async (_req: Request, res: Response) => {
      const status = await checkSheetDbStatus(
        db.backendMeta.sheetDbUrl || DEFAULT_SHEETDB_URL
      );
      db.backendMeta.lastSheetDbStatus = status.messageAr;
      saveDatabase(db);
      res.json({
        success: true,
        sheetDbUrl: db.backendMeta.sheetDbUrl || DEFAULT_SHEETDB_URL,
        webAppUrl: db.backendMeta.webAppUrl || '',
        driveFolderId: db.backendMeta.driveFolderId || '',
        ...status,
      });
    }
  );

  /**
   * POST /api/admin/config
   * Updates server-side Google Apps Script URL, Google Drive folder ID, SheetDB URL, or Admin Key.
   */
  app.post('/api/admin/config', requireAdminAuth, (req: Request, res: Response) => {
    const { webAppUrl, sheetDbUrl, driveFolderId, newAdminKey } = req.body || {};
    if (typeof webAppUrl === 'string') {
      db.backendMeta.webAppUrl = webAppUrl.trim();
    }
    if (typeof sheetDbUrl === 'string' && sheetDbUrl.trim()) {
      db.backendMeta.sheetDbUrl = sheetDbUrl.trim();
    }
    if (typeof driveFolderId === 'string') {
      db.backendMeta.driveFolderId = driveFolderId.trim();
      db.profile.drive_folder_id = driveFolderId.trim();
    }
    if (typeof newAdminKey === 'string' && newAdminKey.trim().length >= 6) {
      db.backendMeta.adminKey = newAdminKey.trim();
    }
    saveDatabase(db);
    res.json({
      success: true,
      message: 'تم حفظ إعدادات الربط السحابي ومجلد Google Drive في الخادم بنجاح.',
      config: {
        webAppUrl: db.backendMeta.webAppUrl,
        sheetDbUrl: db.backendMeta.sheetDbUrl,
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
   * (when Apps Script is configured) + local server storage, and updates the
   * corresponding Google Sheets / SheetDB record.
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

        // 1. Attempt upload to Google Drive via Apps Script if configured
        const driveResult = await uploadToGoogleDriveViaAppsScript({
          fileName: `${safeEntity}-${safeId}-${timestamp}${ext}`,
          mimeType: magicCheck.detectedMime || normalizedMime,
          base64Data: cleanBase64,
          entityType: safeEntity,
          entityId: safeId,
          altAr,
          previousFileId,
        });

        const fileId =
          driveResult.uploadedToDrive && driveResult.driveFileId
            ? driveResult.driveFileId
            : `sm-${safeEntity}-${safeId}-${timestamp}`;

        // 2. Save binary image on server (/public/uploads) for instant, reliable delivery
        const diskFileName = `${fileId}${ext}`;
        const diskFilePath = path.join(UPLOADS_DIR, diskFileName);
        fs.writeFileSync(diskFilePath, imageBuffer);

        // Delete previous local file if replacing an existing image
        if (previousFileId && previousFileId !== fileId) {
          const oldFiles = fs
            .readdirSync(UPLOADS_DIR)
            .filter((f) => f.startsWith(String(previousFileId)));
          for (const oldFile of oldFiles) {
            try {
              fs.unlinkSync(path.join(UPLOADS_DIR, oldFile));
            } catch {
              // ignore cleanup errors
            }
          }
        }

        const publicDisplayUrl = `/uploads/${diskFileName}`;

        // 3. Automatically update corresponding record in Server Database & SheetDB
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

        res.json({
          success: true,
          imageUrl: publicDisplayUrl,
          fileId,
          driveUploaded: driveResult.uploadedToDrive,
          driveDirectUrl: driveResult.driveDirectUrl || null,
          driveViewUrl: driveResult.driveViewUrl || null,
          driveNotice: driveResult.error || null,
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
   * Removes an image reference from a record without deleting unrelated record data.
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

        // Remove local uploaded file if present
        if (fileId) {
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
              db.employees[idx]
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
              }
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
              db.pages[idx]
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
            }
          );
        }

        res.json({
          success: true,
          message:
            'تمت إزالة الصورة وتحديث السجل بنجاح دون المساس بالبيانات الأخرى.',
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
   * POST /api/admin/sync-state
   * Persists full state changes (employees, jobs, services, pages, profile, departments)
   * on the server and pushes changes to SheetDB / Google Apps Script when initialized.
   */
  app.post(
    '/api/admin/sync-state',
    requireAdminAuth,
    async (req: Request, res: Response) => {
      try {
        const { profile, departments, employees, jobs, services, pages } =
          req.body || {};

        if (profile) db.profile = { ...db.profile, ...profile };
        if (Array.isArray(departments)) db.departments = departments;
        if (Array.isArray(employees)) {
          db.employees = employees.map((emp: Employee) => {
            const normalizedUrl = resolvePublicImageUrl(
              emp.image_url || emp.avatarUrl,
              emp.image_file_id
            );
            const extractedId =
              emp.image_file_id ||
              extractGoogleDriveFileId(emp.image_url || emp.avatarUrl) ||
              '';
            return {
              ...emp,
              avatarUrl: normalizedUrl,
              image_url: normalizedUrl,
              image_file_id: extractedId,
            };
          });
        }
        if (Array.isArray(jobs)) db.jobs = jobs;
        if (Array.isArray(services)) {
          db.services = services.map((srv: ServiceItem) => {
            const normalizedUrl = resolvePublicImageUrl(
              srv.image_url,
              srv.image_file_id
            );
            const extractedId =
              srv.image_file_id || extractGoogleDriveFileId(srv.image_url) || '';
            return {
              ...srv,
              image_url: normalizedUrl,
              image_file_id: extractedId,
            };
          });
        }
        if (Array.isArray(pages)) {
          db.pages = pages.map((pg: PageMetadata) => {
            const normalizedUrl = resolvePublicImageUrl(
              pg.hero_image_url,
              pg.hero_image_file_id
            );
            const extractedId =
              pg.hero_image_file_id ||
              extractGoogleDriveFileId(pg.hero_image_url) ||
              '';
            return {
              ...pg,
              hero_image_url: normalizedUrl,
              hero_image_file_id: extractedId,
            };
          });
        }

        db.backendMeta.lastSyncTime = new Date().toLocaleTimeString('ar-JO');
        saveDatabase(db);

        const externalSync = await syncBundleToExternalDatabase();

        res.json({
          success: true,
          message: 'تم حفظ ومزامنة البيانات على الخادم بنجاح.',
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

  // ============================================================================
  // 4. VITE DEV MIDDLEWARE OR PRODUCTION STATIC ASSETS
  // ============================================================================
  const distPath = path.join(__dirname, 'dist');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(distPath);

  if (isProd) {
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Masar server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
