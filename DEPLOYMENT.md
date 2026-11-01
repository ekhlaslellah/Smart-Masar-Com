# Smart Masar (سمارت مسار) — Complete Deployment & External Integration Guide

**Company**: Smart Masar | سمارت مسار  
**Arabic Slogan**: نبتكر اليوم لنصنع فرص الغد  
**English Tagline**: Technology • AI • Innovation  

---

## 1. Live Verification of SheetDB (`https://sheetdb.io/api/v1/gnn52l70oflrp`)

### Live Diagnostic Results
- **`GET https://sheetdb.io/api/v1/gnn52l70oflrp/name`** -> `200 OK`
  - Connected Google Spreadsheet Name: **`"مؤسسة Masar Smart"`**
- **`GET https://sheetdb.io/api/v1/gnn52l70oflrp/sheets`** -> `200 OK`
  - Existing tabs: **`["الورقة1"]`**
- **`GET https://sheetdb.io/api/v1/gnn52l70oflrp/keys`** -> `400 Bad Request`
  - Response: `{"error":"Spreadsheet is empty. Fill first row with the column names, each next row will be treated as a record."}`
- **`GET https://sheetdb.io/api/v1/gnn52l70oflrp/count`** -> `200 OK` (`{"rows":0}`)

### Access to the 6 Required Worksheets via SheetDB
SheetDB natively supports reading and writing multiple worksheets in the same Google Spreadsheet using the `?sheet=<WorksheetName>` query parameter **once the worksheet tabs and Row 1 column headers exist in the Google Sheet**:

| Worksheet Name | SheetDB Endpoint | Primary Key / Match Column | Required Columns (Row 1 Header) |
| :--- | :--- | :--- | :--- |
| **`Team`** | `https://sheetdb.io/api/v1/gnn52l70oflrp?sheet=Team` | `id` | `id`, `nameAr`, `nameEn`, `jobTitleAr`, `jobTitleEn`, `departmentId`, `managerId`, `avatarUrl`, `image_url`, `image_file_id`, `image_alt_ar`, `initials`, `bioAr`, `email`, `isConfirmedPosition`, `order` |
| **`Services`** | `https://sheetdb.io/api/v1/gnn52l70oflrp?sheet=Services` | `id` | `id`, `titleAr`, `titleEn`, `shortDescAr`, `featuresAr`, `iconName`, `image_url`, `image_file_id`, `image_alt_ar` |
| **`Pages`** | `https://sheetdb.io/api/v1/gnn52l70oflrp?sheet=Pages` | `id` | `id`, `slug`, `titleAr`, `titleEn`, `subtitleAr`, `hero_image_url`, `hero_image_file_id`, `hero_image_alt_ar` |
| **`SiteSettings`** | `https://sheetdb.io/api/v1/gnn52l70oflrp?sheet=SiteSettings` | `Key` | `Key`, `Value`, `logo_url`, `logo_file_id` |
| **`Departments`** | `https://sheetdb.io/api/v1/gnn52l70oflrp?sheet=Departments` | `id` | `id`, `nameAr`, `nameEn`, `iconName`, `badgeBg` |
| **`Jobs`** | `https://sheetdb.io/api/v1/gnn52l70oflrp?sheet=Jobs` | `id` | `id`, `titleAr`, `titleEn`, `departmentId`, `departmentNameAr`, `status`, `employmentTypeAr`, `locationAr`, `experienceLevelAr`, `googleFormsUrl`, `summaryAr`, `responsibilitiesAr`, `qualificationsAr`, `accountingSkillsAr`, `softwareExperienceAr`, `applicationInstructionsAr`, `postedDate` |

---

## 2. How to Initialize All 6 Worksheets & Google Drive Folder in 1 Minute

1. Open your Google Spreadsheet **`"مؤسسة Masar Smart"`** (the sheet connected to `https://sheetdb.io/api/v1/gnn52l70oflrp`).
2. In the top menu, click **Extensions (الإضافات) > Apps Script**.
3. Delete any existing code in `Code.gs` and paste the entire contents of `backend/google-apps-script.js`.
4. Save the project (`Ctrl+S` / `Cmd+S`).
5. From the function dropdown at the top of the Apps Script editor, select **`initialSetup`** and click **Run (تشغيل)**.
6. Grant the requested permissions (`SpreadsheetApp` and `DriveApp`) when prompted by Google.
   - `initialSetup()` automatically creates and populates all 6 tabs (`Team`, `Services`, `Pages`, `SiteSettings`, `Departments`, `Jobs`) with exact column headers and foundational Smart Masar records.
   - It also creates a dedicated Google Drive folder named **`Smart Masar Website Images`**, sets its sharing permission to `ANYONE_WITH_LINK` + `VIEW`, and saves the `drive_folder_id` into `SiteSettings` and `Script Properties`.
