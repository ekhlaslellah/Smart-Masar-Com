/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  CompanyProfile,
  Department,
  Employee,
  JobVacancy,
  PageMetadata,
  ServiceItem,
} from '../types';
import {
  INITIAL_COMPANY_PROFILE,
  INITIAL_DEPARTMENTS,
  INITIAL_EMPLOYEES,
  INITIAL_JOBS,
  INITIAL_PAGES,
  INITIAL_SERVICES,
} from '../data/initialData';
import {
  BackendConfig,
  getSavedBackendConfig,
  saveBackendConfig,
  testBackendConnection,
  fetchRemotePublicData,
  syncAllToRemote,
  fetchServerPublicData,
  syncStateToServer,
} from '../services/apiService';

interface AppContextType {
  // Selected entities for modals
  selectedEmployee: Employee | null;
  setSelectedEmployee: (emp: Employee | null) => void;
  selectedJobId: string | null;
  setSelectedJobId: (id: string | null) => void;

  // Data
  profile: CompanyProfile;
  employees: Employee[];
  departments: Department[];
  jobs: JobVacancy[];
  services: ServiceItem[];
  pages: PageMetadata[];

  // Mutations
  updateProfile: (updates: Partial<CompanyProfile>) => void;
  addEmployee: (emp: Omit<Employee, 'id' | 'order'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  updateJob: (id: string, updates: Partial<JobVacancy>) => void;
  addJob: (job: Omit<JobVacancy, 'id' | 'postedDate'>) => void;
  deleteJob: (id: string) => void;
  updateService: (id: string, updates: Partial<ServiceItem>) => void;
  addService: (service: Omit<ServiceItem, 'id'>) => void;
  deleteService: (id: string) => void;
  updatePage: (id: string, updates: Partial<PageMetadata>) => void;
  resetToDefaults: () => void;
  exportDataJSON: () => string;
  importDataJSON: (jsonStr: string) => boolean;

  // Google Sheets & Drive Backend Integration
  backendConfig: BackendConfig;
  setBackendConfig: (config: BackendConfig) => void;
  testBackend: (url: string) => Promise<{ success: boolean; message: string }>;
  syncWithGoogleSheets: () => Promise<{ success: boolean; message: string }>;
  fetchFromGoogleSheets: () => Promise<{ success: boolean; message: string }>;
  refreshFromServer: () => Promise<void>;

  // Notification Toast
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [backendConfig, setBackendConfigState] = useState<BackendConfig>(getSavedBackendConfig);
  const hydratedFromServerRef = useRef(false);

  // Authoritative state hydrated from /api/public/data (which pulls from SheetDB / Google Sheets)
  // No browser localStorage is used for application records or credentials.
  const [profile, setProfile] = useState<CompanyProfile>(INITIAL_COMPANY_PROFILE);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [jobs, setJobs] = useState<JobVacancy[]>(INITIAL_JOBS);
  const [services, setServices] = useState<ServiceItem[]>(INITIAL_SERVICES);
  const [pages, setPages] = useState<PageMetadata[]>(INITIAL_PAGES);

  const refreshFromServer = async (forceExternalRefresh = false) => {
    const res = await fetchServerPublicData(forceExternalRefresh);
    if (res.success && res.data) {
      setProfile((prev) => ({ ...prev, ...res.data!.profile }));
      if (Array.isArray(res.data.departments) && res.data.departments.length > 0) {
        setDepartments(res.data.departments);
      }
      if (Array.isArray(res.data.employees) && res.data.employees.length > 0) {
        setEmployees(res.data.employees);
      }
      if (Array.isArray(res.data.jobs) && res.data.jobs.length > 0) {
        setJobs(res.data.jobs);
      }
      if (Array.isArray(res.data.services) && res.data.services.length > 0) {
        setServices(res.data.services);
      }
      if (Array.isArray(res.data.pages) && res.data.pages.length > 0) {
        setPages(res.data.pages);
      }
      hydratedFromServerRef.current = true;
    }
  };

  // Load authoritative server & external SheetDB data on initial mount
  useEffect(() => {
    refreshFromServer(false);
  }, []);

  // Persist changes to Express server & external SheetDB/Apps Script when admin mutations occur
  const persistBundleToServer = (nextBundle: {
    profile?: CompanyProfile;
    departments?: Department[];
    employees?: Employee[];
    jobs?: JobVacancy[];
    services?: ServiceItem[];
    pages?: PageMetadata[];
  }) => {
    syncStateToServer(backendConfig.adminApiKey || '', {
      profile: nextBundle.profile || profile,
      departments: nextBundle.departments || departments,
      employees: nextBundle.employees || employees,
      jobs: nextBundle.jobs || jobs,
      services: nextBundle.services || services,
      pages: nextBundle.pages || pages,
    }).catch(() => {});
  };

  const setBackendConfig = (config: BackendConfig) => {
    setBackendConfigState(config);
    saveBackendConfig(config);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const updateProfile = (updates: Partial<CompanyProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      persistBundleToServer({ profile: next });
      return next;
    });
    showToast('تم حفظ إعدادات المؤسسة ومزامنتها مع الخادم بنجاح');
  };

