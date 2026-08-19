export type JobLevel = 'Intern' | 'Junior' | 'Intermediate' | 'Senior';
export type Department = 'Business & Management' | 'Backend' | 'Frontend' | 'Design';
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
  'Business & Management',
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

export const jobOpenings: JobOpening[] = [
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
];

/** Helper function to look up an active opening for a department and job level */
export function getOpening(department: Department, level: JobLevel): JobOpening | undefined {
  return jobOpenings.find(
    (o) => o.department === department && o.level === level && o.status === 'open'
  );
}
