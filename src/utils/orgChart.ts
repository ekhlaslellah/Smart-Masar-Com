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

// ============================================================================
// INTERACTIVE ORGANIZATIONAL STRUCTURE DATA (CEO + 9 DEPT HEADS + 18 STAFF)
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
        linkedEmployeeId: 'emp-ekhlaslellah-alsharafat',
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
        linkedEmployeeId: 'emp-ikram-alsharafat',
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
        linkedEmployeeId: 'emp-haneen-alkasaji',
        nameEn: 'Haneen Ziad',
        nameAr: 'حنين زياد',
        titleEn: 'Head of Customer Experience & Services',
        titleAr: 'رئيسة قسم تجربة وخدمات العملاء',
        initials: 'HZ',
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
 * Returns summary metrics for the Smart Masar organizational structure.
 */
export function getOrgStructureSummary(structure: SmartMasarOrgStructure = SMART_MASAR_ORG_STRUCTURE) {
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
 * Filters organizational department units by search term across head and staff names/titles (AR/EN).
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
