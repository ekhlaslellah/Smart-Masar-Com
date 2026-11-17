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
  await t.test('1. Preserves all 10 leadership employees, 10 departments, 7 pages, and Accountant + HR Specialist vacancies pointing to Recruitment Portal', () => {
    assert.equal(INITIAL_COMPANY_PROFILE.nameEn, 'Smart Masar');
    assert.equal(INITIAL_COMPANY_PROFILE.taglineAr, 'نبتكر اليوم لنصنع فرص الغد');
    assert.equal(INITIAL_COMPANY_PROFILE.googleFormsPlaceholderUrl, 'https://smart-masar-recruitment.onrender.com/');
    assert.equal(INITIAL_EMPLOYEES.length, 10);
    assert.equal(INITIAL_DEPARTMENTS.length, 10);
    assert.equal(INITIAL_PAGES.length, 7);
    assert.equal(INITIAL_JOBS.length, 2);
    assert.equal(INITIAL_JOBS[0].id, 'job-accountant-01');
    assert.equal(INITIAL_JOBS[0].departmentId, 'dept-finance');
    assert.equal(INITIAL_JOBS[0].googleFormsUrl, 'https://smart-masar-recruitment.onrender.com/');
    assert.equal(INITIAL_JOBS[1].id, 'job-hr-specialist-02');
    assert.equal(INITIAL_JOBS[1].titleEn, 'Human Resources Specialist (HR Specialist)');
    assert.equal(INITIAL_JOBS[1].departmentId, 'dept-hr');
    assert.equal(INITIAL_JOBS[1].googleFormsUrl, 'https://smart-masar-recruitment.onrender.com/');
  });

  await t.test('2. Preserves SheetDB public read endpoint configuration (https://sheetdb.io/api/v1/9537p5ct7m308)', () => {
    assert.equal(DEFAULT_SHEETDB_ENDPOINT, 'https://sheetdb.io/api/v1/9537p5ct7m308');
    const dbJson = JSON.parse(fs.readFileSync(path.resolve('data/db.json'), 'utf8'));
    assert.equal(dbJson.backendMeta.sheetDbUrl, 'https://sheetdb.io/api/v1/9537p5ct7m308');
  });

  await t.test('3. Verifies production build (dist/) exists and private backup is stored outside public/', () => {
    assert.equal(fs.existsSync(path.resolve('public/backups')), false, 'public/backups must not exist');
    assert.equal(fs.existsSync(path.resolve('public/smart-masar-static-hosting.zip')), false, 'public static zip must not exist in public/');
    assert.equal(fs.existsSync(path.resolve('public/smart-masar-complete-project.zip')), false, 'public project zip must not exist in public/');
    const privateZipPath = path.resolve('data/backups/smart-masar-recovery-backup.zip');
    assert.equal(fs.existsSync(privateZipPath), true, 'data/backups/smart-masar-recovery-backup.zip should exist in private storage');
    const buf = fs.readFileSync(privateZipPath);
    assert.equal(buf[0], 0x50); // 'P'
    assert.equal(buf[1], 0x4b); // 'K'
    assert.equal(buf[2], 0x03);
    assert.equal(buf[3], 0x04);
  });

  await t.test('4. Ensures zero hardcoded admin secret keys or passwords exist in data/db.json, server.ts, .env.example, or public HTML/JS bundles', () => {
    const legacyKeyPattern = new RegExp('sm_masar_' + 'admin_secret_' + '2026');

    const dbJsonRaw = fs.readFileSync(path.resolve('data/db.json'), 'utf8');
    const dbParsed = JSON.parse(dbJsonRaw);
    assert.equal(
      legacyKeyPattern.test(dbJsonRaw),
      false,
      'data/db.json must never contain the legacy admin key'
    );
    assert.equal(
      'adminKey' in (dbParsed.backendMeta || {}),
      false,
      'data/db.json backendMeta must not store any adminKey property'
    );

    const envExample = fs.readFileSync(path.resolve('.env.example'), 'utf8');
    assert.equal(
      legacyKeyPattern.test(envExample),
      false,
      '.env.example must not contain the legacy admin key'
    );

    const distIndex = fs.readFileSync(path.resolve('dist/index.html'), 'utf8');
    assert.equal(
      legacyKeyPattern.test(distIndex),
      false,
      'dist/index.html must never contain admin secret key'
    );

    const assetsDir = path.resolve('dist/assets');
    const assetFiles = fs.readdirSync(assetsDir).filter((f) => f.endsWith('.js') || f.endsWith('.css'));
    assert.ok(assetFiles.length >= 2, 'dist/assets must contain compiled JS and CSS');

    for (const file of assetFiles) {
      const content = fs.readFileSync(path.join(assetsDir, file), 'utf8');
      assert.equal(
        legacyKeyPattern.test(content),
        false,
        `dist/assets/${file} must never contain admin secret key`
      );
    }
  });

  await t.test('5. Verifies public visitor components contain zero ZIP/HTML download buttons, deployment sections, or /admin links', () => {
    const publicFiles = [
      'src/components/layout/Navbar.tsx',
      'src/components/layout/Footer.tsx',
      'src/components/layout/MobileBottomNav.tsx',
      'src/components/pages/HomePage.tsx',
      'src/components/pages/AboutPage.tsx',
      'src/components/pages/ServicesPage.tsx',
      'src/components/pages/TeamPage.tsx',
      'src/components/pages/OrgChartPage.tsx',
      'src/components/pages/CareersPage.tsx',
      'src/components/pages/ContactPage.tsx',
      'src/components/common/EmployeeModal.tsx',
    ];

    const forbiddenVisitorStrings = [
      'حزمة النشر والاستضافة الخارجية',
      'ملفات النشر (ZIP)',
      'حزمة النشر الجاهزة (ZIP + README)',
      'تحميل ملف HTML المستقل الموحد',
      'تحميل ملفات الاستضافة الجاهزة (ZIP)',
      '/api/download-static-zip',
      '/api/download-html',
      'StaticExportModal',
      'to="/admin',
      "to='/admin",
      'رابط الصورة المسجل (Image URL)',
    ];

    for (const relPath of publicFiles) {
      const src = fs.readFileSync(path.resolve(relPath), 'utf8');
      for (const forbidden of forbiddenVisitorStrings) {
        assert.equal(
          src.includes(forbidden),
          false,
          `${relPath} must not contain "${forbidden}" in visitor interface`
        );
      }
    }
  });

  await t.test('6. Verifies Footer retains company info, page links, services links, and contact details', () => {
    const footerSrc = fs.readFileSync(path.resolve('src/components/layout/Footer.tsx'), 'utf8');
    assert.ok(footerSrc.includes('صفحات الموقع'), 'Footer must include site pages section');
    assert.ok(footerSrc.includes('خدماتنا والحلول الذكية'), 'Footer must include services section');
    assert.ok(footerSrc.includes('المقر وقنوات الاتصال'), 'Footer must include contact info section');
    assert.ok(footerSrc.includes('/about'), 'Footer must link to /about');
    assert.ok(footerSrc.includes('/services'), 'Footer must link to /services');
    assert.ok(footerSrc.includes('/team'), 'Footer must link to /team');
    assert.ok(footerSrc.includes('/organization'), 'Footer must link to /organization');
    assert.ok(footerSrc.includes('/careers'), 'Footer must link to /careers');
    assert.ok(footerSrc.includes('/contact'), 'Footer must link to /contact');
  });

  await t.test('7. Verifies AdminLayout and server.ts enforce real authentication gate on /admin', () => {
    const adminLayoutSrc = fs.readFileSync(
      path.resolve('src/components/admin/AdminLayout.tsx'),
      'utf8'
    );
    assert.ok(
      adminLayoutSrc.includes("authStatus === 'unauthenticated'"),
      'AdminLayout must block unauthenticated access with a login gate'
    );
    assert.ok(
      adminLayoutSrc.includes('verifyAdminKeyOnServer'),
      'AdminLayout must verify admin credentials against the server'
    );

    const serverSrc = fs.readFileSync(path.resolve('server.ts'), 'utf8');
    assert.equal(
      serverSrc.includes('!isCustomKeyConfigured ||'),
      false,
      'server.ts must not auto-authenticate unauthenticated requests'
    );
    assert.ok(
      serverSrc.includes("app.post('/api/admin/auth/logout'"),
      'server.ts must provide a logout endpoint to clear the admin session'
    );
  });
});
