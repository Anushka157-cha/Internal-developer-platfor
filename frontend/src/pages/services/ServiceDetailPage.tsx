import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import { Service, Deployment, Log } from '../../types'
import { useAuth } from '../../contexts/AuthContext'
import { ArrowLeft, Rocket, RefreshCw, Terminal, Clock, CheckCircle, XCircle, Loader2, RotateCcw, Clock as ClockIcon } from 'lucide-react'

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedDeployment, setSelectedDeployment] = useState<string | null>(null)

  const { data: service } = useQuery({
    queryKey: ['service', id],
    queryFn: async () => {
      const response = await api.get<Service>(`/services/${id}`)
      return response.data
    },
  })

  const { data: deployments, refetch: refetchDeployments } = useQuery({
    queryKey: ['deployments', id],
    queryFn: async () => {
      const response = await api.get<Deployment[]>(`/deployments?serviceId=${id}`)
      return response.data
    },
    refetchInterval: 5000, // Poll every 5 seconds (reduced from 3)
  })

  const { data: logs } = useQuery({
    queryKey: ['logs', id],
    queryFn: async () => {
      const response = await api.get<Log[]>(`/logs?serviceId=${id}&limit=50`)
      return response.data
    },
  })

  const deployMutation = useMutation({
    mutationFn: async () => {
      return api.post('/deployments', {
        serviceId: id,
        version: service?.version || '1.0.0',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deployments', id] })
      queryClient.invalidateQueries({ queryKey: ['logs', id] })
    },
  })

  const canDeploy = user?.role === 'admin' || user?.role === 'developer'

  const selectedDeploymentData = deployments?.find(d => d.id === selectedDeployment)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link to="/services" className="flex items-center text-primary-600 hover:text-primary-700 mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Services
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{service?.name}</h1>
            <p className="text-gray-600 mt-1">{service?.description || 'No description'}</p>
            <div className="flex items-center mt-2 space-x-4">
              <span className={`
                text-xs px-2 py-1 rounded-full
                ${service?.environment === 'prod' ? 'bg-red-100 text-red-700' : ''}
                ${service?.environment === 'staging' ? 'bg-yellow-100 text-yellow-700' : ''}
                ${service?.environment === 'dev' ? 'bg-blue-100 text-blue-700' : ''}
              `}>
                {service?.environment}
              </span>
              <span className={`
                px-2 py-1 rounded-full text-xs font-medium
                ${service?.healthStatus === 'healthy' ? 'bg-green-100 text-green-800' : ''}
                ${service?.healthStatus === 'degraded' ? 'bg-yellow-100 text-yellow-800' : ''}
                ${service?.healthStatus === 'down' ? 'bg-red-100 text-red-800' : ''}
              `}>
                {service?.healthStatus}
              </span>
            </div>
          </div>

          {canDeploy && (
            <button
              onClick={() => deployMutation.mutate()}
              disabled={deployMutation.isPending}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              <Rocket className="h-5 w-5 mr-2" />
              {deployMutation.isPending ? 'Deploying...' : 'Deploy'}
            </button>
          )}
        </div>
      </div>

      {/* Deployment History */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Deployment History</h2>
          <button
            onClick={() => refetchDeployments()}
            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          {deployments?.map((deployment) => {
            // Status configuration with icons and colors
            const getStatusConfig = (status: string) => {
              switch (status) {
                case 'success':
                  return {
                    icon: CheckCircle,
                    bgColor: 'bg-green-100',
                    textColor: 'text-green-800',
                    borderColor: 'border-green-200',
                    label: 'Success'
                  }
                case 'failed':
                  return {
                    icon: XCircle,
                    bgColor: 'bg-red-100',
                    textColor: 'text-red-800',
                    borderColor: 'border-red-200',
                    label: 'Failed'
                  }
                case 'running':
                  return {
                    icon: Loader2,
                    bgColor: 'bg-blue-100',
                    textColor: 'text-blue-800',
                    borderColor: 'border-blue-200',
                    label: 'Running',
                    animate: true
                  }
                case 'rolled_back':
                  return {
                    icon: RotateCcw,
                    bgColor: 'bg-yellow-100',
                    textColor: 'text-yellow-800',
                    borderColor: 'border-yellow-200',
                    label: 'Rolled Back'
                  }
                default: // pending
                  return {
                    icon: ClockIcon,
                    bgColor: 'bg-gray-100',
                    textColor: 'text-gray-800',
                    borderColor: 'border-gray-200',
                    label: 'Pending'
                  }
              }
            }

            const statusConfig = getStatusConfig(deployment.status)
            const StatusIcon = statusConfig.icon

            return (
            <div
              key={deployment.id}
              onClick={() => setSelectedDeployment(deployment.id)}
              className={`
                p-4 border-2 rounded-lg cursor-pointer transition-all
                ${selectedDeployment === deployment.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className={`
                    px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5
                    ${statusConfig.bgColor} ${statusConfig.textColor}
                    ${statusConfig.animate ? 'animate-pulse' : ''}
                  `}>
                    <StatusIcon className={`h-3.5 w-3.5 ${statusConfig.animate ? 'animate-spin' : ''}`} />
                    {statusConfig.label}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Deployment #{deployment.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-gray-500">
                      by {deployment.triggeredBy.firstName} {deployment.triggeredBy.lastName}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {deployment.durationSeconds && (
                    <p className="text-sm text-gray-600 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {deployment.durationSeconds}s
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    {new Date(deployment.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )})}
        </div>
      </div>

      {/* Deployment Logs */}
      {selectedDeploymentData && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Terminal className="h-5 w-5 mr-2" />
            Deployment Logs
          </h2>
          <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-green-400 max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap">
              {selectedDeploymentData.logs || 'No logs available yet...'}
            </pre>
          </div>
        </div>
      )}

      {/* Service Logs */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Terminal className="h-5 w-5 mr-2" />
          Service Logs
        </h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {logs?.map((log) => (
            <div
              key={log.id}
              className={`
                p-3 rounded-lg text-sm
                ${log.level === 'error' ? 'bg-red-50 text-red-900' : ''}
                ${log.level === 'warn' ? 'bg-yellow-50 text-yellow-900' : ''}
                ${log.level === 'info' ? 'bg-blue-50 text-blue-900' : ''}
                ${log.level === 'debug' ? 'bg-gray-50 text-gray-900' : ''}
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <span className={`
                    px-2 py-0.5 rounded text-xs font-semibold mr-2
                    ${log.level === 'error' ? 'bg-red-200 text-red-800' : ''}
                    ${log.level === 'warn' ? 'bg-yellow-200 text-yellow-800' : ''}
                    ${log.level === 'info' ? 'bg-blue-200 text-blue-800' : ''}
                    ${log.level === 'debug' ? 'bg-gray-200 text-gray-800' : ''}
                  `}>
                    {log.level.toUpperCase()}
                  </span>
                  <span>{log.message}</span>
                </div>
                <span className="text-xs text-gray-500 ml-4">
                  {new Date(log.createdAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
