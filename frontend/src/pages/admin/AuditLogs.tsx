import { useState, useEffect } from 'react';
import api from '@/api/client';
import { toast } from 'sonner';

interface AuditLog {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  actor_user_id: string;
  created_at: string;
  ip_address: string;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = actionFilter ? { action: actionFilter } : {};
      const response = await api.get('/audit-logs', { params });
      setLogs(response.data);
    } catch {
      toast.error('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionFilter]);

  const handleExport = () => {
    let url = '/api/v1/audit-logs/export';
    if (actionFilter) {
      url += `?action=${actionFilter}`;
    }
    // Simple window location for download
    window.location.href = url;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
        <button 
          onClick={handleExport}
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded inline-flex items-center"
        >
          <svg className="fill-current w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z"/></svg>
          Export CSV
        </button>
      </div>

      <div className="flex gap-4 mb-4">
        <select 
          value={actionFilter} 
          onChange={e => setActionFilter(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2"
        >
          <option value="">All Actions</option>
          <option value="API_KEY_CREATED">API Key Created</option>
          <option value="WEBHOOK_CREATED">Webhook Created</option>
          <option value="ORGANIZATION_SETTINGS_UPDATED">Settings Updated</option>
          <option value="MEMBERSHIP_INVITED">User Invited</option>
        </select>
      </div>

      <div className="border rounded-md">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 font-medium">Timestamp</th>
              <th className="px-6 py-3 font-medium">Action</th>
              <th className="px-6 py-3 font-medium">Resource</th>
              <th className="px-6 py-3 font-medium">Resource ID</th>
              <th className="px-6 py-3 font-medium">Actor</th>
              <th className="px-6 py-3 font-medium">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-4 text-center">Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-4 text-center">No audit logs found</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-6 py-4 font-medium">{log.action}</td>
                  <td className="px-6 py-4">{log.resource_type}</td>
                  <td className="px-6 py-4 font-mono text-xs">{log.resource_id}</td>
                  <td className="px-6 py-4 font-mono text-xs">{log.actor_user_id}</td>
                  <td className="px-6 py-4">{log.ip_address}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
