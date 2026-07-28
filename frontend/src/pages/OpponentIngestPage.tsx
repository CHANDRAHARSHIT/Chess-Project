import { useState } from "react";
import { useNavigate } from "react-router";
import { OpponentApiService } from "../services/opponent.service";
import { Sparkles, ChevronRight, UploadCloud } from "lucide-react";

export default function OpponentIngestPage() {
  const [username, setUsername] = useState("");
  const [pgnText, setPgnText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ingested: number; skipped: number; duplicate?: number } | null>(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleIngest = async () => {
    if (!username.trim() || !pgnText.trim()) {
      setError("Please provide a username and at least one game PGN.");
      return;
    }
    
    setLoading(true);
    setError("");
    setResult(null);

    try {
      // Split by [Event to count games crudely if needed, but the backend handles array of raw strings
      // We'll just pass it as an array of 1 string for now since backend parses the whole chunk,
      // or split by [Event to pass array.
      const pgns = pgnText.split(/(?=\[Event )/).map(p => p.trim()).filter(Boolean);
      
      const res = await OpponentApiService.ingestGames(username, pgns);
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Failed to ingest games");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    let combinedText = pgnText;
    if (combinedText.trim() && !combinedText.endsWith('\n\n')) {
      combinedText += '\n\n';
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const text = await file.text();
      combinedText += text + '\n\n';
    }

    setPgnText(combinedText.trim());
    e.target.value = '';
  };

  return (
    <div className="min-h-screen p-8 flex items-center justify-center">
      <div 
        className="flex flex-col rounded-2xl overflow-hidden shadow-2xl w-full max-w-2xl"
        style={{
          background: "linear-gradient(160deg, #0C1020 0%, #0a0e1a 100%)",
          border: "1px solid rgba(212, 175, 110, 0.18)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,175,110,0.06)",
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center gap-3 px-6 py-5 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(212, 175, 110, 0.12)" }}
        >
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(212, 175, 110, 0.1)",
              border: "1px solid rgba(212, 175, 110, 0.2)",
            }}
          >
            <Sparkles className="w-5 h-5" style={{ color: "#D4AF6E" }} />
          </div>
          <div>
            <h1 
              className="text-xl font-semibold tracking-wide"
              style={{ fontFamily: "'Cormorant Garamond', serif", color: "#F5F0E8" }}
            >
              Add Opponent
            </h1>
            <p className="text-xs mt-1" style={{ color: "#8E8B82", fontFamily: "Inter, sans-serif" }}>
              Paste PGNs to generate a scouting report
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-col p-6 gap-5">
          {error && (
            <div className="p-4 rounded-lg bg-red-900/20 border border-red-500/30 text-red-200 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-mono uppercase tracking-widest mb-2 text-[#8E8B82]">
              Opponent Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Hikaru"
              className="w-full text-sm transition-all duration-200 outline-none"
              style={{
                background: "rgba(8, 11, 20, 0.8)",
                border: "1px solid rgba(212, 175, 110, 0.2)",
                borderRadius: "10px",
                padding: "10px 14px",
                color: "#F5F0E8",
                fontFamily: "Inter, sans-serif"
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(212,175,110,0.5)";
                e.currentTarget.style.boxShadow = "0 0 0 2px rgba(212,175,110,0.08)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(212,175,110,0.2)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-mono uppercase tracking-widest text-[#8E8B82]">
                PGN Data
              </label>
              <label 
                className="cursor-pointer flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-[#D4AF6E] hover:text-[#F5F0E8] transition-colors"
                title="Upload .pgn files"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload</span>
                <input 
                  type="file" 
                  accept=".pgn" 
                  multiple 
                  className="hidden" 
                  onChange={handleFileUpload} 
                />
              </label>
            </div>
            <textarea
              value={pgnText}
              onChange={(e) => setPgnText(e.target.value)}
              placeholder="[Event ...]"
              rows={8}
              className="w-full text-sm transition-all duration-200 outline-none resize-y"
              style={{
                background: "rgba(8, 11, 20, 0.8)",
                border: "1px solid rgba(212, 175, 110, 0.2)",
                borderRadius: "10px",
                padding: "10px 14px",
                color: "#F5F0E8",
                fontFamily: "DM Mono, monospace"
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(212,175,110,0.5)";
                e.currentTarget.style.boxShadow = "0 0 0 2px rgba(212,175,110,0.08)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(212,175,110,0.2)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {result && (
            <div className="p-4 rounded-lg bg-[#D4AF6E]/10 border border-[#D4AF6E]/30 text-[#D4AF6E] text-sm">
              <div className="font-semibold mb-1">Ingestion Complete!</div>
              <div>Successfully Ingested: {result.ingested}</div>
              <div>Skipped (Duplicate/Error): {result.skipped}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div 
          className="px-6 py-5 flex-shrink-0 flex gap-4"
          style={{ borderTop: "1px solid rgba(212,175,110,0.08)" }}
        >
          <button
            onClick={handleIngest}
            disabled={loading}
            className="flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            style={{
              background: loading ? "rgba(212,175,110,0.4)" : "rgba(255,255,255,0.04)",
              border: "1px solid rgba(212,175,110,0.3)",
              color: "#F5F0E8",
              fontFamily: "DM Mono, monospace",
            }}
          >
            {loading ? (
              <div className="w-3.5 h-3.5 rounded-full border-2 animate-spin border-[#D4AF6E] border-t-transparent" />
            ) : (
              <><UploadCloud className="w-4 h-4 text-[#D4AF6E]" /> Ingest Data</>
            )}
          </button>

          <button
            onClick={() => username.trim() && navigate(`/opponents/${username.trim()}`)}
            disabled={loading || !username.trim()}
            className="flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, #D4AF6E 0%, #B8934A 100%)",
              color: "#080B14",
              boxShadow: "0 4px 20px rgba(212, 175, 110, 0.25)",
              fontFamily: "DM Mono, monospace",
            }}
          >
            View Report <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
