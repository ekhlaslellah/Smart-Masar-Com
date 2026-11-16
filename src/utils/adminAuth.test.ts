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
      assert.equal(publicDataJson.data.employees.length, 6);
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
});
