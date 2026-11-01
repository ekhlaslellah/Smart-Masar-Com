/**
 * @file Google Apps Script Backend for Smart Masar (سمارت مسار)
 * Includes Google Drive Image Upload + Google Sheets Metadata Synchronization
 * @license Apache-2.0
 *
 * Instructions:
 * 1. Open your Google Sheet ("مؤسسة Masar Smart" connected to SheetDB https://sheetdb.io/api/v1/gnn52l70oflrp)
 * 2. Extensions > Apps Script
 * 3. Replace Code.gs with this script
 * 4. Run `initialSetup()` once from the editor to create/initialize all sheets (Team, Services, Pages, SiteSettings, Departments, Jobs) and create the dedicated Google Drive folder
 * 5. Project Settings > Script Properties:
 *    - `SMART_MASAR_ADMIN_KEY`: Your secret admin key (default: sm_masar_admin_secret_2026)
 *    - `SMART_MASAR_DRIVE_FOLDER_ID`: Your Google Drive Folder ID (created automatically by initialSetup if empty)
 * 6. Deploy > New Deployment > Web App:
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 7. Copy the Web App URL and enter it in Smart Masar Admin Settings (/admin/settings).
 */

const SCRIPT_PROP_KEY = 'SMART_MASAR_ADMIN_KEY';
const DRIVE_FOLDER_PROP_KEY = 'SMART_MASAR_DRIVE_FOLDER_ID';
const DEFAULT_KEY_IF_UNSET = 'sm_masar_admin_secret_2026';
const DEFAULT_FOLDER_NAME = 'Smart Masar Website Images';

function getAdminApiKey() {
  var props = PropertiesService.getScriptProperties();
  var key = props.getProperty(SCRIPT_PROP_KEY);
  return key || DEFAULT_KEY_IF_UNSET;
}

/**
 * Gets or creates the dedicated Google Drive folder for storing website images.
 */
function getOrCreateImageFolder(customFolderId) {
  var props = PropertiesService.getScriptProperties();
  var folderId = customFolderId || props.getProperty(DRIVE_FOLDER_PROP_KEY);

  if (folderId) {
    try {
      var existingFolder = DriveApp.getFolderById(folderId);
      if (existingFolder) return existingFolder;
    } catch (e) {
      Logger.log('Could not open Drive folder by ID ' + folderId + ': ' + e);
    }
  }

  // Search for existing folder by name or create a new one
  var folders = DriveApp.getFoldersByName(DEFAULT_FOLDER_NAME);
  var folder = folders.hasNext()
    ? folders.next()
    : DriveApp.createFolder(DEFAULT_FOLDER_NAME);

  // Ensure folder is publicly viewable by link so direct image delivery works
  folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  props.setProperty(DRIVE_FOLDER_PROP_KEY, folder.getId());
  return folder;
}

/**
 * Creates standardized JSON responses.
 */
