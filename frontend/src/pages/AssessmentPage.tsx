import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router";
import { AlertTriangle, Lock } from "lucide-react";
import {
  AssessmentService,
  AssessmentApiError,
  type AssessmentAttempt,
} from "@/services/joinus-assessment.service";
import type { AssessmentConfig } from "@/types/joinus-assessmentTypes";
import AssessmentComingSoon from "@/components/joinus-AssessmentComingSoon";
import AssessmentSkeleton from "@/components/joinus-AssessmentSkeleton";
import AssessmentResultScreen from "@/components/joinus-AssessmentResultScreen";
import AssessmentAlreadyCompleteScreen from "@/components/joinus-AssessmentAlreadyCompleteScreen";
import AssessmentShell from "@/components/joinus-AssessmentShell";
import AssessmentSubmitConfirmModal from "@/components/joinus-AssessmentSubmitConfirmModal";
import TimedSectionWarningModal from "@/components/joinus-TimedSectionWarningModal";
import QuestionCard from "@/components/joinus-QuestionCard";
import TimedCodingScreen from "@/components/joinus-TimedCodingScreen";
import { motion, AnimatePresence } from "framer-motion";

const KNOWN_TRACK_SLUGS = new Set(["backend", "growth-marketing", "manager"]);

function humanizeRole(role: string): string {
  return role
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function mapResultToStatus(
  result: AssessmentAttempt["result"],
): "pass" | "fail" | "review" {
  if (result === "PASS") return "pass";
  if (result === "FAIL") return "fail";
  return "review";
}

/** True if the session expired mid-assessment (server returns 401 on every endpoint via requireAuth). */
function isUnauthorized(error: unknown): boolean {
  return error instanceof AssessmentApiError && error.status === 401;
}

/** Sends the candidate back to sign in — matches ProtectedRoute's own unauthenticated redirect. */
function redirectToLogin() {
  window.location.href = "/?login=true";
}

const ANSWER_SAVE_DEBOUNCE_MS = 600;
const TOAST_AUTO_DISMISS_MS = 10_000;

export default function AssessmentPage() {
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "";
  const trackSlug = KNOWN_TRACK_SLUGS.has(role) ? role : null;

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [config, setConfig] = useState<AssessmentConfig | null>(null);
  const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);
  // True only once this session has actively submitted — distinguishes the
  // fresh congratulations/thank-you screen from a later revisit to an
  // already-submitted attempt (which shows AssessmentAlreadyCompleteScreen).
  const [justSubmitted, setJustSubmitted] = useState(false);

  // Local mirrors of the attempt, hydrated on load and kept in sync with the
  // server via debounced/immediate saves as the candidate answers questions.
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [radioValues, setRadioValues] = useState<Record<string, string>>({});
  const [textValues, setTextValues] = useState<Record<string, string>>({});
  const [bookmarkedQuestionNumbers, setBookmarkedQuestionNumbers] = useState<
    Set<number>
  >(new Set());

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [focusedQuestionNumber, setFocusedQuestionNumber] = useState(1);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Covers the brief async wait when leaving the estimate page (submitting
  // the estimate to the server before advancing) so the button doesn't look
  // frozen for that round trip.
  const [pageTransitioning, setPageTransitioning] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  // Shown when the candidate clicks the locked Q11 nav pill before an
  // estimate exists — distinct from actionError (red/failure) since this
  // isn't a failure, just a nudge back to Q10.
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  // Loading state for the "I'm Ready — Start the Timer" button on the Q11
  // entry-warning modal, while startTimedSection's round trip is in flight.
  const [startingTimedSection, setStartingTimedSection] = useState(false);

  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Banners/toasts must be opaque (never semi-transparent — overlapping ones
  // become unreadable) and self-dismiss after 10s.
  useEffect(() => {
    if (!actionError) return;
    const timer = setTimeout(() => setActionError(null), TOAST_AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [actionError]);

  useEffect(() => {
    if (!noticeMessage) return;
    const timer = setTimeout(
      () => setNoticeMessage(null),
      TOAST_AUTO_DISMISS_MS,
    );
    return () => clearTimeout(timer);
  }, [noticeMessage]);

  const loadAttempt = useCallback(async () => {
    if (!trackSlug) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const { template, attempt: loadedAttempt } =
        await AssessmentService.get(trackSlug);
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
          error instanceof Error
            ? error.message
            : "Failed to load the assessment.",
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
  const currentPage =
    config && !isTimedCodingPage ? config.pages[currentPageIndex] : null;

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

  // Safety net: if this page is somehow reached without a submitted Q10
  // estimate (e.g. a stale bookmark/back-forward nav), bounce back to the
  // previous page rather than rendering Q11 unlocked. Inlined instead of
  // calling handlePreviousPage (declared later) to avoid a TDZ reference.
  useEffect(() => {
    if (
      !(
        isTimedCodingPage &&
        attempt &&
        attempt.estimateMinutes == null &&
        currentPageIndex > 0
      )
    ) {
      return;
    }
    const prevIndex = currentPageIndex - 1;
    const timer = setTimeout(() => {
      setCurrentPageIndex(prevIndex);
      setFocusedQuestionNumber(firstQuestionNumberOfPage(prevIndex));
    }, 0);
    return () => clearTimeout(timer);
  }, [isTimedCodingPage, attempt, currentPageIndex]);

  useEffect(() => {
    const el = document.getElementById(`question-${focusedQuestionNumber}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [focusedQuestionNumber, currentPageIndex]);

  const activeQuestion = getQuestionByNumber(focusedQuestionNumber);

  const answeredQuestionNumbers = (() => {
    if (!config) return new Set<number>();
    const answered = new Set<number>();
    config.pages.forEach((p) => {
      p.questions.forEach((q) => {
        const val = answers[q.id];
        if (
          val &&
          val.trim().length > 0 &&
          (!q.prefillValue || val.trim() !== q.prefillValue.trim())
        ) {
          answered.add(q.questionNumber);
        }
      });
    });
    if (config.timedCodingConfig) {
      const q = config.timedCodingConfig.question;
      const val = answers[q.id];
      if (
        val &&
        val.trim().length > 0 &&
        (!q.prefillValue || val.trim() !== q.prefillValue.trim())
      ) {
        answered.add(q.questionNumber);
      }
    }
    return answered;
  })();

  const unattemptedQuestionNumbers = config
    ? Array.from({ length: config.totalQuestions }, (_, i) => i + 1).filter(
        (qNum) => !answeredQuestionNumbers.has(qNum),
      )
    : [];

  // Lock Q11 before a Q10 estimate is submitted. Once estimate exists, all questions can be navigated.
  const lockedQuestionNumbers = (() => {
    const locked = new Set<number>();
    if (!config?.timedCodingConfig) return locked;
    const timedQNum = config.timedCodingConfig.question.questionNumber;

    if (attempt?.estimateMinutes == null) {
      locked.add(timedQNum);
      return locked;
    }

    return locked;
  })();

  // Backoff schedule (ms) between retries for a save that fails at the
  // network level (not a real server rejection). Spread out to comfortably
  // absorb a slow/cold-starting backend or a brief network blip — a single
  // 800ms retry wasn't enough for that, which is why some candidates saw
  // "check your connection" on a perfectly fine connection: the backend
  // just hadn't finished waking up yet by the time we gave up.
  const RETRY_DELAYS_MS = [1000, 3000, 6000];

  /**
   * Saves an answer, retrying on what looks like a transient network/cold-start
   * hiccup before actually telling the candidate anything failed. A real
   * server-rejected error (e.g. word-limit validation) is shown verbatim
   * instead of a generic "check your connection" — that message should only
   * ever appear after every retry has genuinely failed to reach the server.
   */
  const saveWithRetry = (fn: () => Promise<unknown>, attemptsMade = 0) => {
    fn().catch((error) => {
      if (isUnauthorized(error)) {
        redirectToLogin();
        return;
      }
      if (error instanceof AssessmentApiError) {
        setActionError(error.message);
        return;
      }
      if (attemptsMade < RETRY_DELAYS_MS.length) {
        setTimeout(
          () => saveWithRetry(fn, attemptsMade + 1),
          RETRY_DELAYS_MS[attemptsMade],
        );
        return;
      }
      setActionError(
        "Failed to save your answer. Please check your connection.",
      );
    });
  };

  // Debounced per-question autosave. Anything not yet flushed when the timed
  // section expires is intentionally lost — matches "don't record the last
  // typed answer" for auto-submitted attempts.
  const scheduleSave = (
    questionId: string,
    value: string,
    radioValue?: string,
    textValue?: string,
  ) => {
    if (!trackSlug) return;
    if (saveTimers.current[questionId])
      clearTimeout(saveTimers.current[questionId]);
    saveTimers.current[questionId] = setTimeout(() => {
      saveWithRetry(() =>
        AssessmentService.saveAnswer(
          trackSlug,
          questionId,
          value,
          radioValue,
          textValue,
        ),
      );
    }, ANSWER_SAVE_DEBOUNCE_MS);
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    scheduleSave(
      questionId,
      value,
      radioValues[questionId],
      textValues[questionId],
    );
  };

  const handleRadioChange = (questionId: string, value: string) => {
    setRadioValues((prev) => ({ ...prev, [questionId]: value }));
    scheduleSave(
      questionId,
      answers[questionId] ?? value,
      value,
      textValues[questionId],
    );
  };

  const handleTextChange = (questionId: string, value: string) => {
    setTextValues((prev) => ({ ...prev, [questionId]: value }));
    scheduleSave(
      questionId,
      answers[questionId] ?? "",
      radioValues[questionId],
      value,
    );
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
    saveWithRetry(() =>
      AssessmentService.setBookmark(trackSlug, questionNumber, !isBookmarked),
    );
  };

  const handleNavigateToQuestion = (qNum: number) => {
    if (!config) return;
    const timedConfig = config.timedCodingConfig;
    const isTimedQuestion =
      !!timedConfig && qNum === timedConfig.question.questionNumber;

    // Clicking the locked Q11 pill before an estimate exists doesn't just
    // no-op — it sends the candidate to Q10 and tells them what to do.
    if (isTimedQuestion && timedConfig && attempt?.estimateMinutes == null) {
      const q10PageIndex = config.pages.findIndex((page) =>
        page.questions.some((q) => q.id === timedConfig.estimateQuestionId),
      );
      if (q10PageIndex !== -1) {
        const q10Question = config.pages[q10PageIndex].questions.find(
          (q) => q.id === timedConfig.estimateQuestionId,
        );
        setCurrentPageIndex(q10PageIndex);
        setFocusedQuestionNumber(
          q10Question?.questionNumber ??
            firstQuestionNumberOfPage(q10PageIndex),
        );
      }
      setNoticeMessage(
        "Question 11 is locked. Enter and submit your time estimate on Question 10 first.",
      );
      return;
    }

    // Direct-navigation guard, mirroring the disabled nav buttons — belt
    // and suspenders against any other path (e.g. a stale click) trying to
    // jump to a question locked because Q11's timer is currently running.
    if (lockedQuestionNumbers.has(qNum)) return;

    if (isTimedQuestion) {
      setCurrentPageIndex(config.pages.length);
      setFocusedQuestionNumber(qNum);
      return;
    }
    const targetPageIndex = config.pages.findIndex((page) =>
      page.questions.some((q) => q.questionNumber === qNum),
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
      setJustSubmitted(true);
    } catch (error) {
      if (isUnauthorized(error)) {
        redirectToLogin();
        return;
      }
      // The server may have already auto-submitted this attempt — fall back
      // to fetching its final state (this is not "just submitted" by this
      // session, so it'll correctly show the Already Complete screen).
      if (error instanceof AssessmentApiError && error.status === 409) {
        try {
          const { attempt: latest } = await AssessmentService.get(trackSlug);
          setAttempt(latest);
        } catch {
          setActionError("Failed to load your assessment result.");
        }
      } else {
        setActionError("Failed to submit your assessment. Please try again.");
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
      timedConfig &&
      currentPage?.questions.some(
        (q) => q.id === timedConfig.estimateQuestionId,
      );

    if (leavingEstimatePage && timedConfig) {
      const estimateRaw = answers[timedConfig.estimateQuestionId];
      const estimateMinutes = parseInt(estimateRaw || "0", 10) || 0;
      setPageTransitioning(true);
      try {
        const updated = await AssessmentService.submitEstimate(
          trackSlug,
          estimateMinutes,
        );
        setAttempt(updated);
      } catch (error) {
        if (isUnauthorized(error)) {
          redirectToLogin();
          return;
        }
        setActionError("Failed to save your time estimate. Please try again.");
        return;
      } finally {
        setPageTransitioning(false);
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

  // Fires when the candidate confirms the "timer starts now" warning on
  // Q11 — stamps the server-side deadline for the first time. A no-op on
  // the server if it's already been started, so this is safe to fire at
  // most once per attempt from the UI's perspective.
  const handleStartTimedSection = async () => {
    if (!trackSlug) return;
    setStartingTimedSection(true);
    setActionError(null);
    try {
      const updated = await AssessmentService.startTimedSection(trackSlug);
      setAttempt(updated);
    } catch (error) {
      if (isUnauthorized(error)) {
        redirectToLogin();
        return;
      }
      setActionError("Failed to start the timed question. Please try again.");
    } finally {
      setStartingTimedSection(false);
    }
  };

  // ── Render states ─────────────────────────────────────────────────────
  if (loading) {
    return <AssessmentSkeleton />;
  }

  if (notFound) {
    return (
      <AssessmentComingSoon roleTitle={role ? humanizeRole(role) : undefined} />
    );
  }

  if (loadError || !config || !attempt) {
    return (
      <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col justify-center items-center px-4 text-center">
        <AlertTriangle className="w-10 h-10 text-red-400" />
        <p className="mt-4 font-sans text-brand-secondary text-sm max-w-md">
          {loadError || "Something went wrong loading the assessment."}
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

  if (attempt.status === "SUBMITTED") {
    if (justSubmitted) {
      return (
        <AssessmentResultScreen
          status={mapResultToStatus(attempt.result)}
          roleTitle={config.roleTitle}
        />
      );
    }
    return (
      <AssessmentAlreadyCompleteScreen
        result={attempt.result}
        submittedAt={attempt.submittedAt}
      />
    );
  }

  if (isTimedCodingPage && config.timedCodingConfig) {
    // Once locked in, the server's estimateMinutes is the source of truth —
    // never the (still-editable-until-locked) local Q10 answer, which could
    // otherwise drift from what the deadline was actually computed from.
    const q10Answer =
      attempt.estimateMinutes != null
        ? String(attempt.estimateMinutes)
        : answers[config.timedCodingConfig.estimateQuestionId] || "0";

    // An estimate over the template's limit is a dead end (TimedCodingScreen
    // renders its own "exceeds limit" screen, no countdown involved) — the
    // "timer starts now" warning only applies to the real timed challenge.
    const exceedsEstimateLimit =
      attempt.estimateMinutes != null &&
      attempt.estimateMinutes > config.timedCodingConfig.maxEstimateMinutes;
    const timerNotYetStarted =
      attempt.timedSectionStartedAt == null && !exceedsEstimateLimit;

    return (
      <>
        <AssessmentShell
          roleTitle={config.roleTitle}
          totalQuestions={config.totalQuestions}
          currentQuestionNumber={
            config.timedCodingConfig.question.questionNumber
          }
          answeredQuestionNumbers={answeredQuestionNumbers}
          bookmarkedQuestionNumbers={bookmarkedQuestionNumbers}
          lockedQuestionNumbers={lockedQuestionNumbers}
          activeQuestion={config.timedCodingConfig.question}
          isFirstPage={false}
          previousDisabled={false}
          isLastPage={true}
          onNavigateToQuestion={handleNavigateToQuestion}
          onPreviousPage={handlePreviousPage}
          onNextPage={attemptSubmit}
          submitButtonText={
            submitting ? "Submitting..." : "Complete Assessment"
          }
        >
          {timerNotYetStarted ? (
            <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-brand-accent/15 border border-brand-accent/30 flex items-center justify-center">
                <Lock className="w-8 h-8 text-brand-accent" />
              </div>
              <h2 className="text-xl font-display font-bold text-brand-text">
                Timed Question Locked
              </h2>
              <p className="text-brand-secondary text-sm">
                Confirm you're ready to begin in the dialog above — the timer
                starts the moment you do.
              </p>
            </div>
          ) : (
            <TimedCodingScreen
              config={config.timedCodingConfig}
              estimatedMinutesRaw={q10Answer}
              answer={answers[config.timedCodingConfig.question.id] || ""}
              onAnswerChange={(val) =>
                handleAnswerChange(config.timedCodingConfig!.question.id, val)
              }
              onBackToPrevious={handlePreviousPage}
              deadlineAt={attempt.timedDeadlineAt}
            />
          )}
        </AssessmentShell>

        {timerNotYetStarted && (
          <TimedSectionWarningModal
            estimatedMinutes={attempt.estimateMinutes ?? 0}
            onGoBack={handlePreviousPage}
            onProceed={handleStartTimedSection}
            proceeding={startingTimedSection}
          />
        )}

        {actionError && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 border border-red-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg">
            {actionError}
          </div>
        )}

        {noticeMessage && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-brand-accent text-brand-bg text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg">
            {noticeMessage}
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
        roleTitle={config.roleTitle}
        totalQuestions={config.totalQuestions}
        currentQuestionNumber={focusedQuestionNumber}
        answeredQuestionNumbers={answeredQuestionNumbers}
        bookmarkedQuestionNumbers={bookmarkedQuestionNumbers}
        lockedQuestionNumbers={lockedQuestionNumbers}
        activeQuestion={activeQuestion}
        pagePurpose={currentPage?.purpose}
        submitButtonText={
          submitting
            ? "Submitting..."
            : pageTransitioning
              ? "Saving..."
              : currentPage?.submitButtonText || "Next"
        }
        isFirstPage={currentPageIndex === 0}
        previousDisabled={false}
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
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="space-y-6"
          >
            {currentPage?.questions.map((q) => {
              // The time estimate (Q10) stays editable up until the timed
              // section actually starts (see submitEstimate) — only once
              // timedSectionStartedAt is set does the server stop accepting
              // changes, so that's the only thing that should lock this
              // input too. Locking on estimateMinutes alone would strand a
              // candidate who clicked "Go Back" on the Q11 warning modal
              // with no way to revise their estimate.
              const isEstimateQuestion =
                config.timedCodingConfig?.estimateQuestionId === q.id;
              const isEstimateLocked =
                isEstimateQuestion && attempt.timedSectionStartedAt != null;
              const displayAnswer = isEstimateLocked
                ? String(attempt.estimateMinutes)
                : answers[q.id] !== undefined
                  ? answers[q.id]
                  : q.prefillValue || "";

              return (
                <QuestionCard
                  key={q.id}
                  question={q}
                  totalQuestions={config.totalQuestions}
                  answer={displayAnswer}
                  onAnswerChange={(val) => handleAnswerChange(q.id, val)}
                  isBookmarked={bookmarkedQuestionNumbers.has(q.questionNumber)}
                  onToggleBookmark={() =>
                    handleToggleBookmark(q.questionNumber)
                  }
                  radioValue={radioValues[q.id] || ""}
                  textValue={textValues[q.id] || ""}
                  onRadioValueChange={(val) => handleRadioChange(q.id, val)}
                  onTextValueChange={(val) => handleTextChange(q.id, val)}
                  disabled={isEstimateLocked}
                  disabledNote="Your estimate has been locked in and can't be changed."
                />
              );
            })}
          </motion.div>
        </AnimatePresence>
      </AssessmentShell>

      {actionError && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 border border-red-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg">
          {actionError}
        </div>
      )}

      {noticeMessage && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-brand-accent text-brand-bg text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg">
          {noticeMessage}
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
