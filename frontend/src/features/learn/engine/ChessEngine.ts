import { Chess, type Move } from "chess.js";

export class ChessEngine {
  private chess: Chess;

  constructor(fen: string = "start") {
    this.chess = fen === "start" ? new Chess() : new Chess(fen);
  }

  public getFen(): string {
    return this.chess.fen();
  }

  public setFen(fen: string): void {
    if (fen === "start") {
      this.chess.reset();
      return;
    }
    try {
      this.chess.load(fen);
    } catch {
      // fallback to start if invalid fen
      this.chess.reset();
    }
  }

  /**
   * Attempts a move. If pseudo-legal, returns the move object.
   * Otherwise returns null.
   */
  public attemptMove(sourceSquare: string, targetSquare: string, promotion: string = "q"): Move | null {
    try {
      const move = this.chess.move({
        from: sourceSquare,
        to: targetSquare,
        promotion,
      });
      return move;
    } catch {
      return null;
    }
  }

  /**
   * Returns array of legal target squares for a selected source square.
   */
  public getLegalMoves(square: string): string[] {
    try {
      const moves = this.chess.moves({ square: square as any, verbose: true });
      return moves.map(m => m.to);
    } catch {
      return [];
    }
  }

  public getAscii(): string {
    return this.chess.ascii();
  }
}

