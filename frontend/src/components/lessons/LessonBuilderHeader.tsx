import {
  ArrowLeft,
  Layers,
  FolderPlus,
  Plus,
  Globe,
} from "lucide-react";
import type { SyncState } from "../../services/lessonSync.service";
import { CloudSyncButton } from "./CloudSyncButton";

export interface LessonBuilderHeaderProps {
  lessonTitle: string;
  onTitleChange: (newTitle: string) => void;
  lessonStatus: "DRAFT" | "PUBLISHED";
  publishedAt: string | null;
  saveStatus: SyncState;
  hasUnsyncedChanges: boolean;
  onForceCloudSync: () => void;
  onNavigateBack: () => void;
  onAddSegment: () => void;
  onAddSlide: () => void;
  onOpenPublishModal: () => void;
}

export function LessonBuilderHeader({
  lessonTitle,
  onTitleChange,
  lessonStatus,
  publishedAt,
  saveStatus,
  hasUnsyncedChanges,
  onForceCloudSync,
  onNavigateBack,
  onAddSegment,
  onAddSlide,
  onOpenPublishModal,
}: LessonBuilderHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-2.5 border-b border-brand-border/40">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onNavigateBack}
          title="Back to Lessons Dashboard"
          className="p-1.5 rounded-lg bg-brand-surface border border-brand-border/60 hover:border-brand-accent/40 text-brand-secondary hover:text-brand-text transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="w-8 h-8 rounded-lg bg-brand-accent/10 border border-brand-accent/30 flex items-center justify-center text-brand-accent">
          <Layers className="w-4 h-4" />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={lessonTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            className="bg-transparent font-display font-medium text-lg text-brand-text outline-none px-2 py-0.5 rounded-md border border-transparent hover:border-brand-border focus:border-brand-accent/50 focus:bg-brand-surface/50 transition-all duration-200"
            placeholder="Untitled Lesson"
          />
          <span
            title={publishedAt ? `Published on ${new Date(publishedAt).toLocaleDateString()}` : "Status: Draft"}
            className={`text-[11px] font-sans font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${
              lessonStatus === "PUBLISHED"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-brand-accent/10 text-brand-accent border-brand-accent/20"
            }`}
          >
            {lessonStatus}
          </span>
        </div>
      </div>

      {/* Right Header Controls: Cloud Sync Button & Action Buttons */}
      <div className="flex items-center gap-4">
        {/* Replaced text save status with Cloud Sync Button & Tooltip */}
        <CloudSyncButton
          hasUnsyncedChanges={hasUnsyncedChanges}
          saveStatus={saveStatus}
          onForceCloudSync={onForceCloudSync}
        />

        <button
          type="button"
          onClick={onAddSegment}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-surface border border-brand-border hover:border-brand-accent/40 text-brand-secondary hover:text-brand-text text-xs font-medium transition-all duration-200 cursor-pointer"
        >
          <FolderPlus className="w-3.5 h-3.5 text-brand-accent" />
          <span>Add Segment</span>
        </button>

        <button
          type="button"
          onClick={onAddSlide}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-surface border border-brand-border hover:border-brand-accent/40 text-brand-secondary hover:text-brand-text text-xs font-medium transition-all duration-200 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-brand-accent" />
          <span>Add Slide</span>
        </button>

        {/* Primary Publish Action */}
        <button
          type="button"
          onClick={onOpenPublishModal}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-md transition-all duration-200 cursor-pointer ${
            lessonStatus === "PUBLISHED"
              ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30"
              : "bg-brand-accent text-brand-bg hover:bg-brand-accent-hover"
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{lessonStatus === "PUBLISHED" ? "Published" : "Publish Lesson"}</span>
        </button>
      </div>
    </div>
  );
}
