import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { adminService, type QualityAnalyticsResponse, type KnowledgeImpactAnalytics } from '@/services/admin.service';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ShieldAlert, CheckCircle, Clock, AlertTriangle, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

const COLORS = ['#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#6366f1'];

export default function AIQuality() {
  const [data, setData] = useState<QualityAnalyticsResponse | null>(null);
  const [impactData, setImpactData] = useState<KnowledgeImpactAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [qualityRes, impactRes] = await Promise.all([
          adminService.getQualityAnalytics(),
          adminService.getKnowledgeImpact()
        ]);
        setData(qualityRes);
        setImpactData(impactRes);
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

        {/* Knowledge Impact Section */}
        {impactData && (
          <div className="space-y-6 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen className="text-cyan-500" size={24} />
                <h2 className="text-xl font-bold text-white">Knowledge Base Impact</h2>
              </div>
              <button 
                onClick={async () => {
                  try {
                    await adminService.detectKnowledgeGaps();
                    const newImpactData = await adminService.getKnowledgeImpact();
                    setImpactData(newImpactData);
                  } catch (err) {
                    console.error("Detection failed", err);
                  }
                }}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Run Gap Detection Engine
              </button>
            </div>
            
            {/* Gap Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center">
                <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">Total Open Gaps</h3>
                <span className="text-4xl font-bold text-white z-10">{impactData.total_open_gaps || 0}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center">
                <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">Critical Gaps</h3>
                <span className="text-4xl font-bold text-red-400 z-10">{impactData.critical_gaps || 0}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center">
                <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">Gap Resolution Rate</h3>
                <span className="text-4xl font-bold text-emerald-400 z-10">{impactData.gap_resolution_rate || 0}%</span>
              </div>
            </div>

            {/* Recent Gaps */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-800">
                <h3 className="text-lg font-semibold text-white">Knowledge Gap Alerts</h3>
              </div>
              <div className="flex-1 overflow-auto p-0">
                {impactData.recent_gaps && impactData.recent_gaps.length > 0 ? (
                  <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-slate-800/50 text-slate-300 text-xs uppercase font-medium">
                      <tr>
                        <th className="px-6 py-4">Document</th>
                        <th className="px-6 py-4">Gap Type</th>
                        <th className="px-6 py-4">Severity</th>
                        <th className="px-6 py-4">Recommendation</th>
                        <th className="px-6 py-4 text-right">Detected</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {impactData.recent_gaps.map((gap) => (
                        <tr key={gap.id} className="hover:bg-slate-800/20 transition-colors">
                          <td className="px-6 py-4">
                            <Link to={`/admin/documents/${gap.document_id}`} className="text-white hover:text-cyan-400 transition-colors font-medium">
                              {gap.filename}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-slate-300">
                            {gap.gap_type.replace(/_/g, ' ')}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              gap.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              gap.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                              gap.severity === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                              'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}>
                              {gap.severity}
                            </span>
                          </td>
                          <td className="px-6 py-4 max-w-[300px] truncate" title={gap.description}>
                            {gap.description}
                          </td>
                          <td className="px-6 py-4 text-right text-xs">
                            {new Date(gap.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-slate-500">No knowledge gaps detected. System is healthy.</div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-800">
                  <h3 className="text-lg font-semibold text-white">Document Health Ranking</h3>
                </div>
                <div className="flex-1 overflow-auto p-0">
                  {impactData.document_health_ranking.length > 0 ? (
                    <table className="w-full text-left text-sm text-slate-400">
                      <thead className="bg-slate-800/50 text-slate-300 text-xs uppercase font-medium">
                        <tr>
                          <th className="px-6 py-4">Document</th>
                          <th className="px-6 py-4 text-center">References</th>
                          <th className="px-6 py-4 text-center">Flags</th>
                          <th className="px-6 py-4 text-right">Health Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {impactData.document_health_ranking.slice(0, 10).map((d) => (
                          <tr key={d.document_id} className="hover:bg-slate-800/20 transition-colors">
                            <td className="px-6 py-4 truncate max-w-[200px]" title={d.filename}>
                              {d.filename}
                            </td>
                            <td className="px-6 py-4 text-center text-slate-300">
                              {d.total_references}
                            </td>
                            <td className="px-6 py-4 text-center text-red-400 font-medium">
                              {d.flagged_responses}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className={`px-2 py-1 rounded-md font-medium text-xs ${
                                d.health_score >= 90 ? 'bg-emerald-500/10 text-emerald-400' :
                                d.health_score >= 70 ? 'bg-yellow-500/10 text-yellow-400' :
                                'bg-red-500/10 text-red-400'
                              }`}>
                                {d.health_score.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-8 text-center text-slate-500">No document health data available.</div>
                  )}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-800">
                  <h3 className="text-lg font-semibold text-white">Top Problematic Chunks</h3>
                </div>
                <div className="flex-1 overflow-auto p-0">
                  {impactData.top_problematic_chunks.length > 0 ? (
                    <table className="w-full text-left text-sm text-slate-400">
                      <thead className="bg-slate-800/50 text-slate-300 text-xs uppercase font-medium">
                        <tr>
                          <th className="px-6 py-4">Document</th>
                          <th className="px-6 py-4 text-center">Chunk Index</th>
                          <th className="px-6 py-4 text-right">Flags</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {impactData.top_problematic_chunks.map((c) => (
                          <tr key={`${c.document_id}-${c.chunk_index}`} className="hover:bg-slate-800/20 transition-colors">
                            <td className="px-6 py-4 truncate max-w-[200px]" title={c.filename}>
                              {c.filename}
                            </td>
                            <td className="px-6 py-4 text-center font-mono text-xs text-slate-300">
                              #{c.chunk_index}
                            </td>
                            <td className="px-6 py-4 text-right text-red-400 font-medium">
                              {c.flag_count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-8 text-center text-slate-500">No problematic chunks found.</div>
                  )}
                </div>
              </div>
            </div>
            {/* AI Improvement Recommendations Section */}
            <div className="pt-6 border-t border-slate-800">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <BookOpen className="text-purple-500" size={24} />
                  <h2 className="text-xl font-bold text-white">AI Improvement Recommendations</h2>
                </div>
                <button 
                  onClick={async () => {
                    try {
                      await adminService.generateRecommendations();
                      const newImpactData = await adminService.getKnowledgeImpact();
                      setImpactData(newImpactData);
                    } catch (err) {
                      console.error("Failed to generate recommendations", err);
                    }
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Run Recommendation Engine
                </button>
              </div>

              {/* Recommendation Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center">
                  <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2 text-center">Open Recs</h3>
                  <span className="text-4xl font-bold text-white z-10">{impactData.open_recommendations || 0}</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center">
                  <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2 text-center">Critical Recs</h3>
                  <span className="text-4xl font-bold text-red-400 z-10">{impactData.critical_recommendations || 0}</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center">
                  <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2 text-center">Completed</h3>
                  <span className="text-4xl font-bold text-emerald-400 z-10">{impactData.completed_recommendations || 0}</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center">
                  <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2 text-center">Resolution Rate</h3>
                  <span className="text-4xl font-bold text-emerald-400 z-10">{impactData.recommendation_resolution_rate || 0}%</span>
                </div>
              </div>

              {/* Recent Recommendations Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-800">
                  <h3 className="text-lg font-semibold text-white">Actionable Recommendations</h3>
                </div>
                <div className="flex-1 overflow-auto p-0">
                  {impactData.recent_recommendations && impactData.recent_recommendations.length > 0 ? (
                    <table className="w-full text-left text-sm text-slate-400">
                      <thead className="bg-slate-800/50 text-slate-300 text-xs uppercase font-medium">
                        <tr>
                          <th className="px-6 py-4">Document</th>
                          <th className="px-6 py-4">Type</th>
                          <th className="px-6 py-4">Severity</th>
                          <th className="px-6 py-4">Recommendation</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {impactData.recent_recommendations.map((rec) => (
                          <tr key={rec.id} className="hover:bg-slate-800/20 transition-colors">
                            <td className="px-6 py-4">
                              <Link to={`/admin/documents/${rec.document_id}`} className="text-white hover:text-cyan-400 transition-colors font-medium">
                                {rec.filename}
                              </Link>
                            </td>
                            <td className="px-6 py-4 text-slate-300">
                              {rec.recommendation_type.replace(/_/g, ' ')}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                rec.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                rec.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                                rec.severity === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}>
                                {rec.severity}
                              </span>
                            </td>
                            <td className="px-6 py-4 max-w-[250px] truncate" title={rec.description}>
                              <strong>{rec.title}</strong><br/>
                              <span className="text-xs text-slate-500">{rec.description}</span>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    rec.status === 'OPEN' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                    rec.status === 'IN_PROGRESS' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                    rec.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                    'bg-slate-800 text-slate-300 border border-slate-700'
                                }`}>
                                    {rec.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {rec.status !== 'COMPLETED' && (
                                <div className="flex justify-end gap-2">
                                  <button 
                                    onClick={async () => {
                                      try {
                                        await adminService.createReviewTask({
                                          recommendation_id: rec.id,
                                          document_id: rec.document_id,
                                        });
                                        const newImpactData = await adminService.getKnowledgeImpact();
                                        setImpactData(newImpactData);
                                      } catch(err) {
                                        console.error(err);
                                      }
                                    }}
                                    className="text-blue-400 hover:text-blue-300 font-medium text-xs bg-blue-500/10 px-2 py-1 rounded-md"
                                  >
                                    Create Task
                                  </button>
                                  <button 
                                    onClick={async () => {
                                      try {
                                        await adminService.updateRecommendationStatus(rec.id, 'COMPLETED');
                                        const newImpactData = await adminService.getKnowledgeImpact();
                                        setImpactData(newImpactData);
                                      } catch(err) {
                                        console.error(err);
                                      }
                                    }}
                                    className="text-emerald-400 hover:text-emerald-300 font-medium text-xs bg-emerald-500/10 px-2 py-1 rounded-md"
                                  >
                                    Resolve
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-8 text-center text-slate-500">No active recommendations. System is optimal.</div>
                  )}
                </div>
              </div>
            </div>
            {/* Knowledge Review Queue Section */}
            <div className="pt-6 border-t border-slate-800">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <BookOpen className="text-indigo-500" size={24} />
                  <h2 className="text-xl font-bold text-white">Knowledge Review Queue</h2>
                </div>
              </div>

              {/* Review Task Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center">
                  <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2 text-center">Open Tasks</h3>
                  <span className="text-4xl font-bold text-white z-10">{impactData.open_review_tasks || 0}</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center">
                  <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2 text-center">Completed</h3>
                  <span className="text-4xl font-bold text-emerald-400 z-10">{impactData.completed_reviews || 0}</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center">
                  <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2 text-center">Completion Rate</h3>
                  <span className="text-4xl font-bold text-emerald-400 z-10">{impactData.review_completion_rate || 0}%</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center">
                  <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2 text-center">Avg Time</h3>
                  <span className="text-4xl font-bold text-white z-10">{impactData.average_review_time ? `${(impactData.average_review_time / 3600).toFixed(1)}h` : 'N/A'}</span>
                </div>
              </div>

              {/* Review Queue Component */}
              <KnowledgeReviewQueue />
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}

function KnowledgeReviewQueue() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const data = await adminService.getReviewTasks();
        setTasks(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  if (loading) {
    return <div className="text-slate-400 animate-pulse p-4">Loading queue...</div>;
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <h3 className="text-lg font-semibold text-white">Active Review Tasks</h3>
      </div>
      <div className="flex-1 overflow-auto p-0">
        {tasks.length > 0 ? (
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-800/50 text-slate-300 text-xs uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Document</th>
                <th className="px-6 py-4">Recommendation</th>
                <th className="px-6 py-4">Assigned To</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4">
                    <Link to={`/admin/documents/${task.document_id}`} className="text-white hover:text-cyan-400 transition-colors font-medium">
                      {task.filename}
                    </Link>
                  </td>
                  <td className="px-6 py-4 max-w-[200px] truncate" title={task.recommendation_title || ''}>
                    {task.recommendation_title}
                  </td>
                  <td className="px-6 py-4">
                    {task.assigned_admin_name || <span className="text-slate-500 italic">Unassigned</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.status === 'OPEN' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        task.status === 'IN_PROGRESS' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                        task.status === 'UNDER_REVIEW' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        task.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                        {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {new Date(task.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {task.status !== 'COMPLETED' && task.status !== 'DISMISSED' && (
                        <button 
                          onClick={async () => {
                            try {
                              await adminService.updateReviewTask(task.id, { status: 'COMPLETED' });
                              // Simple reload for now
                              window.location.reload();
                            } catch(err) {
                              console.error(err);
                            }
                          }}
                          className="text-emerald-400 hover:text-emerald-300 font-medium text-xs bg-emerald-500/10 px-2 py-1 rounded-md"
                        >
                          Complete
                        </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-slate-500">No active review tasks.</div>
        )}
      </div>
    </div>
  );
}
