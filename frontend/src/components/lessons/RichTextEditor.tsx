import { useEffect, useRef } from "react";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Click anywhere to begin typing your lesson content...",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync internal HTML content when external content changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      if (document.activeElement !== editorRef.current) {
        editorRef.current.innerHTML = content;
      }
    }
  }, [content]);

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

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        className="w-full min-h-[350px] outline-none font-sans text-brand-text text-base leading-relaxed break-words space-y-3 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-brand-text [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-brand-text [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-medium [&_h3]:text-brand-text [&_h3]:mb-2 [&_p]:text-base [&_p]:text-brand-text [&_p]:leading-relaxed [&_p]:mb-3"
      />
    </div>
  );
}
