/**
 * Which character an OdysseyPlayer represents. Ordered to match the
 * frontend's actual encounter order: Strategist is the mandatory
 * pre-run intro screen every new run passes through
 * (Title -> Strategist -> Map); Knight/Bishop/Rook are the separate
 * in-map champion-select roster shown later, when the player clicks the
 * map's start node.
 */
export enum EPlayerType {
  Strategist = "strategist",
  Knight = "knight",
  Bishop = "bishop",
  Rook = "rook",
}
