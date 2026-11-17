/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildOrgTree,
  getDepartmentStats,
  validateEmployee,
  filterTeam,
  SMART_MASAR_ORG_STRUCTURE,
  getOrgStructureSummary,
  filterOrgDepartments,
} from './orgChart';
import { INITIAL_DEPARTMENTS, INITIAL_EMPLOYEES } from '../data/initialData';

test('buildOrgTree places Dr. Ahmad Al-Abed at root with 9 confirmed Department Heads', () => {
  const tree = buildOrgTree(INITIAL_EMPLOYEES, INITIAL_DEPARTMENTS);
  assert.ok(tree !== null, 'Tree should not be null');
  assert.equal(tree?.id, 'emp-ahmed-alabed');
  assert.equal(tree?.jobTitleAr, 'الرئيس التنفيذي');
  assert.equal(tree?.level, 0);
  assert.equal(tree?.children.length, 9, 'All 9 Department Heads report to CEO');
});

test('getDepartmentStats correctly calculates team counts across all 10 approved departments', () => {
  const stats = getDepartmentStats(INITIAL_EMPLOYEES, INITIAL_DEPARTMENTS);
  assert.equal(stats.length, 10);

  const execStat = stats.find((s) => s.department.id === 'exec');
  assert.ok(execStat);
  assert.equal(execStat?.count, 1);
  assert.equal(execStat?.confirmedCount, 1);

  const techStat = stats.find((s) => s.department.id === 'dept-tech-ai');
  assert.ok(techStat);
  assert.equal(techStat?.count, 1);
  assert.equal(techStat?.confirmedCount, 1);
});

test('validateEmployee rejects empty Arabic and English names', () => {
  const invalidResult = validateEmployee({
    nameAr: '',
    nameEn: '',
    departmentId: '',
    jobTitleAr: '',
  });
  assert.equal(invalidResult.isValid, false);
  assert.ok(invalidResult.errors.nameAr);
  assert.ok(invalidResult.errors.nameEn);
  assert.ok(invalidResult.errors.departmentId);

  const validResult = validateEmployee({
    nameAr: 'أحمد محمود',
    nameEn: 'Ahmad Mahmoud',
    departmentId: 'dept-tech-ai',
    jobTitleAr: 'مهندس برمجيات',
  });
  assert.equal(validResult.isValid, true);
  assert.equal(Object.keys(validResult.errors).length, 0);
});

test('filterTeam searches accurately across Arabic and English and department IDs', () => {
  const arabicResult = filterTeam(INITIAL_EMPLOYEES, 'أحمد', 'all');
  assert.equal(arabicResult.length, 1);
  assert.equal(arabicResult[0].id, 'emp-ahmed-alabed');

  const englishResult = filterTeam(INITIAL_EMPLOYEES, 'Haneen', 'all');
  assert.equal(englishResult.length, 1);
  assert.equal(englishResult[0].id, 'emp-haneen-ziad');

  const deptResult = filterTeam(INITIAL_EMPLOYEES, '', 'dept-finance');
  assert.equal(deptResult.length, 1);
  assert.equal(deptResult[0].id, 'emp-ekram-alsharafat');
});

test('SMART_MASAR_ORG_STRUCTURE has CEO Dr. Ahmad Al-Abed, 9 Department Heads linked to INITIAL_EMPLOYEES, and 2 Staff per department', () => {
  assert.equal(SMART_MASAR_ORG_STRUCTURE.ceo.nameEn, 'Dr. Ahmad Al-Abed');
  assert.equal(SMART_MASAR_ORG_STRUCTURE.ceo.titleEn, 'Chief Executive Officer (CEO)');
  assert.equal(SMART_MASAR_ORG_STRUCTURE.departments.length, 9);

  const expectedHeads = [
    ['Ekhlaslellah Al-Shalabi', 'Head of Institutional Development & Training', 'emp-ekhlaslellah-alshalabi'],
    ['Rahaf Al-Sharafat', 'Head of Human Resources', 'emp-rahaf-alsharafat'],
    ['Shorouq Al-Sharafat', 'Head of Marketing & Public Relations', 'emp-shorouq-alsharafat'],
    ['Ekram Al-Sharafat', 'Head of Finance & Accounting', 'emp-ekram-alsharafat'],
    ['Amani Akram', 'Head of Technology & AI', 'emp-amani-akram'],
    ['Doaa Tareq', 'Head of Operations & Projects', 'emp-doaa-tareq'],
    ['Roaa', 'Head of Business Development & Partnerships', 'emp-roaa'],
    ['Haneen Ziad', 'Head of Customer Experience & Services', 'emp-haneen-ziad'],
    ['Sumaya Al-Sharafat', 'Head of Quality & Performance', 'emp-sumaya-alsharafat'],
  ];

  SMART_MASAR_ORG_STRUCTURE.departments.forEach((dept, idx) => {
    assert.equal(dept.head.nameEn, expectedHeads[idx][0]);
    assert.equal(dept.head.titleEn, expectedHeads[idx][1]);
    assert.equal(dept.head.linkedEmployeeId, expectedHeads[idx][2]);
    const linkedEmp = INITIAL_EMPLOYEES.find((e) => e.id === dept.head.linkedEmployeeId);
    assert.ok(linkedEmp, `Linked employee ${dept.head.linkedEmployeeId} must exist in INITIAL_EMPLOYEES`);
    if (linkedEmp.id === 'emp-haneen-ziad') {
      assert.equal(linkedEmp.image_url || '', '', 'Haneen Ziad image is unlinked pending manual confirmation');
    } else {
      assert.ok((linkedEmp.image_url || '').length > 0, `Linked employee ${linkedEmp.id} must have a recovered image URL`);
    }
    assert.ok(dept.head.titleAr.length > 0, 'Arabic title must be present');
    assert.equal(dept.staff.length, 2, `${dept.head.nameEn} must have 2 subordinate staff`);
    dept.staff.forEach((member) => {
      assert.ok(member.nameEn.length > 0, 'Staff English name must exist');
      assert.ok(member.titleEn.length > 0, 'Staff English title must exist');
      assert.ok(member.titleAr.length > 0, 'Staff Arabic title must exist');
    });
  });

  const summary = getOrgStructureSummary();
  assert.equal(summary.totalExecutives, 1);
  assert.equal(summary.totalDepartmentHeads, 9);
  assert.equal(summary.totalStaff, 18);
  assert.equal(summary.totalMembers, 28);
});

test('filterOrgDepartments filters by head or staff English and Arabic names and titles', () => {
  const byHead = filterOrgDepartments(SMART_MASAR_ORG_STRUCTURE.departments, 'Ekhlaslellah');
  assert.equal(byHead.length, 1);
  assert.equal(byHead[0].id, 'dept-inst-dev');

  const byStaff = filterOrgDepartments(SMART_MASAR_ORG_STRUCTURE.departments, 'Machine Learning');
  assert.equal(byStaff.length, 1);
  assert.equal(byStaff[0].id, 'dept-tech-ai');

  const byArabic = filterOrgDepartments(SMART_MASAR_ORG_STRUCTURE.departments, 'الجودة والأداء');
  assert.equal(byArabic.length, 1);
  assert.equal(byArabic[0].head.nameEn, 'Sumaya Al-Sharafat');
});
