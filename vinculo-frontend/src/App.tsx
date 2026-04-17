import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/auth-context';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Catalog from './pages/Catalog';
import ApiDetail from './pages/ApiDetail';
import Sandbox from './pages/Sandbox';
import Apps from './pages/Apps';
import Analytics from './pages/Analytics';
import Docs from './pages/Docs';
import Admin from './pages/Admin';
import Audit from './pages/Audit';
import Governance from './pages/Governance';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/catalog/:id" element={<ApiDetail />} />
          <Route path="/sandbox" element={<Sandbox />} />
          <Route path="/apps" element={<Apps />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/audit" element={<Audit />} />
          <Route path="/governance" element={<Governance />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
