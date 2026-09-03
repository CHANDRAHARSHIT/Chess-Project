/**
 * /test-maia — a scratch page for playing against Maia-3 and judging whether it
 * feels human. Not linked from navigation; reached by URL.
 */

import TestMaiaBoard from "@/components/testmaia-TestMaiaBoard";

export default function TestMaiaPage() {
  return (
    <main className="min-h-screen bg-brand-bg">
      <TestMaiaBoard />
    </main>
  );
}
