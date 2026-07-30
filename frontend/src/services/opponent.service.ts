import type { OpponentReport } from "../types/opponent";

const API_BASE = "/api";

export const OpponentApiService = {
  async extractFideGames(fideId: number): Promise<any> {
    const res = await fetch(`${API_BASE}/opponents/extract`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fideId }),
    });
    
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || data.error || "Failed to extract FIDE games");
    }
    
    return res.json();
  },

  async ingestGames(username: string, pgns: string[], targetFideId?: number): Promise<{ ingested: number; skipped: number; duplicate: number }> {
    const res = await fetch(`${API_BASE}/opponents/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, pgns, targetFideId }),
    });
    
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || data.error || "Failed to ingest games");
    }
    
    return res.json();
  },

  async getReport(username: string): Promise<OpponentReport> {
    const res = await fetch(`${API_BASE}/opponents/${encodeURIComponent(username)}/report`);
    
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || data.error || "Failed to fetch report");
    }
    
    return res.json();
  }
};
