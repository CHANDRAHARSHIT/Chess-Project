import React, { useState } from "react";
import {
  DndContext,
  pointerWithin,
  rectIntersection,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  FolderPlus,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Copy,
  GripVertical,
} from "lucide-react";
import { ThemedChessboard } from "../ThemedChessboard";

export interface SlideData {
  id: string;
  title: string;
  content: string;
  hasBoard: boolean;
  fen?: string;
  annotations?: any;
}

export interface SegmentData {
  id: string;
  title: string;
  isExpanded: boolean;
  slides: SlideData[];
}

interface LessonBuilderSidebarProps {
  segments: SegmentData[];
  setSegments: React.Dispatch<React.SetStateAction<SegmentData[]>>;
  activeSegmentId: string;
  setActiveSegmentId: (id: string) => void;
  activeSlideId: string;
  setActiveSlideId: (id: string) => void;
  onAddSegment: () => void;
  onToggleSegment: (segId: string) => void;
  onUpdateSegmentTitle: (segId: string, title: string) => void;
  onDeleteSegment: (segId: string, e: React.MouseEvent) => void;
  onAddSlide: (segId: string, e?: React.MouseEvent) => void;
  onDuplicateSlide: (segId: string, slideId: string, e: React.MouseEvent) => void;
  onDeleteSlide: (segId: string, slideId: string, e: React.MouseEvent) => void;
  onAutoSaveTrigger: () => void;
}

