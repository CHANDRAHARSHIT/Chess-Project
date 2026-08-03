import { Routes, Route } from 'react-router';
import MainLayout from '../layouts/MainLayout';
import MinimalLayout from '../layouts/MinimalLayout';
import { mainRoutes, minimalRoutes } from './routes';
import NotFoundPage from '../pages/NotFoundPage';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function AppRouter() {
  useDocumentTitle();

  return (
    <Routes>
      {/* Main layout wrapper (Navbar + Sidebar + Footer) */}
      <Route element={<MainLayout />}>
        {mainRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
      </Route>

      {/* Minimal layout wrapper (Navbar only, no Sidebar/Footer) */}
      <Route element={<MinimalLayout />}>
        {minimalRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
        {/* Wildcard 404 Page */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
