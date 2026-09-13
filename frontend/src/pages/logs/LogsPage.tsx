import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import { Log } from '../../types'
import { Terminal, Filter, RefreshCw } from 'lucide-react'

export default function LogsPage() {
  const [level, setLevel] = useState<string>('all')
  const [limit, setLimit] = useState(100)

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['logs', level, limit],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: limit.toString() })
      if (level !== 'all') {
        params.append('level', level)
      }
      const response = await api.get<Log[]>(`/logs?${params}`)
      return response.data
    },
  })

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Logs</h1>
          <p className="text-gray-600 mt-1">Monitor application logs across all services</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <RefreshCw className="h-5 w-5 mr-2" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Level:</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            >
              <option value="all">All</option>
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Limit:</label>
            <select
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            >
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="200">200</option>
              <option value="500">500</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Display */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center mb-4">
          <Terminal className="h-5 w-5 text-gray-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Log Stream</h2>
          <span className="ml-auto text-sm text-gray-500">{logs?.length} entries</span>
        </div>

        <div className="space-y-1 max-h-[600px] overflow-y-auto font-mono text-sm">
          {logs?.map((log) => (
            <div
              key={log.id}
              className={`
                p-3 rounded border-l-4 hover:bg-gray-50 transition-colors
                ${log.level === 'error' ? 'border-l-red-500 bg-red-50/50' : ''}
                ${log.level === 'warn' ? 'border-l-yellow-500 bg-yellow-50/50' : ''}
                ${log.level === 'info' ? 'border-l-blue-500 bg-blue-50/50' : ''}
                ${log.level === 'debug' ? 'border-l-gray-500 bg-gray-50' : ''}
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 flex items-start space-x-3">
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                  <span className={`
                    px-2 py-0.5 rounded text-xs font-semibold uppercase
                    ${log.level === 'error' ? 'bg-red-200 text-red-800' : ''}
                    ${log.level === 'warn' ? 'bg-yellow-200 text-yellow-800' : ''}
                    ${log.level === 'info' ? 'bg-blue-200 text-blue-800' : ''}
                    ${log.level === 'debug' ? 'bg-gray-200 text-gray-800' : ''}
                  `}>
                    {log.level}
                  </span>
                  <span className="flex-1 text-gray-900">{log.message}</span>
                </div>
              </div>
              
              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <div className="mt-2 ml-24 text-xs text-gray-600">
                  {JSON.stringify(log.metadata)}
                </div>
              )}
            </div>
          ))}

          {logs?.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <Terminal className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No logs found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
