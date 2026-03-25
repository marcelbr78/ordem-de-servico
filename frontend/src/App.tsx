import { Schedule } from './pages/Schedule';
import { Commissions } from './pages/Commissions';
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Público
import { Login } from './pages/Login';
import { LandingPage } from './pages/LandingPage';
import { SignupPage } from './pages/SignupPage';
import { PricingPage } from './pages/PricingPage';
import { PublicStatus } from './pages/PublicStatus';
import { MonitorDashboard } from './pages/MonitorDashboard';
import { Kiosk } from './pages/public/Kiosk';
import { MasterLogin } from './pages/MasterLogin';

// Sistema principal
import { Dashboard } from './pages/Dashboard';
import { Orders } from './pages/Orders';
import { Clients } from './pages/Clients';
import { Inventory } from './pages/Inventory';
import { Finance } from './pages/Finance';
import { AuditLogs } from './pages/AuditLogs';
import { BankAccounts } from './pages/BankAccounts';
import { Settings } from './pages/Settings';
import { Marketplace } from './pages/Marketplace';
import { SupplierManager } from './pages/smartparts/SupplierManager';
import { MasterInfra } from './pages/MasterInfra';
import { MasterSettings } from './pages/MasterSettings';

// Diagnóstico de placa
import { DiagnosticoIndex } from './pages/diagnostico/DiagnosticoIndex';
import { BoardSequence } from './pages/diagnostico/BoardSequence';
import { NewAnalysis } from './pages/diagnostico/NewAnalysis';
import { AnalysisResult } from './pages/diagnostico/AnalysisResult';
import { DiagnosticoPlaca } from './pages/DiagnosticoPlaca';
import { Reports } from './pages/Reports';
import { Kanban } from './pages/Kanban';
import { Warranty } from './pages/Warranty';
import { Fiscal } from './pages/Fiscal';
import { Suppliers } from './pages/Suppliers';

// Admin SaaS
import { MasterDashboard } from './admin/pages/MasterDashboard';
import { TenantsPage } from './admin/pages/TenantsPage';
import { TenantDetails } from './admin/pages/TenantDetails';
import { BillingPage } from './admin/pages/BillingPage';
import { PlansPage } from './admin/pages/PlansPage';
import { SignupMonitor } from './admin/pages/SignupMonitor';
import { AIInsights } from './admin/pages/AIInsights';
import { HealthMonitor } from './admin/pages/HealthMonitor';
import { SupportPage } from './admin/pages/SupportPage';
import { BroadcastsPage } from './admin/pages/BroadcastsPage';
import { OnboardingPage } from './admin/pages/OnboardingPage';
import { AnalyticsPage } from './admin/pages/AnalyticsPage';
import { AuditPage } from './admin/pages/AuditPage';
import { FeatureFlagsPage } from './admin/pages/FeatureFlagsPage';
import { KioskAdminPage } from './admin/pages/KioskAdminPage';
import { EvolutionManagerPage } from './admin/pages/EvolutionManagerPage';

// Layout unificado
import { AppLayout } from './layout/AppLayout';

