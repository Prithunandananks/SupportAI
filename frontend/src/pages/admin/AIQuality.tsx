import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { adminService, type QualityAnalyticsResponse } from '@/services/admin.service';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ShieldAlert, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const COLORS = ['#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#6366f1'];

export default function AIQuality() {
  const [data, setData] = useState<QualityAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await adminService.getQualityAnalytics();
        setData(res);
      } catch (err: unknown) {
        if (err instanceof Error) {
            setError(err.message || 'Failed to load quality analytics');
        } else {
            setError('Failed to load quality analytics');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <AdminLayout title="AI Quality Center">
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-slate-400 animate-pulse text-lg">Loading analytics...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout title="AI Quality Center">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertTriangle size={24} />
          <p>{error || "Failed to load data"}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="AI Quality Center">
      <div className="space-y-6">
        
        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-cyan-500 group-hover:scale-110 transition-transform">
              <ShieldAlert size={64} />
            </div>
            <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">Total Flagged Responses</h3>
            <span className="text-4xl font-bold text-white z-10">{data.total_flagged}</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-yellow-500 group-hover:scale-110 transition-transform">
              <AlertTriangle size={64} />
            </div>
            <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">Open Tickets</h3>
            <span className="text-4xl font-bold text-yellow-400 z-10">{data.open_tickets}</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-500 group-hover:scale-110 transition-transform">
              <CheckCircle size={64} />
            </div>
            <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">Resolved Tickets</h3>
            <span className="text-4xl font-bold text-emerald-400 z-10">{data.resolved_tickets}</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-purple-500 group-hover:scale-110 transition-transform">
              <Clock size={64} />
            </div>
            <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2 text-center">Avg Resolution Time</h3>
            <span className="text-4xl font-bold text-white z-10">
              {data.average_resolution_time_hours !== null ? `${data.average_resolution_time_hours}h` : 'N/A'}
            </span>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Most Common Report Reasons</h3>
            <div className="h-72">
              {data.report_reasons.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.report_reasons} margin={{ left: -20, bottom: 20 }}>
                    <XAxis dataKey="reason" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val.length > 10 ? val.substring(0, 10) + '...' : val} />
                    <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <RechartsTooltip 
                      cursor={{ fill: '#1e293b' }}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.5rem', color: '#fff' }}
                    />
                    <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-slate-500">No report data available.</div>
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Ticket Status Distribution</h3>
            <div className="h-72">
              {data.status_distribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.status_distribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="status"
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {data.status_distribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.5rem', color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-slate-500">No status data available.</div>
              )}
            </div>
          </div>
        </div>

        {/* Tables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">Most Reported Questions</h3>
            </div>
            <div className="flex-1 overflow-auto p-0">
              {data.most_reported_questions.length > 0 ? (
                <table className="w-full text-left text-sm text-slate-400">
                  <thead className="bg-slate-800/50 text-slate-300 text-xs uppercase font-medium">
                    <tr>
                      <th className="px-6 py-4">Customer Question</th>
                      <th className="px-6 py-4">Flagged AI Response</th>
                      <th className="px-6 py-4 text-right">Flags</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {data.most_reported_questions.map((q) => (
                      <tr key={q.message_id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4 truncate max-w-[200px]" title={q.customer_question}>
                          {q.customer_question.length > 60 ? q.customer_question.substring(0, 60) + '...' : q.customer_question}
                        </td>
                        <td className="px-6 py-4 truncate max-w-[250px]" title={q.ai_response}>
                          {q.ai_response.length > 80 ? q.ai_response.substring(0, 80) + '...' : q.ai_response}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-cyan-400">
                          {q.report_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-slate-500">No reported questions found.</div>
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Recent Flagged Responses</h3>
              <Link to="/admin/flagged" className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">View All</Link>
            </div>
            <div className="flex-1 overflow-auto p-0">
              {data.recent_flags.length > 0 ? (
                <table className="w-full text-left text-sm text-slate-400">
                  <thead className="bg-slate-800/50 text-slate-300 text-xs uppercase font-medium">
                    <tr>
                      <th className="px-6 py-4">Ticket</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Reason</th>
                      <th className="px-6 py-4 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {data.recent_flags.map((f) => (
                      <tr key={f.ticket_id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4">
                          <Link to={`/admin/flagged/${f.ticket_id}`} className="text-white hover:text-cyan-400 transition-colors font-medium">
                            {f.ticket_number}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`px-2 py-1 rounded-full text-xs ${
                            f.status === 'OPEN' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                            f.status === 'RESOLVED' || f.status === 'CLOSED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            'bg-slate-800 text-slate-300 border border-slate-700'
                           }`}>
                            {f.status}
                           </span>
                        </td>
                        <td className="px-6 py-4 truncate max-w-[120px]" title={f.reason || 'N/A'}>
                          {f.reason || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {new Date(f.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-slate-500">No recent flags found.</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
