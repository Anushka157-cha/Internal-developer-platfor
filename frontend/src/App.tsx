import React, { Suspense, Component, ErrorInfo, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';

// Error Boundary to prevent any blank white screen in production
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in IDP frontend:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
            <div className="w-12 h-12 bg-red-500/20 text-red-400 rounded-xl flex items-center justify-center mx-auto mb-4 font-bold text-xl">
              !
            </div>
            <h2 className="text-xl font-bold mb-2">Platform Console Recovery</h2>
            <p className="text-xs text-slate-400 mb-4 font-mono bg-slate-950 p-3 rounded-lg border border-slate-800 text-left overflow-auto max-h-32">
              {this.state.error?.message || 'Unknown runtime error'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-indigo-600/20"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

export default App;
