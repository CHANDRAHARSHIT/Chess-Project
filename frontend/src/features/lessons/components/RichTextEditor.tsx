import { useEffect, useRef, useState } from "react";
import { ExternalLink, Link as LinkIcon } from "lucide-react";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  onContextMenu?: (x: number, y: number) => void;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Click anywhere to begin typing your lesson content...",
  onContextMenu,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeLink, setActiveLink] = useState<{ url: string; x: number; y: number } | null>(null);

  // Sync internal HTML content when external content changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      if (document.activeElement !== editorRef.current) {
        editorRef.current.innerHTML = content;
      }
    }
  }, [content]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (anchor && anchor.getAttribute("href")) {
        const url = anchor.getAttribute("href") || "";
        const rect = anchor.getBoundingClientRect();
        const editorRect = editor.getBoundingClientRect();
        setActiveLink({
          url,
          x: Math.max(0, rect.left - editorRect.left),
          y: Math.max(0, rect.top - editorRect.top - 36),
        });
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      const related = e.relatedTarget as HTMLElement;
      if (!related || !related.closest?.(".link-hover-tooltip")) {
        setActiveLink(null);
      }
    };

    editor.addEventListener("mouseover", handleMouseOver);
    editor.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      editor.removeEventListener("mouseover", handleMouseOver);
      editor.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const isEmpty =
    !content ||
    content.trim() === "" ||
    content.trim() === "<br>" ||
    content.trim() === "<p></p>";

  return (
    <div className="relative flex-1 w-full min-h-[350px]">
      {isEmpty && (
        <div className="absolute top-0 left-0 text-brand-secondary/40 font-sans text-base pointer-events-none select-none leading-relaxed">
          {placeholder}
        </div>
      )}

      {/* Floating Link Hover Tooltip */}
      {activeLink && (
        <div
          style={{ top: `${activeLink.y}px`, left: `${activeLink.x}px` }}
          className="link-hover-tooltip absolute z-50 flex items-center gap-2 px-3 py-1.5 bg-brand-surface border border-brand-border rounded-lg shadow-2xl text-xs font-sans text-brand-text select-none animate-in fade-in zoom-in-95 duration-100"
          onMouseLeave={() => setActiveLink(null)}
        >
          <LinkIcon className="w-3.5 h-3.5 text-brand-accent shrink-0" />
          <span className="max-w-[200px] truncate font-mono text-[11px] text-brand-text">
            {activeLink.url}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open(activeLink.url, "_blank", "noopener,noreferrer");
            }}
            className="flex items-center gap-1 text-[11px] font-medium text-brand-accent hover:underline cursor-pointer pl-1 border-l border-brand-border/40"
          >
            <span>Open</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      )}

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onContextMenu={(e) => {
          e.preventDefault();
          onContextMenu?.(e.clientX, e.clientY);
        }}
        className="w-full min-h-[350px] outline-none font-sans text-brand-text text-base leading-relaxed break-words space-y-3 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-brand-text [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-brand-text [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-medium [&_h3]:text-brand-text [&_h3]:mb-2 [&_p]:text-base [&_p]:text-brand-text [&_p]:leading-relaxed [&_p]:mb-3 [&_ul]:list-disc [&_ul]:list-inside [&_ul]:space-y-1 [&_ul]:my-2 [&_ul]:pl-2 [&_ul]:text-brand-text [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:space-y-1 [&_ol]:my-2 [&_ol]:pl-2 [&_ol]:text-brand-text [&_li]:leading-relaxed [&_li]:text-brand-text [&_blockquote]:border-l-4 [&_blockquote]:border-brand-accent [&_blockquote]:bg-brand-accent/10 [&_blockquote]:px-4 [&_blockquote]:py-2.5 [&_blockquote]:my-3 [&_blockquote]:rounded-r [&_blockquote]:text-brand-text/90 [&_blockquote]:italic [&_blockquote]:font-sans [&_hr]:border-brand-border/80 [&_hr]:my-4 [&_a]:text-brand-accent [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-brand-accent-hover"
      />
    </div>
  );
}