  const addEmployee = (empData: Omit<Employee, 'id' | 'order'>) => {
    const id = `emp-${Date.now()}`;
    const initials =
      empData.nameAr
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('.') || 'س.م';
    const imageUrl = empData.image_url || empData.avatarUrl || '';
    const newEmp: Employee = {
      ...empData,
      id,
      avatarUrl: imageUrl,
      image_url: imageUrl,
      image_file_id: empData.image_file_id || '',
      image_alt_ar: empData.image_alt_ar || `صورة ${empData.nameAr}`,
      initials: empData.initials || initials,
      order: employees.length + 1,
    };
    setEmployees((prev) => {
      const next = [...prev, newEmp];
      persistBundleToServer({ employees: next });
      return next;
    });
    showToast(`تمت إضافة الموظف "${newEmp.nameAr}" بنجاح`);
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees((prev) => {
      const next = prev.map((emp) => {
        if (emp.id !== id) return emp;
        const merged = { ...emp, ...updates };
        if (updates.image_url !== undefined && updates.avatarUrl === undefined) {
          merged.avatarUrl = updates.image_url;
        } else if (updates.avatarUrl !== undefined && updates.image_url === undefined) {
          merged.image_url = updates.avatarUrl;
        }
        return merged;
      });
      persistBundleToServer({ employees: next });
      return next;
    });
    showToast('تم تحديث بيانات الموظف بنجاح');
  };

  const deleteEmployee = (id: string) => {
    const emp = employees.find((e) => e.id === id);
    if (!emp) return;
    if (emp.id === 'emp-ahmed-alabed') {
      showToast('لا يمكن حذف المدير العام من الهيكل التنظيمي الرئيسي');
      return;
    }
    setEmployees((prev) => {
      const next = prev
        .filter((e) => e.id !== id)
        .map((e) => (e.managerId === id ? { ...e, managerId: 'emp-ahmed-alabed' } : e));
      persistBundleToServer({ employees: next });
      return next;
    });
    showToast(`تم حذف الموظف "${emp.nameAr}" من السجل`);
  };

  const updateJob = (id: string, updates: Partial<JobVacancy>) => {
    setJobs((prev) => {
      const next = prev.map((job) => (job.id === id ? { ...job, ...updates } : job));
      persistBundleToServer({ jobs: next });
      return next;
    });
    showToast('تم تحديث تفاصيل الوظيفة ورابط التقديم بنجاح');
  };

  const addJob = (jobData: Omit<JobVacancy, 'id' | 'postedDate'>) => {
    const newJob: JobVacancy = {
      ...jobData,
      id: `job-${Date.now()}`,
      postedDate: new Date().toISOString().split('T')[0],
    };
    setJobs((prev) => {
      const next = [newJob, ...prev];
      persistBundleToServer({ jobs: next });
      return next;
    });
    showToast(`تم نشر الشاغر الوظيفي "${newJob.titleAr}"`);
  };

  const deleteJob = (id: string) => {
    const job = jobs.find((j) => j.id === id);
    if (!job) return;
    setJobs((prev) => {
      const next = prev.filter((j) => j.id !== id);
      persistBundleToServer({ jobs: next });
      return next;
    });
    showToast(`تم حذف الشاغر الوظيفي "${job.titleAr}"`);
  };