/* ── Sortable Slide Component ───────────────────────────────────────────── */
interface SortableSlideProps {
  slide: SlideData;
  segId: string;
  globalNum: number;
  isActive: boolean;
  canDelete: boolean;
  onSelect: () => void;
  onDuplicate: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

function SortableSlideItem({
  slide,
  segId,
  globalNum,
  isActive,
  canDelete,
  onSelect,
  onDuplicate,
  onDelete,
}: SortableSlideProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: slide.id,
    data: { type: "slide", slideId: slide.id, segmentId: segId },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className="group flex items-start gap-1.5 cursor-pointer relative select-none"
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        title="Drag to reorder slide"
        className="mt-3 p-0.5 text-brand-secondary/40 hover:text-brand-accent cursor-grab active:cursor-grabbing shrink-0"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>

      <span className="text-[11px] font-mono text-brand-secondary/70 mt-3 w-3 text-right shrink-0">
        {globalNum}
      </span>

      {/* Miniature Proportional Slide Preview */}
      <div
        className={`relative flex-1 aspect-[16/9] rounded-lg border transition-all duration-200 overflow-hidden bg-brand-surface ${
          isActive
            ? "border-brand-accent shadow-[0_0_12px_rgba(212,175,110,0.20)]"
            : "border-brand-border/60 hover:border-brand-border"
        }`}
      >
        <div
          style={{
            width: "800px",
            height: "450px",
            transform: "scale(0.24)",
            transformOrigin: "top left",
          }}
          className="absolute top-0 left-0 p-8 font-sans text-brand-text bg-brand-surface pointer-events-none select-none overflow-hidden"
        >
          {slide.hasBoard && (
            <div className="float-right ml-6 mb-6 w-[42%] aspect-square rounded-xl border border-brand-border bg-brand-bg shadow-md">
              <ThemedChessboard
                options={{
                  position:
                    slide.fen ||
                    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
                  showNotation: false,
                  allowDragging: false,
                }}
              />
            </div>
          )}

          {slide.content && slide.content.trim() !== "" ? (
            <div
              className="w-full h-full font-sans text-brand-text text-base leading-relaxed break-words space-y-3 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-brand-text [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-brand-text [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-medium [&_h3]:text-brand-text [&_h3]:mb-2 [&_p]:text-base [&_p]:text-brand-text [&_p]:leading-relaxed [&_p]:mb-3 [&_ul]:list-disc [&_ul]:list-inside [&_ul]:space-y-1 [&_ul]:my-2 [&_ul]:pl-2 [&_ul]:text-brand-text [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:space-y-1 [&_ol]:my-2 [&_ol]:pl-2 [&_ol]:text-brand-text [&_li]:leading-relaxed [&_li]:text-brand-text [&_blockquote]:border-l-4 [&_blockquote]:border-brand-accent [&_blockquote]:bg-brand-accent/10 [&_blockquote]:px-4 [&_blockquote]:py-2.5 [&_blockquote]:my-3 [&_blockquote]:rounded-r [&_blockquote]:text-brand-text/90 [&_blockquote]:italic [&_blockquote]:font-sans [&_hr]:border-brand-border/80 [&_hr]:my-4 [&_a]:text-brand-accent [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-brand-accent-hover"
              dangerouslySetInnerHTML={{ __html: slide.content }}
            />
          ) : (
            <div className="text-brand-secondary/40 text-base italic">
              Blank slide...
            </div>
          )}
        </div>

        {/* Hover Action Overlay */}
        <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-brand-bg/90 backdrop-blur-sm rounded p-1 border border-brand-border/50">
          <button
            onClick={onDuplicate}
            title="Duplicate Slide"
            className="p-0.5 text-brand-secondary hover:text-brand-accent transition-colors"
          >
            <Copy className="w-3 h-3" />
          </button>
          {canDelete && (
            <button
              onClick={onDelete}
              title="Delete Slide"
              className="p-0.5 text-brand-secondary hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Sortable Segment Component ─────────────────────────────────────────── */
interface SortableSegmentProps {
  segment: SegmentData;
  segIdx: number;
  segments: SegmentData[];
  activeSegmentId: string;
  activeSlideId: string;
  setActiveSegmentId: (id: string) => void;
  setActiveSlideId: (id: string) => void;
  onToggleSegment: (segId: string) => void;
  onUpdateSegmentTitle: (segId: string, title: string) => void;
  onDeleteSegment: (segId: string, e: React.MouseEvent) => void;
  onAddSlide: (segId: string, e?: React.MouseEvent) => void;
  onDuplicateSlide: (segId: string, slideId: string, e: React.MouseEvent) => void;
  onDeleteSlide: (segId: string, slideId: string, e: React.MouseEvent) => void;
}

function SortableSegmentItem({
  segment,
  segIdx,
  segments,
  activeSlideId,
  setActiveSegmentId,
  setActiveSlideId,
  onToggleSegment,
  onUpdateSegmentTitle,
  onDeleteSegment,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
}: SortableSegmentProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: segment.id,
    data: { type: "segment", segmentId: segment.id },
  });

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `droppable-${segment.id}`,
    data: { type: "segment-droppable", segmentId: segment.id },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const slideIds = segment.slides.map((sl) => sl.id);

  return (
    <div ref={setNodeRef} style={style} className="space-y-1.5 select-none">
      {/* Segment Header */}
      <div
        onClick={() => onToggleSegment(segment.id)}
        className="group flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-brand-surface/60 cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <button
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            title="Drag to reorder segment"
            className="p-0.5 text-brand-secondary/40 hover:text-brand-accent cursor-grab active:cursor-grabbing shrink-0"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>

          {segment.isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-brand-secondary shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-brand-secondary shrink-0" />
          )}

          <input
            type="text"
            value={segment.title}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onUpdateSegmentTitle(segment.id, e.target.value)}
            className="bg-transparent text-xs font-semibold uppercase tracking-wider text-brand-secondary hover:text-brand-text focus:text-brand-text focus:bg-brand-surface outline-none w-full px-1 py-0.5 rounded transition-colors"
          />
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => onAddSlide(segment.id, e)}
            title="Add Slide to Segment"
            className="p-1 rounded text-brand-secondary hover:text-brand-accent hover:bg-brand-text/5 transition-colors"
          >
            <Plus className="w-3 h-3" />
          </button>
          {segments.length > 1 && (
            <button
              onClick={(e) => onDeleteSegment(segment.id, e)}
              title="Delete Segment"
              className="p-1 rounded text-brand-secondary hover:text-red-400 hover:bg-brand-text/5 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Sortable Slides List */}
      {segment.isExpanded && (
        <div ref={setDroppableRef} className="pl-1 space-y-2 min-h-[10px]">
          <SortableContext
            items={slideIds}
            strategy={verticalListSortingStrategy}
          >
            {segment.slides.map((slide, slideIdx) => {
              const isActive = activeSlideId === slide.id;

              let globalNum = 1;
              for (let i = 0; i < segIdx; i++) {
                globalNum += segments[i].slides.length;
              }
              globalNum += slideIdx;

              return (
                <SortableSlideItem
                  key={slide.id}
                  slide={slide}
                  segId={segment.id}
                  globalNum={globalNum}
                  isActive={isActive}
                  canDelete={segment.slides.length > 1}
                  onSelect={() => {
                    setActiveSlideId(slide.id);
                    setActiveSegmentId(segment.id);
                  }}
                  onDuplicate={(e) => onDuplicateSlide(segment.id, slide.id, e)}
                  onDelete={(e) => onDeleteSlide(segment.id, slide.id, e)}
                />
              );
            })}
          </SortableContext>
        </div>
      )}
    </div>
  );
}

/* ── Main Sidebar Export ────────────────────────────────────────────────── */
export function LessonBuilderSidebar({
  segments,
  setSegments,
  activeSegmentId,
  setActiveSegmentId,
  activeSlideId,
  setActiveSlideId,
  onAddSegment,
  onToggleSegment,
  onUpdateSegmentTitle,
  onDeleteSegment,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onAutoSaveTrigger,
}: LessonBuilderSidebarProps) {
  const [activeDragItem, setActiveDragItem] = useState<{
    type: "segment" | "slide";
    id: string;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    })
  );

  const segmentIds = segments.map((s) => s.id);

  const customCollisionStrategy = (args: any) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    return rectIntersection(args);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const type = active.data.current?.type as "segment" | "slide";
    setActiveDragItem({ type, id: active.id as string });
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeType = active.data.current?.type;
    if (activeType !== "slide") return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const sourceSeg = segments.find((s) => s.slides.some((sl) => sl.id === activeId));
    if (!sourceSeg) return;

    let targetSeg = segments.find((s) => s.slides.some((sl) => sl.id === overId));
    if (!targetSeg) {
      if (over.data.current?.type === "segment") {
        targetSeg = segments.find((s) => s.id === overId);
      } else if (overId.startsWith("droppable-")) {
        const segId = overId.replace("droppable-", "");
        targetSeg = segments.find((s) => s.id === segId);
      }
    }

    if (!targetSeg || sourceSeg.id === targetSeg.id) return;

    setSegments((prevSegments) => {
      const sourceSegIdx = prevSegments.findIndex((s) => s.id === sourceSeg.id);
      const targetSegIdx = prevSegments.findIndex((s) => s.id === targetSeg.id);

      if (sourceSegIdx === -1 || targetSegIdx === -1) return prevSegments;

      const sourceSlides = [...prevSegments[sourceSegIdx].slides];
      const targetSlides = [...prevSegments[targetSegIdx].slides];

      const slideIdx = sourceSlides.findIndex((sl) => sl.id === activeId);
      if (slideIdx === -1) return prevSegments;

      const [movedSlide] = sourceSlides.splice(slideIdx, 1);

      const overSlideIdx = targetSlides.findIndex((sl) => sl.id === overId);
      const insertIdx = overSlideIdx >= 0 ? overSlideIdx : targetSlides.length;

      targetSlides.splice(insertIdx, 0, movedSlide);

      const updated = [...prevSegments];
      updated[sourceSegIdx] = { ...updated[sourceSegIdx], slides: sourceSlides };
      updated[targetSegIdx] = { ...updated[targetSegIdx], slides: targetSlides, isExpanded: true };

      if (active.data.current) {
        active.data.current.segmentId = targetSeg.id;
      }

      return updated;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over) return;

    const activeType = active.data.current?.type;

    if (activeType === "segment") {
      if (active.id !== over.id) {
        setSegments((prevSegments) => {
          const oldIndex = prevSegments.findIndex((s) => s.id === active.id);
          const newIndex = prevSegments.findIndex((s) => s.id === over.id);
          if (oldIndex !== -1 && newIndex !== -1) {
            const updated = arrayMove(prevSegments, oldIndex, newIndex);
            setTimeout(onAutoSaveTrigger, 50);
            return updated;
          }
          return prevSegments;
        });
      }
      return;
    }

    if (activeType === "slide") {
      const activeId = active.id as string;
      const overId = over.id as string;

      setSegments((prevSegments) => {
        const segIndex = prevSegments.findIndex((s) => s.slides.some((sl) => sl.id === activeId));
        if (segIndex === -1) return prevSegments;

        const slides = [...prevSegments[segIndex].slides];
        const oldIndex = slides.findIndex((sl) => sl.id === activeId);
        const newIndex = slides.findIndex((sl) => sl.id === overId);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const updatedSlides = arrayMove(slides, oldIndex, newIndex);
          const updatedSegments = [...prevSegments];
          updatedSegments[segIndex] = { ...updatedSegments[segIndex], slides: updatedSlides };
          setTimeout(onAutoSaveTrigger, 50);
          return updatedSegments;
        }

        setTimeout(onAutoSaveTrigger, 50);
        return prevSegments;
      });
    }
  };

  return (
    <aside className="w-64 border-r border-brand-border bg-brand-bg flex flex-col shrink-0">
      <div className="px-4 py-3 border-b border-brand-border/60 flex items-center justify-between">
        <span className="font-sans text-xs font-semibold uppercase tracking-wider text-brand-secondary">
          Segments & Slides
        </span>
        <button
          onClick={onAddSegment}
          title="Create New Segment"
          className="p-1 rounded hover:bg-brand-text/5 text-brand-secondary hover:text-brand-accent transition-colors cursor-pointer"
        >
          <FolderPlus className="w-3.5 h-3.5" />
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionStrategy}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <SortableContext
            items={segmentIds}
            strategy={verticalListSortingStrategy}
          >
            {segments.map((seg, segIdx) => (
              <SortableSegmentItem
                key={seg.id}
                segment={seg}
                segIdx={segIdx}
                segments={segments}
                activeSegmentId={activeSegmentId}
                activeSlideId={activeSlideId}
                setActiveSegmentId={setActiveSegmentId}
                setActiveSlideId={setActiveSlideId}
                onToggleSegment={onToggleSegment}
                onUpdateSegmentTitle={onUpdateSegmentTitle}
                onDeleteSegment={onDeleteSegment}
                onAddSlide={onAddSlide}
                onDuplicateSlide={onDuplicateSlide}
                onDeleteSlide={onDeleteSlide}
              />
            ))}
          </SortableContext>
        </div>

        <DragOverlay>
          {activeDragItem ? (
            <div className="px-3 py-2 rounded-lg bg-brand-surface border border-brand-accent shadow-2xl text-xs font-semibold text-brand-accent opacity-90">
              Dragging {activeDragItem.type}...
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </aside>
  );
}
