import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  Rocket,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Terminal,
  ArrowLeft,
  AlertOctagon,
  Radio,
} from 'lucide-react';

interface DeploymentDetail {
  id: string;
  serviceId: string;
  version: string;
  commitHash?: string;
  environment: string;
  status: string;
  currentStep: string;
  progressPercentage: number;
  durationSeconds?: number;
  failureReason?: string;
  logs: string;
  isRollback?: boolean;
  rollbackOfDeploymentId?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  service?: {
    id: string;
    name: string;
    environment: string;
    healthEndpoint?: string;
  };
  triggeredBy?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

const PIPELINE_STEPS = [
  { key: 'QUEUED', label: 'Queued', description: 'Enqueued in BullMQ Redis queue' },
  { key: 'BUILDING', label: 'Building', description: 'Compiling image and assets' },
  { key: 'TESTING', label: 'Testing', description: 'Running unit & integration test suites' },
  { key: 'DEPLOYING', label: 'Deploying', description: 'Rolling out container instances' },
  { key: 'HEALTH_CHECK', label: 'Health Check', description: 'Probing live HTTP health endpoint' },
  { key: 'COMPLETED', label: 'Completed', description: 'Zero-downtime traffic verification passed' },
];

export default function DeploymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const logContainerRef = useRef<HTMLPreElement>(null);

  const [liveLogs, setLiveLogs] = useState<string>('');
  const [liveStatus, setLiveStatus] = useState<string>('');
  const [liveStep, setLiveStep] = useState<string>('');
  const [liveProgress, setLiveProgress] = useState<number>(0);
  const [sseConnected, setSseConnected] = useState<boolean>(false);

  const canRollback = user?.role?.toUpperCase() === 'ADMIN' || user?.role?.toUpperCase() === 'DEVELOPER';

