# Google Sheets, SheetDB & Google Drive Image Management Architecture

This document describes the complete storage, database schema, Google Drive image upload workflow, SheetDB synchronization, and security architecture for **Smart Masar (سمارت مسار)**.

---

## 1. Storage & API Architecture

1. **Google Drive (Binary Image Store)**:
   - Stores actual uploaded image files (`JPG`, `PNG`, `WebP`, up to `5 MB`) in a dedicated Google Drive folder (`Smart Masar Website Images`, or a custom folder configured via `GOOGLE_DRIVE_FOLDER_ID`).
   - Uploaded files are given public reader permission (`ANYONE_WITH_LINK`, `VIEW`) by the server-side Google Apps Script (`uploadImageToDrive` action) only after verifying the administrator's `SMART_MASAR_ADMIN_KEY`.
2. **Google Sheets & SheetDB (Metadata & URL Store)**:
   - Spreadsheet name: **`مؤسسة Masar Smart`**
   - SheetDB API endpoint: `https://sheetdb.io/api/v1/gnn52l70oflrp`
   - Stores image URLs, Google Drive file IDs, Arabic alt text, and record metadata across 6 structured tabs.
3. **Express Server Proxy (`server.ts`)**:
   - Protects all write/upload endpoints (`/api/admin/upload-image`, `/api/admin/remove-image`, `/api/admin/sync-state`) behind server-verified `SMART_MASAR_ADMIN_KEY` authentication (`requireAdminAuth` middleware).
   - Validates image MIME type, 5 MB file size limit, and binary magic bytes (`FF D8 FF` for JPEG, `89 50 4E 47` for PNG, `RIFF....WEBP` for WebP) before persisting or forwarding to Google Drive.
   - Provides an unauthenticated image delivery proxy (`GET /api/images/drive/:fileId`) and local persistent cache (`/uploads/...`) so unauthenticated visitors never encounter broken images due to Google Drive third-party cookie restrictions or HTML viewer redirects.

---

## 2. Google Sheets Schema (6 Tabs)

Run `initialSetup()` inside `/backend/google-apps-script.js` to automatically create and format all 6 sheets with their headers and seed records.

### Tab 1: `Team`
| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | String (PK) | Unique employee ID (`emp-ahmed-alabed`) |
| `nameAr` | String | Full name in Arabic |
| `nameEn` | String | Full name in English |
| `jobTitleAr` | String | Arabic Job Title |
| `jobTitleEn` | String | English Job Title |
| `departmentId` | String (FK) | Assigned department ID (`exec`, `tech`, `finance`, etc.) |
| `managerId` | String | Direct manager employee ID |
| `avatarUrl` | String | Legacy/synced avatar URL |
| `image_url` | String | Public display image URL (`/uploads/...` or `/api/images/drive/:fileId`) |
| `image_file_id` | String | Google Drive file ID |
| `image_alt_ar` | String | Accessible Arabic alt text |
| `initials` | String | 2–3 letter Arabic initials for placeholder fallback |
| `bioAr` | String | Arabic biography |
| `email` | String | Official corporate email |
| `isConfirmedPosition` | Boolean | `TRUE` if confirmed; `FALSE` for `قيد التعيين` |
| `order` | Number | Display sort order |

### Tab 2: `Services`
| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | String (PK) | Unique service ID (`srv-ai`, `srv-dev`, `srv-dt`, `srv-consult`) |
| `titleAr` | String | Arabic service title |
| `titleEn` | String | English service title |
| `shortDescAr` | String | Arabic service description |
| `iconName` | String | Lucide icon name for fallback placeholder (`Cpu`, `Code`, `Share2`, `Sliders`) |
| `featuresAr` | JSON Array | List of service deliverables in Arabic |
| `image_url` | String | Public display image URL |
| `image_file_id` | String | Google Drive file ID |
| `image_alt_ar` | String | Accessible Arabic alt text |

