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
  normalizeEmployeeVisibility,
  sanitizeEmployeeForPublicView,
  getVisibleTeamEmployees,
  getVisibleOrgChartEmployees,
  buildDynamicOrgStructure,
  TEAM_EXISTING_COLUMNS,
  TEAM_NEW_VISIBILITY_COLUMNS,
} from './orgChart';
import { INITIAL_DEPARTMENTS, INITIAL_EMPLOYEES } from '../data/initialData';

test('buildOrgTree places Dr. Ahmad Al-Abed at root with all 11 direct reports (9 Heads + Eng. Razan Jaber + Ahmad Bakr)', () => {
  const tree = buildOrgTree(INITIAL_EMPLOYEES, INITIAL_DEPARTMENTS);
  assert.ok(tree !== null, 'Tree should not be null');
  assert.equal(tree?.id, 'emp-ahmed-alabed');
  assert.equal(tree?.jobTitleAr, 'الرئيس التنفيذي');
  assert.equal(tree?.level, 0);
  assert.equal(
    tree?.children.length,
    11,
    'All 11 direct reports (9 Heads + Executive Advisor + Corporate Governance Lead) report to CEO'
  );
});

test('getDepartmentStats correctly calculates team counts across all 12 approved departments', () => {
  const stats = getDepartmentStats(INITIAL_EMPLOYEES, INITIAL_DEPARTMENTS);
  assert.equal(stats.length, 12);

  const execStat = stats.find((s) => s.department.id === 'exec');
  assert.ok(execStat);
  assert.equal(execStat?.count, 1);

  const advisoryStat = stats.find((s) => s.department.id === 'dept-exec-digital-advisory');
  assert.ok(advisoryStat);
  assert.equal(advisoryStat?.count, 1);

  const governanceStat = stats.find((s) => s.department.id === 'dept-governance-compliance');
  assert.ok(governanceStat);
  assert.equal(governanceStat?.count, 1);
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
    departmentId: 'dept-it',
    jobTitleAr: 'مهندس برمجيات',
  });
  assert.equal(validResult.isValid, true);
  assert.equal(Object.keys(validResult.errors).length, 0);
});

test('filterTeam searches accurately across Arabic and English, department IDs, and role categories', () => {
  const arabicResult = filterTeam(INITIAL_EMPLOYEES, 'أحمد العابد', 'all');
  assert.equal(arabicResult.length, 1);
  assert.equal(arabicResult[0].id, 'emp-ahmed-alabed');

  const razanResult = filterTeam(INITIAL_EMPLOYEES, 'رزان', 'all');
  assert.equal(razanResult.length, 1);
  assert.equal(razanResult[0].id, 'emp-razan-jaber');

  const bakrResult = filterTeam(INITIAL_EMPLOYEES, 'Ahmad Bakr', 'all');
  assert.equal(bakrResult.length, 1);
  assert.equal(bakrResult[0].id, 'emp-ahmed-bakr');

  const haneenResult = filterTeam(INITIAL_EMPLOYEES, 'Haneen', 'all');
  assert.equal(haneenResult.length, 1);
  assert.equal(haneenResult[0].id, 'emp-haneen-ziad');

  const deptResult = filterTeam(INITIAL_EMPLOYEES, '', 'dept-finance');
  assert.equal(deptResult.length, 1);
  assert.equal(deptResult[0].id, 'emp-ekram-alsharafat');

  const execAdvisorResult = filterTeam(
    INITIAL_EMPLOYEES,
    '',
    'all',
    'executive_advisor',
    true
  );
  assert.equal(execAdvisorResult.length, 2, 'CEO + Executive Advisor');
});