  // Fetch initial deployment details
  const { data: deployment, isLoading, error, refetch } = useQuery<DeploymentDetail>({
    queryKey: ['deployment-detail', id],
    queryFn: async () => {
      const res = await api.get(`/deployments/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  // Rollback mutation
  const rollbackMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/deployments/${id}/rollback`);
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

  // Sync initial query values to local state
  useEffect(() => {
    if (deployment) {
      setLiveLogs(deployment.logs || '');
      setLiveStatus(deployment.status);
      setLiveStep(deployment.currentStep || 'QUEUED');
      setLiveProgress(deployment.progressPercentage || 0);
    }
  }, [deployment]);

  // Connect to SSE stream for real-time live events
  useEffect(() => {
    if (!id) return;

    // Only subscribe to SSE if the deployment is still active or pending
    const terminalStates = ['success', 'failed', 'rolled_back'];
    if (deployment && terminalStates.includes(deployment.status)) {
      return;
    }

    const baseURL = import.meta.env.VITE_API_URL || '/api';
    const sseUrl = `${baseURL}/deployments/${id}/stream`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onopen = () => {
      setSseConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.status) setLiveStatus(payload.status);
        if (payload.currentStep) setLiveStep(payload.currentStep);
        if (typeof payload.progressPercentage === 'number') {
          setLiveProgress(payload.progressPercentage);
        }
        if (payload.logs) {
          setLiveLogs(payload.logs);
        }

        // If completed or failed, close SSE and refetch DB record
        if (payload.status === 'success' || payload.status === 'failed') {
          eventSource.close();
          setSseConnected(false);
          refetch();
          queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
        }
      } catch (err) {
        console.error('Failed to parse SSE payload:', err);
      }
    };

    eventSource.onerror = () => {
      setSseConnected(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [id, deployment?.status]);

  // Auto-scroll terminal logs to bottom on new output
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [liveLogs]);

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-mono text-xs">Loading deployment telemetry...</p>
      </div>
    );
  }

  if (error || !deployment) {
    return (
      <div className="p-6 bg-red-950/30 border border-red-800 rounded-xl text-red-200">
        <h3 className="font-bold text-lg">Deployment not found</h3>
        <p className="text-sm text-red-300 mt-1">Deployment ID {id} was not found in the registry.</p>
        <Link
          to="/deployments"
          className="mt-4 inline-flex items-center text-xs font-semibold text-indigo-400 hover:text-indigo-300"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Deployments
        </Link>
      </div>
    );
  }

  const currentStatus = liveStatus || deployment.status;
  const currentStep = liveStep || deployment.currentStep || 'QUEUED';
  const currentProgress = liveProgress || deployment.progressPercentage || 0;

  const isFailed = currentStatus === 'failed';
  const isSuccess = currentStatus === 'success';
  const isRunning = currentStatus === 'running' || currentStatus === 'queued';

  const getStepIndex = (stepKey: string) => {
    if (stepKey === 'COMPLETED' || isSuccess) return 5;
    if (stepKey === 'FAILED') return 4;
    return PIPELINE_STEPS.findIndex((s) => s.key === stepKey);
  };

  const activeStepIdx = getStepIndex(currentStep);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800 gap-4">
        <div className="flex items-center space-x-3">
          <Link
            to="/deployments"
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-white tracking-tight">
                {deployment.service?.name}
              </h1>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300 font-bold">
                {deployment.version}
              </span>
              {deployment.isRollback && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-amber-300 flex items-center">
                  <RotateCcw className="h-3 w-3 mr-1" /> ROLLBACK
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              ID: {deployment.id} • Environment: {deployment.environment.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Status Indicators and Rollback Button */}
        <div className="flex items-center space-x-3">
          {isRunning && (
            <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/80 px-3 py-1 rounded-lg">
              <Radio className="h-3.5 w-3.5 animate-pulse" />
              <span>{sseConnected ? 'Live SSE Streaming' : 'Polling Worker...'}</span>
            </div>
          )}

          {isSuccess && canRollback && (
            <button
              onClick={() => {
                if (
                  confirm(
                    `Are you sure you want to roll back ${deployment.service?.name} to the prior stable deployment?`,
                  )
                ) {
                  rollbackMutation.mutate();
                }
              }}
              disabled={rollbackMutation.isPending}
              className="px-3.5 py-1.5 bg-amber-950 hover:bg-amber-900 text-amber-200 border border-amber-800 rounded-lg text-xs font-semibold transition-colors flex items-center"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              {rollbackMutation.isPending ? 'Queuing Rollback...' : 'Rollback This Service'}
            </button>
          )}
        </div>
      </div>

      {/* Visual State Machine Pipeline Tracker */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Rocket className="h-4 w-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-white">Pipeline Execution Lifecycle</h2>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Progress: <span className="font-bold text-white">{currentProgress}%</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isFailed ? 'bg-red-500' : isSuccess ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-cyan-400'
            }`}
            style={{ width: `${Math.max(5, currentProgress)}%` }}
          />
        </div>

        {/* Stages Step Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {PIPELINE_STEPS.map((step, idx) => {
            const isCompletedStep = idx < activeStepIdx || isSuccess;
            const isCurrentStep = idx === activeStepIdx && !isSuccess && !isFailed;
            const isFailedStep = isFailed && idx === activeStepIdx;

            return (
              <div
                key={step.key}
                className={`p-3 rounded-lg border text-xs transition-all ${
                  isFailedStep
                    ? 'bg-red-950/40 border-red-700/80 text-red-300'
                    : isCompletedStep
                    ? 'bg-emerald-950/20 border-emerald-700/60 text-emerald-300'
                    : isCurrentStep
                    ? 'bg-indigo-950/40 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500/50'
                    : 'bg-slate-900/40 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between font-mono mb-1">
                  <span className="text-[10px] font-bold">0{idx + 1}</span>
                  {isFailedStep ? (
                    <XCircle className="h-3.5 w-3.5 text-red-400" />
                  ) : isCompletedStep ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  ) : isCurrentStep ? (
                    <Clock className="h-3.5 w-3.5 text-indigo-400 animate-spin" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-800" />
                  )}
                </div>
                <div className="font-semibold">{step.label}</div>
                <div className="text-[10px] text-slate-400 mt-1 leading-tight">{step.description}</div>
              </div>
            );
          })}
        </div>

        {/* Failure banner if pipeline failed */}
        {isFailed && (
          <div className="p-3.5 bg-red-950/50 border border-red-800/80 rounded-lg text-red-200 text-xs flex items-start space-x-2.5">
            <AlertOctagon className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Deployment Failed:</span>{' '}
              {deployment.failureReason || 'Pipeline stage failed health validation'}
            </div>
          </div>
        )}
      </div>

      {/* Metadata & Live Terminal Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Metadata Sidebar */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4 text-xs">
          <h2 className="text-sm font-semibold text-white border-b border-slate-800 pb-2">
            Execution Attributes
          </h2>

          <div className="space-y-3 font-mono">
            <div>
              <span className="text-slate-500 block text-[11px]">Service</span>
              <span className="text-slate-200 font-semibold">{deployment.service?.name}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Version Target</span>
              <span className="text-cyan-300 font-semibold">{deployment.version}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Target Environment</span>
              <span className="text-slate-200 uppercase">{deployment.environment}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Execution Status</span>
              <span className="uppercase font-bold text-white">{currentStatus}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Duration</span>
              <span className="text-slate-200">
                {deployment.durationSeconds ? `${deployment.durationSeconds} seconds` : 'In progress...'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Triggered By</span>
              <span className="text-slate-200">{deployment.triggeredBy?.email || 'Platform Admin'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Health Probe Target</span>
              <span className="text-emerald-400">{deployment.service?.healthEndpoint || '/health'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Initiated At</span>
              <span className="text-slate-400">{new Date(deployment.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Real-time Streaming Terminal */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-inner">
          <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-slate-300">
              <Terminal className="h-4 w-4 text-emerald-400" />
              <span className="font-mono font-semibold">Console Stream</span>
            </div>
            <div className="flex items-center space-x-2 font-mono text-[11px] text-slate-400">
              {isRunning && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-1" />}
              <span>{isRunning ? 'STDOUT: STREAMING' : 'STDOUT: TERMINATED'}</span>
            </div>
          </div>

          <pre
            ref={logContainerRef}
            className="flex-1 p-4 font-mono text-[11px] text-slate-300 bg-slate-950 overflow-y-auto max-h-[420px] min-h-[300px] leading-relaxed whitespace-pre-wrap select-text"
          >
            {liveLogs || 'Waiting for worker process to emit build stdout...'}
          </pre>
        </div>
      </div>
    </div>
  );
}