  const updateService = (id: string, updates: Partial<ServiceItem>) => {
    setServices((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, ...updates } : s));
      persistBundleToServer({ services: next });
      return next;
    });
    showToast('تم تحديث بيانات الخدمة وصورتها بنجاح');
  };

  const addService = (serviceData: Omit<ServiceItem, 'id'>) => {
    const newService: ServiceItem = {
      ...serviceData,
      id: `srv-${Date.now()}`,
    };
    setServices((prev) => {
      const next = [...prev, newService];
      persistBundleToServer({ services: next });
      return next;
    });
    showToast(`تمت إضافة الخدمة "${newService.titleAr}" بنجاح`);
  };

  const deleteService = (id: string) => {
    const srv = services.find((s) => s.id === id);
    if (!srv) return;
    setServices((prev) => {
      const next = prev.filter((s) => s.id !== id);
      persistBundleToServer({ services: next });
      return next;
    });
    showToast(`تم حذف الخدمة "${srv.titleAr}"`);
  };

  const updatePage = (id: string, updates: Partial<PageMetadata>) => {
    setPages((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
      persistBundleToServer({ pages: next });
      return next;
    });
    showToast('تم تحديث إعدادات وصورة الصفحة بنجاح');
  };

  const resetToDefaults = () => {
    setProfile(INITIAL_COMPANY_PROFILE);
    setEmployees(INITIAL_EMPLOYEES);
    setDepartments(INITIAL_DEPARTMENTS);
    setJobs(INITIAL_JOBS);
    setServices(INITIAL_SERVICES);
    setPages(INITIAL_PAGES);
    const headers: Record<string, string> = {};
    if (backendConfig.adminApiKey) {
      headers['x-admin-key'] = backendConfig.adminApiKey;
    }
    fetch('/api/admin/reset', {
      method: 'POST',
      credentials: 'same-origin',
      headers,
    }).catch(() => {});
    showToast('تم استعادة البيانات الافتراضية للنموذج التعليمي');
  };

  const exportDataJSON = () => {
    const bundle = {
      profile,
      employees,
      departments,
      jobs,
      services,
      pages,
      exportedAt: new Date().toISOString(),
      company: 'Smart Masar',
    };
    return JSON.stringify(bundle, null, 2);
  };

  const importDataJSON = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.profile && Array.isArray(parsed.employees) && Array.isArray(parsed.jobs)) {
        setProfile(parsed.profile);
        setEmployees(parsed.employees);
        if (Array.isArray(parsed.departments)) setDepartments(parsed.departments);
        setJobs(parsed.jobs);
        if (Array.isArray(parsed.services)) setServices(parsed.services);
        if (Array.isArray(parsed.pages)) setPages(parsed.pages);
        persistBundleToServer({
          profile: parsed.profile,
          departments: parsed.departments || departments,
          employees: parsed.employees,
          jobs: parsed.jobs,
          services: parsed.services || services,
          pages: parsed.pages || pages,
        });
        showToast('تم استيراد البيانات بنجاح');
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  // Google Sheets actions
  const testBackend = async (url: string) => {
    return await testBackendConnection(url);
  };

  const syncWithGoogleSheets = async () => {
    const serverRes = await syncStateToServer(backendConfig.adminApiKey || '', {
      profile,
      departments,
      employees,
      jobs,
      services,
      pages,
    });

    if (!backendConfig.webAppUrl) {
      return {
        success: serverRes.success,
        message:
          serverRes.externalSync?.detail ||
          serverRes.message ||
          'تم حفظ البيانات ومزامنتها عبر الخادم.',
      };
    }

    const res = await syncAllToRemote(backendConfig.webAppUrl, backendConfig.adminApiKey, {
      profile,
      departments,
      employees,
      jobs,
      services,
      pages,
    });
    if (res.success) {
      const updatedConfig = {
        ...backendConfig,
        lastSyncTime: new Date().toLocaleTimeString('ar-JO'),
      };
      setBackendConfig(updatedConfig);
      showToast('تمت مزامنة كافة البيانات والصور مع Google Sheets بنجاح');
    }
    return res;
  };

  const fetchFromGoogleSheets = async () => {
    if (!backendConfig.webAppUrl) {
      await refreshFromServer(true);
      return {
        success: true,
        message: 'تم جلب وتحديث البيانات من قاعدة البيانات السحابية وخادم الموقع بنجاح',
      };
    }
    const res = await fetchRemotePublicData(backendConfig.webAppUrl);
    if (res.success && res.data) {
      setProfile((prev) => ({ ...prev, ...res.data!.profile }));
      setDepartments(res.data.departments);
      setEmployees(res.data.employees);
      setJobs(res.data.jobs);
      if (Array.isArray(res.data.services)) setServices(res.data.services);
      if (Array.isArray(res.data.pages)) setPages(res.data.pages);
      showToast('تم جلب وتحديث البيانات من Google Sheets بنجاح');
      return { success: true, message: 'تم جلب البيانات بنجاح' };
    }
    return { success: false, message: res.error || 'تعذر جلب البيانات' };
  };

  return (
    <AppContext.Provider
      value={{
        selectedEmployee,
        setSelectedEmployee,
        selectedJobId,
        setSelectedJobId,
        profile,
        employees,
        departments,
        jobs,
        services,
        pages,
        updateProfile,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        updateJob,
        addJob,
        deleteJob,
        updateService,
        addService,
        deleteService,
        updatePage,
        resetToDefaults,
        exportDataJSON,
        importDataJSON,
        backendConfig,
        setBackendConfig,
        testBackend,
        syncWithGoogleSheets,
        fetchFromGoogleSheets,
        refreshFromServer: () => refreshFromServer(true),
        toastMessage,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
