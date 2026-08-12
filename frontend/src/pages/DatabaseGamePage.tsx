import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { Chess } from "chess.js";
import {
  ArrowLeft,
  Info,
  ChevronLeft,
  ChevronRight,
  FastForward,
  Rewind,
  Compass,
} from "lucide-react";
import { ThemedChessboard } from "@/shared/ui/ThemedChessboard";
import { BoardCoordinates } from "@/shared/ui/BoardCoordinates";

import { useStockfish } from "@/shared/hooks/useStockfish";
import { MOCK_GAMES } from "@/features/database/mockGames";

type Tab = "Moves" | "Info";

export default function DatabaseGamePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const game = useMemo(() => MOCK_GAMES.find((g) => g.id === Number(id)), [id]);

  const [activeTab, setActiveTab] = useState<Tab>("Moves");
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const isAnalyzing = false; // Fixed to false as analysis toggle was removed

  // Initialize chess instance and parse history
  const { history } = useMemo(() => {
    const c = new Chess();
    if (game?.pgn) {
      c.loadPgn(game.pgn);
    }
    return { chess: c, history: c.history({ verbose: true }) };
  }, [game?.pgn]);

  // Compute FEN for the current move index
  const currentFen = useMemo(() => {
    const tempChess = new Chess();
    for (let i = 0; i <= currentMoveIndex; i++) {
      if (history[i]) {
        tempChess.move(history[i]);
      }
    }
    return tempChess.fen();
  }, [currentMoveIndex, history]);

  // Stockfish hook
  const { analyzePosition, stopSearch, terminateWorker } = useStockfish();

  // Trigger analysis when move changes and analysis is enabled
  useEffect(() => {
    if (isAnalyzing) {
      analyzePosition(currentFen);
    } else {
      stopSearch();
    }
  }, [currentFen, isAnalyzing, analyzePosition, stopSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      terminateWorker();
    };
  }, [terminateWorker]);

  if (!game) {
    return (
      <div className="min-h-screen bg-brand-bg text-brand-text flex items-center justify-center">
        Game not found
      </div>
    );
  }

  // Navigation handlers
  const handleFirstMove = () => setCurrentMoveIndex(-1);
  const handlePrevMove = () =>
    setCurrentMoveIndex((prev) => Math.max(-1, prev - 1));
  const handleNextMove = () =>
    setCurrentMoveIndex((prev) => Math.min(history.length - 1, prev + 1));
  const handleLastMove = () => setCurrentMoveIndex(history.length - 1);

  const handleMoveClick = (index: number) => {
    setCurrentMoveIndex(index);
  };

  // Group history into move pairs for rendering
  const movePairs = [];
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: history[i],
      whiteIndex: i,
      black: history[i + 1] || null,
      blackIndex: i + 1,
    });
  }

  const whiteWon = game.result === "1-0";
  const blackWon = game.result === "0-1";

  return (
    <div className="md:h-[calc(100vh-64px)] min-h-[calc(100vh-64px)] bg-brand-surface text-brand-text font-sans flex flex-col w-full relative overflow-y-auto md:overflow-hidden">
      <div className="flex-1 flex flex-col md:flex-row w-full md:h-full md:overflow-hidden">
        {/* Left Area (Board & Players) */}
        <div className="md:flex-1 flex flex-col items-center justify-center p-4 lg:p-8 relative bg-brand-surface shrink-0">
          {/* Back Navigation */}
          <div className="w-full max-w-[70vh] mb-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm text-brand-secondary hover:text-brand-text transition-colors cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              Back to Games
            </button>
          </div>

          <div className="w-full max-w-[70vh] flex flex-col items-center">
            {/* Top Player (Black) */}
            <div className="w-full flex items-center justify-between mb-3 bg-transparent p-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded overflow-hidden flex items-center justify-center">
                  <img
                    src="/logo-without-text.png"
                    className="w-6 h-6 opacity-50"
                  />
                </div>
                <span className="font-semibold text-lg">{game.black}</span>
              </div>
            </div>

            {/* Board Area */}
            <div className="flex w-full relative items-stretch">
              {/* Chessboard */}
              <div className="flex-1 aspect-square overflow-hidden border-[3px] border-brand-border rounded-sm relative">
                <ThemedChessboard
                  options={{
                    position: currentFen,
                    showNotation: false,
                    animationDurationInMs: 200,
                  }}
                />
                <BoardCoordinates boardOrientation="white" />
              </div>
            </div>

            {/* Bottom Player (White) */}
            <div className="w-full flex items-center justify-between mt-3 bg-transparent p-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 overflow-hidden rounded bg-white/10">
                  <img
                    src={
                      game.white.includes("Kasparov")
                        ? "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Garri_Kasparow_%2818776605665%29_%28cropped%29_2.jpg/500px-Garri_Kasparow_%2818776605665%29_%28cropped%29_2.jpg"
                        : "/logo-without-text.png"
                    }
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <span className="font-semibold text-lg">{game.white}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar (Moves, Info, Controls) */}
        <div className="w-full md:w-[350px] lg:w-[400px] flex flex-col bg-brand-surface border-t md:border-t-0 md:border-l border-brand-border md:h-full shrink-0">
          {/* Tabs */}
          <div className="flex border-b border-brand-border">
            <button
              onClick={() => setActiveTab("Moves")}
              className={`flex-1 py-4 flex flex-col items-center gap-1 font-semibold text-sm transition-colors
                ${activeTab === "Moves" ? "bg-brand-surface text-brand-text border-t-2 border-brand-accent" : "text-brand-secondary hover:bg-brand-text/5"}
              `}
            >
              <div className="w-4 h-4 grid grid-cols-2 grid-rows-2 gap-[1px]">
                <div className="bg-current rounded-[1px]" />
                <div className="bg-transparent border border-current rounded-[1px]" />
                <div className="bg-transparent border border-current rounded-[1px]" />
                <div className="bg-current rounded-[1px]" />
              </div>
              Moves
            </button>
            <button
              onClick={() => setActiveTab("Info")}
              className={`flex-1 py-4 flex flex-col items-center gap-1 font-semibold text-sm transition-colors
                ${activeTab === "Info" ? "bg-brand-surface text-brand-text border-t-2 border-brand-accent" : "text-brand-secondary hover:bg-brand-text/5"}
              `}
            >
              <Info className="w-4 h-4" />
              Info
            </button>
          </div>

          {/* Controls Panel */}
          <div className="bg-brand-surface border-b border-brand-border p-4">
            {/* Navigation Buttons */}
            <div className="flex gap-2 justify-between">
              <button
                onClick={handleFirstMove}
                className="flex-1 bg-transparent hover:bg-brand-border/40 border border-brand-border/40 rounded py-3 flex items-center justify-center text-brand-secondary hover:text-brand-text transition-colors"
              >
                <Rewind className="w-5 h-5" />
              </button>
              <button
                onClick={handlePrevMove}
                className="flex-1 bg-transparent hover:bg-brand-border/40 border border-brand-border/40 rounded py-3 flex items-center justify-center text-brand-secondary hover:text-brand-text transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleNextMove}
                className="flex-1 bg-transparent hover:bg-brand-border/40 border border-brand-border/40 rounded py-3 flex items-center justify-center text-brand-secondary hover:text-brand-text transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              <button
                onClick={handleLastMove}
                className="flex-1 bg-transparent hover:bg-brand-border/40 border border-brand-border/40 rounded py-3 flex items-center justify-center text-brand-secondary hover:text-brand-text transition-colors"
              >
                <FastForward className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto bg-brand-surface">
            {activeTab === "Info" ? (
              <div className="p-4 space-y-4">
                <div className="bg-white text-black text-center py-2 font-bold rounded">
                  {whiteWon
                    ? "White Won (1-0)"
                    : blackWon
                      ? "Black Won (0-1)"
                      : "Draw (1/2-1/2)"}
                </div>
                <div className="text-sm space-y-2 text-brand-secondary">
                  <p>
                    <span className="text-brand-secondary mr-2">Date:</span>{" "}
                    {game.date || game.year}
                  </p>
                  <p>
                    <span className="text-brand-secondary mr-2">Result:</span>{" "}
                    {game.result}
                  </p>
                  <p>
                    <span className="text-brand-secondary mr-2">Event:</span>{" "}
                    {game.event || "Unknown"}
                  </p>
                  <p>
                    <span className="text-brand-secondary mr-2">Site:</span>{" "}
                    {game.site || "Unknown"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                {/* Opening Header */}
                <div className="flex items-center gap-2 p-3 text-sm border-b border-brand-border bg-brand-surface">
                  <Compass className="w-4 h-4 text-white" />
                  <span className="font-semibold text-brand-secondary truncate">
                    {game.opening}
                  </span>
                </div>

                {/* Move List */}
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-center text-sm table-fixed">
                    <tbody>
                      {movePairs.map((pair, idx) => (
                        <tr
                          key={pair.moveNumber}
                          className={`${idx % 2 === 0 ? "bg-brand-surface" : "bg-brand-bg"} hover:bg-brand-text/5 transition-colors`}
                        >
                          <td className="w-16 py-3 pl-4 text-brand-secondary font-bold text-left">
                            {pair.moveNumber}.
                          </td>
                          <td
                            className="py-3 cursor-pointer"
                            onClick={() => handleMoveClick(pair.whiteIndex)}
                          >
                            <span
                              className={`px-3 py-1 rounded transition-colors ${currentMoveIndex === pair.whiteIndex ? "bg-brand-text/10 text-brand-text font-bold" : "text-brand-secondary hover:text-brand-text font-bold"}`}
                            >
                              {pair.white.san}
                            </span>
                          </td>
                          <td
                            className="py-3 cursor-pointer"
                            onClick={() =>
                              pair.black && handleMoveClick(pair.blackIndex)
                            }
                          >
                            {pair.black && (
                              <span
                                className={`px-3 py-1 rounded transition-colors ${currentMoveIndex === pair.blackIndex ? "bg-brand-text/10 text-brand-text font-bold" : "text-brand-secondary hover:text-brand-text font-bold"}`}
                              >
                                {pair.black.san}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {/* Result at bottom */}
                      <tr
                        className={`${movePairs.length % 2 === 0 ? "bg-brand-surface" : "bg-brand-bg"}`}
                      >
                        <td
                          className="py-4 pl-4 font-bold text-brand-secondary"
                          colSpan={3}
                        >
                          {game.result}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
