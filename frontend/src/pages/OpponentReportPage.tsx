import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { OpponentApiService } from "../services/opponent.service";
import type { OpponentReport } from "../types/opponent";
import { ChevronLeft, Target, Clock, ShieldAlert, Zap, Search } from "lucide-react";

export default function OpponentReportPage() {
  const { username } = useParams<{ username: string }>();
  const [report, setReport] = useState<OpponentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (username) {
      setLoading(true);
      OpponentApiService.getReport(username)
        .then(setReport)
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 animate-spin border-[#D4AF6E] border-t-transparent" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center text-brand-text">
        Error loading report: {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            to="/opponents/add" 
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#8E8B82",
            }}
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-semibold tracking-wide" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--text-primary)" }}>
              Scouting Report: {username}
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)", fontFamily: "Inter, sans-serif" }}>
              Analyzed {report.totalGames} games (Win rate: {Math.round(report.overallScorePercentage * 100)}%)
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Section 1: Opening Stats */}
        <section className="rounded-2xl p-6" style={{ background: "linear-gradient(160deg, var(--obsidian-mid) 0%, var(--obsidian) 100%)", border: "1px solid var(--glass-border-gold)" }}>
          <div className="flex items-center gap-3 mb-6">
            <Search className="w-5 h-5 text-brand-accent" />
            <h2 className="text-xl font-semibold text-brand-text" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Opening Repertoire</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-mono uppercase tracking-widest text-brand-secondary mb-2">Most Frequent</h3>
              {report.mostFrequent.map(op => (
                <div key={op.name} className="flex justify-between items-center py-2 border-b border-[rgba(255,255,255,0.05)]">
                  <span className="text-sm text-brand-text">{op.name}</span>
                  <span className="text-xs font-mono text-brand-accent">{op.count} games</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 2: Repertoire Shape */}
        <section className="rounded-2xl p-6" style={{ background: "linear-gradient(160deg, var(--obsidian-mid) 0%, var(--obsidian) 100%)", border: "1px solid var(--glass-border-gold)" }}>
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-5 h-5 text-brand-accent" />
            <h2 className="text-xl font-semibold text-brand-text" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Repertoire Shape</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-mono uppercase tracking-widest text-brand-secondary mb-2">Preferred Responses (vs d4)</h3>
              {report.preferredResponses["d4"]?.map(res => (
                <div key={res.move} className="flex justify-between items-center py-2 border-b border-[rgba(255,255,255,0.05)]">
                  <span className="text-sm text-brand-text font-bold">{res.move}</span>
                  <span className="text-xs font-mono text-brand-accent">{res.count} times</span>
                </div>
              ))}
            </div>
            
            <div>
              <h3 className="text-xs font-mono uppercase tracking-widest text-brand-secondary mb-2 mt-4">Avoided Openings</h3>
              {Array.isArray(report.avoidedOpenings) ? (
                <>
                  <p className="text-sm text-brand-text">{report.avoidedOpenings.join(", ")}</p>
                  {report.totalGames < 50 && (
                    <p className="text-xs text-brand-accent mt-2 italic">
                      * Note: A minimum of 50 games is recommended for the best repertoire analysis.
                    </p>
                  )}
                </>
              ) : (
                <div className="p-3 rounded-lg bg-[rgba(212,175,110,0.1)] border border-[rgba(212,175,110,0.2)]">
                  <p className="text-xs text-brand-accent">
                    Insufficient Data. Need {report.avoidedOpenings.minGamesRequired} games, only have {report.avoidedOpenings.currentGames}.
                    <br />
                    <span className="italic mt-1 block">* Note: A minimum of 50 games is recommended for the best repertoire analysis.</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 3: Time Management */}
        <section className="rounded-2xl p-6" style={{ background: "linear-gradient(160deg, var(--obsidian-mid) 0%, var(--obsidian) 100%)", border: "1px solid var(--glass-border-gold)" }}>
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-5 h-5 text-brand-accent" />
            <h2 className="text-xl font-semibold text-brand-text" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Time Management</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-4 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] text-center">
              <div className="text-2xl font-bold text-brand-text">{Math.round(report.timeAnalysis.timeTrouble.frequency * 100)}%</div>
              <div className="text-xs text-brand-secondary uppercase mt-1">Games in Time Trouble</div>
            </div>
            <div className="p-4 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] text-center">
              <div className="text-2xl font-bold text-brand-text">{report.timeAnalysis.rushedCriticalMoves}</div>
              <div className="text-xs text-brand-secondary uppercase mt-1">Rushed Critical Moves</div>
            </div>
          </div>
        </section>

        {/* Section 4: Weaknesses */}
        <section className="rounded-2xl p-6" style={{ background: "linear-gradient(160deg, var(--obsidian-mid) 0%, var(--obsidian) 100%)", border: "1px solid var(--glass-border-gold)" }}>
          <div className="flex items-center gap-3 mb-6">
            <ShieldAlert className="w-5 h-5 text-brand-accent" />
            <h2 className="text-xl font-semibold text-brand-text" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Weakness Summary</h2>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-[rgba(255,255,255,0.05)]">
              <span className="text-sm text-brand-text">Opening Blunders</span>
              <span className="text-sm font-bold text-red-400">{report.weaknesses.openingBlunders}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[rgba(255,255,255,0.05)]">
              <span className="text-sm text-brand-text">Middlegame Blunders</span>
              <span className="text-sm font-bold text-red-400">{report.weaknesses.middlegameBlunders}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[rgba(255,255,255,0.05)]">
              <span className="text-sm text-brand-text">Endgame Blunders</span>
              <span className="text-sm font-bold text-red-400">{report.weaknesses.endgameBlunders}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[rgba(255,255,255,0.05)]">
              <span className="text-sm text-brand-text">Time Trouble Blunders</span>
              <span className="text-sm font-bold text-red-400">{report.weaknesses.timeTroubleBlunders}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[rgba(255,255,255,0.05)]">
              <span className="text-sm text-brand-text">Lost Winning Positions</span>
              <span className="text-sm font-bold text-red-400">{report.weaknesses.lostWinningPositions}</span>
            </div>
          </div>
        </section>

        {/* Section 5: Recommendations */}
        <section className="md:col-span-2 rounded-2xl p-6" style={{ background: "linear-gradient(160deg, var(--obsidian-mid) 0%, var(--obsidian) 100%)", border: "1px solid var(--glass-border-gold)" }}>
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-5 h-5 text-brand-accent" />
            <h2 className="text-xl font-semibold text-brand-text" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Top 3 Recommended Openings</h2>
          </div>
          <p className="text-xs text-brand-secondary italic mb-6">
            (Placeholder Algorithm: Sorting by opponent's worst score percentage across colors)
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-brand-accent mb-4 border-b border-[#D4AF6E]/30 pb-2">If You Are White</h3>
              {report.recommendationsAsWhite.length === 0 ? (
                <p className="text-sm text-brand-secondary">Not enough data</p>
              ) : (
                <div className="space-y-4">
                  {report.recommendationsAsWhite.map(rec => (
                    <div key={rec.variation} className="p-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl relative">
                      <div className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full bg-[#D4AF6E]/10 border border-[#D4AF6E]/30 text-xs font-bold text-brand-accent">
                        #{report.recommendationsAsWhite.indexOf(rec) + 1}
                      </div>
                      <div className="text-sm font-bold text-brand-text pr-10 mb-2">{rec.variation}</div>
                      
                      <div className="grid grid-cols-2 gap-y-2 gap-x-4 mb-3">
                        <div className="text-xs text-brand-secondary">
                          <span className="text-[10px] uppercase tracking-widest block mb-0.5 opacity-70">Probability</span>
                          <span className="text-brand-text font-mono">{Math.round(rec.playProbability * 100)}%</span> ({rec.count} games)
                        </div>
                        <div className="text-xs text-brand-secondary">
                          <span className="text-[10px] uppercase tracking-widest block mb-0.5 opacity-70">Expected Eval</span>
                          <span className="text-brand-text font-mono">
                            {rec.expectedEval !== null ? (rec.expectedEval > 0 ? `+${rec.expectedEval.toFixed(2)}` : rec.expectedEval.toFixed(2)) : 'N/A'}
                          </span>
                        </div>
                        <div className="text-xs text-brand-secondary">
                          <span className="text-[10px] uppercase tracking-widest block mb-0.5 opacity-70">Opponent Score</span>
                          <span className="text-brand-text font-mono">{Math.round(rec.scorePercentage * 100)}%</span>
                        </div>
                        <div className="text-xs text-brand-secondary">
                          <span className="text-[10px] uppercase tracking-widest block mb-0.5 opacity-70">Rank Score</span>
                          <span className="text-brand-text font-mono">{rec.compositeScore.toFixed(2)}</span>
                        </div>
                        <div className="text-xs text-brand-secondary col-span-2">
                          <span className="text-[10px] uppercase tracking-widest block mb-0.5 opacity-70">Human Difficulty Rating</span>
                          <span className="text-brand-text font-mono">{rec.humanDifficulty}/10</span>
                        </div>
                      </div>
                      
                      {rec.bestMove && (
                        <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.05)]">
                          <span className="text-xs text-brand-secondary uppercase tracking-widest mr-2">Continue with:</span>
                          <span className="text-sm font-bold text-brand-accent font-mono bg-[#D4AF6E]/10 px-2 py-0.5 rounded border border-[#D4AF6E]/20">{rec.bestMove}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-brand-accent mb-4 border-b border-[#D4AF6E]/30 pb-2">If You Are Black</h3>
              {report.recommendationsAsBlack.length === 0 ? (
                <p className="text-sm text-brand-secondary">Not enough data</p>
              ) : (
                <div className="space-y-4">
                  {report.recommendationsAsBlack.map(rec => (
                    <div key={rec.variation} className="p-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl relative">
                      <div className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full bg-[#D4AF6E]/10 border border-[#D4AF6E]/30 text-xs font-bold text-brand-accent">
                        #{report.recommendationsAsBlack.indexOf(rec) + 1}
                      </div>
                      <div className="text-sm font-bold text-brand-text pr-10 mb-2">{rec.variation}</div>
                      
                      <div className="grid grid-cols-2 gap-y-2 gap-x-4 mb-3">
                        <div className="text-xs text-brand-secondary">
                          <span className="text-[10px] uppercase tracking-widest block mb-0.5 opacity-70">Probability</span>
                          <span className="text-brand-text font-mono">{Math.round(rec.playProbability * 100)}%</span> ({rec.count} games)
                        </div>
                        <div className="text-xs text-brand-secondary">
                          <span className="text-[10px] uppercase tracking-widest block mb-0.5 opacity-70">Expected Eval</span>
                          <span className="text-brand-text font-mono">
                            {rec.expectedEval !== null ? (rec.expectedEval > 0 ? `+${rec.expectedEval.toFixed(2)}` : rec.expectedEval.toFixed(2)) : 'N/A'}
                          </span>
                        </div>
                        <div className="text-xs text-brand-secondary">
                          <span className="text-[10px] uppercase tracking-widest block mb-0.5 opacity-70">Opponent Score</span>
                          <span className="text-brand-text font-mono">{Math.round(rec.scorePercentage * 100)}%</span>
                        </div>
                        <div className="text-xs text-brand-secondary">
                          <span className="text-[10px] uppercase tracking-widest block mb-0.5 opacity-70">Rank Score</span>
                          <span className="text-brand-text font-mono">{rec.compositeScore.toFixed(2)}</span>
                        </div>
                        <div className="text-xs text-brand-secondary col-span-2">
                          <span className="text-[10px] uppercase tracking-widest block mb-0.5 opacity-70">Human Difficulty Rating</span>
                          <span className="text-brand-text font-mono">{rec.humanDifficulty}/10</span>
                        </div>
                      </div>
                      
                      {rec.bestMove && (
                        <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.05)]">
                          <span className="text-xs text-brand-secondary uppercase tracking-widest mr-2">Continue with:</span>
                          <span className="text-sm font-bold text-brand-accent font-mono bg-[#D4AF6E]/10 px-2 py-0.5 rounded border border-[#D4AF6E]/20">{rec.bestMove}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
