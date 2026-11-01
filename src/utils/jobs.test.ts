/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { JobVacancy } from '../types';

export function filterActiveJobs(jobs: JobVacancy[]): JobVacancy[] {
  return jobs.filter((j) => j.status === 'active');
}

export function validateJobInput(data: Partial<JobVacancy>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data.titleAr || !data.titleAr.trim()) {
    errors.push('عنوان الوظيفة بالعربية مطلوب');
  }
  if (!data.titleEn || !data.titleEn.trim()) {
    errors.push('Job title in English is required');
  }
  if (!data.googleFormsUrl || !data.googleFormsUrl.trim()) {
    errors.push('رابط استمارة التقديم على Google Forms مطلوب');
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}

export function toggleJobStatus(current: 'active' | 'closed'): 'active' | 'closed' {
  return current === 'active' ? 'closed' : 'active';
}

const sampleJobs: JobVacancy[] = [
  {
    id: 'job-1',
    titleAr: 'محاسب عام',
    titleEn: 'Accountant',
    departmentId: 'finance',
    departmentNameAr: 'المالية والمحاسبة',
    status: 'active',
    employmentTypeAr: 'دوام كامل',
    locationAr: 'عمان',
    googleFormsUrl: 'https://docs.google.com/forms/d/e/.../viewform',
    summaryAr: 'وصف المحاسب',
    responsibilitiesAr: ['إعداد التقارير'],
    qualificationsAr: ['بكالوريوس محاسبة'],
    accountingSkillsAr: ['Excel'],
    softwareExperienceAr: ['ERP'],
    applicationInstructionsAr: 'يرجى التقديم',
    postedDate: '2026-10-15',
    experienceLevelAr: 'متوسط',
  },
  {
    id: 'job-2',
    titleAr: 'مطور ذكاء اصطناعي',
    titleEn: 'AI Engineer',
    departmentId: 'tech',
    departmentNameAr: 'التكنولوجيا والذكاء الاصطناعي',
    status: 'closed',
    employmentTypeAr: 'دوام كامل',
    locationAr: 'عمان',
    googleFormsUrl: 'https://docs.google.com/forms/d/e/.../viewform',
    summaryAr: 'وصف مطور AI',
    responsibilitiesAr: ['تدريب النماذج'],
    qualificationsAr: ['علوم حاسوب'],
    accountingSkillsAr: ['Python'],
    softwareExperienceAr: ['PyTorch'],
    applicationInstructionsAr: 'يرجى التقديم',
    postedDate: '2026-10-20',
    experienceLevelAr: 'متقدم',
  },
];

test('filterActiveJobs correctly filters active vacancies', () => {
  const active = filterActiveJobs(sampleJobs);
  assert.strictEqual(active.length, 1);
  assert.strictEqual(active[0].id, 'job-1');
});

test('validateJobInput validates required fields', () => {
  const invalid = validateJobInput({ titleAr: '', titleEn: '', googleFormsUrl: '' });
  assert.strictEqual(invalid.valid, false);
  assert.strictEqual(invalid.errors.length, 3);

  const valid = validateJobInput({
    titleAr: 'مهندس برمجيات',
    titleEn: 'Software Engineer',
    googleFormsUrl: 'https://docs.google.com/forms/d/e/.../viewform',
  });
  assert.strictEqual(valid.valid, true);
  assert.strictEqual(valid.errors.length, 0);
});

test('toggleJobStatus alternates between active and closed', () => {
  assert.strictEqual(toggleJobStatus('active'), 'closed');
  assert.strictEqual(toggleJobStatus('closed'), 'active');
});
