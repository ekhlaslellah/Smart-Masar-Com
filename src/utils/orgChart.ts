/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Department, Employee, OrgNode } from '../types';

export type EmployeeRoleCategory =
  | 'executive'
  | 'advisor'
  | 'department_lead'
  | 'specialist';

/**
 * Safely parses a boolean value from Google Sheets / SheetDB strings or booleans,
 * falling back to `defaultValue` when undefined, null, or blank string.
 */
export function parseEmployeeBoolean(
  val: unknown,
  defaultValue: boolean
): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val !== 0;
  if (typeof val === 'string') {
    const trimmed = val.trim().toLowerCase();
    if (!trimmed) return defaultValue;
    if (trimmed === 'true' || trimmed === '1' || trimmed === 'yes') return true;
    if (trimmed === 'false' || trimmed === '0' || trimmed === 'no') return false;
  }
  return defaultValue;
}

/**
 * Normalizes an employee record with explicit, backward-compatible defaults for
 * the 4 independent visibility & privacy options:
 * - showOnTeamPage: default true
 * - showOnOrgChart: default true
 * - showPublicEmail: default false (protects personal emails unless explicitly enabled)
 * - showPublicProfile: default true
 */
export function normalizeEmployeeVisibility(emp: Employee): Employee {
  const cleanManagerId =
    emp.managerId && String(emp.managerId).trim().length > 0
      ? String(emp.managerId).trim()
      : null;

  return {
    ...emp,
    managerId: cleanManagerId,
    isConfirmedPosition: parseEmployeeBoolean(emp.isConfirmedPosition, true),
    order: Number(emp.order) || 1,
    showOnTeamPage: parseEmployeeBoolean(emp.showOnTeamPage, true),
    showOnOrgChart: parseEmployeeBoolean(emp.showOnOrgChart, true),
    showPublicEmail: parseEmployeeBoolean(emp.showPublicEmail, false),
    showPublicProfile: parseEmployeeBoolean(emp.showPublicProfile, true),
  };
}

/**
 * Masks private fields (such as personal email when `showPublicEmail` is false)
 * so that public views and unauthenticated API responses never leak private data.
 */
export function sanitizeEmployeeForPublicView(emp: Employee): Employee {
  const normalized = normalizeEmployeeVisibility(emp);
  return {
    ...normalized,
    email: normalized.showPublicEmail ? normalized.email || '' : '',
    bioAr: normalized.showPublicProfile ? normalized.bioAr || '' : '',
  };
}

/**
 * Classifies an employee's organizational role category from their title, department, and reporting line.
 * Supports Executive Leadership, Advisory Roles, Department/Management Leads, and Specialists.
 */
export function getEmployeeRoleCategory(
  emp: Employee,
  _allEmployees?: Employee[]
): EmployeeRoleCategory {
  const titleAr = (emp.jobTitleAr || '').toLowerCase();
  const titleEn = (emp.jobTitleEn || '').toLowerCase();
  const deptId = (emp.departmentId || '').toLowerCase();

  // 1. Root Executive / CEO
  if (
    emp.id === 'emp-ahmed-alabed' ||
    (!emp.managerId &&
      (deptId === 'exec' ||
        titleAr.includes('الرئيس التنفيذي') ||
        titleAr.includes('المدير العام') ||
        titleEn.includes('chief executive') ||
        titleEn.includes('ceo')))
  ) {
    return 'executive';
  }

  // 2. Advisory / Consultant positions (e.g., Executive Advisor)
  if (
    titleAr.includes('مستشار') ||
    titleAr.includes('مستشارة') ||
    titleEn.includes('advisor') ||
    titleEn.includes('consultant') ||
    deptId.includes('advisory')
  ) {
    return 'advisor';
  }

  // 3. Department Heads & Directors
  if (
    titleAr.includes('رئيس') ||
    titleAr.includes('رئيسة') ||
    titleAr.includes('مدير') ||
    titleAr.includes('مديرة') ||
    titleEn.includes('head of') ||
    titleEn.includes('director') ||
    titleEn.includes('chief') ||
    titleEn.includes('lead')
  ) {
    return 'department_lead';
  }

  // 4. Specialist / Staff / Other
  return 'specialist';
}

const ROLE_CATEGORY_RANK: Record<EmployeeRoleCategory, number> = {
  executive: 0,
  advisor: 1,
  department_lead: 2,
  specialist: 3,
};

/**
 * Sorts employees in a logical leadership order:
 * 1. Executive Leadership (CEO)
 * 2. Executive Advisors
 * 3. Department Heads & Directors (ordered by `order`)
 * 4. Specialists & Staff (ordered by `order`)
 */
