/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Department {
  id: string;
  nameAr: string;
  nameEn: string;
  iconName: string;
  badgeBg: string;
}

export interface Employee {
  id: string;
  nameAr: string;
  nameEn: string;
  jobTitleAr: string;
  jobTitleEn: string;
  departmentId: string;
  managerId: string | null;
  avatarUrl?: string; // Public display URL or path
  image_url?: string; // Google Sheets column: image_url
  image_file_id?: string; // Google Sheets column: image_file_id (Google Drive File ID)
  image_alt_ar?: string; // Google Sheets column: image_alt_ar
  initials: string;
  bioAr?: string;
  email?: string;
  isConfirmedPosition: boolean; // false for "قيد التعيين" (Position to be assigned)
  order: number;
}

export interface JobVacancy {
  id: string;
  titleAr: string;
  titleEn: string;
  departmentId: string;
  departmentNameAr: string;
  status: 'active' | 'closed';
  employmentTypeAr: string;
  locationAr: string;
  googleFormsUrl: string;
  summaryAr: string;
  responsibilitiesAr: string[];
  qualificationsAr: string[];
  accountingSkillsAr: string[];
  softwareExperienceAr: string[];
  applicationInstructionsAr: string;
  postedDate: string;
  experienceLevelAr: string;
}

export interface CompanyProfile {
  nameAr: string;
  nameEn: string;
  taglineAr: string;
  taglineEn: string;
  industryAr: string;
  industryEn: string;
  visionAr: string;
  missionAr: string;
  valuesAr: Array<{
    titleAr: string;
    descriptionAr: string;
    icon: string;
  }>;
  aboutDescriptionAr: string;
  email: string;
  phone: string;
  locationAr: string;
  workingHoursAr: string;
  googleFormsPlaceholderUrl: string;
  logo_url?: string; // Google Sheets SiteSettings: logo_url
  logo_file_id?: string; // Google Sheets SiteSettings: logo_file_id
  logo_alt_ar?: string;
  drive_folder_id?: string; // Google Drive folder ID for image uploads
}

export interface OrgNode extends Employee {
  department?: Department;
  children: OrgNode[];
  level: number;
}

export interface ServiceItem {
  id: string;
  titleAr: string;
  titleEn: string;
  shortDescAr: string;
  featuresAr: string[];
  iconName: string;
  highlightTag?: string;
  image_url?: string; // Google Sheets column: image_url
  image_file_id?: string; // Google Sheets column: image_file_id
  image_alt_ar?: string; // Google Sheets column: image_alt_ar
}

export interface PageMetadata {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  hero_image_url?: string; // Google Sheets column: hero_image_url
  hero_image_file_id?: string; // Google Sheets column: hero_image_file_id
  hero_image_alt_ar?: string;
}

