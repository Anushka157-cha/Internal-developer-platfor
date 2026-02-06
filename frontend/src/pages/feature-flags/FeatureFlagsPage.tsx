import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import { FeatureFlag } from '../../types'
import { useAuth } from '../../contexts/AuthContext'
import { Plus, Flag, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'

export default function FeatureFlagsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    key: '',
    name: '',
    description: '',
    enabled: false,
    environments: [] as ('dev' | 'staging' | 'prod')[],
    rolloutPercentage: 100,
  })

  const { data: flags, isLoading } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      const response = await api.get<FeatureFlag[]>('/feature-flags')
      return response.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return api.post('/feature-flags', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] })
      setShowModal(false)
      setFormData({
        key: '',
        name: '',
        description: '',
        enabled: false,
        environments: [],
        rolloutPercentage: 100,
      })
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.post(`/feature-flags/${id}/toggle`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/feature-flags/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  const canManage = user?.role === 'admin' || user?.role === 'developer'

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Feature Flags</h1>
          <p className="text-gray-600 mt-1">Control feature rollouts and experiments</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Flag
          </button>
        )}
      </div>

      {/* Feature Flags List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-200">
          {flags?.map((flag) => (
            <div key={flag.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Flag className={`h-5 w-5 ${flag.enabled ? 'text-green-600' : 'text-gray-400'}`} />
                    <h3 className="text-lg font-semibold text-gray-900">{flag.name}</h3>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">{flag.key}</code>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{flag.description || 'No description'}</p>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    {flag.environments.length > 0 && (
                      <div className="flex items-center space-x-2">
                        {flag.environments.map((env) => (
                          <span
                            key={env}
                            className={`
                              text-xs px-2 py-1 rounded-full
                              ${env === 'prod' ? 'bg-red-100 text-red-700' : ''}
                              ${env === 'staging' ? 'bg-yellow-100 text-yellow-700' : ''}
                              ${env === 'dev' ? 'bg-blue-100 text-blue-700' : ''}
                            `}
                          >
                            {env}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Rollout:</span>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${flag.rolloutPercentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-700">{flag.rolloutPercentage}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {canManage && (
                    <>
                      <button
                        onClick={() => toggleMutation.mutate(flag.id)}
                        className={`
                          p-2 rounded-lg transition-colors
                          ${flag.enabled 
                            ? 'text-green-600 hover:bg-green-50' 
                            : 'text-gray-400 hover:bg-gray-100'
                          }
                        `}
                        title={flag.enabled ? 'Disable' : 'Enable'}
                      >
                        {flag.enabled ? (
                          <ToggleRight className="h-6 w-6" />
                        ) : (
                          <ToggleLeft className="h-6 w-6" />
                        )}
                      </button>
                      
                      {user?.role === 'admin' && (
                        <button
                          onClick={() => deleteMutation.mutate(flag.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {flags?.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <Flag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No feature flags yet. Create one to get started!</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Flag Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Feature Flag</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Flag Key
                </label>
                <input
                  type="text"
                  required
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="new_feature_enabled"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="New Feature"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                  placeholder="What does this flag control?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Environments
                </label>
                <div className="flex space-x-4">
                  {['dev', 'staging', 'prod'].map((env) => (
                    <label key={env} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.environments.includes(env as any)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              environments: [...formData.environments, env as any],
                            })
                          } else {
                            setFormData({
                              ...formData,
                              environments: formData.environments.filter((e) => e !== env),
                            })
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">{env}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rollout Percentage: {formData.rolloutPercentage}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.rolloutPercentage}
                  onChange={(e) => setFormData({ ...formData, rolloutPercentage: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable immediately</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Flag'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
