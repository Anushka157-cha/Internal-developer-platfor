import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  Rocket,
  RotateCcw,
  Plus,
  Filter,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface DeploymentItem {
  id: string;
  serviceId: string;
  version: string;
  environment: string;
  status: string;
  currentStep?: string;
  progressPercentage?: number;
  durationSeconds?: number;
  failureReason?: string;
  isRollback?: boolean;
  rollbackOfDeploymentId?: string;
  createdAt: string;
  service?: {
    id: string;
    name: string;
    environment: string;
  };
  triggeredBy?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

interface ServiceItem {
  id: string;
  name: string;
  environment: string;
  currentVersion?: string;
}

export default function DeploymentsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [version, setVersion] = useState('');
  const [commitHash, setCommitHash] = useState('');
  const [modalError, setModalError] = useState('');

  const canDeploy = user?.role?.toUpperCase() === 'ADMIN' || user?.role?.toUpperCase() === 'DEVELOPER';

  // Fetch deployments with refetch
  const { data: deploymentsData, isLoading, refetch } = useQuery<{
    data: DeploymentItem[];
    meta: { total: number; page: number; totalPages: number };
  }>({
    queryKey: ['deployments-list', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      const res = await api.get(`/deployments?${params.toString()}`);
      return res.data;
    },
    refetchInterval: 5000,
  });

  // Fetch services for create modal
  const { data: services } = useQuery<ServiceItem[]>({
    queryKey: ['services-options'],
    queryFn: async () => {
      const res = await api.get('/services');
      return res.data;
    },
    enabled: isModalOpen,
  });

  // Trigger deployment mutation
  const triggerMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/deployments', {
        serviceId: selectedServiceId,
        version: version.trim() || undefined,
        commitHash: commitHash.trim() || undefined,
      });
      return res.data;
    },
    onSuccess: (newDep) => {
      setIsModalOpen(false);
      setSelectedServiceId('');
      setVersion('');
      setCommitHash('');
      queryClient.invalidateQueries({ queryKey: ['deployments-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      navigate(`/deployments/${newDep.id}`);
    },
    onError: (err: any) => {
      setModalError(err.response?.data?.message || 'Failed to dispatch deployment');
    },
  });

  // Rollback mutation
  const rollbackMutation = useMutation({
    mutationFn: async (deploymentId: string) => {
      const res = await api.post(`/deployments/${deploymentId}/rollback`);
      return res.data;
    },
    onSuccess: (rollbackDep) => {
      queryClient.invalidateQueries({ queryKey: ['deployments-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      navigate(`/deployments/${rollbackDep.id}`);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Rollback execution failed');
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80';
      case 'failed':
        return 'bg-red-950/80 text-red-300 border-red-700/80';
      case 'running':
        return 'bg-blue-950/80 text-blue-300 border-blue-700/80 animate-pulse';
      case 'queued':
        return 'bg-amber-950/80 text-amber-300 border-amber-700/80';
      case 'rolled_back':
        return 'bg-purple-950/80 text-purple-300 border-purple-700/80';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const deploymentItems: DeploymentItem[] = Array.isArray(deploymentsData?.data)
    ? deploymentsData.data
    : Array.isArray(deploymentsData)
    ? (deploymentsData as any)
    : [];

  const serviceOptions: ServiceItem[] = Array.isArray(services)
    ? services
    : Array.isArray((services as any)?.data)
    ? (services as any).data
    : [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Rocket className="h-6 w-6 text-indigo-400" />
            Deployments
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time pipeline orchestration powered by BullMQ Redis queue & SSE log telemetry
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors"
            title="Refresh Deployments"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {canDeploy && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-lg shadow-indigo-500/20"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              New Deployment
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <Filter className="h-3.5 w-3.5 text-slate-500 mr-1" />
        {['', 'queued', 'running', 'success', 'failed'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1 rounded-md text-xs font-mono transition-colors ${
              statusFilter === st
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {st === '' ? 'ALL' : st.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Deployments Table */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-12 flex justify-center items-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : deploymentItems.length === 0 ? (
          <div className="py-16 text-center">
            <Rocket className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300">No deployments found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Trigger a deployment using the button above to start the BullMQ worker pipeline.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 border-b border-slate-800/80 uppercase font-mono">
                <tr>
                  <th className="py-3.5 px-4">Service</th>
                  <th className="py-3.5 px-4">Version</th>
                  <th className="py-3.5 px-4">Environment</th>
                  <th className="py-3.5 px-4">Status & Step</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Triggered By</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-200">
                {deploymentItems.map((dep) => (
                  <tr key={dep.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">
                      <div className="flex items-center space-x-2">
                        {dep.isRollback && (
                          <span className="p-1 rounded bg-amber-950 border border-amber-800/80 text-amber-400" title="Rollback Deployment">
                            <RotateCcw className="h-3 w-3" />
                          </span>
                        )}
                        <span>{dep.service?.name || 'Service'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-cyan-300 font-semibold">{dep.version}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-900 border border-slate-800 text-slate-300">
                        {dep.environment}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col space-y-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase border font-semibold w-max ${getStatusBadge(
                            dep.status,
                          )}`}
                        >
                          {dep.status}
                        </span>
                        {dep.currentStep && dep.status === 'running' && (
                          <span className="text-[10px] font-mono text-slate-400">
                            {dep.currentStep} ({dep.progressPercentage || 0}%)
                          </span>
                        )}
                        {dep.failureReason && (
                          <span className="text-[10px] text-red-400 truncate max-w-[200px]" title={dep.failureReason}>
                            {dep.failureReason}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {dep.durationSeconds ? `${dep.durationSeconds}s` : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {dep.triggeredBy?.email || 'System'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {new Date(dep.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <Link
                        to={`/deployments/${dep.id}`}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 font-mono text-[11px] transition-colors inline-flex items-center"
                      >
                        Tracker <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>

                      {/* Rollback action button on successful deployments */}
                      {dep.status === 'success' && canDeploy && (
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `Initiate forward rollback of ${dep.service?.name} to previous known-good deployment?`,
                              )
                            ) {
                              rollbackMutation.mutate(dep.id);
                            }
                          }}
                          disabled={rollbackMutation.isPending}
                          className="px-2.5 py-1 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/80 rounded font-mono text-[11px] transition-colors inline-flex items-center"
                          title="Forward rollback to previous stable release"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Rollback
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Deployment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Rocket className="h-5 w-5 text-indigo-400" />
                <span>Trigger Deployment</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-950/40 border border-red-800 text-red-300 text-xs rounded-lg flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Microservice *</label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select a registered service...</option>
                  {serviceOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({(s.environment || 'dev').toUpperCase()}) - Current: {s.currentVersion || (s as any).version || 'v1.0.0'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Deployment Version (e.g. v1.2.0)</label>
                <input
                  type="text"
                  placeholder="v1.2.0"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Git Commit SHA (optional)</label>
                <input
                  type="text"
                  placeholder="8f4b2a1"
                  value={commitHash}
                  onChange={(e) => setCommitHash(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedServiceId || triggerMutation.isPending}
                onClick={() => triggerMutation.mutate()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all disabled:opacity-50"
              >
                {triggerMutation.isPending ? 'Queuing in BullMQ...' : 'Queue Pipeline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
