/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateImageFile,
  extractGoogleDriveFileId,
  resolvePublicImageUrl,
  buildGoogleDriveDirectUrls,
} from './imageUrl';

describe('validateImageFile', () => {
  it('accepts valid JPG, PNG, and WebP files within size limit', () => {
    assert.deepEqual(
      validateImageFile({ name: 'avatar.jpg', type: 'image/jpeg', size: 500 * 1024 }),
      { valid: true }
    );
    assert.deepEqual(
      validateImageFile({ name: 'logo.png', type: 'image/png', size: 1024 * 1024 }),
      { valid: true }
    );
    assert.deepEqual(
      validateImageFile({ name: 'hero.webp', type: 'image/webp', size: 2 * 1024 * 1024 }),
      { valid: true }
    );
  });

  it('rejects unsupported file formats such as SVG, GIF, or PDF', () => {
    const res = validateImageFile({
      name: 'document.pdf',
      type: 'application/pdf',
      size: 100 * 1024,
    });
    assert.equal(res.valid, false);
    assert.ok(res.errorAr?.includes('JPG أو PNG أو WebP'));
  });

  it('rejects files exceeding max size limit', () => {
    const res = validateImageFile(
      {
        name: 'large-photo.png',
        type: 'image/png',
        size: 6 * 1024 * 1024,
      },
      5 * 1024 * 1024
    );
    assert.equal(res.valid, false);
    assert.ok(res.errorAr?.includes('يتجاوز الحد المسموح'));
  });

  it('rejects empty 0-byte files', () => {
    const res = validateImageFile({
      name: 'empty.jpg',
      type: 'image/jpeg',
      size: 0,
    });
    assert.equal(res.valid, false);
  });
});

describe('extractGoogleDriveFileId & resolvePublicImageUrl', () => {
  it('extracts file ID from Google Drive sharing view URL and converts to direct proxy URL', () => {
    const sharingUrl =
      'https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz123456/view?usp=sharing';
    const fileId = extractGoogleDriveFileId(sharingUrl);
    assert.equal(fileId, '1AbCdEfGhIjKlMnOpQrStUvWxYz123456');

    const resolved = resolvePublicImageUrl(sharingUrl);
    assert.equal(resolved, '/api/images/drive/1AbCdEfGhIjKlMnOpQrStUvWxYz123456');

    const resolvedDirect = resolvePublicImageUrl(sharingUrl, null, { useServerProxy: false });
    assert.equal(
      resolvedDirect,
      'https://lh3.googleusercontent.com/d/1AbCdEfGhIjKlMnOpQrStUvWxYz123456'
    );
  });

  it('extracts file ID from drive open and uc URLs', () => {
    assert.equal(
      extractGoogleDriveFileId('https://drive.google.com/open?id=1ZyXwVuTsRqPoNmLkJiHgFeDcBa987654'),
      '1ZyXwVuTsRqPoNmLkJiHgFeDcBa987654'
    );
    assert.equal(
      extractGoogleDriveFileId(
        'https://drive.google.com/uc?export=view&id=1ZyXwVuTsRqPoNmLkJiHgFeDcBa987654'
      ),
      '1ZyXwVuTsRqPoNmLkJiHgFeDcBa987654'
    );
  });

  it('preserves local /uploads/ and /assets/ paths without modification', () => {
    assert.equal(
      resolvePublicImageUrl('/uploads/team-emp-ahmed-123.png', 'local-123'),
      '/uploads/team-emp-ahmed-123.png'
    );
    assert.equal(
      resolvePublicImageUrl('/assets/aistudio/logo.png'),
      '/assets/aistudio/logo.png'
    );
  });

  it('builds all direct URL variants from a Google Drive file ID', () => {
    const variants = buildGoogleDriveDirectUrls('1AbCdEfGhIjKlMnOpQrStUvWxYz123456');
    assert.equal(variants.proxyUrl, '/api/images/drive/1AbCdEfGhIjKlMnOpQrStUvWxYz123456');
    assert.equal(
      variants.lh3Url,
      'https://lh3.googleusercontent.com/d/1AbCdEfGhIjKlMnOpQrStUvWxYz123456'
    );
  });
});
