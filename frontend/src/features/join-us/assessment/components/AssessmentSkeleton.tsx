/**
 * Loading skeleton shown while the initial GET /api/assessments/:track
 * request is in flight, so the page doesn't jump from blank to fully
 * populated — it mirrors AssessmentShell's actual layout (header, purpose
 * card, question card, navigator sidebar) with pulsing placeholder blocks.
 */
export default function AssessmentSkeleton() {
  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col animate-pulse">
      {/* Header */}
      <header className="border-b border-brand-text/15 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-brand-text/10" />
          <div className="h-5 w-px bg-brand-text/10" />
          <div className="flex flex-col gap-1.5">
            <div className="h-2.5 w-20 rounded bg-brand-text/10" />
            <div className="h-2.5 w-32 rounded bg-brand-text/10" />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-6 sm:pt-8 flex-1 space-y-6">
        {/* Purpose card */}
        <div className="bg-brand-surface/80 rounded-2xl border border-brand-text/15 p-5 space-y-2">
          <div className="h-2.5 w-16 rounded bg-brand-text/10" />
          <div className="h-3 w-full max-w-md rounded bg-brand-text/10" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Question card */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-brand-surface rounded-3xl border border-brand-text/15 p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-brand-text/10">
                <div className="h-3 w-28 rounded bg-brand-text/10" />
                <div className="h-8 w-24 rounded-xl bg-brand-text/10" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-brand-text/10" />
                <div className="h-4 w-full rounded bg-brand-text/10" />
                <div className="h-4 w-2/3 rounded bg-brand-text/10" />
              </div>
              <div className="space-y-3">
                <div className="h-12 w-full rounded-xl bg-brand-text/10" />
                <div className="h-12 w-full rounded-xl bg-brand-text/10" />
              </div>
            </div>
          </div>

          {/* Navigator sidebar (desktop only, matches real layout) */}
          <div className="hidden lg:block lg:col-span-4 space-y-6">
            <div className="bg-brand-surface rounded-2xl border border-brand-text/15 p-5 space-y-4">
              <div className="h-3 w-32 rounded bg-brand-text/10" />
              <div className="grid grid-cols-4 gap-2.5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-10 rounded-xl bg-brand-text/10" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
