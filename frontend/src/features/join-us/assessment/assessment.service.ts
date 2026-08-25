import rollbar from '@/shared/lib/rollbar';
import type { AssessmentConfig } from './assessmentTypes';

export type AssessmentAttemptStatus = 'IN_PROGRESS' | 'SUBMITTED';
export type AssessmentResultStatus = 'PENDING' | 'PASS' | 'FAIL' | 'REVIEW';

export interface AssessmentAttempt {
  id: string;
  trackSlug: string;
  status: AssessmentAttemptStatus;
  result: AssessmentResultStatus;
  answers: Record<string, string>;
  radioValues: Record<string, string>;
  textValues: Record<string, string>;
  bookmarks: number[];
  estimateMinutes: number | null;
  timedDeadlineAt: string | null;
  extensionUsed: boolean;
  wrongCount: number | null;
  submittedAt: string | null;
}

export interface AssessmentGetResponse {
  template: AssessmentConfig;
  attempt: AssessmentAttempt;
}

export class AssessmentApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function reportServiceError(action: string, error: unknown, context?: Record<string, unknown>) {
  console.error(`[AssessmentApiService.${action}] Error:`, error);
  rollbar.error(error instanceof Error ? error : new Error(String(error)), {
    context: `AssessmentApiService.${action}`,
    ...context,
  });
}

async function parseOrThrow<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new AssessmentApiError(
      res.status,
      json?.message || `Request failed with status ${res.status}`
    );
  }
  return json.data as T;
}

/**
 * AssessmentApiService
 * ---------------------
 * Client-side service for the Join Us candidate assessment feature.
 * All endpoints require an authenticated session cookie. Unlike
 * PathwayProgressApiService, failures are re-thrown (not swallowed) so
 * AssessmentPage can show the candidate a real error instead of silently
 * losing an answer.
 */
export class AssessmentService {
  static async get(trackSlug: string): Promise<AssessmentGetResponse> {
    try {
      const res = await fetch(`/api/assessments/${trackSlug}`, {
        credentials: 'include',
      });
      return await parseOrThrow<AssessmentGetResponse>(res);
    } catch (error) {
      // A 404 here just means the track has no template yet (e.g. Frontend/Design) —
      // expected, not worth paging anyone over.
      if (!(error instanceof AssessmentApiError) || error.status !== 404) {
        reportServiceError('get', error, { trackSlug });
      }
      throw error;
    }
  }

  static async saveAnswer(
    trackSlug: string,
    questionId: string,
    value: string,
    radioValue?: string,
    textValue?: string
  ): Promise<AssessmentAttempt> {
    try {
      const res = await fetch(`/api/assessments/${trackSlug}/answer`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, value, radioValue, textValue }),
      });
      return await parseOrThrow<AssessmentAttempt>(res);
    } catch (error) {
      reportServiceError('saveAnswer', error, { trackSlug, questionId });
      throw error;
    }
  }

  static async setBookmark(
    trackSlug: string,
    questionNumber: number,
    bookmarked: boolean
  ): Promise<AssessmentAttempt> {
    try {
      const res = await fetch(`/api/assessments/${trackSlug}/bookmark`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionNumber, bookmarked }),
      });
      return await parseOrThrow<AssessmentAttempt>(res);
    } catch (error) {
      reportServiceError('setBookmark', error, { trackSlug });
      throw error;
    }
  }

  static async submitEstimate(
    trackSlug: string,
    estimateMinutes: number
  ): Promise<AssessmentAttempt> {
    try {
      const res = await fetch(`/api/assessments/${trackSlug}/estimate`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estimateMinutes }),
      });
      return await parseOrThrow<AssessmentAttempt>(res);
    } catch (error) {
      reportServiceError('submitEstimate', error, { trackSlug });
      throw error;
    }
  }

  static async requestExtension(trackSlug: string): Promise<AssessmentAttempt> {
    try {
      const res = await fetch(`/api/assessments/${trackSlug}/extend-time`, {
        method: 'POST',
        credentials: 'include',
      });
      return await parseOrThrow<AssessmentAttempt>(res);
    } catch (error) {
      reportServiceError('requestExtension', error, { trackSlug });
      throw error;
    }
  }

  static async submit(trackSlug: string): Promise<AssessmentAttempt> {
    try {
      const res = await fetch(`/api/assessments/${trackSlug}/submit`, {
        method: 'POST',
        credentials: 'include',
      });
      return await parseOrThrow<AssessmentAttempt>(res);
    } catch (error) {
      reportServiceError('submit', error, { trackSlug });
      throw error;
    }
  }
}
