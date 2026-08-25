import type { AssessmentConfig } from './assessmentTypes';
import { growthAssessmentConfig } from './growthAssessmentData';

export const backendAssessmentConfig: AssessmentConfig = {
  id: 'backend-assessment',
  roleIdPrefix: 'backend',
  roleTitle: 'Backend Developer Assessment',
  totalTimeMinutes: 120, // 2-hour general allocation
  totalQuestions: 11,
  pages: [
    // Page 1: Questions 1, 2, 3
    {
      id: 'page-1',
      pageNumber: 1,
      pageTitle: 'General Problem Solving',
      purpose:
        'These are general problem-solving questions designed to assess your ability to understand the information provided, apply logical reasoning, and determine the correct answer.',
      questionIds: ['q1', 'q2', 'q3'],
      submitButtonText: 'Submit and continue to next question',
      questions: [
        {
          id: 'q1',
          questionNumber: 1,
          type: 'short-text',
          questionText:
            'A crossover-minute is defined as that passing of a minute when the minute hand crosses over the hour hand on an analogue clock.\n\nAt the end of the minute if the minute hand only overlaps with the hour hand, this is not a crossover-minute.\n\nFor example, the first cross-over after midnight occurs between 1:05 to 1:06, when the minute hand catches up to and passes the hour hand.\n\nHow many crossover-minutes occur from 12:00 midnight (inclusive) to 12:00 noon (inclusive) on a standard analogue clock?',
          supportingTabs: [
            {
              id: 'assumption',
              label: 'Assumption',
              content:
                'Time is measured only in whole minutes. Thus, a minute refers to the labelled interval from one minute mark to the next (e.g. 1:05–1:06) rather than an arbitrary 60-second interval. All assumptions and definitions stated for this question apply later as well.',
            },
          ],
          wordLimit: 1,
          placeholder: 'Enter answer (e.g. 10)',
          tips: 'Answer in a single word or number. Be precise.',
        },
        {
          id: 'q2',
          questionNumber: 2,
          type: 'multiple-choice',
          questionText:
            'If we start at a random time (inclusive) and end exactly 12 hours later (end time inclusive), does the number of crossover-minutes remain the same?',
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
          ],
          tips: 'Select Yes or No based on clock geometry.',
        },
        {
          id: 'q3',
          questionNumber: 3,
          type: 'long-text',
          questionText: 'What is the purpose of the assumption in question 1?',
          wordLimit: 50,
          placeholder: 'Explain the purpose of the assumption...',
          tips: 'Limit your response to 50 words maximum.',
        },
      ],
    },

    // Page 2: Question 4
    {
      id: 'page-2',
      pageNumber: 2,
      pageTitle: 'Release Policy Evaluation',
      purpose:
        'As a developer, you may be involved in planning and managing software releases. This question is designed to assess your ability to evaluate an existing process and confidently determine whether it should be changed or left as it is.\n\nThere is no expectation that you must recommend a change. A good developer should be able to recognise when an existing process is appropriate and explain why, as well as identify areas where an improvement may be beneficial.',
      questionIds: ['q4'],
      submitButtonText: 'Submit and continue to next question',
      questions: [
        {
          id: 'q4',
          questionNumber: 4,
          type: 'radio-with-text',
          questionText: 'Based on the policy above, choose one of the following:',
          supportingTabs: [
            {
              id: 'policy',
              label: 'Release Policy',
              content:
                "A company's current release policy is:\n• Releases are scheduled from Monday to Thursday at 11:00 a.m.\n• Releases should not be scheduled around lunch breaks.\n• Releases should not be scheduled when people are finishing work for the day.\n• Releases are avoided on Fridays because there is less time available to resolve any issues that may arise.",
            },
          ],
          options: [
            { value: 'no_change', label: 'No changes are needed.' },
            { value: 'make_change', label: 'I would make this change:' },
          ],
          conditionalTextFieldLabel: 'Describe the change you would make:',
          conditionalTextOnValue: 'make_change',
          conditionalWordLimit: 2,
          placeholder: 'Enter change (max 2 words)',
          tips: 'If choosing to make a change, specify it in at most 2 words.',
        },
      ],
    },

    // Page 3: Questions 5 & 6
    {
      id: 'page-3',
      pageNumber: 3,
      pageTitle: 'Code Review & Engineering Practices',
      purpose:
        'As a developer, performing code reviews is a fundamental skill. This question is designed to assess your ability to review an implementation and identify if it is fine or needs changes.',
      questionIds: ['q5', 'q6'],
      submitButtonText: 'Submit and continue to next question',
      questions: [
        {
          id: 'q5',
          questionNumber: 5,
          type: 'radio-with-text',
          questionText:
            '(A) Are there any mistakes?\n\n(B) Leave a comment for the developer.',
          supportingTabs: [
            {
              id: 'scenario',
              label: 'Scenario',
              content:
                'A developer is building a system that allows users to submit X. One of the requirements is to generate a report showing all late submissions.\n\nThe developer has implemented the requirement as follows:\nLoop through all users. If the user is late, add them to late_list; otherwise, add them to list. The report is then generated using these lists.\n\nYou are now tasked with performing a code review of this implementation.',
            },
          ],
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
          ],
          conditionalTextFieldLabel: 'Leave a comment for the developer:',
          conditionalTextOnValue: 'all', // Show text box for comment regardless or specifically for review
          conditionalWordLimit: 120,
          placeholder: 'Write your code review comment here...',
          tips: 'Be constructive and clear in your feedback (max 120 words).',
        },
        {
          id: 'q6',
          questionNumber: 6,
          type: 'long-text',
          questionText:
            'Imagine you were hired by a company with 20 developers, and part of your responsibility was to perform code reviews for all developers.\n\nIn this real-world development environment, would you take any further action beyond leaving this comment? Explain your reasoning.',
          wordLimit: 120,
          placeholder: 'Explain your reasoning and any proactive steps you would take...',
          tips: 'Consider team processes, tooling, standards, and mentoring (max 120 words).',
        },
      ],
    },

    // Page 4: Question 7
    {
      id: 'page-4',
      pageNumber: 4,
      pageTitle: 'Function Optimization & Refactoring',
      purpose:
        'A backend developer should be able to answer this question in under 2 minutes using basic programming concepts and logical reasoning.',
      questionIds: ['q7'],
      submitButtonText: 'Submit and continue to next question',
      questions: [
        {
          id: 'q7',
          questionNumber: 7,
          type: 'code',
          questionText: 'Rewrite this function while improving it:',
          codeBlock: `FUNCTION x(y):
    a ← 0
    b ← 1
    
    WHILE a < y:
        n ← a + b
        a ← b
        b ← n
    
    IF a equals y:
        RETURN TRUE
    ELSE:
        RETURN FALSE
END FUNCTION`,
          prefillValue: `FUNCTION x(y):
    a ← 0
    b ← 1
    
    WHILE a < y:
        n ← a + b
        a ← b
        b ← n
    
    IF a equals y:
        RETURN TRUE
    ELSE:
        RETURN FALSE
END FUNCTION`,
          codeLanguage: 'Pseudocode',
          tips: 'Modify the function to be more concise, efficient, and idiomatic.',
        },
      ],
    },

    // Page 5: Questions 8, 9, 10
    {
      id: 'page-5',
      pageNumber: 5,
      pageTitle: 'Algorithm Analysis & Estimation',
      purpose:
        'This question focuses on problem-solving skills. We expect our developers to be exceptionally strong problem solvers.',
      questionIds: ['q8', 'q9', 'q10'],
      submitButtonText: 'Submit and continue to next question',
      questions: [
        {
          id: 'q8',
          questionNumber: 8,
          type: 'short-text',
          questionText:
            'Given these functions, what is the output of?\n\na ← 1\nWHILE NOT (x(a,2) AND y(a)):\n    a ← a + 1\nOUTPUT(a)',
          supportingTabs: [
            {
              id: 'functions',
              label: 'Functions Definition',
              content: `FUNCTION x(number, y):
    total ← 0

    WHILE number > 0:
        digit ← number MOD 10
        total ← total + digit
        number ← number DIV 10

    RETURN total equals y
END FUNCTION


FUNCTION y(number):
    b ← 2

    WHILE b < (number):
        IF number MOD b == 0:
            RETURN FALSE
            
        b ← b + 1

    RETURN TRUE
END FUNCTION`,
            },
          ],
          wordLimit: 1,
          placeholder: 'Enter output (e.g. 11)',
          tips: 'Trace the algorithm step-by-step.',
        },
        {
          id: 'q9',
          questionNumber: 9,
          type: 'short-text',
          questionText:
            'Given the functions in Q8, what is the output of?\n\na ← 1\nWHILE NOT (x(a,4) AND y(a)):\n    a ← a + 1\nOUTPUT(a)',
          wordLimit: 1,
          placeholder: 'Enter output',
          tips: 'Sum of digits = 4 and prime check.',
        },
        {
          id: 'q10',
          questionNumber: 10,
          type: 'number',
          questionText:
            'Given the functions in Q8, how much time would it take you to find the output?\n\nImportant: Do not rush your estimate. Take time to ensure your estimate is accurate, as it will be relevant to the next question.\n\na ← 1\nWHILE NOT (x(a,73) AND y(a)):\n    a ← a + 1\nOUTPUT(a)',
          numberPrefix: 'It would take me',
          numberSuffix: 'minutes.',
          placeholder: 'e.g. 30',
          tips: 'Be realistic with your time estimation in whole minutes.',
        },
      ],
    },
  ],

  // Page 6: Question 11 (Conditional Timed Coding)
  timedCodingConfig: {
    estimateQuestionId: 'q10',
    maxEstimateMinutes: 90,
    bonusMinutes: 15,
    question: {
      id: 'q11',
      questionNumber: 11,
      type: 'short-text',
      questionText:
        'The question was:\nGiven these functions, what is the output of?\n\na ← 1\nWHILE NOT (x(a,73) AND y(a)):\n    a ← a + 1\nOUTPUT(a)',
      purpose:
        'We want to assess your estimation skills. You estimated that this task would take you a certain amount of time, and we now want to see whether your estimate reflects how long the task actually takes.\n\nTreat this task as you would a task you received in a real-world development environment. You may use any tools or resources that you would normally use when completing work, including GPT, IDEs, documentation, search engines, and other development tools.\n\nUltimately, we want to test what matters most: can you write working code that solves the problem? Writing code to solve problems is a fundamental part of backend development.',
      supportingTabs: [
        {
          id: 'functions',
          label: 'Functions Definition',
          content: `FUNCTION x(number, y):
    total ← 0

    WHILE number > 0:
        digit ← number MOD 10
        total ← total + digit
        number ← number DIV 10

    RETURN total equals y
END FUNCTION


FUNCTION y(number):
    b ← 2

    WHILE b < (number):
        IF number MOD b == 0:
            RETURN FALSE
            
        b ← b + 1

    RETURN TRUE
END FUNCTION`,
        },
      ],
      wordLimit: 1,
      placeholder: 'Enter calculated output value',
      tips: 'You can write a script in any language or environment to solve this.',
    },
  },
};

export function getAssessmentConfigForRole(roleId: string): AssessmentConfig | null {
  if (roleId.startsWith('backend')) {
    return backendAssessmentConfig;
  }
  if (roleId.startsWith('growth')) {
    return growthAssessmentConfig;
  }
  return null;
}
