import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Orders } from './pages/Orders';
import { Clients } from './pages/Clients';
import { Inventory } from './pages/Inventory';
import { Finance } from './pages/Finance';
import { AuditLogs } from './pages/AuditLogs';
import { BankAccounts } from './pages/BankAccounts';
import { PublicStatus } from './pages/PublicStatus';
import { MonitorDashboard } from './pages/MonitorDashboard';
import { SupplierManager } from './pages/smartparts/SupplierManager';
import { LandingPage } from './pages/LandingPage';
import { Settings } from './pages/Settings';
import { Tenants } from './pages/Tenants';
import { Layout } from './components/Layout';
import { Kiosk } from './pages/public/Kiosk';
import { MasterLayout } from './components/MasterLayout';
import { MasterDashboard } from './pages/MasterDashboard';
import { MasterBilling } from './pages/MasterBilling';
import { MasterInfra } from './pages/MasterInfra';
import { MasterSettings } from './pages/MasterSettings';
import { MasterLogin } from './pages/MasterLogin';
import { DebugAuth } from './pages/DebugAuth';
import { useLocation } from 'react-router-dom';

const LocationLogger: React.FC = () => {
  const location = useLocation();
  React.useEffect(() => {
    console.log('[Navigation] Route changed to:', location.pathname + location.search);
  }, [location]);
  return null;
};

// Debug component to verify what's happening
const RouteDebugger: React.FC<{ name: string, children: React.ReactNode }> = ({ name, children }) => {
  return (
    <>
      <div style={{ position: 'fixed', bottom: 10, right: 10, background: 'rgba(0,0,0,0.5)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', zIndex: 9999, pointerEvents: 'none' }}>
        Render: {name}
      </div>
      {children}
    </>
  );
};

const PrivateRoute: React.FC<{ children: React.ReactElement, requireAdmin?: boolean }> = ({ children, requireAdmin }) => {
  const { signed, loading, user } = useAuth();

  if (loading) return <div style={{ background: '#0a0a0c', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Carregando Segurança...</div>;
  if (!signed) {
    if (requireAdmin) {
      return <Navigate to="/portal-gestao/acesso" />;
    }
    return <Navigate to="/login" />;
  }

  const isSuperAdmin = user?.role === 'super_admin' || (typeof user?.role === 'string' && user.role.toLowerCase() === 'super_admin');

  if (requireAdmin && !isSuperAdmin) {
    console.warn('[Routing] Bloqueado: Tentativa de acesso Master sem permissão SaaS. Role:', user?.role);
    return <Navigate to="/dashboard" />;
  }

  return children;
};

const CatchAllRoute: React.FC = () => {
  const { user, signed } = useAuth();
  console.log('[Routing] CatchAll triggered for:', window.location.pathname, 'Signed:', signed);

  if (!signed) {
    console.log('[Routing] CatchAll: Not signed, redirecting to /');
    return <Navigate to="/" />;
  }

  const isSuperAdmin = user?.role === 'super_admin' || (typeof user?.role === 'string' && user.role.toLowerCase() === 'super_admin');
  if (isSuperAdmin && !localStorage.getItem('shadow_tenant_id')) {
    console.log('[Routing] CatchAll: Super Admin, redirecting to Master Dashboard');
    return <Navigate to="/portal-gestao/inicio" />;
  }

  // If signed in but not super admin or shadowing, and no other route matched,
  // or if a standard user hits a non-existent route, redirect to dashboard.
  // This also handles the case where a standard user tries to access a master admin route directly.
  if (signed) {
    console.log('[Routing] CatchAll: Standard User, redirecting to Dashboard');
    return <Navigate to="/dashboard" />;
  }

  // Fallback for any other unhandled case, though the above should cover most.
  return (
    <div style={{ padding: '50px', color: 'white', textAlign: 'center' }}>
      <h1>404 - Rota não encontrada</h1>
      <p>Você tentou acessar: {window.location.pathname}</p>
      <button onClick={() => window.location.href = '/'}>Voltar para Início</button>
    </div>
  );
};

const DashboardRoute: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin' || (typeof user?.role === 'string' && user.role.toLowerCase() === 'super_admin');
  const isShadowing = !!localStorage.getItem('shadow_tenant_id');

  if (isSuperAdmin && !isShadowing) {
    console.log('[Routing] Super Admin detectado no Dashboard, desviando para Admin Panel. Role:', user?.role);
    return <Navigate to="/portal-gestao/inicio" replace />;
  }
  return (
    <Layout>
      <Dashboard />
    </Layout>
  );
};

function App() {
  console.log('[App] Rendering at:', window.location.pathname);
  return (
    <BrowserRouter>
      <LocationLogger />
      <AuthProvider>
        <Routes>
          <Route path="/portal-gestao/acesso" element={<RouteDebugger name="MasterLogin"><MasterLogin /></RouteDebugger>} />
          <Route path="/portal-gestao" element={<Navigate to="/portal-gestao/inicio" replace />} />
          <Route path="/masteradmin" element={<Navigate to="/portal-gestao/inicio" replace />} />
          <Route path="/masteradmin/login" element={<Navigate to="/portal-gestao/acesso" replace />} />
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<RouteDebugger name="StoreLogin"><Login /></RouteDebugger>} />
          {/* <Route path="/test-layout" element={<TestForm />} /> REMOVED */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardRoute />
              </PrivateRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <PrivateRoute>
                <Layout>
                  <Orders />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/clients"
            element={
              <PrivateRoute>
                <Layout>
                  <Clients />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <PrivateRoute>
                <Layout>
                  <Inventory />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/finance"
            element={
              <PrivateRoute>
                <Layout>
                  <Finance />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/smartparts/suppliers"
            element={
              <PrivateRoute>
                <Layout>
                  <SupplierManager />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <Layout>
                  <Settings />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/audit"
            element={
              <PrivateRoute>
                <Layout>
                  <AuditLogs />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/bank-accounts"
            element={
              <PrivateRoute>
                <Layout>
                  <BankAccounts />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<RouteDebugger name="StoreLogin"><Login /></RouteDebugger>} />
          <Route
            path="/portal-gestao/inicio"
            element={
              <PrivateRoute requireAdmin>
                <MasterLayout>
                  <MasterDashboard />
                </MasterLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/masteradmin/dashboard"
            element={<Navigate to="/portal-gestao/inicio" replace />}
          />
          <Route
            path="/masteradmin/tenants"
            element={
              <PrivateRoute requireAdmin>
                <MasterLayout>
                  <Tenants />
                </MasterLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/masteradmin/billing"
            element={
              <PrivateRoute requireAdmin>
                <MasterLayout>
                  <MasterBilling />
                </MasterLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/masteradmin/infra"
            element={
              <PrivateRoute requireAdmin>
                <MasterLayout>
                  <MasterInfra />
                </MasterLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/masteradmin/settings"
            element={
              <PrivateRoute requireAdmin>
                <MasterLayout>
                  <MasterSettings />
                </MasterLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/masteradmin/audit"
            element={
              <PrivateRoute requireAdmin>
                <MasterLayout>
                  <AuditLogs isGlobal />
                </MasterLayout>
              </PrivateRoute>
            }
          />
          <Route path="/status" element={<PublicStatus />} />
          <Route path="/status/:id" element={<PublicStatus />} />
          <Route path="/monitor" element={<MonitorDashboard />} />
          <Route path="/kiosk" element={<Kiosk />} />
          <Route path="/debug-auth" element={<DebugAuth />} />
          {/* Public access catch-all */}
          <Route path="*" element={<CatchAllRoute />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
