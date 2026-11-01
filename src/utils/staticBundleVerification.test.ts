/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  INITIAL_COMPANY_PROFILE,
  INITIAL_DEPARTMENTS,
  INITIAL_EMPLOYEES,
  INITIAL_JOBS,
  INITIAL_PAGES,
} from '../data/initialData';
import { DEFAULT_SHEETDB_ENDPOINT } from '../services/apiService';

test('Static Hosting Bundle & Security Verification Suite', async (t) => {
  await t.test('1. Preserves all 6 founding employees, 6 departments, 7 pages, and Accountant job vacancy', () => {
    assert.equal(INITIAL_COMPANY_PROFILE.nameEn, 'Smart Masar');
    assert.equal(INITIAL_COMPANY_PROFILE.taglineAr, 'نبتكر اليوم لنصنع فرص الغد');
    assert.equal(INITIAL_EMPLOYEES.length, 6);
    assert.equal(INITIAL_DEPARTMENTS.length, 6);
    assert.equal(INITIAL_PAGES.length, 7);
    assert.equal(INITIAL_JOBS.length, 1);
    assert.equal(INITIAL_JOBS[0].id, 'job-accountant-01');
  });

  await t.test('2. Preserves SheetDB public read endpoint configuration', () => {
    assert.equal(DEFAULT_SHEETDB_ENDPOINT, 'https://sheetdb.io/api/v1/gnn52l70oflrp');
  });

  await t.test('3. Verifies production build (dist/) and static hosting ZIP exist and have valid ZIP signature', () => {
    const zipPath = path.resolve('public/smart-masar-static-hosting.zip');
    assert.equal(fs.existsSync(zipPath), true, 'smart-masar-static-hosting.zip should exist');
    const buf = fs.readFileSync(zipPath);
    assert.equal(buf[0], 0x50); // 'P'
    assert.equal(buf[1], 0x4b); // 'K'
    assert.equal(buf[2], 0x03);
    assert.equal(buf[3], 0x04);
    assert.ok(buf.length > 100_000, 'ZIP should contain compiled assets and logo');

    const zipStr = buf.toString('utf8');
    assert.ok(zipStr.includes('index.html'), 'ZIP must include index.html');
    assert.ok(zipStr.includes('smart-masar.html'), 'ZIP must include smart-masar.html');
    assert.ok(zipStr.includes('README.md'), 'ZIP must include README.md');
    assert.ok(zipStr.includes('.htaccess'), 'ZIP must include .htaccess');
    assert.ok(zipStr.includes('_redirects'), 'ZIP must include _redirects');
    assert.ok(zipStr.includes('vercel.json'), 'ZIP must include vercel.json');
    assert.ok(zipStr.includes('404.html'), 'ZIP must include 404.html');
  });

  await t.test('4. Ensures zero admin secret keys or passwords exist in public HTML/JS bundles', () => {
    const forbiddenSecret = 'sm_masar_admin_secret_2026';

    const standaloneHtml = fs.readFileSync(path.resolve('public/smart-masar.html'), 'utf8');
    assert.equal(
      standaloneHtml.includes(forbiddenSecret),
      false,
      'smart-masar.html must never contain admin secret key'
    );

    const distIndex = fs.readFileSync(path.resolve('dist/index.html'), 'utf8');
    assert.equal(
      distIndex.includes(forbiddenSecret),
      false,
      'dist/index.html must never contain admin secret key'
    );

    const assetsDir = path.resolve('dist/assets');
    const assetFiles = fs.readdirSync(assetsDir).filter((f) => f.endsWith('.js') || f.endsWith('.css'));
    assert.ok(assetFiles.length >= 2, 'dist/assets must contain compiled JS and CSS');

    for (const file of assetFiles) {
      const content = fs.readFileSync(path.join(assetsDir, file), 'utf8');
      assert.equal(
        content.includes(forbiddenSecret),
        false,
        `dist/assets/${file} must never contain admin secret key`
      );
    }
  });
});
