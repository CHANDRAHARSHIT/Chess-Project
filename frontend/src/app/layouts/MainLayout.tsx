import SidebarLayout from '@/app/navigation/SidebarLayout';
import { Outlet } from 'react-router';

export default function MainLayout() {
  return (
    <SidebarLayout>
      <div className="flex-1 flex flex-col min-h-[calc(100vh-4rem)] relative">
        <div className="flex-1 relative">
          <Outlet />
        </div>
      </div>
    </SidebarLayout>
  );
}