function createJsonResponse(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * Handle HTTP GET Requests (Public Read Endpoints)
 */
function doGet(e) {
  try {
    var params = e && e.parameter ? e.parameter : {};
    var action = params.action || 'getPublicData';

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'ping') {
      return createJsonResponse({
        success: true,
        status: 'healthy',
        service: 'Smart Masar Google Sheets & Drive Backend',
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'getPublicData') {
      var profile = readSiteSettings(ss);
      var departments = readTable(ss, 'Departments');
      var employees = readTable(ss, 'Team');
      var jobs = readTable(ss, 'Jobs').map(parseJobArrays);
      var services = readTable(ss, 'Services').map(parseServiceArrays);
      var pages = readTable(ss, 'Pages');

      return createJsonResponse({
        success: true,
        data: {
          profile: profile,
          departments: departments,
          employees: employees,
          jobs: jobs,
          services: services,
          pages: pages,
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'getJobs') {
      var jobsList = readTable(ss, 'Jobs').map(parseJobArrays);
      return createJsonResponse({ success: true, jobs: jobsList });
    }

    if (action === 'getTeam') {
      var team = readTable(ss, 'Team');
      return createJsonResponse({ success: true, team: team });
    }

    return createJsonResponse({
      success: false,
      error: 'Unknown GET action: ' + action,
    });
  } catch (err) {
    return createJsonResponse({
      success: false,
      error: err.toString(),
    });
  }
}

/**
 * Handle HTTP POST Requests (Authenticated Write & Drive Upload Endpoints)
 * Requires valid `apiKey` matching SMART_MASAR_ADMIN_KEY.
 */
function doPost(e) {
  try {
    var rawBody = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    var payload = JSON.parse(rawBody);

    // Server-side Admin Authentication Verification
    var serverKey = getAdminApiKey();
    var clientKey = payload.apiKey || (e && e.parameter && e.parameter.apiKey);

    if (!clientKey || clientKey !== serverKey) {
      return createJsonResponse({
        success: false,
        error: 'Unauthorized: Invalid or missing administrator API key',
      });
    }

    var action = payload.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // ---------------------------------------------------------
    // ACTION: uploadImageToDrive
    // Uploads JPG/PNG/WebP to Google Drive folder & updates Google Sheet
    // ---------------------------------------------------------
    if (action === 'uploadImageToDrive') {
      var allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      var mimeType = String(payload.mimeType || '').toLowerCase();
      if (allowedMimes.indexOf(mimeType) === -1) {
        return createJsonResponse({
          success: false,
          error: 'Unsupported image format. Only JPG, PNG, and WebP are allowed.',
        });
      }

      var base64Data = String(payload.base64Data || '').replace(
        /^data:image\/[a-zA-Z0-9.+-]+;base64,/,
        ''
      );
      var decodedBytes = Utilities.base64Decode(base64Data);
      if (decodedBytes.length > 5 * 1024 * 1024) {
        return createJsonResponse({
          success: false,
          error: 'File size exceeds 5MB maximum limit.',
        });
      }

      var fileName = payload.fileName || 'smart-masar-image-' + new Date().getTime() + '.png';
      var folder = getOrCreateImageFolder(payload.folderId);
      var blob = Utilities.newBlob(decodedBytes, mimeType, fileName);
      var driveFile = folder.createFile(blob);

      // Make file publicly viewable by link so direct image URL works
      driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      var fileId = driveFile.getId();

      // Direct image display URLs (never use the HTML /view page as an <img src>)
      var directUrl = 'https://lh3.googleusercontent.com/d/' + fileId;
      var thumbnailUrl = 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w1600';
      var viewUrl = 'https://drive.google.com/file/d/' + fileId + '/view';

      // Optionally move replaced image to trash without touching sheet data
      if (payload.previousFileId && payload.previousFileId !== fileId) {
        try {
          DriveApp.getFileById(payload.previousFileId).setTrashed(true);
        } catch (trashErr) {
          Logger.log('Could not trash old file: ' + trashErr);
        }
      }

      // Automatically save the resulting public display URL into the corresponding Google Sheets record
      var entityType = payload.entityType;
      var entityId = payload.entityId;
      var altAr = payload.altAr || '';

      if (entityType === 'team' && entityId) {
        updateRowById(ss, 'Team', entityId, {
          avatarUrl: directUrl,
          image_url: directUrl,
          image_file_id: fileId,
          image_alt_ar: altAr,
        });
      } else if (entityType === 'services' && entityId) {
        updateRowById(ss, 'Services', entityId, {
          image_url: directUrl,
          image_file_id: fileId,
          image_alt_ar: altAr,
        });
      } else if (entityType === 'pages' && entityId) {
        updateRowById(ss, 'Pages', entityId, {
          hero_image_url: directUrl,
          hero_image_file_id: fileId,
        });
      } else if (entityType === 'settings') {
        var currentSettings = readSiteSettings(ss);
        currentSettings.logo_url = directUrl;
        currentSettings.logo_file_id = fileId;
        writeSiteSettings(ss, currentSettings);
      }

      return createJsonResponse({
        success: true,
        fileId: fileId,
        directUrl: directUrl,
        thumbnailUrl: thumbnailUrl,
        viewUrl: viewUrl,
        folderId: folder.getId(),
      });
    }

    if (action === 'updateJob') {
      var jobData = payload.job;
      if (!jobData || !jobData.id) {
        return createJsonResponse({ success: false, error: 'Missing job payload or id' });
      }
      updateRowById(ss, 'Jobs', jobData.id, serializeJobArrays(jobData));
      return createJsonResponse({ success: true, message: 'Job updated successfully' });
    }

    if (action === 'saveEmployee') {
      var emp = payload.employee;
      if (!emp || !emp.id) {
        return createJsonResponse({ success: false, error: 'Missing employee payload or id' });
      }
      upsertRowById(ss, 'Team', emp.id, emp);
      return createJsonResponse({ success: true, message: 'Employee saved successfully' });
    }

    if (action === 'deleteEmployee') {
      var empId = payload.id;
      if (!empId) {
        return createJsonResponse({ success: false, error: 'Missing employee id' });
      }
      deleteRowById(ss, 'Team', empId);
      return createJsonResponse({ success: true, message: 'Employee deleted successfully' });
    }

    if (action === 'saveService') {
      var srv = payload.service;
      if (!srv || !srv.id) {
        return createJsonResponse({ success: false, error: 'Missing service payload or id' });
      }
      upsertRowById(ss, 'Services', srv.id, serializeServiceArrays(srv));
      return createJsonResponse({ success: true, message: 'Service saved successfully' });
    }

    if (action === 'savePage') {
      var pg = payload.page;
      if (!pg || !pg.id) {
        return createJsonResponse({ success: false, error: 'Missing page payload or id' });
      }
      upsertRowById(ss, 'Pages', pg.id, pg);
      return createJsonResponse({ success: true, message: 'Page updated successfully' });
    }

    if (action === 'saveSettings') {
      var settings = payload.settings;
      if (!settings) {
        return createJsonResponse({ success: false, error: 'Missing settings payload' });
      }
      writeSiteSettings(ss, settings);
      return createJsonResponse({ success: true, message: 'Settings saved successfully' });
    }

    if (action === 'syncAllData') {
      var data = payload.data;
      if (!data) {
        return createJsonResponse({ success: false, error: 'Missing sync data payload' });
      }
      if (data.profile) writeSiteSettings(ss, data.profile);
      if (Array.isArray(data.departments)) overwriteTable(ss, 'Departments', data.departments);
      if (Array.isArray(data.employees)) overwriteTable(ss, 'Team', data.employees);
      if (Array.isArray(data.jobs)) {
        overwriteTable(ss, 'Jobs', data.jobs.map(serializeJobArrays));
      }
      if (Array.isArray(data.services)) {
        overwriteTable(ss, 'Services', data.services.map(serializeServiceArrays));
      }
      if (Array.isArray(data.pages)) {
        overwriteTable(ss, 'Pages', data.pages);
      }
      return createJsonResponse({ success: true, message: 'All tables synced successfully' });
    }

    return createJsonResponse({
      success: false,
      error: 'Unknown POST action: ' + action,
    });
  } catch (err) {
    return createJsonResponse({
      success: false,
      error: err.toString(),
    });
  }
}

// -------------------------------------------------------------
// SPREADSHEET HELPER FUNCTIONS
// -------------------------------------------------------------

function readTable(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  var headers = data[0];
  var rows = [];

  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var key = headers[j];
      obj[key] = data[i][j];
    }
    rows.push(obj);
  }
  return rows;
}

function overwriteTable(ss, sheetName, items) {
  if (!items || items.length === 0) return;
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  var headers = Object.keys(items[0]);
  sheet.clearContents();
  var rows = [headers];
  items.forEach(function (item) {
    var row = [];
    headers.forEach(function (h) {
      row.push(item[h] !== undefined ? item[h] : '');
    });
    rows.push(row);
  });
  sheet.getRange(1, 1, rows.length, headers.length).setValues(rows);
}

function upsertRowById(ss, sheetName, id, obj) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idColIdx = headers.indexOf('id');
  if (idColIdx === -1) return;

  var rowIndex = -1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idColIdx]) === String(id)) {
      rowIndex = i + 1;
      break;
    }
  }

  var rowValues = [];
  headers.forEach(function (h) {
    rowValues.push(obj[h] !== undefined ? obj[h] : '');
  });

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
}