export function sortEmployeesByHierarchy(employees: Employee[]): Employee[] {
  return [...employees]
    .map(normalizeEmployeeVisibility)
    .sort((a, b) => {
      const rankA = ROLE_CATEGORY_RANK[getEmployeeRoleCategory(a)];
      const rankB = ROLE_CATEGORY_RANK[getEmployeeRoleCategory(b)];
      if (rankA !== rankB) return rankA - rankB;
      const orderA = Number(a.order) || 999;
      const orderB = Number(b.order) || 999;
      if (orderA !== orderB) return orderA - orderB;
      return a.nameAr.localeCompare(b.nameAr, 'ar');
    });
}

/**
 * Returns only employees enabled for display on the public Team page (`showOnTeamPage !== false`),
 * sorted in logical leadership order.
 */
export function getVisibleTeamEmployees(employees: Employee[]): Employee[] {
  return sortEmployeesByHierarchy(
    (employees || []).filter(
      (emp) => normalizeEmployeeVisibility(emp).showOnTeamPage !== false
    )
  );
}

/**
 * Returns only employees enabled for display on the public Organizational Chart (`showOnOrgChart !== false`),
 * sorted in logical leadership order.
 */
export function getVisibleOrgChartEmployees(employees: Employee[]): Employee[] {
  return sortEmployeesByHierarchy(
    (employees || []).filter(
      (emp) => normalizeEmployeeVisibility(emp).showOnOrgChart !== false
    )
  );
}

/**
 * Builds a hierarchical organizational tree from a flat list of employees.
 */
