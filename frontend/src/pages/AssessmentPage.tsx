import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router';
import { getOpeningById } from '@/features/join-us/joinUsData';
import { getAssessmentConfigForRole } from '@/features/join-us/assessment/backendAssessmentData';
import AssessmentComingSoon from '@/features/join-us/assessment/components/AssessmentComingSoon';
import AssessmentResultScreen from '@/features/join-us/assessment/components/AssessmentResultScreen';
import AssessmentShell from '@/features/join-us/assessment/components/AssessmentShell';
import QuestionCard from '@/features/join-us/assessment/components/QuestionCard';
import TimedCodingScreen from '@/features/join-us/assessment/components/TimedCodingScreen';
import { motion, AnimatePresence } from 'framer-motion';

export default function AssessmentPage() {
  const { roleId = '' } = useParams<{ roleId?: string }>();

  // 1. Get assessment configuration for the role
  const config = useMemo(() => getAssessmentConfigForRole(roleId), [roleId]);
  const jobOpening = useMemo(() => getOpeningById(roleId), [roleId]);

  // If no assessment config exists (e.g. Growth & Marketing), show Coming Soon
  if (!config) {
    return (
      <AssessmentComingSoon
        roleTitle={jobOpening?.roleSubtitle || jobOpening?.title}
        department={jobOpening?.department}
      />
    );
  }

  // 2. Assessment State Management
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [radioValues, setRadioValues] = useState<Record<string, string>>({});
  const [textValues, setTextValues] = useState<Record<string, string>>({});
  const [bookmarkedQuestionNumbers, setBookmarkedQuestionNumbers] = useState<
    Set<number>
  >(new Set());
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Scroll to top whenever page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPageIndex]);

  const totalPages = config.pages.length + (config.timedCodingConfig ? 1 : 0);
  const isTimedCodingPage =
    config.timedCodingConfig && currentPageIndex === config.pages.length;

  const currentPage = !isTimedCodingPage ? config.pages[currentPageIndex] : null;

  // Active question for the sidebar info card
  const activeQuestion = currentPage?.questions[0];

  // Calculate current question display number
  const currentQuestionNumber = useMemo(() => {
    if (isTimedCodingPage && config.timedCodingConfig) {
      return config.timedCodingConfig.question.questionNumber;
    }
    if (currentPage && currentPage.questions.length > 0) {
      return currentPage.questions[0].questionNumber;
    }
    return 1;
  }, [isTimedCodingPage, config, currentPage]);

  // Set of answered question numbers
  const answeredQuestionNumbers = useMemo(() => {
    const answered = new Set<number>();
    config.pages.forEach((p) => {
      p.questions.forEach((q) => {
        const val = answers[q.id];
        if (val && val.trim().length > 0) {
          answered.add(q.questionNumber);
        }
      });
    });

    if (config.timedCodingConfig) {
      const q11Val = answers[config.timedCodingConfig.question.id];
      if (q11Val && q11Val.trim().length > 0) {
        answered.add(config.timedCodingConfig.question.questionNumber);
      }
    }

    return answered;
  }, [answers, config]);

  // Handlers
  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleRadioChange = (questionId: string, value: string) => {
    setRadioValues((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleTextChange = (questionId: string, value: string) => {
    setTextValues((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleToggleBookmark = (questionNumber: number) => {
    setBookmarkedQuestionNumbers((prev) => {
      const next = new Set(prev);
      if (next.has(questionNumber)) {
        next.delete(questionNumber);
      } else {
        next.add(questionNumber);
      }
      return next;
    });
  };

  const handleNavigateToQuestion = (qNum: number) => {
    // Check if it's the timed coding question (e.g. Q11)
    if (
      config.timedCodingConfig &&
      qNum === config.timedCodingConfig.question.questionNumber
    ) {
      setCurrentPageIndex(config.pages.length);
      return;
    }

    // Find the regular page that contains this question number
    const targetPageIndex = config.pages.findIndex((page) =>
      page.questions.some((q) => q.questionNumber === qNum)
    );

    if (targetPageIndex !== -1) {
      setCurrentPageIndex(targetPageIndex);
    }
  };

  const handleNextPage = () => {
    if (currentPageIndex < totalPages - 1) {
      setCurrentPageIndex((prev) => prev + 1);
    } else {
      setIsSubmitted(true);
    }
  };

  const handlePreviousPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex((prev) => prev - 1);
    }
  };

  const handleSubmitAssessment = () => {
    setIsSubmitted(true);
  };

  // If submitted, show result screen
  if (isSubmitted) {
    return (
      <AssessmentResultScreen
        status="pass"
        roleTitle={jobOpening?.roleSubtitle || config.roleTitle}
      />
    );
  }

  // If on timed coding page (Q11)
  if (isTimedCodingPage && config.timedCodingConfig) {
    const q10Answer = answers[config.timedCodingConfig.estimateQuestionId] || '0';

    return (
      <AssessmentShell
        roleTitle={jobOpening?.roleSubtitle || config.roleTitle}
        totalTimeMinutes={config.totalTimeMinutes}
        totalQuestions={config.totalQuestions}
        currentQuestionNumber={config.timedCodingConfig.question.questionNumber}
        answeredQuestionNumbers={answeredQuestionNumbers}
        bookmarkedQuestionNumbers={bookmarkedQuestionNumbers}
        activeQuestion={config.timedCodingConfig.question}
        isFirstPage={false}
        isLastPage={true}
        onNavigateToQuestion={handleNavigateToQuestion}
        onPreviousPage={handlePreviousPage}
        onNextPage={handleSubmitAssessment}
        onTimerExpire={handleSubmitAssessment}
        submitButtonText="Complete Assessment"
      >
        <TimedCodingScreen
          config={config.timedCodingConfig}
          estimatedMinutesRaw={q10Answer}
          answer={answers[config.timedCodingConfig.question.id] || ''}
          onAnswerChange={(val) =>
            handleAnswerChange(config.timedCodingConfig!.question.id, val)
          }
          onBackToPrevious={handlePreviousPage}
          onSubmitAssessment={handleSubmitAssessment}
        />
      </AssessmentShell>
    );
  }

  // Regular Assessment Pages (Pages 1 to 5)
  return (
    <AssessmentShell
      roleTitle={jobOpening?.roleSubtitle || config.roleTitle}
      totalTimeMinutes={config.totalTimeMinutes}
      totalQuestions={config.totalQuestions}
      currentQuestionNumber={currentQuestionNumber}
      answeredQuestionNumbers={answeredQuestionNumbers}
      bookmarkedQuestionNumbers={bookmarkedQuestionNumbers}
      activeQuestion={activeQuestion}
      pagePurpose={currentPage?.purpose}
      submitButtonText={
        currentPage?.submitButtonText || 'Submit and continue to next question'
      }
      isFirstPage={currentPageIndex === 0}
      isLastPage={currentPageIndex === totalPages - 1}
      onNavigateToQuestion={handleNavigateToQuestion}
      onPreviousPage={handlePreviousPage}
      onNextPage={handleNextPage}
      onTimerExpire={handleSubmitAssessment}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={`page-${currentPage?.id}`}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="space-y-6"
        >
          {currentPage?.questions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              totalQuestions={config.totalQuestions}
              answer={answers[q.id] || ''}
              onAnswerChange={(val) => handleAnswerChange(q.id, val)}
              isBookmarked={bookmarkedQuestionNumbers.has(q.questionNumber)}
              onToggleBookmark={() => handleToggleBookmark(q.questionNumber)}
              radioValue={radioValues[q.id] || ''}
              textValue={textValues[q.id] || ''}
              onRadioValueChange={(val) => handleRadioChange(q.id, val)}
              onTextValueChange={(val) => handleTextChange(q.id, val)}
            />
          ))}
        </motion.div>
      </AnimatePresence>
    </AssessmentShell>
  );
}
