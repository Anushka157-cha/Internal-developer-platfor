import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Server,
  Rocket,
  Flag,
  FileText,
  Shield,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Radio,
} from 'lucide-react';
import { useState } from 'react';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Services', href: '/services', icon: Server },
    { name: 'Deployments', href: '/deployments', icon: Rocket },
    { name: 'Feature Flags', href: '/feature-flags', icon: Flag },
    { name: 'Central Logs', href: '/logs', icon: FileText },
    { name: 'Audit Trail', href: '/audit', icon: Shield },
    ...(isAdmin ? [{ name: 'User Management', href: '/users', icon: Users }] : []),
    { name: 'Platform Settings', href: '/settings', icon: Settings },
  ];

  const getRoleBadge = (role?: string) => {
    const normalized = role?.toUpperCase();
    if (normalized === 'ADMIN') {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    if (normalized === 'DEVELOPER') {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800 transform transition-transform duration-300 ease-in-out flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-auto
      `}
      >
        {/* Logo and Brand */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800/80 bg-slate-950/80">
          <div className="flex items-center space-x-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/20">
              IDP
            </div>
            <div>
              <h1 className="text-base font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent leading-none">
                Platform Console
              </h1>
              <span className="text-[10px] text-cyan-400 font-mono tracking-wider">v2.0 PRODUCTION</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Live Cluster Indicator */}
        <div className="px-5 py-2.5 bg-slate-900/50 border-b border-slate-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-slate-400">
            <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono">Cluster Active</span>
          </div>
          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-mono">
            Postgres + Redis
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navigation.map((item) => {
            const isActive =
              location.pathname === item.href ||
              (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center px-3.5 py-2.5 text-sm font-medium rounded-lg transition-all
                  ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm shadow-indigo-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                  }
                `}
              >
                <item.icon className={`h-4.5 w-4.5 mr-3 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User profile & Role */}
        <div className="border-t border-slate-800/80 p-4 bg-slate-950/60">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-indigo-950 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-sm shadow-inner">
                {user?.firstName?.[0] || 'U'}
                {user?.lastName?.[0] || ''}
              </div>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold ${getRoleBadge(
                    user?.role,
                  )}`}
                >
                  {user?.role?.toUpperCase()}
                </span>
              </div>
            </div>
            <button
              onClick={() => logout()}
              className="ml-2 p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 hover:text-white"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="h-7 w-7 rounded bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">
              IDP
            </div>
            <span className="font-bold text-white text-sm">Platform Console</span>
          </div>
          <button onClick={() => logout()} className="text-slate-400 hover:text-red-400">
            <LogOut className="h-5 w-5" />
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
