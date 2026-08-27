export type JobLevel = 'Intern' | 'Junior' | 'Intermediate' | 'Senior';
export type Department =
  | 'Manager'
  | 'Growth & Marketing'
  | 'Backend'
  | 'Frontend'
  | 'Design';
export type OpeningStatus = 'open' | 'closed';

export interface JobOpening {
  id: string;
  department: Department;
  level: JobLevel;
  title: string;
  roleSubtitle?: string;
  status: OpeningStatus;
  overview: string;
  evaluationTitle?: string;
  evaluationDetails?: string;
  rulesHeading?: string;
  rulesSubheading?: string;
  rules?: string[];
  rulesFootnote?: string;
  timeRequirement?: string;
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
  title: 'Joining our Team',
  overview:
    'Thank you for your interest in joining our development team.\n\nTo join us as a Backend Developer, you must first successfully complete our Stage 1 Assessment. This assessment is designed to evaluate the core skills we consider important for our developers, including problem solving, programming, backend development, code review, estimation, and technical decision-making.\n\nWe expect our developers to be exceptionally strong problem solvers who can understand problems quickly, reason carefully, and produce practical solutions.',
  evaluationTitle: 'What We Evaluate',
  evaluationDetails:
    'Problem solving, programming, backend development architecture, code review, estimation, and technical decision-making under realistic scenarios.',
  rulesHeading: 'Before You Begin',
  rulesSubheading:
    'The initial part of this assessment must be completed without outside assistance. The purpose of this section is to assess your individual knowledge, skills, and baseline ability.',
  rules: [
    'Do not use ChatGPT, GPT, or any other AI tools.',
    'Do not use Google or other search engines.',
    'Do not use external tools, websites, references, or other sources of assistance.',
    'Complete the assessment using your own knowledge and abilities.',
  ],
  rulesFootnote:
    '*Some questions may explicitly state that AI or other assistance is permitted. Only use assistance when the question specifically allows it.',
  timeRequirement:
    'Please set aside approximately 2 hours to complete the assessment. Individual questions may have their own time requirements, which will be clearly indicated.',
  ctaText: 'Begin Assessment',
};

const sharedGrowthMarketingAssessmentContent = {
  title: 'Joining our Team',
  overview:
    'Thank you for your interest in joining our Growth & Marketing team.\n\nTo join us in Growth & Marketing, you must complete our Stage 1 Assessment. This assessment is designed to evaluate your strategic thinking, user acquisition frameworks, community-building instincts, viral loops, and analytical marketing decision-making.\n\nWe expect our growth team to be exceptionally proactive, creative, and data-driven—capable of identifying scalable acquisition channels, crafting compelling campaigns, and accelerating our community of passionate chess players globally.',
  evaluationTitle: 'What We Evaluate',
  evaluationDetails:
    'User acquisition strategies, viral mechanics, retention & engagement funnels, social campaigns, community growth, conversion analytics, and brand positioning under realistic growth scenarios.',
  rulesHeading: 'Before You Begin',
  rulesSubheading:
    'The initial section of this assessment evaluates your strategic marketing instincts, structured problem-solving, and core growth frameworks.',
  rules: [
    'Provide clear, actionable strategies and real-world execution plans.',
    'Back your recommendations with logical reasoning, metrics, and KPI frameworks.',
    'Demonstrate an understanding of chess communities, modern social distribution, and product-led growth.',
    'Complete the assessment using your own original strategic thinking and creativity.',
  ],
  rulesFootnote:
    '*Some questions may allow referencing public marketing case studies or chess industry benchmarks when specified.',
  timeRequirement:
    'Please set aside approximately 1 hour to complete the assessment and strategy exercises. Individual questions may indicate specific time allocations.',
  ctaText: 'Begin Assessment',
};

export const jobOpenings: JobOpening[] = [
  // Backend Openings
  {
    id: 'backend-intern',
    department: 'Backend',
    level: 'Intern',
    roleSubtitle: 'Backend Developer Assessment (Intern)',
    status: 'open',
    ...sharedBackendAssessmentContent,
  },
  {
    id: 'backend-junior',
    department: 'Backend',
    level: 'Junior',
    roleSubtitle: 'Backend Developer Assessment (Junior)',
    status: 'open',
    ...sharedBackendAssessmentContent,
  },
  {
    id: 'backend-intermediate',
    department: 'Backend',
    level: 'Intermediate',
    roleSubtitle: 'Backend Developer Assessment (Intermediate)',
    status: 'open',
    ...sharedBackendAssessmentContent,
  },
  {
    id: 'backend-senior',
    department: 'Backend',
    level: 'Senior',
    roleSubtitle: 'Backend Developer Assessment (Senior)',
    status: 'open',
    ...sharedBackendAssessmentContent,
  },

  // Growth & Marketing Openings
  {
    id: 'growth-marketing-junior',
    department: 'Growth & Marketing',
    level: 'Junior',
    roleSubtitle: 'Growth & Marketing Assessment (Junior)',
    status: 'open',
    ...sharedGrowthMarketingAssessmentContent,
  },
  {
    id: 'growth-marketing-intermediate',
    department: 'Growth & Marketing',
    level: 'Intermediate',
    roleSubtitle: 'Growth & Marketing Assessment (Intermediate)',
    status: 'open',
    ...sharedGrowthMarketingAssessmentContent,
  },
  {
    id: 'growth-marketing-senior',
    department: 'Growth & Marketing',
    level: 'Senior',
    roleSubtitle: 'Growth & Marketing Assessment (Senior)',
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
