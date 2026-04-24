import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';

// Pages
import LandingPage from '@/pages/LandingPage';
import AuthPage from '@/pages/AuthPage';
import CatalogPage from '@/pages/CatalogPage';
import ApiDetailPage from '@/pages/ApiDetailPage';
import SandboxPage from '@/pages/SandboxPage';
import AdminPage from '@/pages/AdminPage';
import ObservabilityPage from '@/pages/ObservabilityPage';
import AnalyticsPage from '@/pages/AnalyticsPage';

export function AppRouter() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/catalog/:apiId" element={<ApiDetailPage />} />
        <Route path="/sandbox/:apiId" element={<SandboxPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/observability" element={<ObservabilityPage />} />
      </Route>
    </Routes>
  );
}
