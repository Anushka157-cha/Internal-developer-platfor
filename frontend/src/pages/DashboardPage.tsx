import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import {
  Server,
  Rocket,
  Flag,
  CheckCircle2,
  Clock,
  RotateCcw,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Link } from 'react-router-dom';

interface DashboardMetricsResponse {
  overview: {
    totalServices: number;
    healthyServices: number;
    degradedServices: number;
    downServices: number;
    totalDeployments: number;
    activeDeployments: number;
    successfulDeployments: number;
    failedDeployments: number;
    deploymentSuccessRate: number;
    averageDeploymentDurationSeconds: number;
    totalFeatureFlags: number;
  };
  deploymentTrends: {
    day: string;
    date: string;
    deployments: number;
    successful: number;
    failed: number;
  }[];
  recentDeployments: Array<{
    id: string;
    version: string;
    environment: string;
    status: string;
    currentStep?: string;
    durationSeconds?: number;
    createdAt: string;
    service?: {
      name: string;
    };
    isRollback?: boolean;
  }>;
  serviceHealthDistribution: {
    name: string;
    value: number;
    color: string;
  }[];
}

export default function DashboardPage() {
  const { data: metrics, isLoading, error, refetch } = useQuery<DashboardMetricsResponse>({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const response = await api.get('/dashboard/metrics');
      return response.data;
    },
    refetchInterval: 10000, // auto-refresh metrics every 10 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-mono text-sm">Aggregating telemetry and deployment telemetry...</p>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-6 bg-red-950/30 border border-red-800/60 rounded-xl text-red-200">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-6 w-6 text-red-400" />
          <div>
            <h3 className="text-lg font-bold">Failed to load real dashboard telemetry</h3>
            <p className="text-sm text-red-300/80 mt-1">
              Ensure PostgreSQL and backend are accessible. Error:{' '}
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          Retry Telemetry Query
        </button>
      </div>
    );
  }

  const overview = metrics?.overview || {
    totalServices: 0,
    healthyServices: 0,
    degradedServices: 0,
    downServices: 0,
    totalDeployments: 0,
    activeDeployments: 0,
    successfulDeployments: 0,
    failedDeployments: 0,
    deploymentSuccessRate: 100,
    averageDeploymentDurationSeconds: 0,
    totalFeatureFlags: 0,
  };
  const deploymentTrends = Array.isArray(metrics?.deploymentTrends) ? metrics.deploymentTrends : [];
  const recentDeployments = Array.isArray(metrics?.recentDeployments) ? metrics.recentDeployments : [];

  const statCards = [
    {
      name: 'Registered Services',
      value: overview.totalServices ?? 0,
      subValue: `${overview.healthyServices ?? 0} Healthy • ${overview.degradedServices ?? 0} Degraded`,
      icon: Server,
      accent: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
    },
    {
      name: 'Deployments Processed',
      value: overview.totalDeployments ?? 0,
      subValue: `${overview.successfulDeployments ?? 0} Successful • ${overview.failedDeployments ?? 0} Failed`,
      icon: Rocket,
      accent: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    },
    {
      name: 'Success Rate',
      value: `${overview.deploymentSuccessRate ?? 100}%`,
      subValue: overview.totalDeployments === 0 ? 'No deployments yet' : `Calculated across all runs`,
      icon: CheckCircle2,
      accent: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
    },
    {
      name: 'Avg Deployment Duration',
      value: `${overview.averageDeploymentDurationSeconds ?? 0}s`,
      subValue: 'Real duration from queue to health-check',
      icon: Clock,
      accent: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    },
    {
      name: 'Active Feature Flags',
      value: overview.totalFeatureFlags ?? 0,
      subValue: 'SHA-256 deterministic rollout',
      icon: Flag,
      accent: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-emerald-950 text-emerald-300 border-emerald-700';
      case 'failed':
        return 'bg-red-950 text-red-300 border-red-700';
      case 'running':
        return 'bg-blue-950 text-blue-300 border-blue-700 animate-pulse';
      case 'queued':
        return 'bg-amber-950 text-amber-300 border-amber-700';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Platform Observability</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time telemetry aggregated from PostgreSQL, BullMQ, and active microservices.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/deployments"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Rocket className="h-4 w-4 mr-2" />
            Trigger Deployment
          </Link>
          <Link
            to="/services"
            className="inline-flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-sm font-semibold transition-all"
          >
            <Server className="h-4 w-4 mr-2" />
            Registry
          </Link>
        </div>
      </div>

      {/* Real Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.name}
              className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{card.name}</span>
                <div className={`p-2 rounded-lg border ${card.accent}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold font-mono text-white tracking-tight">
                  {card.value}
                </span>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug truncate">{card.subValue}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Deployment Velocity Trend Chart */}
        <div className="lg:col-span-2 bg-slate-950/70 border border-slate-800/80 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">7-Day Deployment Velocity</h2>
              <p className="text-xs text-slate-400">Actual daily execution volume recorded in database</p>
            </div>
            <div className="flex items-center space-x-4 text-xs font-mono">
              <span className="flex items-center text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block mr-1.5" />
                Successful
              </span>
              <span className="flex items-center text-red-400">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block mr-1.5" />
                Failed
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={deploymentTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis allowDecimals={false} stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '0.5rem',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="successful"
                  name="Successful"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSuccess)"
                />
                <Area
                  type="monotone"
                  dataKey="failed"
                  name="Failed"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorFailed)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service Health Distribution Donut */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Service Health Distribution</h2>
            <p className="text-xs text-slate-400">Live HTTP probe status across registry</p>
          </div>

          <div className="h-52 w-full my-2 flex flex-col items-center justify-center">
            {/* SVG Circular Donut Chart */}
            <div className="relative flex items-center justify-center">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Track Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  className="text-slate-800/80 stroke-current"
                  strokeWidth="10"
                  fill="transparent"
                />
                {/* Healthy Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  className="text-emerald-500 transition-all duration-1000 ease-out stroke-current"
                  strokeWidth="10"
                  strokeDasharray="238.76"
                  strokeDashoffset={
                    238.76 - (238.76 * ((overview.healthyServices ?? 0) / Math.max(overview.totalServices || 1, 1)))
                  }
                  strokeLinecap="round"
                  fill="transparent"
                />
                {/* Degraded Ring */}
                {(overview.degradedServices ?? 0) > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    className="text-amber-500 stroke-current"
                    strokeWidth="10"
                    strokeDasharray="238.76"
                    strokeDashoffset={
                      238.76 - (238.76 * ((overview.degradedServices ?? 0) / Math.max(overview.totalServices || 1, 1)))
                    }
                    strokeLinecap="round"
                    fill="transparent"
                  />
                )}
                {/* Down Ring */}
                {(overview.downServices ?? 0) > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    className="text-red-500 stroke-current"
                    strokeWidth="10"
                    strokeDasharray="238.76"
                    strokeDashoffset={
                      238.76 - (238.76 * ((overview.downServices ?? 0) / Math.max(overview.totalServices || 1, 1)))
                    }
                    strokeLinecap="round"
                    fill="transparent"
                  />
                )}
              </svg>
              {/* Center Metrics Text */}
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-bold font-mono text-white">
                  {overview.totalServices ?? 0}
                </span>
                <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">
                  Services
                </span>
              </div>
            </div>

            {/* Microservice Health Indicators */}
            <div className="flex items-center space-x-3 mt-3 text-xs">
              <span className="flex items-center text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-1.5" />
                Healthy
              </span>
              <span className="flex items-center text-amber-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block mr-1.5" />
                Degraded
              </span>
              <span className="flex items-center text-red-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block mr-1.5" />
                Down
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 grid grid-cols-3 text-center text-xs">
            <div>
              <span className="text-emerald-400 font-bold text-base font-mono">
                {overview.healthyServices}
              </span>
              <p className="text-slate-500 text-[10px]">Healthy</p>
            </div>
            <div>
              <span className="text-amber-400 font-bold text-base font-mono">
                {overview.degradedServices}
              </span>
              <p className="text-slate-500 text-[10px]">Degraded</p>
            </div>
            <div>
              <span className="text-red-400 font-bold text-base font-mono">
                {overview.downServices}
              </span>
              <p className="text-slate-500 text-[10px]">Down</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Deployments Table */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Recent Deployment Pipeline Runs</h2>
            <p className="text-xs text-slate-400">Audited transitions executed via BullMQ workers</p>
          </div>
          <Link
            to="/deployments"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 inline-flex items-center"
          >
            View All Runs <ExternalLink className="h-3 w-3 ml-1" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-800/80 uppercase font-mono">
              <tr>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">Environment</th>
                <th className="py-3 px-4">Pipeline Status</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Triggered At</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-200">
              {recentDeployments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No deployment pipeline executions recorded yet.
                  </td>
                </tr>
              ) : (
                recentDeployments.map((dep) => (
                  <tr key={dep.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white flex items-center space-x-2">
                      {dep.isRollback && (
                        <span title="Rollback">
                          <RotateCcw className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                        </span>
                      )}
                      <span>{dep.service?.name || 'Service'}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-cyan-300">{dep.version}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 border border-slate-700 text-slate-300">
                        {dep.environment}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase border font-semibold ${getStatusBadge(
                          dep.status,
                        )}`}
                      >
                        {dep.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {dep.durationSeconds ? `${dep.durationSeconds}s` : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(dep.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/deployments/${dep.id}`}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 font-mono text-[11px] transition-colors"
                      >
                        Tracker →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
