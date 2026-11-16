/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'node:crypto';

export const ADMIN_SESSION_COOKIE_NAME = 'sm_admin_session';
export const DEFAULT_SESSION_TTL_SECONDS = 86400; // 24 hours

/**
 * Reads the administrator secret key exclusively from the environment variable
 * `SMART_MASAR_ADMIN_KEY`. Never uses any fallback, default, or database-stored key.
 */
export function getConfiguredAdminKey(env: NodeJS.ProcessEnv = process.env): string {
  const raw = env.SMART_MASAR_ADMIN_KEY;
  if (typeof raw !== 'string') return '';
  return raw.trim();
}

/**
 * Constant-time comparison between a candidate admin key and the configured
 * environment variable `SMART_MASAR_ADMIN_KEY`.
 */
export function verifyAdminKeyConstantTime(
  candidateKey: unknown,
  expectedKey: string = getConfiguredAdminKey()
): boolean {
  if (!expectedKey || typeof candidateKey !== 'string') {
    return false;
  }
  const trimmedCandidate = candidateKey.trim();
  if (!trimmedCandidate) {
    return false;
  }

  const candidateHash = crypto.createHash('sha256').update(trimmedCandidate, 'utf8').digest();
  const expectedHash = crypto.createHash('sha256').update(expectedKey, 'utf8').digest();
  return crypto.timingSafeEqual(candidateHash, expectedHash);
}

/**
 * Creates a stateless HMAC-SHA256 signed session token so session cookies work
 * reliably across both Vercel Serverless Function invocations and Node/Express servers
 * without storing session state in localStorage or server memory.
 */
export function createStatelessAdminSessionToken(
  expectedKey: string = getConfiguredAdminKey(),
  ttlSeconds: number = DEFAULT_SESSION_TTL_SECONDS,
  nowMs: number = Date.now()
): string {
  if (!expectedKey) {
    throw new Error('SMART_MASAR_ADMIN_KEY is not configured');
  }
  const nowSec = Math.floor(nowMs / 1000);
  const payload = {
    role: 'admin',
    iat: nowSec,
    exp: nowSec + ttlSeconds,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', expectedKey)
    .update(payloadB64, 'utf8')
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

/**
 * Verifies a stateless HMAC-SHA256 signed session token against `SMART_MASAR_ADMIN_KEY`.
 */
export function verifyStatelessAdminSessionToken(
  token: unknown,
  expectedKey: string = getConfiguredAdminKey(),
  nowMs: number = Date.now()
): boolean {
  if (!expectedKey || typeof token !== 'string' || !token.includes('.')) {
    return false;
  }
  const parts = token.trim().split('.');
  if (parts.length !== 2) {
    return false;
  }
  const [payloadB64, providedSig] = parts;
  if (!payloadB64 || !providedSig) {
    return false;
  }

  const expectedSig = crypto
    .createHmac('sha256', expectedKey)
    .update(payloadB64, 'utf8')
    .digest('base64url');

  const providedBuf = Buffer.from(providedSig, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (providedBuf.length !== expectedBuf.length) {
    return false;
  }
  if (!crypto.timingSafeEqual(providedBuf, expectedBuf)) {
    return false;
  }

  try {
    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload = JSON.parse(payloadJson);
    if (!payload || payload.role !== 'admin' || typeof payload.exp !== 'number') {
      return false;
    }
    const nowSec = Math.floor(nowMs / 1000);
    return payload.exp > nowSec;
  } catch {
    return false;
  }
}

/**
 * Parses HTTP Cookie header into key-value pairs.
 */
export function parseCookieHeader(cookieHeader?: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      const k = part.slice(0, idx).trim();
      const v = part.slice(idx + 1).trim();
      try {
        result[k] = decodeURIComponent(v);
      } catch {
        result[k] = v;
      }
    }
  }
  return result;
}

/**
 * Checks whether an incoming request is authenticated via either:
 * 1) Valid `sm_admin_session` HttpOnly HMAC-signed cookie, OR
 * 2) Valid `x-admin-key` / `Authorization: Bearer` header matching `SMART_MASAR_ADMIN_KEY`.
 */
export function isRequestAdminAuthenticated(
  headers: {
    cookie?: string;
    'x-admin-key'?: string | string[];
    authorization?: string;
  },
  expectedKey: string = getConfiguredAdminKey()
): { authenticated: boolean; configured: boolean } {
  if (!expectedKey) {
    return { authenticated: false, configured: false };
  }

  const cookies = parseCookieHeader(headers.cookie);
  const sessionToken = cookies[ADMIN_SESSION_COOKIE_NAME];
  if (sessionToken && verifyStatelessAdminSessionToken(sessionToken, expectedKey)) {
    return { authenticated: true, configured: true };
  }

  const rawHeaderKey = Array.isArray(headers['x-admin-key'])
    ? headers['x-admin-key'][0]
    : headers['x-admin-key'];
  const bearerKey =
    typeof headers.authorization === 'string' && headers.authorization.startsWith('Bearer ')
      ? headers.authorization.slice(7)
      : '';
  const candidateKey = rawHeaderKey || bearerKey || '';

  if (candidateKey && verifyAdminKeyConstantTime(candidateKey, expectedKey)) {
    return { authenticated: true, configured: true };
  }

  return { authenticated: false, configured: true };
}

/**
 * Builds the Set-Cookie header value for establishing an authenticated admin session.
 */
export function buildAdminSessionSetCookie(
  token: string,
  isSecure: boolean = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1',
  ttlSeconds: number = DEFAULT_SESSION_TTL_SECONDS
): string {
  const secureAttr = isSecure ? '; Secure' : '';
  return `${ADMIN_SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${ttlSeconds}${secureAttr}`;
}

/**
 * Builds the Set-Cookie header value for clearing the admin session on logout.
 */
export function buildAdminLogoutSetCookie(
  isSecure: boolean = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
): string {
  const secureAttr = isSecure ? '; Secure' : '';
  return `${ADMIN_SESSION_COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secureAttr}`;
}
