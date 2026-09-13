import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, Terminal, Eye, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'ADMIN' | 'DEVELOPER' | 'VIEWER') => {
    setError('');
    setLoading(true);
    try {
      await demoLogin(role);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Demo authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 text-white font-bold text-xl shadow-lg shadow-indigo-500/20 mb-3">
            IDP
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Internal Developer Platform</h2>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise multi-tenant microservices deployment & observability engine
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-7 shadow-xl backdrop-blur-sm">
          {error && (
            <div className="mb-4 p-3 bg-red-950/40 border border-red-800 text-red-300 rounded-lg text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-300 mb-1">
                Corporate Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                placeholder="dev@example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-300">
                  Password
                </label>
                <Link to="/forgot-password" className="text-[11px] text-indigo-400 hover:text-indigo-300">
                  Forgot Password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                placeholder="••••••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg text-xs font-semibold transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In with Credentials'}
            </button>
          </form>

          {/* Quick Demo Access Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-3">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span className="font-semibold text-slate-300">Evaluate with Demo Roles (Instant):</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('ADMIN')}
                disabled={loading}
                className="p-2 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/80 text-purple-300 rounded-lg text-[11px] font-mono font-semibold transition-all flex flex-col items-center"
              >
                <Shield className="h-4 w-4 mb-1 text-purple-400" />
                Admin
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('DEVELOPER')}
                disabled={loading}
                className="p-2 bg-blue-950/40 hover:bg-blue-900/60 border border-blue-800/80 text-blue-300 rounded-lg text-[11px] font-mono font-semibold transition-all flex flex-col items-center"
              >
                <Terminal className="h-4 w-4 mb-1 text-blue-400" />
                Developer
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('VIEWER')}
                disabled={loading}
                className="p-2 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/80 text-emerald-300 rounded-lg text-[11px] font-mono font-semibold transition-all flex flex-col items-center"
              >
                <Eye className="h-4 w-4 mb-1 text-emerald-400" />
                Viewer
              </button>
            </div>
          </div>

          <div className="mt-5 text-center text-xs text-slate-400">
            Need an account?{' '}
            <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold">
              Create platform account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