// ── Guarda de rota privada ─────────────────────────────────────
const PrivateRoute: React.FC<{ children: React.ReactElement; requireAdmin?: boolean }> = ({ children, requireAdmin }) => {
  const { signed, loading, user } = useAuth();

  if (loading) {
    return (
      <div style={{ background: '#0a0a0c', height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', gap: '12px' }}>
        <div style={{ width: '18px', height: '18px', border: '2px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        Carregando...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!signed) return <Navigate to={requireAdmin ? '/portal-gestao/acesso' : '/login'} replace />;

  const isSuperAdmin = user?.role === 'super_admin' || (typeof user?.role === 'string' && user.role.toLowerCase() === 'super_admin');
  if (requireAdmin && !isSuperAdmin) return <Navigate to="/dashboard" replace />;

  return children;
};

// ── Dashboard redireciona super_admin para painel master ───────
const DashboardRoute: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin' || (typeof user?.role === 'string' && user.role.toLowerCase() === 'super_admin');
  const isShadowing = !!localStorage.getItem('shadow_tenant_id');

  if (isSuperAdmin && !isShadowing) return <Navigate to="/portal-gestao/inicio" replace />;

  return <AppLayout><Dashboard /></AppLayout>;
};

// ── Catch-all ──────────────────────────────────────────────────
const CatchAllRoute: React.FC = () => {
  const { user, signed } = useAuth();
  if (!signed) return <Navigate to="/" replace />;
  const isSuperAdmin = user?.role === 'super_admin' || (typeof user?.role === 'string' && user.role.toLowerCase() === 'super_admin');
  if (isSuperAdmin && !localStorage.getItem('shadow_tenant_id')) return <Navigate to="/portal-gestao/inicio" replace />;
  return <Navigate to="/dashboard" replace />;
};

// ── App ────────────────────────────────────────────────────────
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Público */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/status" element={<PublicStatus />} />
          <Route path="/status/:id" element={<PublicStatus />} />
          <Route path="/monitor" element={<MonitorDashboard />} />
          <Route path="/kiosk/:slug" element={<Kiosk />} />
          <Route path="/kiosk" element={<Kiosk />} />

          {/* Acesso master */}
          <Route path="/portal-gestao/acesso" element={<MasterLogin />} />
          <Route path="/masteradmin/login" element={<Navigate to="/portal-gestao/acesso" replace />} />
          <Route path="/masteradmin" element={<Navigate to="/portal-gestao/inicio" replace />} />
          <Route path="/portal-gestao" element={<Navigate to="/portal-gestao/inicio" replace />} />
          <Route path="/masteradmin/dashboard" element={<Navigate to="/portal-gestao/inicio" replace />} />

          {/* Sistema principal */}
          <Route path="/dashboard" element={<PrivateRoute><DashboardRoute /></PrivateRoute>} />
          <Route path="/orders" element={<PrivateRoute><AppLayout><Orders /></AppLayout></PrivateRoute>} />
          <Route path="/clients" element={<PrivateRoute><AppLayout><Clients /></AppLayout></PrivateRoute>} />
          <Route path="/inventory" element={<PrivateRoute><AppLayout><Inventory /></AppLayout></PrivateRoute>} />
          <Route path="/finance" element={<PrivateRoute><AppLayout><Finance /></AppLayout></PrivateRoute>} />
          <Route path="/bank-accounts" element={<PrivateRoute><AppLayout><BankAccounts /></AppLayout></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><AppLayout><Settings /></AppLayout></PrivateRoute>} />
          <Route path="/audit" element={<PrivateRoute><AppLayout><AuditLogs /></AppLayout></PrivateRoute>} />
          <Route path="/reports" element={<PrivateRoute><AppLayout><Reports /></AppLayout></PrivateRoute>} />
          <Route path="/schedule" element={<PrivateRoute><AppLayout><Schedule /></AppLayout></PrivateRoute>} />
          <Route path="/kanban" element={<PrivateRoute><AppLayout><Kanban /></AppLayout></PrivateRoute>} />
          <Route path="/warranty" element={<PrivateRoute><AppLayout><Warranty /></AppLayout></PrivateRoute>} />
          <Route path="/fiscal" element={<PrivateRoute><AppLayout><Fiscal /></AppLayout></PrivateRoute>} />
          <Route path="/commissions" element={<PrivateRoute><AppLayout><Commissions /></AppLayout></PrivateRoute>} />
          <Route path="/suppliers" element={<PrivateRoute><AppLayout><Suppliers /></AppLayout></PrivateRoute>} />
          <Route path="/marketplace" element={<PrivateRoute><AppLayout><Marketplace /></AppLayout></PrivateRoute>} />
          <Route path="/smartparts/suppliers" element={<PrivateRoute><AppLayout><SupplierManager /></AppLayout></PrivateRoute>} />

          {/* Diagnóstico de placa */}
          <Route path="/diagnostico" element={<PrivateRoute><AppLayout><DiagnosticoIndex /></AppLayout></PrivateRoute>} />
          <Route path="/diagnostico/board/:id" element={<PrivateRoute><AppLayout><BoardSequence /></AppLayout></PrivateRoute>} />
          <Route path="/diagnostico/board/:id/new-analysis" element={<PrivateRoute><AppLayout><NewAnalysis /></AppLayout></PrivateRoute>} />
          <Route path="/diagnostico/result/:id" element={<PrivateRoute><AppLayout><AnalysisResult /></AppLayout></PrivateRoute>} />
          <Route path="/diagnostico-placa" element={<PrivateRoute><AppLayout><DiagnosticoPlaca /></AppLayout></PrivateRoute>} />

          {/* Admin SaaS */}
          <Route path="/portal-gestao/inicio" element={<PrivateRoute requireAdmin><AppLayout><MasterDashboard /></AppLayout></PrivateRoute>} />
          <Route path="/masteradmin/tenants" element={<PrivateRoute requireAdmin><AppLayout><TenantsPage /></AppLayout></PrivateRoute>} />
          <Route path="/masteradmin/tenants/:id" element={<PrivateRoute requireAdmin><AppLayout><TenantDetails /></AppLayout></PrivateRoute>} />
          <Route path="/masteradmin/billing" element={<PrivateRoute requireAdmin><AppLayout><BillingPage /></AppLayout></PrivateRoute>} />
          <Route path="/masteradmin/plans" element={<PrivateRoute requireAdmin><AppLayout><PlansPage /></AppLayout></PrivateRoute>} />
          <Route path="/masteradmin/signups" element={<PrivateRoute requireAdmin><AppLayout><SignupMonitor /></AppLayout></PrivateRoute>} />
          <Route path="/masteradmin/insights" element={<PrivateRoute requireAdmin><AppLayout><AIInsights /></AppLayout></PrivateRoute>} />
          <Route path="/masteradmin/health" element={<PrivateRoute requireAdmin><AppLayout><HealthMonitor /></AppLayout></PrivateRoute>} />
          <Route path="/masteradmin/support" element={<PrivateRoute requireAdmin><AppLayout><SupportPage /></AppLayout></PrivateRoute>} />
          <Route path="/masteradmin/broadcasts" element={<PrivateRoute requireAdmin><AppLayout><BroadcastsPage /></AppLayout></PrivateRoute>} />
          <Route path="/masteradmin/onboarding" element={<PrivateRoute requireAdmin><AppLayout><OnboardingPage /></AppLayout></PrivateRoute>} />
          <Route path="/masteradmin/analytics" element={<PrivateRoute requireAdmin><AppLayout><AnalyticsPage /></AppLayout></PrivateRoute>} />
          <Route path="/masteradmin/audit" element={<PrivateRoute requireAdmin><AppLayout><AuditPage /></AppLayout></PrivateRoute>} />
          <Route path="/masteradmin/feature-flags" element={<PrivateRoute requireAdmin><AppLayout><FeatureFlagsPage /></AppLayout></PrivateRoute>} />
          <Route path="/masteradmin/infra" element={<PrivateRoute requireAdmin><AppLayout><MasterInfra /></AppLayout></PrivateRoute>} />
          <Route path="/masteradmin/evolution" element={<PrivateRoute requireAdmin><AppLayout><EvolutionManagerPage /></AppLayout></PrivateRoute>} />
          <Route path="/masteradmin/kiosk" element={<PrivateRoute requireAdmin><AppLayout><KioskAdminPage /></AppLayout></PrivateRoute>} />
          <Route path="/masteradmin/settings" element={<PrivateRoute requireAdmin><AppLayout><MasterSettings /></AppLayout></PrivateRoute>} />
          <Route path="/masteradmin/audit" element={<PrivateRoute requireAdmin><AppLayout><AuditLogs isGlobal /></AppLayout></PrivateRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<CatchAllRoute />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
