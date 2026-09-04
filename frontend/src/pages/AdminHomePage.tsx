import React from "react";
import { useNavigate } from "react-router";
import {
  FileText,
  ShieldCheck,
  Settings,
  ArrowRight,
  Sparkles,
  Server,
  Lock,
} from "lucide-react";
import { useAdminSession } from "@/features/admin/useAdminSession";

/**
 * AdminHomePage.tsx
 *
 * Executive Command Center for XLChess Administrators.
 * Built with design-taste-frontend and frontend-ui-dark-ts standards:
 * - Luxury obsidian/cream theme awareness
 * - Tactile glassmorphic cards with gold-accented borders
 * - Accessible, responsive bento layout with micro-interactions
 */
export const AdminHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { admin } = useAdminSession();

  const displayName = admin?.name || (admin?.email ? admin.email.split("@")[0] : "Administrator");
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-brand-bg text-brand-text px-4 sm:px-8 py-8 max-w-7xl mx-auto font-sans transition-colors duration-200 select-none">
      {/* ── Top Welcome Bar ─────────────────────────────────────────────────── */}
      <header className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-brand-border/60">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              Systems Operational
            </span>
            <span className="text-xs text-brand-secondary">
              {formattedDate}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-brand-text">
            Welcome back,{" "}
            <span className="text-brand-accent">{displayName}</span>
          </h1>
          <p className="text-sm sm:text-base text-brand-secondary mt-1 max-w-2xl">
            XLChess Central Command — Manage platform documents, governance, and system configurations.
          </p>
        </div>

        {/* Quick Identity Tag */}
        <div className="flex items-center gap-3 bg-brand-surface/80 border border-brand-border/80 ring-1 ring-white/15 dark:ring-white/5 rounded-2xl px-4 py-3 backdrop-blur-xl transition-all self-start md:self-auto">
          <div className="w-10 h-10 rounded-xl bg-brand-accent/15 border border-brand-accent/30 text-brand-accent flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-brand-text truncate">
              {admin?.email ?? "admin@xlchess.com"}
            </p>
            <span className="inline-block text-[11px] font-mono font-medium text-brand-accent uppercase tracking-wider">
              {admin?.role ?? "SUPER_ADMIN"}
            </span>
          </div>
        </div>
      </header>

      {/* ── Main Bento Grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {/* 1. ACS Documents Card */}
        <div
          onClick={() => navigate("/admin/acs/documents")}
          className="group relative bg-brand-surface/80 hover:bg-brand-surface border border-brand-border/80 hover:border-brand-accent/60 ring-1 ring-white/20 dark:ring-white/5 rounded-3xl p-6 sm:p-8 hover:-translate-y-1 backdrop-blur-xl transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/5 rounded-full blur-2xl group-hover:bg-brand-accent/10 transition-all duration-300 pointer-events-none" />

          <div>
            <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 border border-brand-border text-brand-accent flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-200">
              <FileText className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-brand-secondary">
                ACS Module
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-brand-accent/10 text-brand-accent font-semibold">
                Active
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-brand-text tracking-tight mb-2">
              Documentation Library
            </h2>
            <p className="text-sm text-brand-secondary leading-relaxed">
              Create, update, and manage official legal notices, privacy disclosures, and terms of service.
            </p>
          </div>

          <div className="mt-8 pt-4 border-t border-brand-border/40 flex items-center justify-between text-sm font-semibold text-brand-accent group-hover:text-gold transition-colors">
            <span>Explore Documents</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform duration-200" />
          </div>
        </div>

        {/* 2. Admin Settings Card */}
        <div
          onClick={() => navigate("/admin/settings")}
          className="group relative bg-brand-surface/80 hover:bg-brand-surface border border-brand-border/80 hover:border-brand-accent/60 ring-1 ring-white/20 dark:ring-white/5 rounded-3xl p-6 sm:p-8 hover:-translate-y-1 backdrop-blur-xl transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/5 rounded-full blur-2xl group-hover:bg-brand-accent/10 transition-all duration-300 pointer-events-none" />

          <div>
            <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 border border-brand-border text-brand-accent flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-200">
              <Settings className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-brand-secondary">
                Configuration
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-brand-text/10 text-brand-secondary font-semibold">
                Global
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-brand-text tracking-tight mb-2">
              Platform Settings
            </h2>
            <p className="text-sm text-brand-secondary leading-relaxed">
              Configure administrator permissions, theme palettes, accessibility toggles, and security controls.
            </p>
          </div>

          <div className="mt-8 pt-4 border-t border-brand-border/40 flex items-center justify-between text-sm font-semibold text-brand-accent group-hover:text-gold transition-colors">
            <span>Open Settings</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform duration-200" />
          </div>
        </div>

        {/* 3. Security & Access Overview Card */}
        <div className="relative bg-brand-surface/80 border border-brand-border/80 ring-1 ring-white/20 dark:ring-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-xl flex flex-col justify-between overflow-hidden">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 border border-brand-border text-brand-accent flex items-center justify-center mb-6">
              <Lock className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-brand-secondary">
                Security Perimeter
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                Protected
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-brand-text tracking-tight mb-2">
              OAuth 2.0 Guard
            </h2>
            <p className="text-sm text-brand-secondary leading-relaxed mb-4">
              Restricted to authorized Google Workspace accounts with cryptographic session authentication.
            </p>

            <div className="space-y-2 pt-2 border-t border-brand-border/40 text-xs text-brand-secondary">
              <div className="flex items-center justify-between">
                <span>Domain Auth:</span>
                <span className="font-mono text-brand-text">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Encryption:</span>
                <span className="font-mono text-brand-text">TLS 1.3 / AES-256</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-brand-border/40 flex items-center gap-2 text-xs text-brand-secondary">
            <Sparkles className="w-3.5 h-3.5 text-brand-accent" />
            <span>Zero-Trust isolated admin runtime</span>
          </div>
        </div>
      </div>

      {/* ── Platform Telemetry Row ──────────────────────────────────────────── */}
      <section className="bg-brand-surface/70 border border-brand-border/80 ring-1 ring-white/10 dark:ring-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-accent/10 border border-brand-border text-brand-accent flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-brand-text">
                Platform Infrastructure Status
              </h3>
              <p className="text-xs text-brand-secondary">
                Real-time services health and connectivity verification
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-brand-secondary bg-brand-bg/60 border border-brand-border px-3 py-1.5 rounded-xl self-start sm:self-auto">
            XLChess Engine v1.0.0
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-brand-bg/60 border border-brand-border/60 flex items-center gap-3.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 shrink-0" />
            <div>
              <p className="text-xs text-brand-secondary">PostgreSQL / Supabase</p>
              <p className="text-sm font-semibold text-brand-text">Online & Synced</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-brand-bg/60 border border-brand-border/60 flex items-center gap-3.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 shrink-0" />
            <div>
              <p className="text-xs text-brand-secondary">Real-Time Transport</p>
              <p className="text-sm font-semibold text-brand-text">Multiplayer WebSocket Ready</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-brand-bg/60 border border-brand-border/60 flex items-center gap-3.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 shrink-0" />
            <div>
              <p className="text-xs text-brand-secondary">Admin API Gateway</p>
              <p className="text-sm font-semibold text-brand-text">Protected (/api/admin/*)</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminHomePage;
