import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router';
import { Loader2, AlertTriangle } from 'lucide-react';
import { getOpeningById } from '@/features/join-us/joinUsData';
import {
  AssessmentService,
  AssessmentApiError,
  type AssessmentAttempt,
} from '@/features/join-us/assessment/assessment.service';
import type { AssessmentConfig } from '@/features/join-us/assessment/assessmentTypes';
import AssessmentComingSoon from '@/features/join-us/assessment/components/AssessmentComingSoon';
import AssessmentResultScreen from '@/features/join-us/assessment/components/AssessmentResultScreen';
import AssessmentShell from '@/features/join-us/assessment/components/AssessmentShell';
import AssessmentSubmitConfirmModal from '@/features/join-us/assessment/components/AssessmentSubmitConfirmModal';
import QuestionCard from '@/features/join-us/assessment/components/QuestionCard';
import TimedCodingScreen from '@/features/join-us/assessment/components/TimedCodingScreen';
import { motion, AnimatePresence } from 'framer-motion';

/** Maps a roleId (e.g. "backend-junior") to the backend track slug it belongs to. */
function resolveTrackSlug(roleId: string): string | null {
  if (roleId.startsWith('backend')) return 'backend';
  if (roleId.startsWith('growth')) return 'growth-marketing';
  if (roleId.startsWith('manager')) return 'manager';
  return null;
}

function mapResultToStatus(result: AssessmentAttempt['result']): 'pass' | 'fail' | 'review' {
  if (result === 'PASS') return 'pass';
  if (result === 'FAIL') return 'fail';
  return 'review';
}

/** True if the session expired mid-assessment (server returns 401 on every endpoint via requireAuth). */
function isUnauthorized(error: unknown): boolean {
  return error instanceof AssessmentApiError && error.status === 401;
}

/** Sends the candidate back to sign in — matches ProtectedRoute's own unauthenticated redirect. */
function redirectToLogin() {
  window.location.href = '/?login=true';
}

const ANSWER_SAVE_DEBOUNCE_MS = 600;

