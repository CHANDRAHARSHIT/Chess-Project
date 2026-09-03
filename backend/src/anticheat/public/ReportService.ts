/**
 * User-submitted reports of suspected cheating.
 *
 * Replaces the current path: ReportForm.tsx POSTs to web3forms.com, so reports
 * never reach our database and can't be queried, assigned, or answered.
 *
 * A report is a trigger, not evidence. Players report opponents who beat them,
 * and treating report volume as signal would let a group coordinate a ban.
 */

import type { Situation, TriggerPoint } from "../types.js";

export type ReportCategory =
  | "engine_assistance"
  | "rating_manipulation"
  | "account_sharing"
  | "sandbagging"
  | "other";

export type ReportStatus = "received" | "queued_for_analysis" | "linked_to_case" | "dismissed";

export interface CheatReport {
  readonly reportId: string;
  readonly reporterUserId: string;
  readonly reportedUserId: string;
  readonly category: ReportCategory;
  readonly gameRecordIds: readonly string[];
  readonly description: string;
  readonly status: ReportStatus;
  readonly submittedAt: Date;
  readonly linkedCaseId?: string;
}

export class ReportService {
  /** Rate-limited per reporter — without a limit, mass reporting is a harassment vector. */
  submitReport(
    reporterUserId: string,
    reportedUserId: string,
    category: ReportCategory,
    description: string,
    gameRecordIds: readonly string[]
  ): Promise<CheatReport> {
    throw new Error("Not implemented");
  }

  toTrigger(report: CheatReport): TriggerPoint {
    throw new Error("Not implemented");
  }

  /** Corroboration is worth prioritising. It is still not evidence. */
  correlateReports(reportedUserId: string): Promise<readonly CheatReport[]> {
    throw new Error("Not implemented");
  }

  /** Prioritises analysis order only — never weights a detection score. */
  getReporterAccuracy(reporterUserId: string): Promise<number> {
    throw new Error("Not implemented");
  }

  /** Minimal by design: revealing the outcome would leak moderation and hand them a probe. */
  getReportStatus(reportId: string, reporterUserId: string): Promise<ReportStatus> {
    throw new Error("Not implemented");
  }

  listReports(status?: ReportStatus): Promise<readonly CheatReport[]> {
    throw new Error("Not implemented");
  }

  dismissReport(reportId: string, reason: string): Promise<CheatReport> {
    throw new Error("Not implemented");
  }

  resolveSituation(report: CheatReport): Promise<Situation> {
    throw new Error("Not implemented");
  }
}
