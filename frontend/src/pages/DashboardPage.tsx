import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { Service, Deployment, FeatureFlag } from '../types'
import { Server, Rocket, Flag, Activity, TrendingUp } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function DashboardPage() {
  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const response = await api.get<Service[]>('/services')
      return response.data
    },
  })

  const { data: deployments } = useQuery({
    queryKey: ['deployments'],
    queryFn: async () => {
      const response = await api.get<Deployment[]>('/deployments')
      return response.data
    },
  })

  const { data: featureFlags } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      const response = await api.get<FeatureFlag[]>('/feature-flags')
      return response.data
    },
  })

  const stats = [
    {
      name: 'Total Services',
      value: services?.length || 0,
      icon: Server,
      color: 'bg-blue-500',
      change: '+12%',
    },
    {
      name: 'Recent Deployments',
      value: deployments?.slice(0, 10).length || 0,
      icon: Rocket,
      color: 'bg-green-500',
      change: '+8%',
    },
    {
      name: 'Feature Flags',
      value: featureFlags?.length || 0,
      icon: Flag,
      color: 'bg-purple-500',
      change: '+3',
    },
    {
      name: 'Healthy Services',
      value: services?.filter(s => s.healthStatus === 'healthy').length || 0,
      icon: Activity,
      color: 'bg-emerald-500',
      change: '98%',
    },
  ]

  // Mock deployment activity data
  const deploymentActivity = Array.from({ length: 7 }, (_, i) => ({
    day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i],
    deployments: Math.floor(Math.random() * 15) + 5,
  }))

  const recentDeployments = deployments?.slice(0, 5) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to your Internal Developer Platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                <p className="text-sm text-green-600 mt-2 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  {stat.change}
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deployment Activity Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Deployment Activity</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={deploymentActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="deployments" stroke="#3b82f6" fill="#93c5fd" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Service Health */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Health</h2>
          <div className="space-y-4">
            {services?.slice(0, 5).map((service) => (
              <div key={service.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{service.name}</p>
                  <p className="text-xs text-gray-500">{service.environment}</p>
                </div>
                <span className={`
                  px-2 py-1 rounded-full text-xs font-medium
                  ${service.healthStatus === 'healthy' ? 'bg-green-100 text-green-800' : ''}
                  ${service.healthStatus === 'degraded' ? 'bg-yellow-100 text-yellow-800' : ''}
                  ${service.healthStatus === 'down' ? 'bg-red-100 text-red-800' : ''}
                `}>
                  {service.healthStatus}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Deployments */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Deployments</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Triggered By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentDeployments.map((deployment) => (
                <tr key={deployment.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {deployment.serviceId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`
                      px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${deployment.status === 'success' ? 'bg-green-100 text-green-800' : ''}
                      ${deployment.status === 'failed' ? 'bg-red-100 text-red-800' : ''}
                      ${deployment.status === 'running' ? 'bg-blue-100 text-blue-800' : ''}
                      ${deployment.status === 'pending' ? 'bg-gray-100 text-gray-800' : ''}
                    `}>
                      {deployment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {deployment.triggeredBy.firstName} {deployment.triggeredBy.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {deployment.durationSeconds ? `${deployment.durationSeconds}s` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(deployment.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
