import {
  Settings as SettingsIcon,
  Shield,
  Database,
  Cpu,
  FileCode,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';

export default function SettingsPage() {
  const rbacMatrix = [
    { resource: 'Services (View)', viewer: true, developer: true, admin: true },
    { resource: 'Services (Register & Edit)', viewer: false, developer: true, admin: true },
    { resource: 'Services (Delete)', viewer: false, developer: false, admin: true },
    { resource: 'Deployments (View & Tracker)', viewer: true, developer: true, admin: true },
    { resource: 'Deployments (Trigger & Rollback)', viewer: false, developer: true, admin: true },
    { resource: 'Feature Flags (Evaluate)', viewer: true, developer: true, admin: true },
    { resource: 'Feature Flags (Create & Update)', viewer: false, developer: true, admin: true },
    { resource: 'Feature Flags (Delete)', viewer: false, developer: false, admin: true },
    { resource: 'Central Logs (Read)', viewer: true, developer: true, admin: true },
    { resource: 'Audit Trail (Read)', viewer: false, developer: true, admin: true },
    { resource: 'User & Role Management', viewer: false, developer: false, admin: true },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
          <SettingsIcon className="h-6 w-6 text-indigo-400" />
          <span>Platform Architecture & Specifications</span>
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Production runtime topology, cluster components, and security authorization matrix.
        </p>
      </div>

      {/* Cluster Stack Components */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-5 space-y-3">
          <div className="flex items-center space-x-2.5 text-blue-400">
            <Database className="h-5 w-5" />
            <h3 className="text-sm font-bold text-white">PostgreSQL Storage</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Relational storage with strict foreign keys, composite indexes, fail-fast production startup, and
            immutable audit event logs.
          </p>
          <div className="pt-2 text-[11px] font-mono text-slate-400 border-t border-slate-800/80">
            Status: <span className="text-emerald-400 font-bold">CONNECTED</span>
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-5 space-y-3">
          <div className="flex items-center space-x-2.5 text-red-400">
            <Cpu className="h-5 w-5" />
            <h3 className="text-sm font-bold text-white">BullMQ + Redis Engine</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Asynchronous background workers handling deployment multi-stage pipeline, exponential backoff, job
            idempotency, and SSE broadcast.
          </p>
          <div className="pt-2 text-[11px] font-mono text-slate-400 border-t border-slate-800/80">
            Queue: <span className="text-cyan-400 font-bold">deployments</span>
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-5 space-y-3">
          <div className="flex items-center space-x-2.5 text-purple-400">
            <Shield className="h-5 w-5" />
            <h3 className="text-sm font-bold text-white">Enterprise Security</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Dual JWT token rotation (15m access / 7d hashed refresh), Helmet headers, rate limiting (5 req/min on
            login), and CORS strict origin controls.
          </p>
          <div className="pt-2 text-[11px] font-mono text-slate-400 border-t border-slate-800/80">
            Hashing: <span className="text-purple-400 font-bold">bcrypt + SHA-256</span>
          </div>
        </div>
      </div>

      {/* API Documentation Banner */}
      <div className="bg-gradient-to-r from-indigo-950/60 to-slate-950/80 border border-indigo-500/30 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-lg text-indigo-400">
            <FileCode className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Interactive OpenAPI / Swagger Documentation</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Explore and test all REST endpoints, DTO schemas, and JWT authorization headers.
            </p>
          </div>
        </div>
        <a
          href="/api/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all self-start sm:self-auto"
        >
          Open Swagger Docs <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
        </a>
      </div>

      {/* RBAC Authorization Matrix */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-800/80">
          <h2 className="text-base font-semibold text-white">Role-Based Access Control (RBAC) Matrix</h2>
          <p className="text-xs text-slate-400">
            Backend API route enforcement across platform roles
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/60 text-slate-400 border-b border-slate-800/80 uppercase">
              <tr>
                <th className="py-3 px-4">Protected Capability</th>
                <th className="py-3 px-4 text-center">Viewer</th>
                <th className="py-3 px-4 text-center">Developer</th>
                <th className="py-3 px-4 text-center">Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {rbacMatrix.map((row) => (
                <tr key={row.resource} className="hover:bg-slate-900/40">
                  <td className="py-3 px-4 font-sans text-white font-medium">{row.resource}</td>
                  <td className="py-3 px-4 text-center">
                    {row.viewer ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 mx-auto" />
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {row.developer ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 mx-auto" />
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {row.admin ? (
                      <CheckCircle2 className="h-4 w-4 text-purple-400 mx-auto" />
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