7. Click **Deploy (نشر) > New deployment (نشر جديد)**:
   - Select type: **Web app (تطبيق ويب)**.
   - **Execute as (التنفيذ بصفتي)**: **Me (أنا)** — this ensures visitors never need Google credentials and your Google account credentials are never exposed.
   - **Who has access (من لديه حق الوصول)**: **Anyone (أي شخص)**.
8. Copy the generated **Web App URL** (`https://script.google.com/macros/s/.../exec`) and paste it into `/admin/settings` or set `GOOGLE_APPS_SCRIPT_URL` in your `.env` file.

---

## 3. Google Drive Image Folder & Secure Authentication Architecture

- **How Images Are Stored**:
  - Binary files (`JPG`, `PNG`, `WebP`, up to `5 MB`) are validated for MIME type and binary magic bytes on the server (`server.ts`) and uploaded via `uploadImageToDrive` in Google Apps Script into the dedicated Google Drive folder (`Smart Masar Website Images`).
  - Google Apps Script sets `driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW)` on the uploaded image file and returns:
    - `fileId`: The Google Drive file ID
    - `directUrl`: `https://lh3.googleusercontent.com/d/<FILE_ID>`
    - `thumbnailUrl`: `https://drive.google.com/thumbnail?id=<FILE_ID>&sz=w1600`
- **How Admin Credentials Stay Protected**:
  - The browser never talks directly to Google Drive APIs with OAuth tokens or service account keys.
  - Admin actions authenticate with `server.ts` using an `HttpOnly; SameSite=Lax` session cookie (`sm_admin_session`) or `X-Admin-Key` verified on the server against `process.env.SMART_MASAR_ADMIN_KEY`.
  - `server.ts` forwards the server-side `SMART_MASAR_ADMIN_KEY` to Google Apps Script (`PropertiesService.getScriptProperties().getProperty('SMART_MASAR_ADMIN_KEY')`).

---

## 4. Hosting Requirements (Node.js Full-Stack vs. HTML-Only Static Hosting)

### Can HTML-Only Shared Hosting Run This Project As-Is?
**No.** Pure HTML-only static hosting (e.g., basic cPanel static HTML folders, GitHub Pages, or S3 static buckets without a backend runtime) **cannot run `server.ts` as-is** because:
1. `server.ts` is a Node.js + Express backend server that handles:
   - `HttpOnly` administrator session authentication (`/api/admin/auth/*`)
   - Binary magic-byte validation and local `/public/uploads` file caching (`/api/admin/upload-image`)
   - Server-side Google Drive image proxy (`/api/images/drive/:fileId`)
   - Server-side SheetDB synchronization (`/api/admin/sync-state`, `/api/admin/sheetdb-status`)
   - SPA route fallback (`/* -> index.html`) for `/about`, `/services`, `/team`, `/organization`, `/careers`, `/contact`, and `/admin/*`.

### Option A (Recommended — Runs Project As-Is): Node.js Hosting
Deploy the complete project to any Node.js v18+ / v20+ host (Google Cloud Run, Render, Railway, Fly.io, VPS with PM2, or cPanel with Node.js Selector):
```bash
npm install
npm run build
NODE_ENV=production PORT=3000 npx tsx server.ts
```

### Option B (Minimum Architecture If Using Static HTML Hosting):
If you must host the frontend (`dist/` folder generated by `npm run build`) on static HTML hosting:
1. Upload the contents of `dist/` to your static web root.
2. Configure a URL rewrite rule (`.htaccess` on Apache/cPanel or `_redirects` on Netlify/Cloudflare Pages) so all routes (`/about`, `/services`, `/team`, `/organization`, `/careers`, `/contact`, `/admin/*`) rewrite to `/index.html`:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```
3. Deploy `backend/google-apps-script.js` as a Google Apps Script Web App (`https://script.google.com/macros/s/.../exec`) and point the frontend API calls to the deployed Google Apps Script Web App + SheetDB (`https://sheetdb.io/api/v1/gnn52l70oflrp`) or host `server.ts` separately on a free Node.js tier (Cloud Run / Render).
