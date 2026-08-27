interface CodeBlockProps {
  code: string;
  language?: string;
  /** Set false when embedding inside a container that already has its own header/tabs. */
  showHeader?: boolean;
}

/**
 * Read-only, line-numbered code display for reference pseudocode (e.g. a
 * question's static codeBlock, or a "Functions Definition" supporting tab).
 * Uses theme tokens (not a hardcoded black) so it matches light/dark mode,
 * and `whitespace-pre` so indentation is never collapsed.
 */
export default function CodeBlock({ code, language = 'Pseudocode', showHeader = true }: CodeBlockProps) {
  const lines = code.split('\n');

  return (
    <div className="w-full bg-brand-bg font-mono text-xs sm:text-sm">
      {showHeader && (
        <div className="flex items-center px-4 py-2.5 bg-brand-surface/90 border-b border-brand-text/15">
          <span className="text-xs font-mono uppercase tracking-wider text-brand-accent">
            {language}
          </span>
        </div>
      )}

      <div className="flex overflow-x-auto">
        <div
          className="select-none py-3 pl-3 pr-2 text-right text-brand-secondary/40 font-mono text-xs sm:text-sm border-r border-brand-text/10 leading-6 min-w-[2.5rem]"
          aria-hidden="true"
        >
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        <pre className="flex-1 p-3 m-0 text-brand-text font-mono text-xs sm:text-sm leading-6 whitespace-pre">
          {code}
        </pre>
      </div>
    </div>
  );
}
