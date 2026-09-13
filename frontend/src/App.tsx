import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';

// Lazy-loaded routes for code-splitting and production performance
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const SignupPage = React.lazy(() => import('./pages/auth/SignupPage'));
const ForgotPasswordPage = React.lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = React.lazy(() => import('./pages/auth/ResetPasswordPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const ServicesPage = React.lazy(() => import('./pages/services/ServicesPage'));
const ServiceDetailPage = React.lazy(() => import('./pages/services/ServiceDetailPage'));
const DeploymentsPage = React.lazy(() => import('./pages/deployments/DeploymentsPage'));
const DeploymentDetailPage = React.lazy(() => import('./pages/deployments/DeploymentDetailPage'));
const FeatureFlagsPage = React.lazy(() => import('./pages/feature-flags/FeatureFlagsPage'));
const AuditLogsPage = React.lazy(() => import('./pages/audit/AuditLogsPage'));
const LogsPage = React.lazy(() => import('./pages/logs/LogsPage'));
const UsersPage = React.lazy(() => import('./pages/users/UsersPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center space-y-3">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-mono text-slate-400">Loading module...</span>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            <Route
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/services/:id" element={<ServiceDetailPage />} />
              <Route path="/deployments" element={<DeploymentsPage />} />
              <Route path="/deployments/:id" element={<DeploymentDetailPage />} />
              <Route path="/feature-flags" element={<FeatureFlagsPage />} />
              <Route path="/logs" element={<LogsPage />} />
              <Route path="/audit" element={<AuditLogsPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
