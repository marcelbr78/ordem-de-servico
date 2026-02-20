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
import { PublicStatus } from './pages/PublicStatus';
import { SupplierManager } from './pages/smartparts/SupplierManager';
import { Settings } from './pages/Settings';
import { Layout } from './components/Layout';
import { Kiosk } from './pages/public/Kiosk';
// import { TestForm } from './pages/TestForm'; REMOVED

const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { signed, loading } = useAuth();

  if (loading) return <div>Carregando...</div>;
  if (!signed) return <Navigate to="/login" />;

  return children;
};

// ... (imports)

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          {/* <Route path="/test-layout" element={<TestForm />} /> REMOVED */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout>
                  <Dashboard />
                </Layout>
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
            path="/audit"
            element={
              <PrivateRoute>
                <Layout>
                  <AuditLogs />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route path="/status" element={<PublicStatus />} />
          <Route path="/status/:id" element={<PublicStatus />} />
          <Route path="/kiosk" element={<Kiosk />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
