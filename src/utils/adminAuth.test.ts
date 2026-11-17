/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  getConfiguredAdminKey,
  verifyAdminKeyConstantTime,
  createStatelessAdminSessionToken,
  verifyStatelessAdminSessionToken,
  isRequestAdminAuthenticated,
  buildAdminSessionSetCookie,
  buildAdminLogoutSetCookie,
  ADMIN_SESSION_COOKIE_NAME,
} from './adminAuth';

process.env.SMART_MASAR_NO_LISTEN = '1';

test('Admin Authentication & Vercel Serverless Compatibility Suite', async (t) => {
  const originalEnvKey = process.env.SMART_MASAR_ADMIN_KEY;

  t.after(() => {
    if (originalEnvKey === undefined) {
      delete process.env.SMART_MASAR_ADMIN_KEY;
    } else {
      process.env.SMART_MASAR_ADMIN_KEY = originalEnvKey;
    }
  });

  await t.test('1. Relies exclusively on process.env.SMART_MASAR_ADMIN_KEY with zero hardcoded fallback', () => {
    delete process.env.SMART_MASAR_ADMIN_KEY;
    assert.equal(getConfiguredAdminKey(), '');
    assert.equal(verifyAdminKeyConstantTime('any-key'), false);
    assert.throws(() => createStatelessAdminSessionToken(), /SMART_MASAR_ADMIN_KEY is not configured/);
    assert.equal(verifyStatelessAdminSessionToken('payload.signature'), false);
    assert.deepEqual(isRequestAdminAuthenticated({}), { authenticated: false, configured: false });
  });

  await t.test('2. Verifies constant-time admin key check and stateless HMAC-SHA256 session token lifecycle', () => {
    const testSecret = 'test_env_only_admin_key_9f8a7b6c5d4e';
    process.env.SMART_MASAR_ADMIN_KEY = testSecret;

    assert.equal(getConfiguredAdminKey(), testSecret);
    assert.equal(verifyAdminKeyConstantTime(testSecret), true);
    assert.equal(verifyAdminKeyConstantTime('wrong_key'), false);
    assert.equal(verifyAdminKeyConstantTime(''), false);

    // Create stateless session token (works across Vercel Serverless cold starts)
    const nowMs = 1_700_000_000_000;
    const token = createStatelessAdminSessionToken(testSecret, 86400, nowMs);
    assert.ok(token && token.includes('.'), 'Token must be <base64url-payload>.<hmac-signature>');
    assert.equal(
      token.includes(testSecret),
      false,
      'Session token must never contain or expose the raw admin key'
    );

    // Verify valid token before expiration
    assert.equal(verifyStatelessAdminSessionToken(token, testSecret, nowMs + 60_000), true);

    // Reject expired token
    assert.equal(verifyStatelessAdminSessionToken(token, testSecret, nowMs + 90_000_000), false);

    // Reject tampered signature
    const tampered = token.slice(0, -4) + '0000';
    assert.equal(verifyStatelessAdminSessionToken(tampered, testSecret, nowMs + 1000), false);

    // Reject token if SMART_MASAR_ADMIN_KEY changes on server
    process.env.SMART_MASAR_ADMIN_KEY = 'rotated_different_env_key_12345';
    assert.equal(verifyStatelessAdminSessionToken(token, undefined, nowMs + 1000), false);
  });

  await t.test('3. Verifies HttpOnly cookie attributes for login and logout', () => {
    process.env.SMART_MASAR_ADMIN_KEY = 'test_cookie_env_key_abc123';
    const token = createStatelessAdminSessionToken();
    const loginCookie = buildAdminSessionSetCookie(token, true);
    assert.ok(loginCookie.startsWith(`${ADMIN_SESSION_COOKIE_NAME}=`));
    assert.ok(loginCookie.includes('HttpOnly'));
    assert.ok(loginCookie.includes('SameSite=Lax'));
    assert.ok(loginCookie.includes('Secure'));

    const logoutCookie = buildAdminLogoutSetCookie(true);
    assert.ok(logoutCookie.startsWith(`${ADMIN_SESSION_COOKIE_NAME}=;`));
    assert.ok(logoutCookie.includes('Max-Age=0'));
    assert.ok(logoutCookie.includes('HttpOnly'));
  });

  await t.test('4. Verifies compiled Vercel Serverless bundle (api/index.js) has zero unbundled imports, zero listen(), and zero /tmp replacement', () => {
    const bundlePath = path.resolve('api/index.js');
    assert.equal(fs.existsSync(bundlePath), true, 'api/index.js unified bundle must exist');
    assert.equal(
      fs.existsSync(path.resolve('api/admin')),
      false,
      'Separate conflicting api/admin/* functions must not exist'
    );

    const bundleCode = fs.readFileSync(bundlePath, 'utf8');
    assert.equal(
      bundleCode.includes('/var/task/server') ||
        bundleCode.includes('../server') ||
        bundleCode.includes('./src/'),
      false,
      'api/index.js must be self-contained with zero relative imports to ../server or ./src/*'
    );
    assert.equal(
      bundleCode.includes('import("vite")') || bundleCode.includes("import('vite')"),
      false,
      'api/index.js must not import vite in serverless bundle'
    );
    assert.equal(
      bundleCode.includes('apiApp.listen('),
      false,
      'api/index.js must not invoke apiApp.listen() inside Serverless Function'
    );
    assert.equal(
      bundleCode.includes('/tmp/smart-masar') || bundleCode.includes('/tmp/'),
      false,
      'api/index.js must not replace persistent storage with /tmp'
    );
    assert.equal(
      bundleCode.includes('writeFileSync') ||
        bundleCode.includes('mkdirSync') ||
        bundleCode.includes('unlinkSync'),
      false,
      'api/index.js must not rely on writing to local container files (data/db.json or public/uploads) on Vercel'
    );

    const rootVercel = JSON.parse(fs.readFileSync(path.resolve('vercel.json'), 'utf8'));
    assert.ok(Array.isArray(rootVercel.rewrites));
    const hasApiRewrite = rootVercel.rewrites.some(
      (r: any) => r.source === '/api/(.*)' && r.destination === '/api/index'
    );
    const hasSpaRewrite = rootVercel.rewrites.some(
      (r: any) => r.source === '/((?!api/).*)' && r.destination === '/index.html'
    );
    assert.equal(hasApiRewrite, true, 'vercel.json must route /api/(.*) to /api/index');
    assert.equal(hasSpaRewrite, true, 'vercel.json must route non-API paths to /index.html');
  });

  await t.test('5. End-to-End Vercel Serverless Runtime Test on compiled api/index.js (session, verify, logout, public/data)', async () => {
    const bundleUrl = pathToFileURL(path.resolve('api/index.js')).href;
    const vercelBundleMod = await import(bundleUrl);
    const serverlessHandler = vercelBundleMod.default;
    assert.equal(typeof serverlessHandler, 'function', 'api/index.js default export must be an Express handler');

    const server = http.createServer(serverlessHandler);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address() as { port: number };
    const baseUrl = `http://127.0.0.1:${address.port}`;

    try {
      // 1) GET /api/public/data works and returns JSON with intact team, org, services, and jobs
      const publicDataRes = await fetch(`${baseUrl}/api/public/data`);
      assert.equal(publicDataRes.status, 200);
      assert.ok((publicDataRes.headers.get('content-type') || '').includes('application/json'));
      const publicDataJson: any = await publicDataRes.json();
      assert.equal(publicDataJson.success, true);
      assert.ok(Array.isArray(publicDataJson.data.employees));
      assert.equal(publicDataJson.data.employees.length, 10);
      assert.ok(Array.isArray(publicDataJson.data.departments));
      assert.equal(publicDataJson.data.departments.length, 10);
      assert.ok(Array.isArray(publicDataJson.data.services));
      assert.equal(publicDataJson.data.services.length, 4);
      assert.ok(Array.isArray(publicDataJson.data.pages));
      assert.equal(publicDataJson.data.pages.length, 7);
      assert.ok(Array.isArray(publicDataJson.data.jobs));
      assert.equal(publicDataJson.data.jobs.length, 2);

      // 2) GET /api/admin/auth/session when unconfigured returns HTTP 200 JSON { authenticated: false } (never HTTP 500)
      delete process.env.SMART_MASAR_ADMIN_KEY;
      const unconfSessionRes = await fetch(`${baseUrl}/api/admin/auth/session`);
      assert.equal(unconfSessionRes.status, 200);
      assert.ok((unconfSessionRes.headers.get('content-type') || '').includes('application/json'));
      const unconfSessionJson: any = await unconfSessionRes.json();
      assert.equal(unconfSessionJson.authenticated, false);

      // POST /api/admin/auth/verify when unconfigured returns 503 JSON
      const unconfVerifyRes = await fetch(`${baseUrl}/api/admin/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey: 'any_key' }),
      });
      assert.equal(unconfVerifyRes.status, 503);
      const unconfVerifyJson: any = await unconfVerifyRes.json();
      assert.equal(unconfVerifyJson.authenticated, false);

      // 3) Configure SMART_MASAR_ADMIN_KEY in environment
      const runtimeSecret = 'vercel_preview_admin_secret_2026_verified';
      process.env.SMART_MASAR_ADMIN_KEY = runtimeSecret;

      // GET /api/admin/auth/session without cookie returns HTTP 200 JSON { authenticated: false }
      const noCookieSessionRes = await fetch(`${baseUrl}/api/admin/auth/session`);
      assert.equal(noCookieSessionRes.status, 200);
      assert.ok((noCookieSessionRes.headers.get('content-type') || '').includes('application/json'));
      const noCookieSessionJson: any = await noCookieSessionRes.json();
      assert.equal(noCookieSessionJson.authenticated, false);

      // Also verify rewritten URL (/admin/auth/session without /api prefix) works identically
      const rewrittenSessionRes = await fetch(`${baseUrl}/admin/auth/session`);
      assert.equal(rewrittenSessionRes.status, 200);
      const rewrittenSessionJson: any = await rewrittenSessionRes.json();
      assert.equal(rewrittenSessionJson.authenticated, false);

      // POST /api/admin/auth/verify with invalid key returns 401 JSON
      const badLoginRes = await fetch(`${baseUrl}/api/admin/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey: 'wrong_password' }),
      });
      assert.equal(badLoginRes.status, 401);
      const badLoginJson: any = await badLoginRes.json();
      assert.equal(badLoginJson.authenticated, false);

      // 4) POST /api/admin/auth/verify with valid SMART_MASAR_ADMIN_KEY returns 200 JSON + HttpOnly cookie
      const goodLoginRes = await fetch(`${baseUrl}/api/admin/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey: runtimeSecret }),
      });
      assert.equal(goodLoginRes.status, 200);
      assert.ok((goodLoginRes.headers.get('content-type') || '').includes('application/json'));
      const setCookieHeader = goodLoginRes.headers.get('set-cookie') || '';
      assert.ok(setCookieHeader.includes(`${ADMIN_SESSION_COOKIE_NAME}=`));
      assert.ok(setCookieHeader.includes('HttpOnly'));
      const goodLoginJson: any = await goodLoginRes.json();
      assert.equal(goodLoginJson.authenticated, true);
      assert.equal(JSON.stringify(goodLoginJson).includes(runtimeSecret), false);

      const cookiePair = setCookieHeader.split(';')[0];

      // 5) GET /api/admin/auth/session with cookie returns 200 JSON { authenticated: true }
      const authedSessionRes = await fetch(`${baseUrl}/api/admin/auth/session`, {
        method: 'GET',
        headers: { Cookie: cookiePair },
      });
      assert.equal(authedSessionRes.status, 200);
      const authedSessionJson: any = await authedSessionRes.json();
      assert.equal(authedSessionJson.authenticated, true);

      // 6) POST /api/admin/auth/logout clears session cookie and returns 200 JSON { authenticated: false }
      const logoutRes = await fetch(`${baseUrl}/api/admin/auth/logout`, {
        method: 'POST',
        headers: { Cookie: cookiePair },
      });
      assert.equal(logoutRes.status, 200);
      assert.ok((logoutRes.headers.get('content-type') || '').includes('application/json'));
      const logoutCookieHeader = logoutRes.headers.get('set-cookie') || '';
      assert.ok(logoutCookieHeader.includes('Max-Age=0'));
      const logoutJson: any = await logoutRes.json();
      assert.equal(logoutJson.authenticated, false);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  await t.test('6. Verifies 6-tab SheetDB read/write, safe connectivity test, explicit image upload failure without Drive, and strict save confirmation', async () => {
    const bundleUrl = pathToFileURL(path.resolve('api/index.js')).href;
    const vercelBundleMod = await import(bundleUrl);
    const serverlessHandler = vercelBundleMod.default;

    const runtimeSecret = 'vercel_preview_admin_secret_2026_verified';
    process.env.SMART_MASAR_ADMIN_KEY = runtimeSecret;

    // Spin up a local mock SheetDB server so tests never write demo data to the live SheetDB endpoint
    const mockTabs: Record<string, any[]> = {
      Team: [],
      Services: [],
      Pages: [],
      SiteSettings: [],
      Departments: [],
      Jobs: [],
    };
    const mockHeaders: Record<string, string[]> = {
      Team: ['id', 'nameAr', 'nameEn', 'jobTitleAr', 'jobTitleEn', 'departmentId', 'managerId', 'avatarUrl', 'image_url', 'image_file_id', 'image_alt_ar', 'initials', 'bioAr', 'email', 'isConfirmedPosition', 'order'],
      Services: ['id', 'titleAr', 'titleEn', 'shortDescAr', 'featuresAr', 'iconName', 'image_url', 'image_file_id', 'image_alt_ar'],
      Pages: ['id', 'slug', 'titleAr', 'titleEn', 'subtitleAr', 'hero_image_url', 'hero_image_file_id', 'hero_image_alt_ar'],
      SiteSettings: ['Key', 'Value', 'logo_url', 'logo_file_id'],
      Departments: ['id', 'nameAr', 'nameEn', 'iconName', 'badgeBg'],
      Jobs: ['id', 'titleAr', 'titleEn', 'departmentId', 'departmentNameAr', 'status', 'employmentTypeAr', 'locationAr', 'experienceLevelAr', 'googleFormsUrl', 'summaryAr', 'responsibilitiesAr', 'qualificationsAr', 'accountingSkillsAr', 'softwareExperienceAr', 'applicationInstructionsAr', 'postedDate'],
    };
    let allowWrite = true;

    const mockSheetDbServer = http.createServer((req, res) => {
      const u = new URL(req.url || '/', 'http://127.0.0.1');
      const sheet = u.searchParams.get('sheet') || 'Team';
      res.setHeader('Content-Type', 'application/json');

      if (req.method === 'GET' && u.pathname === '/name') {
        res.end(JSON.stringify({ name: 'مؤسسة Masar Smart' }));
        return;
      }
      if (req.method === 'GET' && u.pathname === '/sheets') {
        res.end(JSON.stringify({ sheets: Object.keys(mockTabs) }));
        return;
      }
      if (req.method === 'GET' && u.pathname === '/keys') {
        res.end(JSON.stringify(mockHeaders[sheet] || []));
        return;
      }
      if (req.method === 'GET' && u.pathname === '/') {
        res.end(JSON.stringify(mockTabs[sheet] || []));
        return;
      }

      if (req.method === 'PATCH' || req.method === 'POST') {
        if (!allowWrite) {
          res.statusCode = 403;
          res.end(JSON.stringify({ error: 'Write access disabled on SheetDB' }));
          return;
        }
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
          const parsed = JSON.parse(body || '{}');
          if (req.method === 'PATCH') {
            const parts = u.pathname.split('/').filter(Boolean);
            const matchCol = decodeURIComponent(parts[0] || '');
            const matchVal = decodeURIComponent(parts[1] || '');
            if (matchVal === '__smart_masar_connectivity_probe__') {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'No results found' }));
              return;
            }
            const rows = mockTabs[sheet] || [];
            const idx = rows.findIndex((r) => String(r[matchCol]) === matchVal);
            if (idx !== -1) {
              rows[idx] = { ...rows[idx], ...(parsed.data || {}) };
              res.end(JSON.stringify({ updated: 1 }));
            } else {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'No results found' }));
            }
            return;
          }
          if (req.method === 'POST') {
            const items = Array.isArray(parsed.data) ? parsed.data : [parsed.data];
            mockTabs[sheet] = [...(mockTabs[sheet] || []), ...items];
            res.statusCode = 201;
            res.end(JSON.stringify({ created: items.length }));
            return;
          }
        });
        return;
      }

      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'Not found' }));
    });

    await new Promise<void>((resolve) => mockSheetDbServer.listen(0, '127.0.0.1', resolve));
    const mockPort = (mockSheetDbServer.address() as { port: number }).port;
    const mockSheetDbUrl = `http://127.0.0.1:${mockPort}`;

    const appServer = http.createServer(serverlessHandler);
    await new Promise<void>((resolve) => appServer.listen(0, '127.0.0.1', resolve));
    const appPort = (appServer.address() as { port: number }).port;
    const baseUrl = `http://127.0.0.1:${appPort}`;

    try {
      // Login as admin
      const loginRes = await fetch(`${baseUrl}/api/admin/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey: runtimeSecret }),
      });
      const cookiePair = (loginRes.headers.get('set-cookie') || '').split(';')[0];

      // Point server to mock SheetDB for isolated write/upload testing
      await fetch(`${baseUrl}/api/admin/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookiePair },
        body: JSON.stringify({ sheetDbUrl: mockSheetDbUrl, webAppUrl: '' }),
      });

      // A) Safe connectivity test checks all 6 tabs, read access, and non-destructive write probe without mutating rows
      const statusRes = await fetch(`${baseUrl}/api/admin/sheetdb-status`, {
        headers: { Cookie: cookiePair },
      });
      assert.equal(statusRes.status, 200);
      const statusJson: any = await statusRes.json();
      assert.equal(statusJson.reachable, true);
      assert.equal(statusJson.readAccess.ok, true);
      assert.equal(statusJson.readAccess.verifiedTabs, 6);
      assert.equal(statusJson.writeAccess.ok, true);
      assert.equal(mockTabs.SiteSettings.length, 0, 'Connectivity probe must not insert any rows');
      assert.equal(JSON.stringify(statusJson).includes(runtimeSecret), false, 'Must not expose credentials');

      // B) Image upload fails explicitly (502, success: false) when Google Drive persistent storage is unavailable, never returning fake /uploads/ links
      const onePxPngBase64 =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
      const uploadFailRes = await fetch(`${baseUrl}/api/admin/upload-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookiePair },
        body: JSON.stringify({
          fileName: 'avatar.png',
          mimeType: 'image/png',
          base64Data: onePxPngBase64,
          entityType: 'team',
          entityId: 'emp-ahmed-alabed',
        }),
      });
      assert.equal(uploadFailRes.status, 502);
      const uploadFailJson: any = await uploadFailRes.json();
      assert.equal(uploadFailJson.success, false);
      assert.equal(uploadFailJson.driveUploaded, false);
      assert.equal(
        String(uploadFailJson.imageUrl || '').includes('/uploads/'),
        false,
        'Must never return fake /uploads/ links as permanent uploads'
      );

      // C) When write access is disabled on persistent storage, /api/admin/sync-state fails with 502 and success: false
      allowWrite = false;
      const failedSyncRes = await fetch(`${baseUrl}/api/admin/sync-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookiePair },
        body: JSON.stringify({}),
      });
      assert.equal(failedSyncRes.status, 502);
      const failedSyncJson: any = await failedSyncRes.json();
      assert.equal(failedSyncJson.success, false);
      assert.equal(failedSyncJson.externalSync.synced, false);

      // D) When write access is enabled, /api/admin/sync-state writes all 6 tabs and confirms the write
      allowWrite = true;
      const okSyncRes = await fetch(`${baseUrl}/api/admin/sync-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookiePair },
        body: JSON.stringify({}),
      });
      assert.equal(okSyncRes.status, 200);
      const okSyncJson: any = await okSyncRes.json();
      assert.equal(okSyncJson.success, true);
      assert.equal(okSyncJson.externalSync.synced, true);
      assert.ok(mockTabs.SiteSettings.length > 0, 'SiteSettings tab must be written');
      assert.ok(mockTabs.Departments.length > 0, 'Departments tab must be written');
      assert.ok(mockTabs.Team.length > 0, 'Team tab must be written');
      assert.ok(mockTabs.Services.length > 0, 'Services tab must be written');
      assert.ok(mockTabs.Pages.length > 0, 'Pages tab must be written');
      assert.ok(mockTabs.Jobs.length > 0, 'Jobs tab must be written');

      // E) Verify backup security: zero backup files in public/, 401 for unauthenticated visitors, 200 for authenticated admin
      assert.equal(
        fs.existsSync(path.resolve('public/backups')),
        false,
        'public/backups must not exist in public directory'
      );
      assert.equal(
        fs.existsSync(path.resolve('public/smart-masar-complete-project.zip')),
        false,
        'project zip must not exist in public directory'
      );

      const unauthBackupZip = await fetch(`${baseUrl}/api/download-recovery-backup`);
      assert.equal(
        unauthBackupZip.status,
        401,
        'Unauthenticated visitor must get 401 on /api/download-recovery-backup'
      );

      const unauthBackupJson = await fetch(`${baseUrl}/api/download-recovery-json`);
      assert.equal(
        unauthBackupJson.status,
        401,
        'Unauthenticated visitor must get 401 on /api/download-recovery-json'
      );

      const authBackupZip = await fetch(`${baseUrl}/api/download-recovery-backup`, {
        headers: { Cookie: cookiePair },
      });
      assert.equal(
        authBackupZip.status,
        200,
        'Authenticated admin must get 200 on /api/download-recovery-backup'
      );

      const authBackupJson = await fetch(`${baseUrl}/api/download-recovery-json`, {
        headers: { Cookie: cookiePair },
      });
      assert.equal(
        authBackupJson.status,
        200,
        'Authenticated admin must get 200 on /api/download-recovery-json'
      );

      // Reset server sheetDbUrl back to production default https://sheetdb.io/api/v1/9537p5ct7m308
      await fetch(`${baseUrl}/api/admin/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookiePair },
        body: JSON.stringify({
          sheetDbUrl: 'https://sheetdb.io/api/v1/9537p5ct7m308',
          webAppUrl: '',
        }),
      });
    } finally {
      await new Promise<void>((resolve) => appServer.close(() => resolve()));
      await new Promise<void>((resolve) => mockSheetDbServer.close(() => resolve()));
    }
  });
});