export function buildOrgTree(
  employees: Employee[],
  departments: Department[]
): OrgNode | null {
  const visible = getVisibleOrgChartEmployees(employees);
  if (!visible || visible.length === 0) return null;

  const deptMap = new Map<string, Department>();
  departments.forEach((d) => deptMap.set(d.id, d));

  // Find root employee (managerId is null or root ID)
  let rootEmp = visible.find((e) => !e.managerId);
  if (!rootEmp) {
    rootEmp = visible.find((e) => e.id === 'emp-ahmed-alabed') || visible[0];
  }

  const visited = new Set<string>([rootEmp.id]);

  const buildSubtree = (emp: Employee, level: number): OrgNode => {
    const children = visible
      .filter((e) => e.managerId === emp.id && !visited.has(e.id))
      .sort((a, b) => (a.order || 999) - (b.order || 999))
      .map((child) => {
        visited.add(child.id);
        return buildSubtree(child, level + 1);
      });

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
): Array<{
  department: Department;
  count: number;
  confirmedCount: number;
  visibleTeamCount: number;
  visibleOrgCount: number;
}> {
  return departments.map((dept) => {
    const deptEmployees = employees
      .map(normalizeEmployeeVisibility)
      .filter((e) => e.departmentId === dept.id);
    const confirmedCount = deptEmployees.filter((e) => e.isConfirmedPosition).length;
    const visibleTeamCount = deptEmployees.filter((e) => e.showOnTeamPage !== false).length;
    const visibleOrgCount = deptEmployees.filter((e) => e.showOnOrgChart !== false).length;
    return {
      department: dept,
      count: deptEmployees.length,
      confirmedCount,
      visibleTeamCount,
      visibleOrgCount,
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
 * Filters employee list by search term, department, and optional role category.
 * Respects `showOnTeamPage !== false` by default so hidden employees do not appear on public filters.
 */
export function filterTeam(
  employees: Employee[],
  searchTerm: string = '',
  departmentId: string = 'all',
  roleCategory:
    | 'all'
    | EmployeeRoleCategory
    | 'leadership_advisory'
    | 'executive_advisor' = 'all',
  onlyVisibleOnTeamPage: boolean = true
): Employee[] {
  const cleanSearch = searchTerm.trim().toLowerCase();
  const baseList = onlyVisibleOnTeamPage
    ? getVisibleTeamEmployees(employees)
    : sortEmployeesByHierarchy(employees);

  return baseList.filter((emp) => {
    const matchesDept = departmentId === 'all' || emp.departmentId === departmentId;
    if (!matchesDept) return false;

    if (roleCategory !== 'all') {
      const cat = getEmployeeRoleCategory(emp);
      if (
        roleCategory === 'leadership_advisory' ||
        roleCategory === 'executive_advisor'
      ) {
        if (cat !== 'executive' && cat !== 'advisor') return false;
      } else if (cat !== roleCategory) {
        return false;
      }
    }

    if (!cleanSearch) return true;

    const matchNameAr = emp.nameAr.toLowerCase().includes(cleanSearch);
    const matchNameEn = (emp.nameEn || '').toLowerCase().includes(cleanSearch);
    const matchTitleAr = emp.jobTitleAr.toLowerCase().includes(cleanSearch);
    const matchTitleEn = (emp.jobTitleEn || '').toLowerCase().includes(cleanSearch);

    return matchNameAr || matchNameEn || matchTitleAr || matchTitleEn;
  });
}

// ============================================================================
// DYNAMIC ORGANIZATIONAL STRUCTURE BUILDER (FROM TEAM & DEPARTMENTS DATABASE)
// ============================================================================

export interface DynamicOrgUnit {
  department: Department;
  code: string;
  unitType: 'advisory' | 'department';
  lead: Employee | null;
  head: Employee | null;
  members: Employee[];
}

export type DynamicOrgDepartmentUnit = DynamicOrgUnit;

export interface DynamicOrgStructure {
  ceo: Employee | null;
  executiveDepartment: Department | undefined;
  advisoryUnits: DynamicOrgUnit[];
  departmentUnits: DynamicOrgUnit[];
  independentRoles: Employee[];
  summary: {
    totalDatabaseEmployees: number;
    totalVisibleMembers: number;
    totalExecutives: number;
    totalAdvisors: number;
    totalDepartmentLeads: number;
    totalSpecialists: number;
    totalDepartments: number;
  };
}

/**
 * Dynamically builds the live organizational structure exclusively from `Team` (`employees`)
 * and `Departments` (`departments`), supporting:
 * - Root Executive Leadership (CEO)
 * - Executive Advisory roles & offices (e.g. Eng. Razan Jaber)
 * - Departmental & Governance Leadership units (e.g. 9 Department Heads + Director of Corporate Governance Ahmad Bakr)
 * - Direct reports / team specialists within each department
 * - Non-department-head independent or cross-functional roles
 */
export function buildDynamicOrgStructure(
  employees: Employee[],
  departments: Department[]
): DynamicOrgStructure {
  const allNormalized = (employees || []).map(normalizeEmployeeVisibility);
  const visible = getVisibleOrgChartEmployees(allNormalized);
  const deptMap = new Map<string, Department>();
  (departments || []).forEach((d) => deptMap.set(d.id, d));

  // 1. Identify Root Executive (CEO)
  let ceo: Employee | null =
    visible.find((e) => getEmployeeRoleCategory(e) === 'executive') ||
    visible.find((e) => !e.managerId) ||
    null;

  const assignedEmployeeIds = new Set<string>();
  if (ceo) {
    assignedEmployeeIds.add(ceo.id);
  }

  const executiveDepartment =
    (ceo && deptMap.get(ceo.departmentId)) || deptMap.get('exec');

  // 2. Build Advisory Units & Departmental Units from `Departments` and `Team`
  const advisoryUnits: DynamicOrgUnit[] = [];
  const departmentUnits: DynamicOrgUnit[] = [];

  const nonExecDepartments = (departments || []).filter((d) => d.id !== 'exec');
  let deptCounter = 1;
  let advCounter = 1;

  for (const dept of nonExecDepartments) {
    const deptEmps = visible.filter(
      (e) => e.departmentId === dept.id && !assignedEmployeeIds.has(e.id)
    );

    const isAdvisoryDept =
      dept.id.toLowerCase().includes('advisory') ||
      dept.nameAr.includes('مستشار') ||
      dept.nameEn.toLowerCase().includes('advisory') ||
      (deptEmps.length > 0 &&
        deptEmps.every((e) => getEmployeeRoleCategory(e) === 'advisor'));

    // Pick unit lead (Head, Director, Advisor, or person reporting directly to CEO)
    let lead: Employee | null = null;
    if (deptEmps.length > 0) {
      lead =
        deptEmps.find(
          (e) =>
            getEmployeeRoleCategory(e) === 'department_lead' ||
            getEmployeeRoleCategory(e) === 'advisor'
        ) ||
        deptEmps.find((e) => !ceo || e.managerId === ceo.id) ||
        deptEmps[0];
      assignedEmployeeIds.add(lead.id);
    }

    // Members in this department or reporting directly to this lead
    const members = visible.filter(
      (e) =>
        !assignedEmployeeIds.has(e.id) &&
        (e.departmentId === dept.id || (lead && e.managerId === lead.id))
    );
    members.forEach((m) => assignedEmployeeIds.add(m.id));

    if (isAdvisoryDept) {
      if (lead || members.length > 0) {
        advisoryUnits.push({
          department: dept,
          code: `A${advCounter++}`,
          unitType: 'advisory',
          lead,
          head: lead,
          members,
        });
      }
    } else {
      const code = String(deptCounter++).padStart(2, '0');
      departmentUnits.push({
        department: dept,
        code,
        unitType: 'department',
        lead,
        head: lead,
        members,
      });
    }
  }

  // 3. Check for any visible Advisory employees not in a dedicated advisory department
  const remainingAdvisors = visible.filter(
    (e) => !assignedEmployeeIds.has(e.id) && getEmployeeRoleCategory(e) === 'advisor'
  );
  for (const adv of remainingAdvisors) {
    assignedEmployeeIds.add(adv.id);
    const directReports = visible.filter(
      (e) => !assignedEmployeeIds.has(e.id) && e.managerId === adv.id
    );
    directReports.forEach((r) => assignedEmployeeIds.add(r.id));
    advisoryUnits.push({
      department: deptMap.get(adv.departmentId) || {
        id: adv.departmentId || `adv-${adv.id}`,
        nameAr: adv.jobTitleAr,
        nameEn: adv.jobTitleEn || 'Executive Advisory',
        iconName: 'Lightbulb',
        badgeBg: '#2563EB',
      },
      code: `A${advCounter++}`,
      unitType: 'advisory',
      lead: adv,
      head: adv,
      members: directReports,
    });
  }

  // 4. Any remaining visible employees (e.g. non-head roles in `exec` or custom departments)
  const independentRoles = visible.filter((e) => !assignedEmployeeIds.has(e.id));
  independentRoles.forEach((e) => assignedEmployeeIds.add(e.id));

  const totalExecutives = ceo ? 1 : 0;
  const totalAdvisors = advisoryUnits.reduce(
    (acc, u) => acc + (u.lead ? 1 : 0) + u.members.length,
    0
  );
  const totalDepartmentLeads = departmentUnits.filter((u) => Boolean(u.lead)).length;
  const totalSpecialists =
    departmentUnits.reduce((acc, u) => acc + u.members.length, 0) +
    independentRoles.length;

  return {
    ceo,
    executiveDepartment,
    advisoryUnits,
    departmentUnits,
    independentRoles,
    summary: {
      totalDatabaseEmployees: allNormalized.length,
      totalVisibleMembers: visible.length,
      totalExecutives,
      totalAdvisors,
      totalDepartmentLeads,
      totalSpecialists,
      totalDepartments: (departments || []).length,
    },
  };
}

/**
 * Filters dynamic organizational units by search query across department names, lead names/titles, and member names/titles.
 */
export function filterDynamicOrgUnits(
  units: DynamicOrgUnit[],
  query: string
): DynamicOrgUnit[] {
  const q = query.trim().toLowerCase();
  if (!q) return units;

  return units.filter((unit) => {
    const matchDept =
      unit.department.nameAr.toLowerCase().includes(q) ||
      unit.department.nameEn.toLowerCase().includes(q);
    const matchLead =
      Boolean(unit.lead) &&
      (unit.lead!.nameAr.toLowerCase().includes(q) ||
        (unit.lead!.nameEn || '').toLowerCase().includes(q) ||
        unit.lead!.jobTitleAr.toLowerCase().includes(q) ||
        (unit.lead!.jobTitleEn || '').toLowerCase().includes(q));
    const matchMember = unit.members.some(
      (m) =>
        m.nameAr.toLowerCase().includes(q) ||
        (m.nameEn || '').toLowerCase().includes(q) ||
        m.jobTitleAr.toLowerCase().includes(q) ||
        (m.jobTitleEn || '').toLowerCase().includes(q)
    );
    return matchDept || matchLead || matchMember;
  });
}

// ============================================================================
// GOOGLE SHEETS / SHEETDB SAFE COLUMN MIGRATION PLAN FOR `Team` TAB
// ============================================================================

export const TEAM_EXISTING_COLUMNS = [
  'id',
  'nameAr',
  'nameEn',
  'jobTitleAr',
  'jobTitleEn',
  'departmentId',
  'managerId',
  'avatarUrl',
  'image_url',
  'image_file_id',
  'image_alt_ar',
  'initials',
  'bioAr',
  'email',
  'isConfirmedPosition',
  'order',
] as const;

export const TEAM_NEW_VISIBILITY_COLUMNS = [
  {
    columnName: 'showOnTeamPage',
    columnLetter: 'Q',
    columnIndex: 17,
    type: 'BOOLEAN',
    defaultValue: 'TRUE',
    descriptionAr: 'إظهار أو إخفاء بطاقة الموظف في صفحة فريق العمل العامة (/team)',
  },
  {
    columnName: 'showOnOrgChart',
    columnLetter: 'R',
    columnIndex: 18,
    type: 'BOOLEAN',
    defaultValue: 'TRUE',
    descriptionAr: 'إظهار أو إخفاء الموظف في المخطط الهيكلي التفاعلي (/organization)',
  },
  {
    columnName: 'showPublicEmail',
    columnLetter: 'S',
    columnIndex: 19,
    type: 'BOOLEAN',
    defaultValue: 'FALSE',
    descriptionAr:
      'التحكم بعرض البريد الإلكتروني للعامة (الافتراضي FALSE لحماية البريد الشخصي من التسرب)',
  },
  {
    columnName: 'showPublicProfile',
    columnLetter: 'T',
    columnIndex: 20,
    type: 'BOOLEAN',
    defaultValue: 'TRUE',
    descriptionAr:
      'السماح بفتح نافذة الملف الشخصي التفصيلي عند النقر على البطاقة العامة',
  },
] as const;

// ============================================================================
// SEPARATED TRAINING SIMULATION STRUCTURE (NOT MIXED WITH LIVE TEAM DATABASE)
// ============================================================================

export interface OrgStaffMember {
  id: string;
  nameEn: string;
  nameAr: string;
  titleEn: string;
  titleAr: string;
  initials: string;
  email: string;
  bioAr: string;
}

export interface OrgDepartmentUnit {
  id: string;
  code: string;
  departmentNameAr: string;
  departmentNameEn: string;
  head: {
    id: string;
    linkedEmployeeId?: string;
    nameEn: string;
    nameAr: string;
    titleEn: string;
    titleAr: string;
    initials: string;
    email: string;
    bioAr: string;
  };
  staff: [OrgStaffMember, OrgStaffMember];
}

export interface SmartMasarOrgStructure {
  ceo: {
    id: string;
    linkedEmployeeId: string;
    nameEn: string;
    nameAr: string;
    titleEn: string;
    titleAr: string;
    departmentNameAr: string;
    departmentNameEn: string;
    initials: string;
    email: string;
    bioAr: string;
  };
  departments: OrgDepartmentUnit[];
}

export const SMART_MASAR_ORG_STRUCTURE: SmartMasarOrgStructure = {
  ceo: {
    id: 'ceo-ahmad-alabed',
    linkedEmployeeId: 'emp-ahmed-alabed',
    nameEn: 'Dr. Ahmad Al-Abed',
    nameAr: 'د. أحمد العابد',
    titleEn: 'Chief Executive Officer (CEO)',
    titleAr: 'الرئيس التنفيذي',
    departmentNameAr: 'الإدارة العليا والتنفيذية',
    departmentNameEn: 'Executive Leadership',
    initials: 'AA',
    email: 'ceo@smartmasar.edu',
    bioAr:
      'يقود الرؤية الاستراتيجية لشركة سمارت مسار، ويشرف على التكامل بين قطاعات التكنولوجيا والذكاء الاصطناعي والتطوير المؤسسي.',
  },
  departments: [
    {
      id: 'dept-inst-dev',
      code: '01',
      departmentNameAr: 'قسم التطوير المؤسسي والتدريب',
      departmentNameEn: 'Institutional Development & Training',
      head: {
        id: 'head-ekhlaslellah',
        linkedEmployeeId: 'emp-ekhlaslellah-alshalabi',
        nameEn: 'Ekhlaslellah Al-Shalabi',
        nameAr: 'إخلاص لله الشلبي',
        titleEn: 'Head of Institutional Development & Training',
        titleAr: 'رئيسة قسم التطوير المؤسسي والتدريب',
        initials: 'EA',
        email: 'ekhlaslellah@smartmasar.edu',
        bioAr:
          'قيادة خطط التطوير المؤسسي وبناء قدرات الكوادر وتصميم البرامج التدريبية المتقدمة.',
      },
      staff: [
        {
          id: 'staff-inst-1',
          nameEn: 'Tariq Al-Majali',
          nameAr: 'طارق المجالي',
          titleEn: 'Senior Training & Learning Specialist',
          titleAr: 'أخصائي أول تدريب وتطوير مهني',
          initials: 'TM',
          email: 't.majali@smartmasar.edu',
          bioAr: 'إعداد الحقائب التدريبية وتنفيذ مسارات التعلم الرقمي والتطوير الوظيفي.',
        },
        {
          id: 'staff-inst-2',
          nameEn: 'Nour Al-Huda Mansour',
          nameAr: 'نور الهدى منصور',
          titleEn: 'Institutional Development Coordinator',
          titleAr: 'منسقة التطوير والتميز المؤسسي',
          initials: 'NM',
          email: 'n.mansour@smartmasar.edu',
          bioAr: 'متابعة مبادرات التحسين المؤسسي وتقييم أثر البرامج التدريبية.',
        },
      ],
    },
    {
      id: 'dept-hr',
      code: '02',
      departmentNameAr: 'قسم الموارد البشرية',
      departmentNameEn: 'Human Resources',
      head: {
        id: 'head-rahaf',
        linkedEmployeeId: 'emp-rahaf-alsharafat',
        nameEn: 'Rahaf Al-Sharafat',
        nameAr: 'رهف الشرفات',
        titleEn: 'Head of Human Resources',
        titleAr: 'رئيسة قسم الموارد البشرية',
        initials: 'RS',
        email: 'rahaf@smartmasar.edu',
        bioAr:
          'الإشراف على استراتيجيات رأس المال البشري، الاستقطاب الرقمي، وبيئة العمل المحفزة.',
      },
      staff: [
        {
          id: 'staff-hr-1',
          nameEn: 'Zaid Al-Khatib',
          nameAr: 'زيد الخطيب',
          titleEn: 'Talent Acquisition Specialist',
          titleAr: 'أخصائي استقطاب المواهب والتوظيف',
          initials: 'ZK',
          email: 'z.khatib@smartmasar.edu',
          bioAr: 'إدارة عمليات الفرز والمقابلات واستقطاب الكفاءات التقنية والإدارية.',
        },
        {
          id: 'staff-hr-2',
          nameEn: 'Lina Al-Zoubi',
          nameAr: 'لينا الزعبي',
          titleEn: 'People Operations & HR Officer',
          titleAr: 'مسؤولة شؤون الموظفين والعمليات البشرية',
          initials: 'LZ',
          email: 'l.zoubi@smartmasar.edu',
          bioAr: 'تنظيم شؤون الكوادر، السياسات الداخلية، وتجربة الموظف اليومية.',
        },
      ],
    },
    {
      id: 'dept-marketing',
      code: '03',
      departmentNameAr: 'قسم التسويق والعلاقات العامة',
      departmentNameEn: 'Marketing & Public Relations',
      head: {
        id: 'head-shorouq',
        linkedEmployeeId: 'emp-shorouq-alsharafat',
        nameEn: 'Shorouq Al-Sharafat',
        nameAr: 'شروق الشرفات',
        titleEn: 'Head of Marketing & Public Relations',
        titleAr: 'رئيسة قسم التسويق والعلاقات العامة',
        initials: 'SS',
        email: 'shorouq@smartmasar.edu',
        bioAr:
          'قيادة الهوية المؤسسية، الحملات الرقمية، وبناء الصورة الذهنية والعلاقات العامة للشركة.',
      },
      staff: [
        {
          id: 'staff-mkt-1',
          nameEn: 'Omar Al-Nabulsi',
          nameAr: 'عمر النابلسي',
          titleEn: 'Digital Marketing & Brand Specialist',
          titleAr: 'أخصائي التسويق الرقمي والهوية البصرية',
          initials: 'ON',
          email: 'o.nabulsi@smartmasar.edu',
          bioAr: 'إدارة المحتوى التسويقي والحملات الرقمية لمنصات ومنتجات الشركة.',
        },
        {
          id: 'staff-mkt-2',
          nameEn: 'Dana Al-Masri',
          nameAr: 'دانا المصري',
          titleEn: 'Public Relations & Media Coordinator',
          titleAr: 'منسقة العلاقات العامة والاتصال الإعلامي',
          initials: 'DM',
          email: 'd.masri@smartmasar.edu',
          bioAr: 'تنسيق الفعاليات المؤسسية والتواصل الإعلامي وبناء الشراكات المجتمعية.',
        },
      ],
    },
    {
      id: 'dept-finance',
      code: '04',
      departmentNameAr: 'قسم المالية والمحاسبة',
      departmentNameEn: 'Finance & Accounting',
      head: {
        id: 'head-ekram',
        linkedEmployeeId: 'emp-ekram-alsharafat',
        nameEn: 'Ekram Al-Sharafat',
        nameAr: 'إكرام الشرفات',
        titleEn: 'Head of Finance & Accounting',
        titleAr: 'رئيسة قسم المالية والمحاسبة',
        initials: 'ES',
        email: 'ikram@smartmasar.edu',
        bioAr:
          'إدارة التخطيط المالي، الميزانيات السنوية، والرقابة المحاسبية وفق المعايير الدولية.',
      },
      staff: [
        {
          id: 'staff-fin-1',
          nameEn: 'Yazan Al-Momani',
          nameAr: 'يزن المومني',
          titleEn: 'Senior Financial Accountant',
          titleAr: 'محاسب مالي أول',
          initials: 'YM',
          email: 'y.momani@smartmasar.edu',
          bioAr: 'متابعة القيود المالية، المطابقات البنكية، وإعداد القوائم المالية الدورية.',
        },
        {
          id: 'staff-fin-2',
          nameEn: 'Maha Al-Rawashdeh',
          nameAr: 'مها الرواشدة',
          titleEn: 'Budgeting & Financial Analyst',
          titleAr: 'محللة الموازنات والتقارير المالية',
          initials: 'MR',
          email: 'm.rawashdeh@smartmasar.edu',
          bioAr: 'تحليل المؤشرات المالية وتقييم كفاءة الإنفاق والتدفقات النقدية.',
        },
      ],
    },
    {
      id: 'dept-tech-ai',
      code: '05',
      departmentNameAr: 'قسم التكنولوجيا والذكاء الاصطناعي',
      departmentNameEn: 'Technology & AI',
      head: {
        id: 'head-amani',
        linkedEmployeeId: 'emp-amani-akram',
        nameEn: 'Amani Akram',
        nameAr: 'أماني أكرم',
        titleEn: 'Head of Technology & AI',
        titleAr: 'رئيسة قسم التكنولوجيا والذكاء الاصطناعي',
        initials: 'AA',
        email: 'amani@smartmasar.edu',
        bioAr:
          'قيادة هندسة البرمجيات السحابية، تطوير نماذج الذكاء الاصطناعي، والابتكار التقني.',
      },
      staff: [
        {
          id: 'staff-tech-1',
          nameEn: 'Kareem Al-Jundi',
          nameAr: 'كريم الجندي',
          titleEn: 'AI & Machine Learning Engineer',
          titleAr: 'مهندس الذكاء الاصطناعي وتعلم الآلة',
          initials: 'KJ',
          email: 'k.jundi@smartmasar.edu',
          bioAr: 'تطوير خوارزميات التحليل الذكي وأتمتة البيانات والنماذج التنبؤية.',
        },
        {
          id: 'staff-tech-2',
          nameEn: 'Sara Al-Tamimi',
          nameAr: 'سارة التميمي',
          titleEn: 'Full-Stack Cloud Software Engineer',
          titleAr: 'مهندسة برمجيات وتطبيقات سحابية',
          initials: 'ST',
          email: 's.tamimi@smartmasar.edu',
          bioAr: 'تصميم وتطوير واجهات المستخدم والمنظومات السحابية المتكاملة.',
        },
      ],
    },
    {
      id: 'dept-ops-projects',
      code: '06',
      departmentNameAr: 'قسم العمليات والمشاريع',
      departmentNameEn: 'Operations & Projects',
      head: {
        id: 'head-doaa',
        linkedEmployeeId: 'emp-doaa-tareq',
        nameEn: 'Doaa Tareq',
        nameAr: 'دعاء طارق',
        titleEn: 'Head of Operations & Projects',
        titleAr: 'رئيسة قسم العمليات والمشاريع',
        initials: 'DT',
        email: 'doaa@smartmasar.edu',
        bioAr:
          'الإشراف على تنفيذ المشاريع التقنية، كفاءة العمليات التشغيلية، وضبط الجداول الزمنية.',
      },
      staff: [
        {
          id: 'staff-ops-1',
          nameEn: 'Firas Al-Obaidi',
          nameAr: 'فراس العبيدي',
          titleEn: 'Technical Project Specialist',
          titleAr: 'أخصائي إدارة المشاريع التقنية',
          initials: 'FO',
          email: 'f.obaidi@smartmasar.edu',
          bioAr: 'متابعة خطط التنفيذ ومخرجات المشاريع والتنسيق بين الفرق الهندسية.',
        },
        {
          id: 'staff-ops-2',
          nameEn: 'Rania Al-Bataineh',
          nameAr: 'رانيا البطاينة',
          titleEn: 'Operations & Process Coordinator',
          titleAr: 'منسقة العمليات والإجراءات التشغيلية',
          initials: 'RB',
          email: 'r.bataineh@smartmasar.edu',
          bioAr: 'تحسين سير العمل اليومي وأتمتة العمليات التشغيلية الداخلية.',
        },
      ],
    },
    {
      id: 'dept-biz-dev',
      code: '07',
      departmentNameAr: 'قسم تطوير الأعمال والشراكات',
      departmentNameEn: 'Business Development & Partnerships',
      head: {
        id: 'head-roaa',
        linkedEmployeeId: 'emp-roaa',
        nameEn: 'Roaa',
        nameAr: 'رؤى',
        titleEn: 'Head of Business Development & Partnerships',
        titleAr: 'رئيسة قسم تطوير الأعمال والشراكات',
        initials: 'RO',
        email: 'roaa@smartmasar.edu',
        bioAr:
          'بناء الشراكات الاستراتيجية، استكشاف فرص النمو، وتوسيع نطاق الحلول الرقمية للمؤسسات.',
      },
      staff: [
        {
          id: 'staff-biz-1',
          nameEn: 'Laith Al-Smadi',
          nameAr: 'ليث الصمادي',
          titleEn: 'Strategic Partnerships Specialist',
          titleAr: 'أخصائي الشراكات الاستراتيجية',
          initials: 'LS',
          email: 'l.smadi@smartmasar.edu',
          bioAr: 'تطوير اتفاقيات التعاون وبناء العلاقات مع الشركاء في القطاع التقني.',
        },
        {
          id: 'staff-biz-2',
          nameEn: 'Nadine Al-Qudah',
          nameAr: 'نادين القضاة',
          titleEn: 'Business Growth Consultant',
          titleAr: 'مستشارة نمو وتطوير الأعمال',
          initials: 'NQ',
          email: 'n.qudah@smartmasar.edu',
          bioAr: 'دراسة احتياجات السوق وتقديم مقترحات الحلول التقنية لعملاء المؤسسات.',
        },
      ],
    },
    {
      id: 'dept-cx',
      code: '08',
      departmentNameAr: 'قسم تجربة وخدمات العملاء',
      departmentNameEn: 'Customer Experience & Services',
      head: {
        id: 'head-haneen',
        linkedEmployeeId: 'emp-haneen-ziad',
        nameEn: 'Haneen Al-Kasaji',
        nameAr: 'حنين الكسجي',
        titleEn: 'Head of Customer Experience & Services',
        titleAr: 'رئيسة قسم تجربة وخدمات العملاء',
        initials: 'HK',
        email: 'haneen@smartmasar.edu',
        bioAr:
          'الارتقاء بتجربة المستفيدين والعملاء، وضمان جودة الدعم والخدمات الرقمية المقدمة.',
      },
      staff: [
        {
          id: 'staff-cx-1',
          nameEn: 'Samer Al-Jarrah',
          nameAr: 'سامر الجراح',
          titleEn: 'Customer Success Specialist',
          titleAr: 'أخصائي نجاح وتجربة العملاء',
          initials: 'SJ',
          email: 's.jarrah@smartmasar.edu',
          bioAr: 'متابعة رضا العملاء وضمان تحقيقهم أقصى استفادة من المنصات الرقمية.',
        },
        {
          id: 'staff-cx-2',
          nameEn: 'Hala Al-Awamleh',
          nameAr: 'حلا العواملة',
          titleEn: 'Client Services & Support Coordinator',
          titleAr: 'منسقة خدمات ودعم العملاء',
          initials: 'HA',
          email: 'h.awamleh@smartmasar.edu',
          bioAr: 'استقبال استفسارات المستفيدين وتقديم المساندة الفنية والتشغيلية الفورية.',
        },
      ],
    },
    {
      id: 'dept-quality',
      code: '09',
      departmentNameAr: 'قسم الجودة والأداء',
      departmentNameEn: 'Quality & Performance',
      head: {
        id: 'head-sumaya',
        linkedEmployeeId: 'emp-sumaya-alsharafat',
        nameEn: 'Sumaya Al-Sharafat',
        nameAr: 'سمية الشرفات',
        titleEn: 'Head of Quality & Performance',
        titleAr: 'رئيسة قسم الجودة والأداء',
        initials: 'SA',
        email: 'sumaya@smartmasar.edu',
        bioAr:
          'قيادة منظومة ضمان الجودة الشاملة، قياس مؤشرات الأداء المؤسسي (KPIs)، والامتثال المعياري.',
      },
      staff: [
        {
          id: 'staff-qa-1',
          nameEn: 'Bader Al-Harthi',
          nameAr: 'بدر الحارثي',
          titleEn: 'Quality Assurance Specialist',
          titleAr: 'أخصائي ضمان الجودة والمعايير',
          initials: 'BH',
          email: 'b.harthi@smartmasar.edu',
          bioAr: 'مراجعة جودة المخرجات البرمجية والإدارية والتحقق من مطابقتها للمعايير.',
        },
        {
          id: 'staff-qa-2',
          nameEn: 'Reem Al-Fayez',
          nameAr: 'ريم الفايز',
          titleEn: 'Performance & KPI Analyst',
          titleAr: 'محللة الأداء ومؤشرات القياس',
          initials: 'RF',
          email: 'r.fayez@smartmasar.edu',
          bioAr: 'تحليل تقارير الأداء الدوري وإعداد لوحات قياس الكفاءة المؤسسية.',
        },
      ],
    },
  ],
};

/**
 * Returns summary metrics for the separated training simulation structure.
 */
export function getOrgStructureSummary(
  structure: SmartMasarOrgStructure = SMART_MASAR_ORG_STRUCTURE
) {
  const totalExecutives = 1;
  const totalDepartmentHeads = structure.departments.length;
  const totalStaff = structure.departments.reduce((acc, d) => acc + d.staff.length, 0);
  return {
    totalExecutives,
    totalDepartmentHeads,
    totalStaff,
    totalMembers: totalExecutives + totalDepartmentHeads + totalStaff,
  };
}

/**
 * Filters training simulation department units by search term across head and staff names/titles (AR/EN).
 */
export function filterOrgDepartments(
  departments: OrgDepartmentUnit[],
  query: string
): OrgDepartmentUnit[] {
  const q = query.trim().toLowerCase();
  if (!q) return departments;

  return departments.filter((dept) => {
    const matchDept =
      dept.departmentNameAr.toLowerCase().includes(q) ||
      dept.departmentNameEn.toLowerCase().includes(q);
    const matchHead =
      dept.head.nameEn.toLowerCase().includes(q) ||
      dept.head.nameAr.toLowerCase().includes(q) ||
      dept.head.titleEn.toLowerCase().includes(q) ||
      dept.head.titleAr.toLowerCase().includes(q);
    const matchStaff = dept.staff.some(
      (s) =>
        s.nameEn.toLowerCase().includes(q) ||
        s.nameAr.toLowerCase().includes(q) ||
        s.titleEn.toLowerCase().includes(q) ||
        s.titleAr.toLowerCase().includes(q)
    );
    return matchDept || matchHead || matchStaff;
  });
}