function updateRowById(ss, sheetName, id, updates) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idColIdx = headers.indexOf('id');
  if (idColIdx === -1) return;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idColIdx]) === String(id)) {
      var targetRow = i + 1;
      headers.forEach(function (h, colIdx) {
        if (updates[h] !== undefined) {
          sheet.getRange(targetRow, colIdx + 1).setValue(updates[h]);
        }
      });
      break;
    }
  }
}

function deleteRowById(ss, sheetName, id) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idColIdx = headers.indexOf('id');
  if (idColIdx === -1) return;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idColIdx]) === String(id)) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
}

function readSiteSettings(ss) {
  var sheet = ss.getSheetByName('SiteSettings');
  if (!sheet) return {};
  var data = sheet.getDataRange().getValues();
  var settings = {};
  for (var i = 1; i < data.length; i++) {
    var k = data[i][0];
    var v = data[i][1];
    if (k) {
      if (String(v).startsWith('{') || String(v).startsWith('[')) {
        try {
          v = JSON.parse(v);
        } catch (e) {}
      }
      settings[k] = v;
    }
  }
  return settings;
}

function writeSiteSettings(ss, settings) {
  var sheet = ss.getSheetByName('SiteSettings');
  if (!sheet) sheet = ss.insertSheet('SiteSettings');
  sheet.clearContents();
  var rows = [['Key', 'Value', 'logo_url', 'logo_file_id']];
  Object.keys(settings).forEach(function (k) {
    var val = settings[k];
    if (typeof val === 'object') {
      val = JSON.stringify(val);
    }
    rows.push([
      k,
      val,
      k === 'logo_url' ? val : '',
      k === 'logo_file_id' ? val : '',
    ]);
  });
  sheet.getRange(1, 1, rows.length, 4).setValues(rows);
}

