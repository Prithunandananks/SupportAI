import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { 
  adminService, 
  type KnowledgeGapResponse, 
  type ImprovementRecommendationResponse, 
  type KnowledgeReviewTaskResponse 
} from '@/services/admin.service';
import { AlertTriangle, ShieldAlert, CheckCircle, Clock } from 'lucide-react';

export default function AdminDocumentDetails() {
  const { id } = useParams<{ id: string }>();
  const [gaps, setGaps] = useState<KnowledgeGapResponse[]>([]);
  const [recommendations, setRecommendations] = useState<ImprovementRecommendationResponse[]>([]);
  const [tasks, setTasks] = useState<KnowledgeReviewTaskResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // We'll fetch all and filter by document_id since there are no targeted endpoints for a single document
        // In a real prod environment we would add document-specific filters to the backend API.
        const [allGaps, allRecs, allTasks] = await Promise.all([
          adminService.getKnowledgeGaps(),
          adminService.getRecommendations(),
          adminService.getReviewTasks()
        ]);
        
        setGaps(allGaps.filter(g => g.document_id === id));
        setRecommendations(allRecs.filter(r => r.document_id === id));
        setTasks(allTasks.filter(t => t.document_id === id));
      } catch (err: unknown) {
        if (err instanceof Error) {
            setError(err.message || 'Failed to load document details');
        } else {
            setError('Failed to load document details');
        }
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchData();
    }
  }, [id]);

  if (loading) {
    return (
      <AdminLayout title="Document Details">
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-slate-400 animate-pulse text-lg">Loading document insights...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Document Details">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertTriangle size={24} />
          <p>{error}</p>
        </div>
      </AdminLayout>
    );
  }

  const filename = gaps[0]?.filename || recommendations[0]?.filename || tasks[0]?.filename || id;

  return (
    <AdminLayout title={`Document Review: ${filename}`}>
      <div className="space-y-6">
        
        {/* Knowledge Gaps */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <ShieldAlert className="text-red-500" size={20} />
            <h3 className="text-lg font-semibold text-white">Knowledge Gaps</h3>
          </div>
          <div className="p-6">
            {gaps.length > 0 ? (
              <ul className="space-y-4">
                {gaps.map(gap => (
                  <li key={gap.id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex justify-between">
                      <span className="font-semibold text-white">{gap.gap_type.replace(/_/g, ' ')}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        gap.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        gap.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                        gap.severity === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                        'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {gap.severity}
                      </span>
                    </div>
                    <p className="text-slate-400 mt-2 text-sm">{gap.description}</p>
                    <div className="text-xs text-slate-500 mt-2">Detected: {new Date(gap.created_at).toLocaleString()}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500">No knowledge gaps detected for this document.</p>
            )}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <CheckCircle className="text-emerald-500" size={20} />
            <h3 className="text-lg font-semibold text-white">Recommendations</h3>
          </div>
          <div className="p-6">
            {recommendations.length > 0 ? (
              <ul className="space-y-4">
                {recommendations.map(rec => (
                  <li key={rec.id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex justify-between">
                      <span className="font-semibold text-white">{rec.title}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        rec.status === 'OPEN' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        rec.status === 'IN_PROGRESS' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                        rec.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {rec.status}
                      </span>
                    </div>
                    <p className="text-slate-400 mt-2 text-sm">{rec.description}</p>
                    <div className="flex items-center gap-4 mt-3">
                      {rec.status !== 'COMPLETED' && (
                        <button
                          onClick={async () => {
                            try {
                              await adminService.createReviewTask({
                                recommendation_id: rec.id,
                                document_id: rec.document_id,
                              });
                              window.location.reload();
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded transition-colors"
                        >
                          Create Review Task
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500">No recommendations for this document.</p>
            )}
          </div>
        </div>

        {/* Review Tasks */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <Clock className="text-indigo-500" size={20} />
            <h3 className="text-lg font-semibold text-white">Review History & Active Tasks</h3>
          </div>
          <div className="p-6">
            {tasks.length > 0 ? (
              <ul className="space-y-4">
                {tasks.map(task => (
                  <li key={task.id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex justify-between">
                      <span className="font-medium text-white">Task for: {task.recommendation_title}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.status === 'OPEN' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        task.status === 'IN_PROGRESS' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                        task.status === 'UNDER_REVIEW' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        task.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mt-1">Assigned to: {task.assigned_admin_name || <span className="italic">Unassigned</span>}</p>
                    {task.status !== 'COMPLETED' && task.status !== 'DISMISSED' && (
                      <div className="mt-3">
                        <button
                          onClick={async () => {
                            try {
                              await adminService.updateReviewTask(task.id, { status: 'COMPLETED' });
                              window.location.reload();
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                          className="text-emerald-400 hover:text-emerald-300 font-medium text-xs bg-emerald-500/10 px-2 py-1 rounded-md"
                        >
                          Complete Task
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500">No review tasks found for this document.</p>
            )}
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
