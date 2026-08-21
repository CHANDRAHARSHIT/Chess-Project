
import { Outlet } from 'react-router';

export default function MinimalLayout() {
  return (
    <div className="min-h-screen text-brand-text bg-brand-bg flex flex-col relative select-none">

      {/* Main content viewport with top padding for the fixed header */}
      <div className="flex flex-1 pt-16 flex-col">
        <main className="flex-1 flex flex-col min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