test('Visibility & Privacy controls: normalizeEmployeeVisibility, sanitizeEmployeeForPublicView, getVisibleTeamEmployees, and getVisibleOrgChartEmployees', () => {
  const sample = INITIAL_EMPLOYEES[0];
  const normalized = normalizeEmployeeVisibility(sample);
  assert.equal(normalized.showOnTeamPage, true);
  assert.equal(normalized.showOnOrgChart, true);
  assert.equal(normalized.showPublicEmail, false);
  assert.equal(normalized.showPublicProfile, true);

  // Public sanitization must strip personal email when showPublicEmail is false
  const sanitizedDefault = sanitizeEmployeeForPublicView({
    ...sample,
    email: 'private.personal@yahoo.com',
    showPublicEmail: false,
  });
  assert.equal(sanitizedDefault.email, '');

  // Public sanitization preserves email only when showPublicEmail is explicitly true
  const sanitizedPublic = sanitizeEmployeeForPublicView({
    ...sample,
    email: 'official@smartmasar.com',
    showPublicEmail: true,
  });
  assert.equal(sanitizedPublic.email, 'official@smartmasar.com');

  // Hiding an employee from Team page removes them from getVisibleTeamEmployees without deleting from array
  const modifiedList = INITIAL_EMPLOYEES.map((e) =>
    e.id === 'emp-razan-jaber'
      ? { ...e, showOnTeamPage: false, showOnOrgChart: true }
      : e.id === 'emp-ahmed-bakr'
      ? { ...e, showOnTeamPage: true, showOnOrgChart: false }
      : e
  );
  assert.equal(modifiedList.length, 12, 'All 12 records remain intact');
  const visibleTeam = getVisibleTeamEmployees(modifiedList);
  assert.equal(visibleTeam.length, 11);
  assert.equal(
    visibleTeam.some((e) => e.id === 'emp-razan-jaber'),
    false,
    'Razan hidden from Team page when showOnTeamPage=false'
  );

  const visibleOrg = getVisibleOrgChartEmployees(modifiedList);
  assert.equal(visibleOrg.length, 11);
  assert.equal(
    visibleOrg.some((e) => e.id === 'emp-ahmed-bakr'),
    false,
    'Ahmad Bakr hidden from Org Chart when showOnOrgChart=false'
  );
});

test('buildDynamicOrgStructure builds live hierarchy from Team and Departments including Executive Advisory and Corporate Governance', () => {
  const liveOrg = buildDynamicOrgStructure(INITIAL_EMPLOYEES, INITIAL_DEPARTMENTS);
  assert.ok(liveOrg.ceo);
  assert.equal(liveOrg.ceo?.id, 'emp-ahmed-alabed');
  assert.equal(liveOrg.advisoryUnits.length, 1);
  assert.equal(liveOrg.advisoryUnits[0].head?.id, 'emp-razan-jaber');
  assert.equal(liveOrg.departmentUnits.length, 10, '9 core departments + Corporate Governance');
  assert.equal(liveOrg.summary.totalVisibleMembers, 12);
  assert.equal(liveOrg.summary.totalExecutives, 1);
  assert.equal(liveOrg.summary.totalAdvisors, 1);
  assert.equal(liveOrg.summary.totalDepartmentLeads, 10);
});

test('Column migration plan constants define 16 existing columns and 4 new visibility columns', () => {
  assert.equal(TEAM_EXISTING_COLUMNS.length, 16);
  assert.equal(TEAM_NEW_VISIBILITY_COLUMNS.length, 4);
  assert.deepEqual(
    TEAM_NEW_VISIBILITY_COLUMNS.map((c) => c.columnName),
    ['showOnTeamPage', 'showOnOrgChart', 'showPublicEmail', 'showPublicProfile']
  );
});

test('SMART_MASAR_ORG_STRUCTURE preserves separated training structure without mixing into INITIAL_EMPLOYEES counts', () => {
  assert.equal(SMART_MASAR_ORG_STRUCTURE.ceo.nameEn, 'Dr. Ahmad Al-Abed');
  assert.equal(SMART_MASAR_ORG_STRUCTURE.departments.length, 9);
  const summary = getOrgStructureSummary();
  assert.equal(summary.totalExecutives, 1);
  assert.equal(summary.totalDepartmentHeads, 9);
  assert.equal(summary.totalStaff, 18);
  assert.equal(summary.totalMembers, 28);
});

test('filterOrgDepartments filters training structure by head or staff names and titles', () => {
  const byHead = filterOrgDepartments(SMART_MASAR_ORG_STRUCTURE.departments, 'Ekhlaslellah');
  assert.equal(byHead.length, 1);
  assert.equal(byHead[0].id, 'dept-inst-dev');

  const byStaff = filterOrgDepartments(SMART_MASAR_ORG_STRUCTURE.departments, 'Machine Learning');
  assert.equal(byStaff.length, 1);
  assert.equal(byStaff[0].id, 'dept-tech-ai');
});
