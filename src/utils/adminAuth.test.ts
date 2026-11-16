/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
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

  await t.test('4. Integration test: /api/admin/auth/* login, session check, protected routes, and logout', async () => {
    const { apiApp } = await import('../../server');
    const server = http.createServer(apiApp);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address() as { port: number };
    const baseUrl = `http://127.0.0.1:${address.port}`;

    try {
      // Case A: SMART_MASAR_ADMIN_KEY is unset -> /api/admin/auth/verify returns 503
      delete process.env.SMART_MASAR_ADMIN_KEY;
      const unconfiguredRes = await fetch(`${baseUrl}/api/admin/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey: 'anything' }),
      });
      assert.equal(unconfiguredRes.status, 503);
      const unconfiguredJson: any = await unconfiguredRes.json();
      assert.equal(unconfiguredJson.authenticated, false);

      // Case B: Configure SMART_MASAR_ADMIN_KEY in environment
      const runtimeSecret = 'vercel_runtime_admin_secret_2026_xyz';
      process.env.SMART_MASAR_ADMIN_KEY = runtimeSecret;

      // Reject unauthorized request with wrong key (401)
      const badLoginRes = await fetch(`${baseUrl}/api/admin/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey: 'invalid_key_attempt' }),
      });
      assert.equal(badLoginRes.status, 401);
      const badLoginJson: any = await badLoginRes.json();
      assert.equal(badLoginJson.authenticated, false);

      // Reject unauthorized access to protected admin endpoints (401)
      const unauthConfigRes = await fetch(`${baseUrl}/api/admin/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webAppUrl: 'https://script.google.com/macros/s/test/exec' }),
      });
      assert.equal(unauthConfigRes.status, 401);

      const unauthSheetStatusRes = await fetch(`${baseUrl}/api/admin/sheetdb-status`);
      assert.equal(unauthSheetStatusRes.status, 401);

      // Case C: Valid login with SMART_MASAR_ADMIN_KEY -> 200 + HttpOnly Set-Cookie
      const goodLoginRes = await fetch(`${baseUrl}/api/admin/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey: runtimeSecret }),
      });
      assert.equal(goodLoginRes.status, 200);
      const setCookieHeader = goodLoginRes.headers.get('set-cookie') || '';
      assert.ok(
        setCookieHeader.includes(`${ADMIN_SESSION_COOKIE_NAME}=`),
        'Verify endpoint must issue sm_admin_session cookie'
      );
      assert.ok(setCookieHeader.includes('HttpOnly'), 'Session cookie must be HttpOnly');
      const goodLoginJson: any = await goodLoginRes.json();
      assert.equal(goodLoginJson.authenticated, true);
      assert.equal(
        JSON.stringify(goodLoginJson).includes(runtimeSecret),
        false,
        'Server response must never echo or expose the admin key'
      );

      const cookiePair = setCookieHeader.split(';')[0];

      // Case D: Verify session using only the HttpOnly cookie (GET /api/admin/auth/session)
      const sessionCheckRes = await fetch(`${baseUrl}/api/admin/auth/session`, {
        method: 'GET',
        headers: { Cookie: cookiePair },
      });
      assert.equal(sessionCheckRes.status, 200);
      const sessionCheckJson: any = await sessionCheckRes.json();
      assert.equal(sessionCheckJson.authenticated, true);

      // Case E: Logout clears the session cookie
      const logoutRes = await fetch(`${baseUrl}/api/admin/auth/logout`, {
        method: 'POST',
        headers: { Cookie: cookiePair },
      });
      assert.equal(logoutRes.status, 200);
      const logoutCookieHeader = logoutRes.headers.get('set-cookie') || '';
      assert.ok(logoutCookieHeader.includes('Max-Age=0'), 'Logout must expire the cookie immediately');

      // Verify unauthenticated session check returns authenticated: false
      const afterLogoutSessionRes = await fetch(`${baseUrl}/api/admin/auth/session`, {
        method: 'GET',
      });
      const afterLogoutJson: any = await afterLogoutSessionRes.json();
      assert.equal(afterLogoutJson.authenticated, false);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  await t.test('5. Verifies Vercel Serverless Function files and vercel.json rewrites exist', () => {
    assert.equal(fs.existsSync(path.resolve('api/index.ts')), true);
    assert.equal(fs.existsSync(path.resolve('api/admin/auth/verify.ts')), true);
    assert.equal(fs.existsSync(path.resolve('api/admin/auth/session.ts')), true);
    assert.equal(fs.existsSync(path.resolve('api/admin/auth/logout.ts')), true);

    const rootVercel = JSON.parse(fs.readFileSync(path.resolve('vercel.json'), 'utf8'));
    assert.ok(Array.isArray(rootVercel.rewrites));
    const hasApiRewrite = rootVercel.rewrites.some(
      (r: any) => r.source === '/api/(.*)' && r.destination === '/api/index'
    );
    const hasSpaRewrite = rootVercel.rewrites.some(
      (r: any) => r.source === '/((?!api/).*)' && r.destination === '/index.html'
    );
    assert.equal(hasApiRewrite, true, 'vercel.json must route /api/(.*) to /api/index');
    assert.equal(hasSpaRewrite, true, 'vercel.json must route non-API paths to /index.html without swallowing /api/*');
  });
});