export default function AssessmentPage() {
  const { roleId = '' } = useParams<{ roleId?: string }>();
  const trackSlug = resolveTrackSlug(roleId);
  const jobOpening = getOpeningById(roleId);

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [config, setConfig] = useState<AssessmentConfig | null>(null);
  const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);

  // Local mirrors of the attempt, hydrated on load and kept in sync with the
  // server via debounced/immediate saves as the candidate answers questions.
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [radioValues, setRadioValues] = useState<Record<string, string>>({});
  const [textValues, setTextValues] = useState<Record<string, string>>({});
  const [bookmarkedQuestionNumbers, setBookmarkedQuestionNumbers] = useState<Set<number>>(
    new Set()
  );

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [focusedQuestionNumber, setFocusedQuestionNumber] = useState(1);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const loadAttempt = useCallback(async () => {
    if (!trackSlug) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const { template, attempt: loadedAttempt } = await AssessmentService.get(trackSlug);
      setConfig(template);
      setAttempt(loadedAttempt);
      setAnswers(loadedAttempt.answers || {});
      setRadioValues(loadedAttempt.radioValues || {});
      setTextValues(loadedAttempt.textValues || {});
      setBookmarkedQuestionNumbers(new Set(loadedAttempt.bookmarks || []));
    } catch (error) {
      if (isUnauthorized(error)) {
        redirectToLogin();
        return;
      }
      if (error instanceof AssessmentApiError && error.status === 404) {
        setNotFound(true);
      } else {
        setLoadError(
          error instanceof Error ? error.message : 'Failed to load the assessment.'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [trackSlug]);

  useEffect(() => {
    loadAttempt();
  }, [loadAttempt]);

  const totalPages = config
    ? config.pages.length + (config.timedCodingConfig ? 1 : 0)
    : 0;
  const isTimedCodingPage =
    !!config?.timedCodingConfig && currentPageIndex === config.pages.length;
  const currentPage = config && !isTimedCodingPage ? config.pages[currentPageIndex] : null;

  const getQuestionByNumber = (qNum: number) => {
    if (!config) return undefined;
    if (config.timedCodingConfig?.question.questionNumber === qNum) {
      return config.timedCodingConfig.question;
    }
    for (const page of config.pages) {
      const found = page.questions.find((q) => q.questionNumber === qNum);
      if (found) return found;
    }
    return undefined;
  };

  const firstQuestionNumberOfPage = (pageIndex: number) => {
    if (!config) return 1;
    if (config.timedCodingConfig && pageIndex === config.pages.length) {
      return config.timedCodingConfig.question.questionNumber;
    }
    return config.pages[pageIndex]?.questions[0]?.questionNumber ?? 1;
  };

  useEffect(() => {
    const el = document.getElementById(`question-${focusedQuestionNumber}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [focusedQuestionNumber, currentPageIndex]);

  const activeQuestion = getQuestionByNumber(focusedQuestionNumber);

  const answeredQuestionNumbers = (() => {
    if (!config) return new Set<number>();
    const answered = new Set<number>();
    config.pages.forEach((p) => {
      p.questions.forEach((q) => {
        const val = answers[q.id];
        if (val && val.trim().length > 0) answered.add(q.questionNumber);
      });
    });
    if (config.timedCodingConfig) {
      const q = config.timedCodingConfig.question;
      const val = answers[q.id];
      if (val && val.trim().length > 0) answered.add(q.questionNumber);
    }
    return answered;
  })();

  const unattemptedQuestionNumbers = config
    ? Array.from({ length: config.totalQuestions }, (_, i) => i + 1).filter(
        (qNum) => !answeredQuestionNumbers.has(qNum)
      )
    : [];

  // Debounced per-question autosave. Anything not yet flushed when the timed
  // section expires is intentionally lost — matches "don't record the last
  // typed answer" for auto-submitted attempts.
  const scheduleSave = (
    questionId: string,
    value: string,
    radioValue?: string,
    textValue?: string
  ) => {
    if (!trackSlug) return;
    if (saveTimers.current[questionId]) clearTimeout(saveTimers.current[questionId]);
    saveTimers.current[questionId] = setTimeout(() => {
      AssessmentService.saveAnswer(trackSlug, questionId, value, radioValue, textValue).catch(
        (error) => {
          if (isUnauthorized(error)) {
            redirectToLogin();
            return;
          }
          setActionError('Failed to save your answer. Please check your connection.');
        }
      );
    }, ANSWER_SAVE_DEBOUNCE_MS);
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    scheduleSave(questionId, value, radioValues[questionId], textValues[questionId]);
  };

  const handleRadioChange = (questionId: string, value: string) => {
    setRadioValues((prev) => ({ ...prev, [questionId]: value }));
    scheduleSave(questionId, answers[questionId] ?? value, value, textValues[questionId]);
  };

  const handleTextChange = (questionId: string, value: string) => {
    setTextValues((prev) => ({ ...prev, [questionId]: value }));
    scheduleSave(questionId, answers[questionId] ?? '', radioValues[questionId], value);
  };

  const handleToggleBookmark = (questionNumber: number) => {
    if (!trackSlug) return;
    const isBookmarked = bookmarkedQuestionNumbers.has(questionNumber);
    setBookmarkedQuestionNumbers((prev) => {
      const next = new Set(prev);
      if (isBookmarked) next.delete(questionNumber);
      else next.add(questionNumber);
      return next;
    });
    AssessmentService.setBookmark(trackSlug, questionNumber, !isBookmarked).catch((error) => {
      if (isUnauthorized(error)) {
        redirectToLogin();
        return;
      }
      setActionError('Failed to save your bookmark.');
    });
  };

  const handleNavigateToQuestion = (qNum: number) => {
    if (!config) return;
    if (config.timedCodingConfig && qNum === config.timedCodingConfig.question.questionNumber) {
      setCurrentPageIndex(config.pages.length);
      setFocusedQuestionNumber(qNum);
      return;
    }
    const targetPageIndex = config.pages.findIndex((page) =>
      page.questions.some((q) => q.questionNumber === qNum)
    );
    if (targetPageIndex !== -1) {
      setCurrentPageIndex(targetPageIndex);
      setFocusedQuestionNumber(qNum);
    }
  };

  const finalizeSubmit = async () => {
    if (!trackSlug) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const updated = await AssessmentService.submit(trackSlug);
      setAttempt(updated);
    } catch (error) {
      if (isUnauthorized(error)) {
        redirectToLogin();
        return;
      }
      // The server may have already auto-submitted this attempt (e.g. the
      // timed section's deadline passed) — fall back to fetching its final state.
      if (error instanceof AssessmentApiError && error.status === 409) {
        try {
          const { attempt: latest } = await AssessmentService.get(trackSlug);
          setAttempt(latest);
        } catch {
          setActionError('Failed to load your assessment result.');
        }
      } else {
        setActionError('Failed to submit your assessment. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const attemptSubmit = () => {
    if (unattemptedQuestionNumbers.length > 0) {
      setShowSubmitConfirm(true);
    } else {
      finalizeSubmit();
    }
  };

  const handleNextPage = async () => {
    if (!config || !trackSlug) return;

    // Leaving the estimate page and entering the timed challenge: submit the
    // estimate first so the server can start the countdown (absolute deadline).
    const timedConfig = config.timedCodingConfig;
    const leavingEstimatePage =
      timedConfig && currentPage?.questions.some((q) => q.id === timedConfig.estimateQuestionId);

    if (leavingEstimatePage && timedConfig) {
      const estimateRaw = answers[timedConfig.estimateQuestionId];
      const estimateMinutes = parseInt(estimateRaw || '0', 10) || 0;
      try {
        const updated = await AssessmentService.submitEstimate(trackSlug, estimateMinutes);
        setAttempt(updated);
      } catch (error) {
        if (isUnauthorized(error)) {
          redirectToLogin();
          return;
        }
        setActionError('Failed to save your time estimate. Please try again.');
        return;
      }
    }

    if (currentPageIndex < totalPages - 1) {
      const nextIndex = currentPageIndex + 1;
      setCurrentPageIndex(nextIndex);
      setFocusedQuestionNumber(firstQuestionNumberOfPage(nextIndex));
    } else {
      attemptSubmit();
    }
  };

  const handlePreviousPage = () => {
    if (currentPageIndex > 0) {
      const prevIndex = currentPageIndex - 1;
      setCurrentPageIndex(prevIndex);
      setFocusedQuestionNumber(firstQuestionNumberOfPage(prevIndex));
    }
  };

  const handleRequestExtension = async () => {
    if (!trackSlug) return;
    try {
      const updated = await AssessmentService.requestExtension(trackSlug);
      setAttempt(updated);
    } catch (error) {
      if (isUnauthorized(error)) {
        redirectToLogin();
        return;
      }
      setActionError("Couldn't grant extra time — you may have already used your extension.");
    }
  };

  // ── Render states ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col justify-center items-center">
        <Loader2 className="w-10 h-10 text-brand-accent animate-spin" />
        <p className="mt-4 font-sans text-brand-secondary text-sm">Loading assessment...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <AssessmentComingSoon
        roleTitle={jobOpening?.roleSubtitle || jobOpening?.title}
        department={jobOpening?.department}
      />
    );
  }

  if (loadError || !config || !attempt) {
    return (
      <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col justify-center items-center px-4 text-center">
        <AlertTriangle className="w-10 h-10 text-red-400" />
        <p className="mt-4 font-sans text-brand-secondary text-sm max-w-md">
          {loadError || 'Something went wrong loading the assessment.'}
        </p>
        <button
          type="button"
          onClick={loadAttempt}
          className="mt-6 px-6 py-3 rounded-xl bg-brand-accent text-brand-bg font-semibold text-sm cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Already submitted (fresh finish, or revisiting the assessment page later —
  // no reattempts are supported, see the note baked into AssessmentResultScreen).
  if (attempt.status === 'SUBMITTED') {
    return (
      <AssessmentResultScreen
        status={mapResultToStatus(attempt.result)}
        roleTitle={jobOpening?.roleSubtitle || config.roleTitle}
      />
    );
  }

  if (isTimedCodingPage && config.timedCodingConfig) {
    const q10Answer = answers[config.timedCodingConfig.estimateQuestionId] || '0';

    return (
      <>
        <AssessmentShell
          roleTitle={jobOpening?.roleSubtitle || config.roleTitle}
          totalQuestions={config.totalQuestions}
          currentQuestionNumber={config.timedCodingConfig.question.questionNumber}
          answeredQuestionNumbers={answeredQuestionNumbers}
          bookmarkedQuestionNumbers={bookmarkedQuestionNumbers}
          activeQuestion={config.timedCodingConfig.question}
          isFirstPage={false}
          isLastPage={true}
          onNavigateToQuestion={handleNavigateToQuestion}
          onPreviousPage={handlePreviousPage}
          onNextPage={attemptSubmit}
          submitButtonText={submitting ? 'Submitting...' : 'Complete Assessment'}
        >
          <TimedCodingScreen
            config={config.timedCodingConfig}
            estimatedMinutesRaw={q10Answer}
            answer={answers[config.timedCodingConfig.question.id] || ''}
            onAnswerChange={(val) =>
              handleAnswerChange(config.timedCodingConfig!.question.id, val)
            }
            onBackToPrevious={handlePreviousPage}
            deadlineAt={attempt.timedDeadlineAt}
            extensionUsed={attempt.extensionUsed}
            onRequestExtension={handleRequestExtension}
            onExpire={finalizeSubmit}
          />
        </AssessmentShell>

        {actionError && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-red-500/15 border border-red-500/40 text-red-300 text-sm px-4 py-2.5 rounded-xl">
            {actionError}
          </div>
        )}

        {showSubmitConfirm && (
          <AssessmentSubmitConfirmModal
            unattemptedQuestionNumbers={unattemptedQuestionNumbers}
            onJumpToQuestion={handleNavigateToQuestion}
            onSubmitAnyway={finalizeSubmit}
            onClose={() => setShowSubmitConfirm(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <AssessmentShell
        roleTitle={jobOpening?.roleSubtitle || config.roleTitle}
        totalQuestions={config.totalQuestions}
        currentQuestionNumber={focusedQuestionNumber}
        answeredQuestionNumbers={answeredQuestionNumbers}
        bookmarkedQuestionNumbers={bookmarkedQuestionNumbers}
        activeQuestion={activeQuestion}
        pagePurpose={currentPage?.purpose}
        submitButtonText={
          submitting
            ? 'Submitting...'
            : currentPage?.submitButtonText || 'Submit and continue to next question'
        }
        isFirstPage={currentPageIndex === 0}
        isLastPage={currentPageIndex === totalPages - 1}
        onNavigateToQuestion={handleNavigateToQuestion}
        onPreviousPage={handlePreviousPage}
        onNextPage={handleNextPage}
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

      {actionError && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-red-500/15 border border-red-500/40 text-red-300 text-sm px-4 py-2.5 rounded-xl">
          {actionError}
        </div>
      )}

      {showSubmitConfirm && (
        <AssessmentSubmitConfirmModal
          unattemptedQuestionNumbers={unattemptedQuestionNumbers}
          onJumpToQuestion={handleNavigateToQuestion}
          onSubmitAnyway={finalizeSubmit}
          onClose={() => setShowSubmitConfirm(false)}
        />
      )}
    </>
  );
}
