/**
 * Facade for the ACS. Other domains depend on this and never on internals.
 *
 * Loop: trigger → detection → flags → escalation → case → decision
 *       → penalty + compensation → appeal → feedback → policy change
 *
 * Every hook is fire-and-forget. The ACS must never delay a move, hold a clock,
 * or change a result — an anti-cheat system that can break games is a bigger
 * liability than the cheating it prevents.
 *
 * Gated behind ANTICHEAT_ENABLED (default false), following MULTIPLAYER_ENABLED.
 */

import type { DetectionOutcome, EventType, ReviewCase, Situation } from "./types.js";
import type { DetectionEngine } from "./detection/DetectionEngine.js";
import type { TriggerScheduler } from "./detection/TriggerScheduler.js";
import type { PenaltyManager } from "./penalty/PenaltyManager.js";
import type { EscalationLadder } from "./penalty/EscalationLadder.js";
import type { CompensationManager } from "./compensation/CompensationManager.js";
import type { CaseManager } from "./review/CaseManager.js";
import type { AppealService } from "./review/AppealService.js";
import type { ReportService } from "./public/ReportService.js";
import type { EligibilityService } from "./public/EligibilityService.js";
import type { PolicyRegistry } from "./feedback/PolicyRegistry.js";
import type { EffectivenessReview } from "./feedback/EffectivenessReview.js";

export interface AntiCheatSystemDeps {
  readonly detection: DetectionEngine;
  readonly triggers: TriggerScheduler;
  readonly penalties: PenaltyManager;
  readonly escalation: EscalationLadder;
  readonly compensation: CompensationManager;
  readonly cases: CaseManager;
  readonly appeals: AppealService;
  readonly reports: ReportService;
  readonly eligibility: EligibilityService;
  readonly policy: PolicyRegistry;
  readonly feedback: EffectivenessReview;
}

export class AntiCheatSystem {
  constructor(private readonly deps: AntiCheatSystemDeps) {}

  /** False disables every hook below. */
  isEnabled(): boolean {
    throw new Error("Not implemented");
  }

  // ── Hooks called by other domains ──────────────────────────────────────────

  /** Called by Session per ply. Must not throw into the game loop or block the move. */
  onMovePlayed(gameSessionId: string, userId: string, ply: number): void {
    throw new Error("Not implemented");
  }

  onGameCompleted(gameRecordId: string): void {
    throw new Error("Not implemented");
  }

  onTournamentRoundCompleted(tournamentId: string, round: number): void {
    throw new Error("Not implemented");
  }

  /** The one hook allowed to block — see EligibilityService. */
  checkEventEligibility(userId: string, eventType: EventType): Promise<boolean> {
    throw new Error("Not implemented");
  }

  // ── The loop ───────────────────────────────────────────────────────────────

  processOutcome(outcome: DetectionOutcome): Promise<ReviewCase | null> {
    throw new Error("Not implemented");
  }

  resolveCase(caseId: string): Promise<ReviewCase> {
    throw new Error("Not implemented");
  }

  resolveSituation(userId: string, eventType: EventType): Promise<Situation> {
    throw new Error("Not implemented");
  }

  // ── Module access for internal surfaces ────────────────────────────────────

  /** Admin case queue. Internal callers only. */
  get cases(): CaseManager {
    throw new Error("Not implemented");
  }

  get reports(): ReportService {
    throw new Error("Not implemented");
  }

  get appeals(): AppealService {
    throw new Error("Not implemented");
  }
}
