/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOrgTree, getDepartmentStats, validateEmployee, filterTeam } from './orgChart';
import { INITIAL_DEPARTMENTS, INITIAL_EMPLOYEES } from '../data/initialData';

test('buildOrgTree places Dr. Ahmed Alabed at root', () => {
  const tree = buildOrgTree(INITIAL_EMPLOYEES, INITIAL_DEPARTMENTS);
  assert.ok(tree !== null, 'Tree should not be null');
  assert.equal(tree?.id, 'emp-ahmed-alabed');
  assert.equal(tree?.jobTitleAr, 'المدير العام');
  assert.equal(tree?.level, 0);
  assert.equal(tree?.children.length, 5, 'All other 5 employees report to General Manager');
});

test('getDepartmentStats correctly calculates team counts per department', () => {
  const stats = getDepartmentStats(INITIAL_EMPLOYEES, INITIAL_DEPARTMENTS);
  assert.equal(stats.length, INITIAL_DEPARTMENTS.length);

  const execStat = stats.find(s => s.department.id === 'exec');
  assert.ok(execStat);
  assert.equal(execStat?.count, 1);
  assert.equal(execStat?.confirmedCount, 1);

  const techStat = stats.find(s => s.department.id === 'tech');
  assert.ok(techStat);
  assert.equal(techStat?.count, 1);
  assert.equal(techStat?.confirmedCount, 0, 'Unconfirmed position should have confirmedCount 0');
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
    departmentId: 'tech',
    jobTitleAr: 'مهندس برمجيات',
  });
  assert.equal(validResult.isValid, true);
  assert.equal(Object.keys(validResult.errors).length, 0);
});

test('filterTeam searches accurately across Arabic and English', () => {
  const arabicResult = filterTeam(INITIAL_EMPLOYEES, 'أحمد', 'all');
  assert.equal(arabicResult.length, 1);
  assert.equal(arabicResult[0].id, 'emp-ahmed-alabed');

  const englishResult = filterTeam(INITIAL_EMPLOYEES, 'Haneen', 'all');
  assert.equal(englishResult.length, 1);
  assert.equal(englishResult[0].id, 'emp-haneen-alkasaji');

  const deptResult = filterTeam(INITIAL_EMPLOYEES, '', 'finance');
  assert.equal(deptResult.length, 1);
  assert.equal(deptResult[0].id, 'emp-ikram-alsharafat');
});