### Tab 3: `Pages`
| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | String (PK) | Page identifier (`page-home`, `page-about`, `page-services`, `page-team`, `page-organization`, `page-careers`, `page-contact`) |
| `slug` | String | Route path (`/`, `/about`, `/services`, `/team`, `/organization`, `/careers`, `/contact`) |
| `titleAr` | String | Page header title in Arabic |
| `titleEn` | String | Page title in English |
| `subtitleAr` | String | Page header subtitle in Arabic |
| `hero_image_url` | String | Public display hero image URL |
| `hero_image_file_id` | String | Google Drive file ID for hero image |
| `hero_image_alt_ar` | String | Accessible Arabic alt text |

### Tab 4: `SiteSettings`
| Column Name | Type | Description |
| :--- | :--- | :--- |
| `Key` | String | Setting key (`logo_url`, `logo_file_id`, `logo_alt_ar`, `drive_folder_id`, `taglineAr`, `taglineEn`, `visionAr`, `missionAr`, `email`, etc.) |
| `Value` | String / JSON | Setting value |

### Tab 5: `Departments`
| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | String (PK) | Department ID |
| `nameAr` | String | Arabic Department Name |
| `nameEn` | String | English Department Name |
| `iconName` | String | Lucide icon identifier |
| `badgeBg` | String | Theme color hex |

### Tab 6: `Jobs`
| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | String (PK) | Unique job vacancy ID (`job-accountant-01`) |
| `titleAr` | String | Job title in Arabic |
| `titleEn` | String | Job title in English |
| `departmentId` | String | Department ID |
| `departmentNameAr`| String | Department Arabic name |
| `status` | String | `active` or `closed` |
| `employmentTypeAr`| String | Employment type |
| `locationAr` | String | Job Location |
| `experienceLevelAr`| String | Required experience |
| `googleFormsUrl` | String | External Google Forms respondent URL |
| `summaryAr` | Text | Full job summary |
| `responsibilitiesAr`| JSON Array | List of job duties |
| `qualificationsAr` | JSON Array | List of requirements |
| `accountingSkillsAr`| JSON Array | Specialized skills |
| `softwareExperienceAr`| JSON Array | Software & ERP experience |
| `applicationInstructionsAr`| Text | Application steps |
| `postedDate` | String | Posting date |

---

## 3. Google Drive Direct Image Delivery Limitations & Production Recommendation

### Why Raw Google Drive Sharing URLs Fail in `<img>` Tags
1. **Viewer HTML vs. Binary Image**: A standard Google Drive sharing link (`https://drive.google.com/file/d/<FILE_ID>/view?usp=sharing`) returns an HTML viewer webpage (`text/html`), not an `image/*` binary stream. Using it directly in `<img src="...">` always fails.
2. **Third-Party Cookie & ORB Restrictions on `drive.google.com/uc`**: Modern browsers (Chrome, Safari, Firefox) block unauthenticated cross-site redirects and third-party cookies on `https://drive.google.com/uc?export=view&id=<FILE_ID>` (`ERR_BLOCKED_BY_ORB` or `403 Forbidden`), and Google enforces strict rate limits on direct Drive hotlinking.

### How Smart Masar Solves This
1. **Automatic URL Normalization (`src/utils/imageUrl.ts`)**: Any Google Drive sharing link or file ID is automatically extracted and normalized to `/api/images/drive/<FILE_ID>`.
2. **Server-Side Binary Proxy & Local Persistence (`server.ts`)**:
   - Uploaded images are stored in `/public/uploads/` and forwarded to Google Drive via Apps Script when configured.
   - `GET /api/images/drive/:fileId` serves the local file if cached, or fetches the binary image server-to-server from Google Drive (`lh3.googleusercontent.com/d/:id` / `drive.google.com/thumbnail?id=:id&sz=w1600`) and streams it to the browser with proper `Content-Type: image/*` and `Cache-Control` headers.
3. **Recommended Dedicated Public Image CDN (Optional Enhancement)**:
   - For high-traffic production deployments where Google Drive bandwidth quotas may be reached, we recommend pairing **Google Sheets / SheetDB** (as the metadata store) with **Cloudinary**, **Cloudflare R2**, or **Firebase Cloud Storage** as the public image CDN while keeping the exact same `image_url`, `image_file_id`, and `image_alt_ar` columns in Google Sheets.
