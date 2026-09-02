export type JobLevel = 'Intern' | 'Junior' | 'Intermediate' | 'Senior';
export type Department =
  | 'Manager'
  | 'Growth & Marketing'
  | 'Backend'
  | 'Frontend'
  | 'Design';
export type OpeningStatus = 'open' | 'closed';

export interface RoleDetails {
  location?: string;
  hours?: string;
  employmentType?: string;
  salaryNotice?: string;
}

export interface AssessmentDetails {
  estimatedTime?: string;
  numberOfQuestions?: number | string;
  aiAssistance?: string;
  timeLimit?: string;
  maximumAttempts?: number | string;
  nextStep?: string;
}

export interface JobOpening {
  id: string;
  department: Department;
  level: JobLevel;
  title: string;
  status: OpeningStatus;
  overview: string;
  roleDetails?: RoleDetails;
  assessmentDetails?: AssessmentDetails;
  ctaText?: string;
}

export const DEPARTMENTS: Department[] = [
  'Manager',
  'Growth & Marketing',
  'Backend',
  'Frontend',
  'Design',
];

export const JOB_LEVELS: JobLevel[] = [
  'Intern',
  'Junior',
  'Intermediate',
  'Senior',
];

const sharedBackendAssessmentContent = {
  title: 'Assessment',
  overview:
    'The first step is completing our technical assessment. The questions focus on the kind of work you’d actually be doing, allowing you to see if this is the kind of work you’d want to do and allowing us to evaluate whether you can handle the tasks involved.',
  roleDetails: {
    location: 'Remote',
    hours: 'Flexible hours',
    employmentType: 'Full-time / Part-time',
    salaryNotice: 'Salary details will be shared if you pass our Stage 1 assessment',
  },
  assessmentDetails: {
    estimatedTime: '1.5 hour',
    numberOfQuestions: 11,
    aiAssistance: 'Not Allowed',
    timeLimit: 'None',
    maximumAttempts: 1,
    nextStep: 'Candidates who pass will progress to Stage 2',
  },
  ctaText: 'Begin Assessment',
};

const sharedGrowthMarketingAssessmentContent = {
  title: 'Assessment',
  overview:
    'The first step is completing our technical assessment. The questions focus on the kind of work you’d actually be doing, allowing you to see if this is the kind of work you’d want to do and allowing us to evaluate whether you can handle the tasks involved.',
  roleDetails: {
    location: 'Remote',
    hours: 'Flexible hours',
    employmentType: 'Full-time / Part-time',
    salaryNotice: 'Salary details will be shared if you pass our Stage 1 assessment',
  },
  assessmentDetails: {
    estimatedTime: '1 hour',
    numberOfQuestions: 6,
    aiAssistance: 'Not Allowed',
    timeLimit: 'None',
    maximumAttempts: 1,
    nextStep: 'Candidates who pass will progress to Stage 2',
  },
  ctaText: 'Begin Assessment',
};

export const jobOpenings: JobOpening[] = [
  // Backend Openings
  {
    id: 'backend-intern',
    department: 'Backend',
    level: 'Intern',
    status: 'open',
    ...sharedBackendAssessmentContent,
  },
  {
    id: 'backend-junior',
    department: 'Backend',
    level: 'Junior',
    status: 'open',
    ...sharedBackendAssessmentContent,
  },
  {
    id: 'backend-intermediate',
    department: 'Backend',
    level: 'Intermediate',
    status: 'open',
    ...sharedBackendAssessmentContent,
  },
  {
    id: 'backend-senior',
    department: 'Backend',
    level: 'Senior',
    status: 'open',
    ...sharedBackendAssessmentContent,
  },

  // Growth & Marketing Openings
  {
    id: 'growth-marketing-junior',
    department: 'Growth & Marketing',
    level: 'Junior',
    status: 'open',
    ...sharedGrowthMarketingAssessmentContent,
  },
  {
    id: 'growth-marketing-intermediate',
    department: 'Growth & Marketing',
    level: 'Intermediate',
    status: 'open',
    ...sharedGrowthMarketingAssessmentContent,
  },
  {
    id: 'growth-marketing-senior',
    department: 'Growth & Marketing',
    level: 'Senior',
    status: 'open',
    ...sharedGrowthMarketingAssessmentContent,
  },
];

/**
 * Maps a department to its backend assessment track slug. All levels
 * (Intern/Junior/Intermediate/Senior) within a department share the exact
 * same assessment, so the track is keyed by department only.
 */
const DEPARTMENT_TRACK_SLUG: Partial<Record<Department, string>> = {
  Backend: 'backend',
  'Growth & Marketing': 'growth-marketing',
  Manager: 'manager',
};

/** Returns the assessment track slug for a department, or null if that department has no assessment yet. */
export function getAssessmentTrackSlug(department: Department): string | null {
  return DEPARTMENT_TRACK_SLUG[department] ?? null;
}

/** Helper function to look up an active opening for a department and job level */
export function getOpening(
  department: Department,
  level: JobLevel
): JobOpening | undefined {
  return jobOpenings.find(
    (o) => o.department === department && o.level === level && o.status === 'open'
  );
}

/** Helper function to look up an opening by unique ID */
export function getOpeningById(id: string): JobOpening | undefined {
  return jobOpenings.find((o) => o.id === id);
}

/**
 * Looks up any open opening for a track slug (e.g. "backend"). Since every
 * level within a department shares the exact same assessment/overview
 * content, the specific level returned doesn't matter — this just needs
 * *an* open opening for that department to source display copy from.
 */
export function getOpeningByTrackSlug(trackSlug: string): JobOpening | undefined {
  const department = (Object.keys(DEPARTMENT_TRACK_SLUG) as Department[]).find(
    (dept) => DEPARTMENT_TRACK_SLUG[dept] === trackSlug
  );
  if (!department) return undefined;
  return jobOpenings.find((o) => o.department === department && o.status === 'open');
}
