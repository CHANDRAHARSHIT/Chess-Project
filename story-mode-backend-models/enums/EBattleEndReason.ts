export enum EBattleEndReason {
  Checkmate = "checkmate",
  Timeout = "timeout",
  /** Stalemate, insufficient material, repetition, etc. — all counted as EBattleResult.Defeat in story mode. */
  Draw = "draw",
}
