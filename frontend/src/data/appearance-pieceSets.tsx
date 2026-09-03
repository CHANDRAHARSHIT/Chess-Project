/**
 * pieceSets.tsx
 *
 * Defines the set of piece styles a player can choose from on the
 * Settings → Board & Pieces → Pieces tab.
 *
 * Each entry is a `PieceRenderObject` — the same shape react-chessboard's
 * `options.pieces` prop expects (a map of "wP" / "bK" / etc. to a render
 * function). That means a set defined here can be dropped straight onto
 * any <Chessboard /> in the app via `options.pieces = pieceSet.pieces`.
 *
 * "Classic" reuses react-chessboard's own bundled piece artwork so we're not
 * shipping/duplicating any third-party artwork ourselves. "Maestro" is a
 * user-supplied SVG asset set — static SVG files under
 * `frontend/public/pieces/maestro/` (one per piece code), rendered via
 * plain <img> tags rather than any inline/hand-drawn markup.
 *
 * Only two sets for now — more can be added here later without touching
 * any component that consumes `useBoardSettings()`.
 */
import { defaultPieces } from "react-chessboard";
import type { PieceRenderObject } from "react-chessboard";

export interface PieceSetDef {
  id: string;
  name: string;
  pieces: PieceRenderObject;
}

const PIECE_CODES = ["K", "Q", "R", "B", "N", "P"] as const;
const COLORS = ["w", "b"] as const;

function buildMaestroPieces(): PieceRenderObject {
  const pieces: PieceRenderObject = {};

  COLORS.forEach((color) => {
    PIECE_CODES.forEach((type) => {
      const code = `${color}${type}`;

      pieces[code] = (props) => (
        <img
          src={`/pieces/maestro/${code}.svg`}
          alt={code}
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            pointerEvents: "none",
            userSelect: "none",
            ...props?.svgStyle,
          }}
        />
      );
    });
  });

  return pieces;
}

export const PIECE_SETS: PieceSetDef[] = [
  { id: "classic", name: "Classic", pieces: defaultPieces },
  { id: "maestro", name: "Maestro", pieces: buildMaestroPieces() },
];

export const DEFAULT_PIECE_SET_ID = PIECE_SETS[0].id;
