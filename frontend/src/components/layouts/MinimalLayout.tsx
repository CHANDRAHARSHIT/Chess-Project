import { Outlet } from "react-router";

export default function MinimalLayout() {
  return (
    <div className="min-h-screen text-brand-text bg-brand-bg flex flex-col relative select-none">
      <main className="flex-1 flex flex-col min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