function parseJobArrays(job) {
  [
    'responsibilitiesAr',
    'qualificationsAr',
    'accountingSkillsAr',
    'softwareExperienceAr',
  ].forEach(function (key) {
    if (typeof job[key] === 'string') {
      try {
        job[key] = JSON.parse(job[key]);
      } catch (e) {
        job[key] = job[key].split('\n').filter(Boolean);
      }
    }
  });
  return job;
}

function serializeJobArrays(job) {
  var copy = Object.assign({}, job);
  [
    'responsibilitiesAr',
    'qualificationsAr',
    'accountingSkillsAr',
    'softwareExperienceAr',
  ].forEach(function (key) {
    if (Array.isArray(copy[key])) {
      copy[key] = JSON.stringify(copy[key]);
    }
  });
  return copy;
}

function parseServiceArrays(service) {
  if (typeof service.featuresAr === 'string') {
    try {
      service.featuresAr = JSON.parse(service.featuresAr);
    } catch (e) {
      service.featuresAr = service.featuresAr.split('\n').filter(Boolean);
    }
  }
  return service;
}

function serializeServiceArrays(service) {
  var copy = Object.assign({}, service);
  if (Array.isArray(copy.featuresAr)) {
    copy.featuresAr = JSON.stringify(copy.featuresAr);
  }
  return copy;
}

/**
 * Run this function ONCE in the Apps Script editor to initialize sheets with headers,
 * image columns, and create the dedicated Google Drive folder.
 */
