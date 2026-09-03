/**
 * Stylistic fingerprint of a player: historical profile vs current-game profile.
 *
 * Useful against Type 3 — an expert cheater shapes accuracy and timing, but the
 * engine is choosing the moves and has its own taste.
 *
 * Spec constraint: a deviation is NEVER cheating on its own. Players legitimately
 * study, improve, and change style.
 */

/** Axes normalised 0–1 so historical and current-game profiles compare directly. */
export interface PersonalityProfile {
  readonly userId: string;
  /** 0 = tactical, 1 = positional. */
  readonly positionalPreference: number;
  /** 0 = defensive, 1 = aggressive. */
  readonly aggression: number;
  readonly openingRepertoire: Readonly<Record<string, number>>;
  readonly pawnStructures: Readonly<Record<string, number>>;
  /** 0 = maintains complexity, 1 = simplifies. */
  readonly simplificationTendency: number;
  readonly tradingTendency: number;
  readonly kingSafetyTendency: number;
  /** 0 = risk-averse, 1 = risk-seeking. */
  readonly riskTolerance: number;
  readonly endgamePreference: number;
  readonly sampleGameCount: number;
  readonly computedAt: Date;
}

export interface PersonalityDeviation {
  readonly axis: keyof PersonalityProfile;
  readonly historicalValue: number;
  readonly currentValue: number;
  /** In standard deviations of the user's own historical variance. */
  readonly sigmaDeviation: number;
}

export class PlayingPersonalityService {
  /**
   * Must exclude games tied to confirmed violations — otherwise a cheater's
   * assisted games become the baseline they're later measured against.
   */
  buildHistoricalProfile(userId: string): Promise<PersonalityProfile> {
    throw new Error("Not implemented");
  }

  computeCurrentGameProfile(userId: string, gameRecordId: string): Promise<PersonalityProfile> {
    throw new Error("Not implemented");
  }

  compare(
    historical: PersonalityProfile,
    current: PersonalityProfile
  ): readonly PersonalityDeviation[] {
    throw new Error("Not implemented");
  }

  /** Comparing against a 4-game history produces noise, not evidence. */
  hasSufficientHistory(profile: PersonalityProfile): boolean {
    throw new Error("Not implemented");
  }
}
