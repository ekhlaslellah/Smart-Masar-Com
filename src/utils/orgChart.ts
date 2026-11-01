/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Department, Employee, OrgNode } from '../types';

/**
 * Builds a hierarchical organizational tree from a flat list of employees.
 */
export function buildOrgTree(
  employees: Employee[],
  departments: Department[]
): OrgNode | null {
  if (!employees || employees.length === 0) return null;

  const deptMap = new Map<string, Department>();
  departments.forEach((d) => deptMap.set(d.id, d));

  // Find root employee (managerId is null or root ID)
  let rootEmp = employees.find((e) => e.managerId === null);
  if (!rootEmp) {
    // Fallback: Dr. Ahmed Alabed or first employee
    rootEmp = employees.find((e) => e.id === 'emp-ahmed-alabed') || employees[0];
  }

  const buildSubtree = (emp: Employee, level: number): OrgNode => {
    const children = employees
      .filter((e) => e.managerId === emp.id && e.id !== emp.id)
      .sort((a, b) => a.order - b.order)
      .map((child) => buildSubtree(child, level + 1));

    return {
      ...emp,
      department: deptMap.get(emp.departmentId),
      children,
      level,
    };
  };

  return buildSubtree(rootEmp, 0);
}

/**
 * Calculates member counts per department.
 */
export function getDepartmentStats(
  employees: Employee[],
  departments: Department[]
): Array<{ department: Department; count: number; confirmedCount: number }> {
  return departments.map((dept) => {
    const deptEmployees = employees.filter((e) => e.departmentId === dept.id);
    const confirmedCount = deptEmployees.filter((e) => e.isConfirmedPosition).length;
    return {
      department: dept,
      count: deptEmployees.length,
      confirmedCount,
    };
  });
}

/**
 * Validates employee input data for forms.
 */
export function validateEmployee(data: Partial<Employee>): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!data.nameAr || data.nameAr.trim().length < 2) {
    errors.nameAr = 'يرجى كتابة الاسم باللغة العربية (حرفان على الأقل)';
  }
  if (!data.nameEn || data.nameEn.trim().length < 2) {
    errors.nameEn = 'يرجى كتابة الاسم باللغة الإنجليزية';
  }
  if (!data.departmentId) {
    errors.departmentId = 'يرجى اختيار القسم التابع له';
  }
  if (!data.jobTitleAr || data.jobTitleAr.trim().length < 2) {
    errors.jobTitleAr = 'يرجى تحديد المسمى الوظيفي بالعربية';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Filters employee list by search term and department.
 */
export function filterTeam(
  employees: Employee[],
  searchTerm: string = '',
  departmentId: string = 'all'
): Employee[] {
  const cleanSearch = searchTerm.trim().toLowerCase();

  return employees.filter((emp) => {
    const matchesDept = departmentId === 'all' || emp.departmentId === departmentId;
    if (!matchesDept) return false;

    if (!cleanSearch) return true;

    const matchNameAr = emp.nameAr.toLowerCase().includes(cleanSearch);
    const matchNameEn = emp.nameEn.toLowerCase().includes(cleanSearch);
    const matchTitleAr = emp.jobTitleAr.toLowerCase().includes(cleanSearch);
    const matchTitleEn = emp.jobTitleEn.toLowerCase().includes(cleanSearch);

    return matchNameAr || matchNameEn || matchTitleAr || matchTitleEn;
  });
}