function initialSetup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var driveFolder = getOrCreateImageFolder();

  // 1. Setup SiteSettings (includes logo_url and logo_file_id)
  var initialSettings = {
    nameAr: 'سمارت مسار',
    nameEn: 'Smart Masar',
    taglineAr: 'نبتكر اليوم لنصنع فرص الغد',
    taglineEn: 'Technology • AI • Innovation',
    industryAr: 'الذكاء الاصطناعي، الحلول البرمجية، والتحول الرقمي',
    visionAr:
      'أن نكون من الشركات الرائدة في تطوير حلول تقنية ذكية تسهّل الأعمال وتصنع فرصًا جديدة.',
    missionAr:
      'مساعدة الأفراد والمؤسسات على تطوير أعمالهم من خلال التكنولوجيا والذكاء الاصطناعي.',
    email: 'info@smartmasar.edu',
    phone: '+962 6 500 0000',
    locationAr: 'مجمع واحة التقنية، عمّان — المملكة الأردنية الهاشمية',
    workingHoursAr: 'الأحد – الخميس: 8:30 صباحاً – 5:00 مساءً',
    googleFormsPlaceholderUrl:
      'https://docs.google.com/forms/d/e/1FAIpQLSc-placeholder-smart-masar-accountant-form/viewform',
    logo_url: '',
    logo_file_id: '',
    drive_folder_id: driveFolder.getId(),
  };
  writeSiteSettings(ss, initialSettings);

  // 2. Setup Departments
  var departments = [
    {
      id: 'exec',
      nameAr: 'الإدارة العامة والتنفيذية',
      nameEn: 'Executive Management',
      iconName: 'Building2',
      badgeBg: '#101B32',
    },
    {
      id: 'tech',
      nameAr: 'التكنولوجيا والذكاء الاصطناعي',
      nameEn: 'Technology & AI',
      iconName: 'Cpu',
      badgeBg: '#203B65',
    },
    {
      id: 'finance',
      nameAr: 'المالية والمحاسبة',
      nameEn: 'Finance & Accounting',
      iconName: 'CircleDollarSign',
      badgeBg: '#2563EB',
    },
    {
      id: 'hr',
      nameAr: 'الموارد البشرية',
      nameEn: 'Human Resources',
      iconName: 'Users',
      badgeBg: '#203B65',
    },
    {
      id: 'marketing',
      nameAr: 'التسويق والاتصال المؤسسي',
      nameEn: 'Marketing & Communications',
      iconName: 'Megaphone',
      badgeBg: '#2563EB',
    },
    {
      id: 'ops',
      nameAr: 'العمليات والإدارة التشغيلية',
      nameEn: 'Operations & Administration',
      iconName: 'Layers',
      badgeBg: '#101B32',
    },
  ];
  overwriteTable(ss, 'Departments', departments);

  // 3. Setup Team (with image_url, image_file_id, image_alt_ar)
  var team = [
    {
      id: 'emp-ahmed-alabed',
      nameAr: 'د. أحمد العابد',
      nameEn: 'Dr. Ahmed Alabed',
      jobTitleAr: 'المدير العام',
      jobTitleEn: 'General Manager',
      departmentId: 'exec',
      managerId: '',
      avatarUrl: '',
      image_url: '',
      image_file_id: '',
      image_alt_ar: 'صورة د. أحمد العابد - المدير العام',
      initials: 'د.أ',
      bioAr:
        'المدير العام لشركة سمارت مسار، يقود التوجه الاستراتيجي وتطوير حلول التحول الرقمي والذكاء الاصطناعي.',
      email: 'gm@smartmasar.edu',
      isConfirmedPosition: true,
      order: 1,
    },
    {
      id: 'emp-shorouq-alsharafat',
      nameAr: 'شروق الشرفات',
      nameEn: 'Shorouq Alsharafat',
      jobTitleAr: 'قيد التعيين',
      jobTitleEn: 'Position to be assigned',
      departmentId: 'tech',
      managerId: 'emp-ahmed-alabed',
      avatarUrl: '',
      image_url: '',
      image_file_id: '',
      image_alt_ar: 'صورة شروق الشرفات',
      initials: 'ش.ش',
      bioAr: '',
      email: 'shorouq@smartmasar.edu',
      isConfirmedPosition: false,
      order: 2,
    },
    {
      id: 'emp-ikram-alsharafat',
      nameAr: 'إكرام الشرفات',
      nameEn: 'Ikram Alsharafat',
      jobTitleAr: 'قيد التعيين',
      jobTitleEn: 'Position to be assigned',
      departmentId: 'finance',
      managerId: 'emp-ahmed-alabed',
      avatarUrl: '',
      image_url: '',
      image_file_id: '',
      image_alt_ar: 'صورة إكرام الشرفات',
      initials: 'إ.ش',
      bioAr: '',
      email: 'ikram@smartmasar.edu',
      isConfirmedPosition: false,
      order: 3,
    },
    {
      id: 'emp-ekhlaslellah-sh',
      nameAr: 'إخلاص لله الشرفات',
      nameEn: 'Ekhlaslellah Sh',
      jobTitleAr: 'قيد التعيين',
      jobTitleEn: 'Position to be assigned',
      departmentId: 'hr',
      managerId: 'emp-ahmed-alabed',
      avatarUrl: '',
      image_url: '',
      image_file_id: '',
      image_alt_ar: 'صورة إخلاص لله الشرفات',
      initials: 'إ.ل',
      bioAr: '',
      email: 'ekhlaslellah@smartmasar.edu',
      isConfirmedPosition: false,
      order: 4,
    },
    {
      id: 'emp-haneen-alkasaji',
      nameAr: 'حنين الكساسبة',
      nameEn: 'Haneen Alkasaji',
      jobTitleAr: 'قيد التعيين',
      jobTitleEn: 'Position to be assigned',
      departmentId: 'marketing',
      managerId: 'emp-ahmed-alabed',
      avatarUrl: '',
      image_url: '',
      image_file_id: '',
      image_alt_ar: 'صورة حنين الكساسبة',
      initials: 'ح.ك',
      bioAr: '',
      email: 'haneen@smartmasar.edu',
      isConfirmedPosition: false,
      order: 5,
    },
    {
      id: 'emp-amani-akram',
      nameAr: 'أماني أكرم',
      nameEn: 'Amani Akram',
      jobTitleAr: 'قيد التعيين',
      jobTitleEn: 'Position to be assigned',
      departmentId: 'ops',
      managerId: 'emp-ahmed-alabed',
      avatarUrl: '',
      image_url: '',
      image_file_id: '',
      image_alt_ar: 'صورة أماني أكرم',
      initials: 'أ.أ',
      bioAr: '',
      email: 'amani@smartmasar.edu',
      isConfirmedPosition: false,
      order: 6,
    },
  ];
  overwriteTable(ss, 'Team', team);

  // 4. Setup Services (with image_url, image_file_id, image_alt_ar)
  var services = [
    {
      id: 'ai-solutions',
      titleAr: 'حلول الذكاء الاصطناعي',
      titleEn: 'Artificial Intelligence Solutions',
      shortDescAr:
        'تطوير نماذج ذكاء اصطناعي مخصصة، أنظمة التنبؤ وتحليل البيانات الضخمة، وحلول معالجة اللغة الطبيعية للارتقاء بإنتاجية الأعمال.',
      featuresAr: JSON.stringify([
        'نماذج تعلم آلي مخصصة لاحتياجات المؤسسات',
        'تحليلات تنبؤية للقرارات المالية والتشغيلية',
        'مساعدات ذكية وأتمتة خدمة العملاء',
        'معالجة الوثائق واستخراج البيانات آلياً',
      ]),
      iconName: 'Cpu',
      image_url: '',
      image_file_id: '',
      image_alt_ar: 'حلول الذكاء الاصطناعي في سمارت مسار',
    },
    {
      id: 'software-dev',
      titleAr: 'تطوير البرمجيات والأنظمة',
      titleEn: 'Software Development',
      shortDescAr:
        'هندسة منصات ويب وتطبيقات سحابية فائقة الأداء وفق أحدث المعايير البرمجية لتلبية متطلبات المشاريع الريادية والشركات.',
      featuresAr: JSON.stringify([
        'بناء تطبيقات الويب الحديثة وحلول السحابية',
        'تكامل واجهات البرمجة APIs وتوحيد الأنظمة',
        'بنية تحتية مرنة وقابلة للتوسع الفوري',
        'معايير أمان عالية وضمان استمرارية التشغيل',
      ]),
      iconName: 'Code',
      image_url: '',
      image_file_id: '',
      image_alt_ar: 'تطوير البرمجيات والأنظمة السحابية',
    },
    {
      id: 'digital-transformation',
      titleAr: 'التحول الرقمي المؤسسي',
      titleEn: 'Digital Transformation',
      shortDescAr:
        'استراتيجيات شاملة لرقمنة بيئة العمل والانتقال من الإجراءات التقليدية إلى بيئات رقمية متكاملة ترفع كفاءة الأداء التشغيلي.',
      featuresAr: JSON.stringify([
        'دراسة وتحليل فجوات التحول الرقمي الحالية',
        'خارطة طريق تنفيذية للتحديث التكنولوجي',
        'إدارة التغيير وتأهيل الكوادر البشرية',
        'ربط القنوات الرقمية وتحسين تجربة المستفيدين',
      ]),
      iconName: 'Share2',
      image_url: '',
      image_file_id: '',
      image_alt_ar: 'استراتيجيات التحول الرقمي المؤسسي',
    },
    {
      id: 'process-automation',
      titleAr: 'أتمتة العمليات التشغيلية (RPA)',
      titleEn: 'Business Process Automation',
      shortDescAr:
        'أتمتة المهام الروتينية وسير المعاملات الإدارية والمالية لتقليل التكاليف التشغيلية والتخلص التام من الأخطاء البشرية.',
      featuresAr: JSON.stringify([
        'أتمتة تدفقات الفواتير والمطابقات الحسابية',
        'إدارة دورات الموافقات الإدارية الذكية',
        'أرشفة رقمية وتتبع تلقائي للمستندات',
        'تقارير فورية ومؤشرات قياس الأداء KPI',
      ]),
      iconName: 'Sliders',
      image_url: '',
      image_file_id: '',
      image_alt_ar: 'أتمتة العمليات التشغيلية والإدارية',
    },
  ];
  overwriteTable(ss, 'Services', services);

  // 5. Setup Pages (with hero_image_url, hero_image_file_id)
  var pages = [
    {
      id: 'home',
      slug: '/',
      titleAr: 'الرئيسية — سمارت مسار',
      titleEn: 'Homepage',
      subtitleAr: 'نبتكر اليوم لنصنع فرص الغد',
      hero_image_url: '',
      hero_image_file_id: '',
      hero_image_alt_ar: 'صورة الواجهة الرئيسية لشركة سمارت مسار',
    },
    {
      id: 'about',
      slug: '/about',
      titleAr: 'عن الشركة (من نحن)',
      titleEn: 'About Smart Masar',
      subtitleAr: 'نبتكر الحلول الذكية لنصنع آفاق الغد',
      hero_image_url: '',
      hero_image_file_id: '',
      hero_image_alt_ar: 'صورة بانر صفحة من نحن',
    },
    {
      id: 'services',
      slug: '/services',
      titleAr: 'خدماتنا التقنية',
      titleEn: 'Technology Services',
      subtitleAr: 'حلول متقدمة في الذكاء الاصطناعي وهندسة التحول الرقمي',
      hero_image_url: '',
      hero_image_file_id: '',
      hero_image_alt_ar: 'صورة بانر صفحة الخدمات التقنية',
    },
    {
      id: 'team',
      slug: '/team',
      titleAr: 'فريق العمل والكوادر',
      titleEn: 'Our Team',
      subtitleAr: 'فريق العمل والكوادر التأسيسية',
      hero_image_url: '',
      hero_image_file_id: '',
      hero_image_alt_ar: 'صورة بانر صفحة فريق العمل',
    },
    {
      id: 'organization',
      slug: '/organization',
      titleAr: 'الهيكل التنظيمي التفاعلي',
      titleEn: 'Organization Chart',
      subtitleAr: 'الهيكل التنظيمي لشركة سمارت مسار',
      hero_image_url: '',
      hero_image_file_id: '',
      hero_image_alt_ar: 'صورة بانر صفحة الهيكل التنظيمي',
    },
    {
      id: 'careers',
      slug: '/careers',
      titleAr: 'فرص العمل والتوظيف',
      titleEn: 'Careers & Vacancies',
      subtitleAr: 'فرص العمل وبناء المسار المهني مع سمارت مسار',
      hero_image_url: '',
      hero_image_file_id: '',
      hero_image_alt_ar: 'صورة بانر صفحة الوظائف والشواغر',
    },
    {
      id: 'contact',
      slug: '/contact',
      titleAr: 'تواصل معنا',
      titleEn: 'Contact Us',
      subtitleAr: 'تواصل مع إدارة سمارت مسار',
      hero_image_url: '',
      hero_image_file_id: '',
      hero_image_alt_ar: 'صورة بانر صفحة التواصل',
    },
  ];
  overwriteTable(ss, 'Pages', pages);

  // 6. Setup Jobs
  var jobs = [
    {
      id: 'job-accountant-01',
      titleAr: 'محاسب عام – Accountant',
      titleEn: 'Accountant',
      departmentId: 'finance',
      departmentNameAr: 'المالية والمحاسبة',
      status: 'active',
      employmentTypeAr: 'دوام كامل (مكتبي / هجين)',
      locationAr: 'المقر الرئيسي — عمّان',
      experienceLevelAr: 'سنتان إلى 4 سنوات خبرة',
      googleFormsUrl:
        'https://docs.google.com/forms/d/e/1FAIpQLSc-placeholder-smart-masar-accountant-form/viewform',
      summaryAr:
        'تبحث شركة سمارت مسار عن محاسب محترف وموثوق للانضمام إلى قسم المالية والمحاسبة، للمساهمة في إدارة العمليات المحاسبية اليومية، إعداد التقارير المالية الدقيقة، ومتابعة المطابقات البنكية وتطوير الإجراءات المالية الرقمية.',
      responsibilitiesAr: JSON.stringify([
        'تسجيل القيود المحاسبية اليومية ومراجعة فواتير المشتريات والمبيعات بدقة عالية.',
        'إجراء المطابقات البنكية ومطابقة حسابات العملاء والموردين بشكل دوري.',
        'المشاركة في إعداد القوائم المالية الشهرية وميزان المراجعة وتقارير التدفق النقدي.',
        'متابعة الحسابات المدينة والدائنة والتحصيلات والتسويات المالية.',
      ]),
      qualificationsAr: JSON.stringify([
        'شهادة البكالوريوس في المحاسبة أو العلوم المالية والمصرفية من جامعة معترف بها.',
        'خبرة عملية لا تقل عن سنتين في المحاسبة المالية والتسجيل الدفتري والإلكتروني.',
        'معرفة تامة بالمعايير المحاسبية الدولية (IFRS) واللوائح الضريبية.',
      ]),
      accountingSkillsAr: JSON.stringify([
        'إتقان متقدم لبرنامج Microsoft Excel (الدوال المحاسبية المتقدمة، Pivot Tables، VLOOKUP/XLOOKUP).',
        'القدرة على إعداد وتصميم جداول الإهلاك والتقارير التحليلية وجداول التدفقات النقدية.',
      ]),
      softwareExperienceAr: JSON.stringify([
        'خبرة سابقة في استخدام الأنظمة المحاسبية الشائعة وبرمجيات تخطيط الموارد (ERP).',
        'إلمام ببرامج مثل QuickBooks أو Odoo أو Zoho Books.',
      ]),
      applicationInstructionsAr:
        'يرجى الضغط على زر "تقديم الطلب الآن" بالأسفل وتعبئة نموذج التقديم الرسمي عبر Google Forms مع إرفاق السيرة الذاتية المحدثة.',
      postedDate: '2026-10-15',
    },
  ];
  overwriteTable(ss, 'Jobs', jobs);

  Logger.log(
    'Smart Masar Google Sheets initialized with 6 tables! Dedicated Google Drive Folder ID: ' +
      driveFolder.getId()
  );
}
