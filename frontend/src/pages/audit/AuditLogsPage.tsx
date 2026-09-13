import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import { AuditLog } from '../../types'
import { Shield, User, Clock, AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react'

export default function AuditLogsPage() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const response = await api.get<AuditLog[]>('/audit?limit=100')
      return response.data
    },
  })

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'SUCCESS':
        return {
          color: 'text-green-700 bg-green-100 border-green-200',
          icon: CheckCircle,
          iconColor: 'text-green-600',
        }
      case 'WARNING':
        return {
          color: 'text-yellow-700 bg-yellow-100 border-yellow-200',
          icon: AlertCircle,
          iconColor: 'text-yellow-600',
        }
      case 'FAILED':
        return {
          color: 'text-red-700 bg-red-100 border-red-200',
          icon: XCircle,
          iconColor: 'text-red-600',
        }
      case 'INFO':
      default:
        return {
          color: 'text-blue-700 bg-blue-100 border-blue-200',
          icon: Info,
          iconColor: 'text-blue-600',
        }
    }
  }

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-gray-600 mt-1">Track all actions and changes in the platform</p>
      </div>

      {/* Audit Timeline */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="space-y-4">
          {logs?.map((log, index) => {
            const severityConfig = getSeverityConfig(log.severity || 'INFO')
            const SeverityIcon = severityConfig.icon
            
            return (
              <div key={log.id} className="relative">
                {index !== logs.length - 1 && (
                  <div className="absolute top-16 left-6 w-0.5 h-full bg-gray-200" />
                )}
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className={`h-12 w-12 rounded-full ${severityConfig.color} border-2 flex items-center justify-center`}>
                      <SeverityIcon className={`h-6 w-6 ${severityConfig.iconColor}`} />
                    </div>
                  </div>

                  <div className="flex-1 bg-gray-50 rounded-lg p-5 hover:bg-gray-100 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Severity Badge - Prominent */}
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`px-3 py-1.5 rounded-lg text-sm font-bold border ${severityConfig.color} uppercase tracking-wide`}>
                            {log.severity || 'INFO'}
                          </span>
                        </div>

                        {/* Action - Bigger & Bolder */}
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {log.action.replace(/_/g, ' ')}
                        </h3>

                        {/* Actor - Secondary */}
                        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                          <User className="h-4 w-4" />
                          <span className="font-medium">{log.actor.firstName} {log.actor.lastName}</span>
                          <span className="text-gray-400">·</span>
                          <span className="capitalize text-gray-500">{log.actor.role}</span>
                        </div>

                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <div className="mt-3 text-sm">
                            <details className="cursor-pointer group">
                              <summary className="text-gray-700 font-medium hover:text-primary-600 transition-colors">
                                View details
                              </summary>
                              <pre className="mt-2 p-3 bg-white rounded border border-gray-200 text-xs overflow-x-auto">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </details>
                          </div>
                        )}
                      </div>

                      {/* Timestamp - Lighter */}
                      <div className="flex items-center text-xs text-gray-400 whitespace-nowrap">
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {logs?.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No audit logs yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
