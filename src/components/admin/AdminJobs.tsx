/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { JobVacancy } from '../../types';
import {
  Briefcase,
  ExternalLink,
  Save,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  FileSpreadsheet,
  Cpu,
  Layers,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

export const AdminJobs: React.FC = () => {
  const { jobs, departments, addJob, updateJob, deleteJob, showToast } = useApp();

  // Selected job for editing
  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id || '');
  const activeJob = jobs.find((j) => j.id === selectedJobId) || jobs[0];

  // Modal state for adding a new job
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<JobVacancy | null>(null);

  // Edit form state
  const [titleAr, setTitleAr] = useState(activeJob?.titleAr || '');
  const [titleEn, setTitleEn] = useState(activeJob?.titleEn || '');
  const [departmentId, setDepartmentId] = useState(activeJob?.departmentId || 'finance');
  const [status, setStatus] = useState<'active' | 'closed'>(activeJob?.status || 'active');
  const [googleFormsUrl, setGoogleFormsUrl] = useState(activeJob?.googleFormsUrl || '');
  const [summaryAr, setSummaryAr] = useState(activeJob?.summaryAr || '');
  const [employmentTypeAr, setEmploymentTypeAr] = useState(activeJob?.employmentTypeAr || '');
  const [locationAr, setLocationAr] = useState(activeJob?.locationAr || '');
  const [experienceLevelAr, setExperienceLevelAr] = useState(activeJob?.experienceLevelAr || '');
  const [responsibilitiesText, setResponsibilitiesText] = useState(
    activeJob?.responsibilitiesAr?.join('\n') || ''
  );
  const [qualificationsText, setQualificationsText] = useState(
    activeJob?.qualificationsAr?.join('\n') || ''
  );
  const [accountingSkillsText, setAccountingSkillsText] = useState(
    activeJob?.accountingSkillsAr?.join('\n') || ''
  );
  const [softwareExperienceText, setSoftwareExperienceText] = useState(
    activeJob?.softwareExperienceAr?.join('\n') || ''
  );
  const [applicationInstructionsAr, setApplicationInstructionsAr] = useState(
    activeJob?.applicationInstructionsAr || ''
  );

  // When switching selected job in edit view
  const handleSelectJobToEdit = (job: JobVacancy) => {
    setSelectedJobId(job.id);
    setTitleAr(job.titleAr);
    setTitleEn(job.titleEn);
    setDepartmentId(job.departmentId);
    setStatus(job.status);
    setGoogleFormsUrl(job.googleFormsUrl);
    setSummaryAr(job.summaryAr);
    setEmploymentTypeAr(job.employmentTypeAr);
    setLocationAr(job.locationAr);
    setExperienceLevelAr(job.experienceLevelAr || '');
    setResponsibilitiesText(job.responsibilitiesAr.join('\n'));
    setQualificationsText(job.qualificationsAr.join('\n'));
    setAccountingSkillsText(job.accountingSkillsAr.join('\n'));
    setSoftwareExperienceText(job.softwareExperienceAr.join('\n'));
    setApplicationInstructionsAr(job.applicationInstructionsAr);
  };

  // Save changes to existing job
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJob) return;

    const dept = departments.find((d) => d.id === departmentId);

    const responsibilities = responsibilitiesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const qualifications = qualificationsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const accountingSkills = accountingSkillsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const softwareExperience = softwareExperienceText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    updateJob(activeJob.id, {
      titleAr: titleAr.trim(),
      titleEn: titleEn.trim(),
      departmentId,
      departmentNameAr: dept?.nameAr || 'القسم العام',
      status,
      googleFormsUrl: googleFormsUrl.trim(),
      summaryAr: summaryAr.trim(),
      employmentTypeAr: employmentTypeAr.trim(),
      locationAr: locationAr.trim(),
      experienceLevelAr: experienceLevelAr.trim(),
      responsibilitiesAr: responsibilities,
      qualificationsAr: qualifications,
      accountingSkillsAr: accountingSkills,
      softwareExperienceAr: softwareExperience,
      applicationInstructionsAr: applicationInstructionsAr.trim(),
    });
  };

  // Toggle quick status
  const handleToggleStatus = (job: JobVacancy, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = job.status === 'active' ? 'closed' : 'active';
    updateJob(job.id, { status: newStatus });
    if (job.id === activeJob?.id) {
      setStatus(newStatus);
    }
  };

  // Delete vacancy handler
  const confirmDeleteJob = () => {
    if (!jobToDelete) return;
    deleteJob(jobToDelete.id);
    if (selectedJobId === jobToDelete.id) {
      const remaining = jobs.filter((j) => j.id !== jobToDelete.id);
      if (remaining.length > 0) {
        handleSelectJobToEdit(remaining[0]);
      }
    }
    setJobToDelete(null);
  };

  // --- NEW JOB MODAL STATE ---
  const [newTitleAr, setNewTitleAr] = useState('');
  const [newTitleEn, setNewTitleEn] = useState('');
  const [newDeptId, setNewDeptId] = useState('tech');
  const [newStatus, setNewStatus] = useState<'active' | 'closed'>('active');
  const [newGoogleFormsUrl, setNewGoogleFormsUrl] = useState(
    'https://docs.google.com/forms/d/e/1FAIpQLSc-smart-masar-official-applicant-form/viewform'
  );
  const [newSummaryAr, setNewSummaryAr] = useState('');
  const [newEmploymentTypeAr, setNewEmploymentTypeAr] = useState('دوام كامل (مكتبي / هجين)');
  const [newLocationAr, setNewLocationAr] = useState('المقر الرئيسي — عمّان، العبدلي');
  const [newExperienceLevelAr, setNewExperienceLevelAr] = useState('سنتان إلى 4 سنوات خبرة');
  const [newResponsibilitiesText, setNewResponsibilitiesText] = useState('');
  const [newQualificationsText, setNewQualificationsText] = useState('');
  const [newSkillsText, setNewSkillsText] = useState('');
  const [newSoftwareText, setNewSoftwareText] = useState('');
  const [newInstructionsAr, setNewInstructionsAr] = useState(
    'يرجى الضغط على زر "تقديم الطلب الآن" وتعبئة استمارة التقديم الرسمية عبر Google Forms مع إرفاق السيرة الذاتية المحدثة.'
  );

  // Template Quick Fills for ease of demonstration
  const applyPreset = (presetType: 'ai' | 'hr' | 'dev') => {
    if (presetType === 'ai') {
      setNewTitleAr('مطور حلول الذكاء الاصطناعي – AI Solutions Engineer');
      setNewTitleEn('AI Solutions Engineer');
      setNewDeptId('tech');
      setNewSummaryAr(
        'تبحث سمارت مسار عن مهندس حلول ذكاء اصطناعي موهوب لتطوير وتدريب نماذج التعلم الآلي وتكامل الحلول التنبؤية مع منصات الأعمال السحابية.'
      );
      setNewResponsibilitiesText(
        'تصميم وتدريب نماذج التعلم الآلي والذكاء الاصطناعي التوليدي.\nتكامل واجهات البرمجة APIs للذكاء الاصطناعي مع أنظمة العملاء.\nتحسين كفاءة النماذج ودقة التنبؤ والتحليل.\nالتعاون مع فرق هندسة البيانات لتجهيز مجموعات التدريب والتنظيف.'
      );
      setNewQualificationsText(
        'درجة البكالوريوس أو الماجستير في هندسة البرمجيات، علوم الحاسوب، أو الذكاء الاصطناعي.\nخبرة لا تقل عن سنتين في لغات البرمجة Python و TypeScript وأطر عمل PyTorch أو TensorFlow.\nفهم قوي لنماذج اللغة الكبيرة (LLMs) وتقنيات RAG ومعالجة اللغة الطبيعية.\nمهارات حل المشكلات والتفكير التحليلي العالي.'
      );
      setNewSkillsText(
        'إتقان Python و Prompt Engineering وهندسة النماذج التوليدية.\nالتعامل مع قواعد البيانات المتجهة Vector Databases.\nبناء خوارزميات التنبؤ وأتمتة اتخاذ القرار.'
      );
      setNewSoftwareText(
        'Git, Docker, Cloud Platforms (GCP / AWS / Azure).\nFastAPI, LangChain, LlamaIndex.\nأنظمة إدارة المهام والتحكم بالإصدارات.'
      );
    } else if (presetType === 'hr') {
      setNewTitleAr('أخصائي استقطاب مواهب وموارد بشرية – Talent Acquisition Specialist');
      setNewTitleEn('Talent Acquisition & HR Specialist');
      setNewDeptId('hr');
      setNewSummaryAr(
        'قيادة عمليات استقطاب الكفاءات والكوادر التقنية، تنظيم المقابلات وإجراءات التعيين، وتعزيز العلامة المؤسسية لصاحب العمل.'
      );
      setNewResponsibilitiesText(
        'إدارة دورة التوظيف الكاملة من نشر الإعلانات حتى توقيع عقود العمل.\nفرز وتقييم السير الذاتية واستمارات التقديم عبر Google Forms والأنظمة الرقمية.\nإجراء المقابلات الأولية وتقييم الملاءمة الثقافية والمهنية للمرشحين.\nإدارة برنامج تزكية الموظفين الداخلي وضمان معايير النزاهة وتكافؤ الفرص.'
      );
      setNewQualificationsText(
        'بكالوريوس في إدارة الأعمال، الموارد البشرية، أو علم النفس التنظيمي.\nخبرة سابقة لا تقل عن سنتين في التوظيف التقني (Tech Recruitment).\nإلمام بقوانين العمل والأنظمة المعمول بها.\nشخصية قيادية ومهارات تواصل ممتازة باللغتين العربية والإنجليزية.'
      );
      setNewSkillsText(
        'إتقان تقنيات البحث عن المواهب عبر LinkedIn Recruiter والمنصات المهنية.\nتحليل مؤشرات أداء التوظيف Time-to-hire و Quality-of-hire.\nتصميم خطط الاستقطاب وبناء بنوك السير الذاتية.'
      );
      setNewSoftwareText(
        'أنظمة متابعة المتقدمين (ATS).\nGoogle Workspace و Google Forms و Sheets لإدارة الترشيحات.\nأدوات التقييم والمقابلات الرقمية.'
      );
    } else if (presetType === 'dev') {
      setNewTitleAr('مهندس برمجيات سحابية وتطبيقات – Cloud Software Engineer');
      setNewTitleEn('Cloud Software Engineer');
      setNewDeptId('tech');
      setNewSummaryAr(
        'المشاركة في بناء منصات الويب السحابية الحديثة لشركة سمارت مسار وضمان كفاءة الأداء والأمان والتوافقية العالية.'
      );
      setNewResponsibilitiesText(
        'تطوير واجهات المستخدم التفاعلية والخدمات الخلفية باستخدام React و Node.js.\nبناء وتصميم واجهات البرمجة RESTful APIs والخدمات المصغرة Microservices.\nكتابة اختبارات جودة البرمجيات وضمان الاستقرار والأمان.\nالمشاركة في مراجعات الكود البرمجي وجلسات التخطيط الفني.'
      );
      setNewQualificationsText(
        'بكالوريوس في علوم الحاسوب أو تكنولوجيا المعلومات.\nخبرة سنتين على الأقل في تطوير الويب الكامل (Full-Stack Development).\nإتقان عميق لـ TypeScript و React و Next.js أو Express.\nالقدرة على العمل في بيئات التطوير السريع Agile.'
      );
      setNewSkillsText(
        'Modern React, Tailwind CSS, State Management.\nREST APIs, SQL / PostgreSQL, NoSQL.\nClean Code Architecture & Performance Optimization.'
      );
      setNewSoftwareText(
        'Git & GitHub Actions, Docker, CI/CD Pipelines.\nVS Code, Postman, Cloud Run / Supabase / Firebase.'
      );
    }
  };

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitleAr.trim() || !newTitleEn.trim()) {
      showToast('يرجى إدخال مسمى الوظيفة بالعربية والإنجليزية');
      return;
    }

    const dept = departments.find((d) => d.id === newDeptId);

    const responsibilities = newResponsibilitiesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const qualifications = newQualificationsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const skills = newSkillsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const software = newSoftwareText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    addJob({
      titleAr: newTitleAr.trim(),
      titleEn: newTitleEn.trim(),
      departmentId: newDeptId,
      departmentNameAr: dept?.nameAr || 'القسم التقني',
      status: newStatus,
      googleFormsUrl: newGoogleFormsUrl.trim(),
      summaryAr: newSummaryAr.trim() || 'شاغر وظيفي جديد متاح للتقديم في شركة سمارت مسار.',
      employmentTypeAr: newEmploymentTypeAr.trim(),
      locationAr: newLocationAr.trim(),
      experienceLevelAr: newExperienceLevelAr.trim(),
      responsibilitiesAr:
        responsibilities.length > 0
          ? responsibilities
          : ['القيام بالمهام التخصصية الموكلة بحرفية وكفاءة عالية.'],
      qualificationsAr:
        qualifications.length > 0
          ? qualifications
          : ['مؤهل علمي ذو صلة بالتخصص المطلوب وخبرة عملية مناسبة.'],
      accountingSkillsAr: skills.length > 0 ? skills : ['مهارات تخصصية متقدمة في مجال الوظيفة.'],
      softwareExperienceAr:
        software.length > 0 ? software : ['إلمام بالبرمجيات والأنظمة الحديثة ذات الصلة.'],
      applicationInstructionsAr: newInstructionsAr.trim(),
    });

    // Reset and close
    setIsAddModalOpen(false);
    setNewTitleAr('');
    setNewTitleEn('');
    setNewSummaryAr('');
    setNewResponsibilitiesText('');
    setNewQualificationsText('');
    setNewSkillsText('');
    setNewSoftwareText('');
  };

  const activeJobsCount = jobs.filter((j) => j.status === 'active').length;
  const closedJobsCount = jobs.filter((j) => j.status === 'closed').length;

  return (
    <div className="space-y-8 text-right bg-white">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
            <h2 className="text-xl sm:text-2xl font-black text-[#142B4F]">
              إدارة الشواغر والفرص الوظيفية (Jobs Management)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            إضافة شواغر وظيفية جديدة، تعديل المتطلبات، وإدارة روابط التقديم الرقمية عبر Google Forms.
          </p>
        </div>

        {/* Primary Action Button: Add New Vacancy */}
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md hover:shadow-cyan-500/20 transition-all flex items-center gap-2 cursor-pointer border border-[#00D2FF]/40"
        >
          <Plus className="w-4 h-4 text-[#00D2FF]" />
          <span>إضافة شاغر وظيفي جديد</span>
        </button>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-[#F5F8FC] border border-[#CBD5E1] shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 mb-1">إجمالي الشواغر المسجلة</div>
          <div className="text-2xl font-black text-[#142B4F]">{jobs.length}</div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-2xs">
          <div className="text-[11px] font-bold text-emerald-700 mb-1">شواغر نشطة للتقديم</div>
          <div className="text-2xl font-black text-emerald-800">{activeJobsCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 mb-1">شواغر مغلقة مؤقتاً</div>
          <div className="text-2xl font-black text-slate-700">{closedJobsCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#F5F8FC] border border-[#2563EB]/30 shadow-2xs">
          <div className="text-[11px] font-bold text-[#2563EB] mb-1">بوابة الاستقطاب</div>
          <div className="text-xs font-bold text-[#142B4F] flex items-center gap-1.5 mt-2">
            <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />
            <span>متصلة بـ Google Forms</span>
          </div>
        </div>
      </div>

      {/* Vacancies Directory / Table */}
      <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 bg-[#F5F8FC] border-b border-[#CBD5E1] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#2563EB]" />
            <h3 className="text-sm sm:text-base font-bold text-[#142B4F]">
              قائمة الشواغر الوظيفية المعرفة في النظام ({jobs.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            انقر على أي شاغر لتعديله أو إدارة رابطه
          </span>
        </div>

        <div className="divide-y divide-[#E2E8F0]">
          {jobs.map((job) => {
            const isSelected = activeJob?.id === job.id;
            return (
              <div
                key={job.id}
                onClick={() => handleSelectJobToEdit(job)}
                className={`p-4 sm:p-5 transition-colors cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  isSelected
                    ? 'bg-[#EBF4FE] border-r-4 border-r-[#2563EB]'
                    : 'hover:bg-slate-50'
                }`}
              >
                {/* Job Title & Meta */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                        job.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {job.status === 'active' ? 'نشط ومتاح للتقديم' : 'مغلق مؤقتاً'}
                    </span>

                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#142B4F] text-white">
                      {job.departmentNameAr}
                    </span>

                    <span className="text-[11px] text-slate-500 font-mono">
                      نُشر في: {job.postedDate}
                    </span>
                  </div>

                  <h4 className="text-base sm:text-lg font-bold text-[#142B4F]">
                    {job.titleAr}
                  </h4>
                  <p className="text-xs font-semibold text-slate-500 font-mono" dir="ltr">
                    {job.titleEn} • {job.locationAr} • {job.employmentTypeAr}
                  </p>
                </div>

                {/* Row Actions */}
                <div
                  className="flex items-center gap-2 shrink-0 self-end md:self-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Status Toggle Button */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleStatus(job, e)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 border cursor-pointer ${
                      job.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                    }`}
                    title="تغيير حالة الشاغر فورا"
                  >
                    {job.status === 'active' ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-emerald-600" />
                        <span>إغلاق الشاغر</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 text-slate-500" />
                        <span>تنشيط الشاغر</span>
                      </>
                    )}
                  </button>

                  {/* Test Form Link */}
                  {job.googleFormsUrl && (
                    <a
                      href={job.googleFormsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-slate-600 hover:text-[#2563EB] hover:bg-white rounded-lg border border-slate-200 transition-colors cursor-pointer"
                      title="فتح استمارة التقديم عبر Google Forms"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}

                  {/* Select for edit */}
                  <button
                    type="button"
                    onClick={() => handleSelectJobToEdit(job)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border ${
                      isSelected
                        ? 'bg-[#2563EB] text-white border-[#2563EB]'
                        : 'bg-white text-[#142B4F] border-[#CBD5E1] hover:bg-slate-50'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>تعديل</span>
                  </button>

                  {/* Delete Button (disabled for base accountant if only 1 job) */}
                  <button
                    type="button"
                    onClick={() => setJobToDelete(job)}
                    disabled={jobs.length <= 1}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    title={jobs.length <= 1 ? 'يجب الإبقاء على شاغر واحد على الأقل' : 'حذف الشاغر'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Form Section */}
      {activeJob && (
        <form
          onSubmit={handleSaveEdit}
          className="bg-white rounded-2xl border border-[#CBD5E1] shadow-2xs p-6 sm:p-8 space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
            <div>
              <span className="text-[11px] font-bold text-[#2563EB] tracking-wide block">
                تعديل وتحديث الشاغر المحدد
              </span>
              <h3 className="text-lg sm:text-xl font-black text-[#142B4F]">
                {activeJob.titleAr}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {activeJob.googleFormsUrl && (
                <a
                  href={activeJob.googleFormsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-[#F5F8FC] hover:bg-slate-100 text-[#142B4F] border border-[#CBD5E1] text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <span>اختبار رابط الاستمارة</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#2563EB]" />
                </a>
              )}
            </div>
          </div>

          {/* Google Forms URL Section (Prominent) */}
          <div className="p-5 rounded-xl bg-[#F5F8FC] border border-[#2563EB]/40 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#142B4F] flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-[#2563EB]" />
                <span>رابط استمارة التقديم عبر Google Forms *</span>
              </label>
              <span className="text-[11px] font-bold text-[#2563EB]">
                قابل للتعديل والتحديث الفوري
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              عند نقر المتقدم على "تقديم الطلب الآن" في صفحة الوظائف العامة، سيتم توجيهه مباشرة إلى هذا الرابط. ضع رابط نموذج Google Forms الفعلي هنا.
            </p>

            <input
              type="url"
              required
              value={googleFormsUrl}
              onChange={(e) => setGoogleFormsUrl(e.target.value)}
              placeholder="https://docs.google.com/forms/d/e/.../viewform"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#CBD5E1] bg-white font-mono focus:outline-none focus:border-[#2563EB]"
              dir="ltr"
            />
          </div>

          {/* Status & Titles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                حالة الشاغر الوظيفي *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'closed')}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white font-bold"
              >
                <option value="active">متاح ونشط للتقديم (Active)</option>
                <option value="closed">مغلق مؤقتاً (Closed)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                القسم المؤسسي *
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white font-bold"
              >
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.nameAr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                مستوى الخبرة المطلوبة
              </label>
              <input
                type="text"
                value={experienceLevelAr}
                onChange={(e) => setExperienceLevelAr(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white"
                placeholder="سنتان إلى 4 سنوات خبرة"
              />
            </div>
          </div>

          {/* Titles in Ar & En */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                عنوان الوظيفة بالعربية *
              </label>
              <input
                type="text"
                required
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                عنوان الوظيفة بالإنجليزية *
              </label>
              <input
                type="text"
                required
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white"
                dir="ltr"
              />
            </div>
          </div>

          {/* Location & Employment Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                نوع الدوام وطبيعة العمل
              </label>
              <input
                type="text"
                value={employmentTypeAr}
                onChange={(e) => setEmploymentTypeAr(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                مكان العمل والمقر
              </label>
              <input
                type="text"
                value={locationAr}
                onChange={(e) => setLocationAr(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white"
              />
            </div>
          </div>

          {/* Summary */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              الوصف العام للشاغر (Job Summary) *
            </label>
            <textarea
              rows={3}
              required
              value={summaryAr}
              onChange={(e) => setSummaryAr(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white leading-relaxed"
            />
          </div>

          {/* Responsibilities & Qualifications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                المهام والمسؤوليات (سطر لكل بند)
              </label>
              <textarea
                rows={5}
                value={responsibilitiesText}
                onChange={(e) => setResponsibilitiesText(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                المؤهلات المطلوبة (سطر لكل بند)
              </label>
              <textarea
                rows={5}
                value={qualificationsText}
                onChange={(e) => setQualificationsText(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white leading-relaxed"
              />
            </div>
          </div>

          {/* Skills & Software experience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                المهارات الفنية والتخصصية المتقدمة (سطر لكل بند)
              </label>
              <textarea
                rows={4}
                value={accountingSkillsText}
                onChange={(e) => setAccountingSkillsText(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                البرمجيات والأنظمة المطلوبة (سطر لكل بند)
              </label>
              <textarea
                rows={4}
                value={softwareExperienceText}
                onChange={(e) => setSoftwareExperienceText(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white leading-relaxed"
              />
            </div>
          </div>

          {/* Application Instructions */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              إرشادات التقديم للمرشح
            </label>
            <textarea
              rows={2}
              value={applicationInstructionsAr}
              onChange={(e) => setApplicationInstructionsAr(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white"
            />
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ وتحديث بيانات الشاغر</span>
            </button>
          </div>
        </form>
      )}

      {/* --- ADD NEW JOB MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[#CBD5E1] shadow-2xl p-6 sm:p-8 space-y-6 text-right">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shadow-md">
                  <Plus className="w-5 h-5 text-[#00D2FF]" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-[#142B4F]">
                    إضافة شاغر وظيفي جديد
                  </h3>
                  <p className="text-xs text-slate-500">
                    أدخل تفاصيل الشاغر الجديد ورابط استمارة التقديم على Google Forms
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Templates Buttons */}
            <div className="p-4 rounded-2xl bg-[#F5F8FC] border border-[#CBD5E1] space-y-2">
              <span className="text-xs font-bold text-[#142B4F] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>نماذج وظيفية مقترحة سريعة (انقر للتعبئة التلقائية):</span>
              </span>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => applyPreset('ai')}
                  className="px-3 py-1.5 bg-white hover:bg-blue-50 text-[#2563EB] text-xs font-bold rounded-lg border border-[#2563EB]/30 transition-colors shadow-2xs cursor-pointer"
                >
                  + مطور ذكاء اصطناعي (AI Engineer)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('hr')}
                  className="px-3 py-1.5 bg-white hover:bg-blue-50 text-[#2563EB] text-xs font-bold rounded-lg border border-[#2563EB]/30 transition-colors shadow-2xs cursor-pointer"
                >
                  + أخصائي موارد بشرية (Talent Acquisition)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('dev')}
                  className="px-3 py-1.5 bg-white hover:bg-blue-50 text-[#2563EB] text-xs font-bold rounded-lg border border-[#2563EB]/30 transition-colors shadow-2xs cursor-pointer"
                >
                  + مهندس برمجيات سحابية (Cloud Engineer)
                </button>
              </div>
            </div>

            {/* Creation Form */}
            <form onSubmit={handleCreateJob} className="space-y-5">
              {/* Google Forms URL */}
              <div className="p-4 rounded-xl bg-blue-50 border border-[#2563EB]/40 space-y-2">
                <label className="text-xs font-bold text-[#142B4F] flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-[#2563EB]" />
                  <span>رابط استمارة التقديم على Google Forms *</span>
                </label>
                <input
                  type="url"
                  required
                  value={newGoogleFormsUrl}
                  onChange={(e) => setNewGoogleFormsUrl(e.target.value)}
                  placeholder="https://docs.google.com/forms/d/e/.../viewform"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#CBD5E1] bg-white font-mono"
                  dir="ltr"
                />
              </div>

              {/* Status & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    حالة الشاغر *
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as 'active' | 'closed')}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white font-bold"
                  >
                    <option value="active">متاح ونشط للتقديم</option>
                    <option value="closed">مغلق مؤقتاً</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    القسم المؤسسي *
                  </label>
                  <select
                    value={newDeptId}
                    onChange={(e) => setNewDeptId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white font-bold"
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    مستوى الخبرة
                  </label>
                  <input
                    type="text"
                    value={newExperienceLevelAr}
                    onChange={(e) => setNewExperienceLevelAr(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white"
                  />
                </div>
              </div>

              {/* Title Ar & En */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    مسمى الوظيفة بالعربية *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitleAr}
                    onChange={(e) => setNewTitleAr(e.target.value)}
                    placeholder="مثال: مهندس حلول الذكاء الاصطناعي"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    مسمى الوظيفة بالإنجليزية *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitleEn}
                    onChange={(e) => setNewTitleEn(e.target.value)}
                    placeholder="e.g. AI Solutions Engineer"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Location & Employment Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    نوع وطبيعة الدوام
                  </label>
                  <input
                    type="text"
                    value={newEmploymentTypeAr}
                    onChange={(e) => setNewEmploymentTypeAr(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    مكان العمل
                  </label>
                  <input
                    type="text"
                    value={newLocationAr}
                    onChange={(e) => setNewLocationAr(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white"
                  />
                </div>
              </div>

              {/* Summary */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الوصف العام للشاغر (Job Summary) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={newSummaryAr}
                  onChange={(e) => setNewSummaryAr(e.target.value)}
                  placeholder="وصف موجز لطبيعة الدور وأهدافه في شركة سمارت مسار..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white leading-relaxed"
                />
              </div>

              {/* Responsibilities & Qualifications */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    المهام والمسؤوليات (سطر لكل بند)
                  </label>
                  <textarea
                    rows={4}
                    value={newResponsibilitiesText}
                    onChange={(e) => setNewResponsibilitiesText(e.target.value)}
                    placeholder="بند 1&#10;بند 2&#10;بند 3"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    المؤهلات المطلوبة (سطر لكل بند)
                  </label>
                  <textarea
                    rows={4}
                    value={newQualificationsText}
                    onChange={(e) => setNewQualificationsText(e.target.value)}
                    placeholder="بند 1&#10;بند 2"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white leading-relaxed"
                  />
                </div>
              </div>

              {/* Skills & Software */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    المهارات التخصصية والفنية (سطر لكل بند)
                  </label>
                  <textarea
                    rows={3}
                    value={newSkillsText}
                    onChange={(e) => setNewSkillsText(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    البرمجيات والأدوات المطلوبة (سطر لكل بند)
                  </label>
                  <textarea
                    rows={3}
                    value={newSoftwareText}
                    onChange={(e) => setNewSoftwareText(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white leading-relaxed"
                  />
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  إرشادات التقديم
                </label>
                <textarea
                  rows={2}
                  value={newInstructionsAr}
                  onChange={(e) => setNewInstructionsAr(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#CBD5E1] bg-white"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer border border-[#00D2FF]/40"
                >
                  <Plus className="w-4 h-4 text-[#00D2FF]" />
                  <span>نشر وحفظ الشاغر الجديد</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {jobToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-[#CBD5E1] shadow-2xl p-6 sm:p-8 max-w-md w-full space-y-4 text-right">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-[#142B4F]">تأكيد حذف الشاغر الوظيفي</h3>
              <p className="text-xs text-slate-600">
                هل أنت متأكد من رغبتك في حذف الشاغر &quot;{jobToDelete.titleAr}&quot; نهائياً من الموقع وبوابة التوظيف؟
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setJobToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={confirmDeleteJob}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
