import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  Users as UsersIcon,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Search,
} from 'lucide-react';

interface UserItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'DEVELOPER' | 'VIEWER';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [actionError, setActionError] = useState('');

  const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';

  const { data: usersData, isLoading, refetch } = useQuery<{
    data: UserItem[];
    meta: { total: number; page: number; totalPages: number };
  }>({
    queryKey: ['users-list', search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      const res = await api.get(`/users?${params.toString()}`);
      return res.data;
    },
    enabled: isAdmin,
  });

  const roleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const res = await api.patch(`/users/${id}/role`, { role });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
      setActionError('');
    },
    onError: (err: any) => {
      setActionError(err.response?.data?.message || 'Failed to update user role');
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await api.patch(`/users/${id}/status`, { isActive });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
      setActionError('');
    },
    onError: (err: any) => {
      setActionError(err.response?.data?.message || 'Failed to update user status');
    },
  });

  if (!isAdmin) {
    return (
      <div className="p-8 bg-red-950/30 border border-red-800 rounded-xl text-center max-w-md mx-auto mt-12">
        <ShieldAlert className="h-12 w-12 text-red-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white">Access Denied (403 Forbidden)</h2>
        <p className="text-xs text-red-300/80 mt-1">
          User administration is strictly restricted to platform administrators with role{' '}
          <code className="font-mono bg-red-900/40 px-1 py-0.5 rounded">ADMIN</code>.
        </p>
      </div>
    );
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-950/80 text-purple-300 border-purple-700/80';
      case 'DEVELOPER':
        return 'bg-blue-950/80 text-blue-300 border-blue-700/80';
      default:
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80';
    }
  };

  const userList: any[] = Array.isArray(usersData?.data)
    ? usersData.data
    : Array.isArray(usersData)
    ? (usersData as any)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <UsersIcon className="h-6 w-6 text-indigo-400" />
            <span>User & Access Control</span>
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Role-Based Access Control (RBAC) management and credential governance.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-sm transition-colors self-start"
          title="Refresh users"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {actionError && (
        <div className="p-3 bg-red-950/40 border border-red-800 text-red-300 text-xs rounded-lg flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Search Input */}
      <div className="flex items-center space-x-3 bg-slate-900/90 px-3.5 py-2 rounded-lg border border-slate-800/80 max-w-md">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Filter by email or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
        />
      </div>

      {/* Users Table */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-12 flex justify-center items-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 border-b border-slate-800/80 uppercase font-mono">
                <tr>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Joined</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-200">
                {userList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">
                      {u.firstName} {u.lastName}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">{u.email}</td>
                    <td className="py-3 px-4">
                      <select
                        value={u.role}
                        disabled={u.id === currentUser?.id || roleMutation.isPending}
                        onChange={(e) => roleMutation.mutate({ id: u.id, role: e.target.value })}
                        className={`text-[10px] font-mono uppercase px-2 py-1 rounded border font-semibold bg-slate-900 focus:outline-none ${getRoleBadge(
                          u.role,
                        )}`}
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="DEVELOPER">DEVELOPER</option>
                        <option value="VIEWER">VIEWER</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          u.isActive
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-red-950 text-red-300 border border-red-800'
                        }`}
                      >
                        {u.isActive ? 'ACTIVE' : 'DEACTIVATED'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => statusMutation.mutate({ id: u.id, isActive: !u.isActive })}
                          disabled={statusMutation.isPending}
                          className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors border ${
                            u.isActive
                              ? 'bg-red-950/40 hover:bg-red-900/60 text-red-300 border-red-800'
                              : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800'
                          }`}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
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
    </div>
  );
}
