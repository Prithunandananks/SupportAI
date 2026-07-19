import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import AnalyticsCards from "@/components/admin/analytics/AnalyticsCards";
import type { KPIData } from "@/components/admin/analytics/AnalyticsCards";
import ActivityChart from "@/components/admin/analytics/ActivityChart";
import type { ChartData } from "@/components/admin/analytics/ActivityChart";
import TopTopics from "@/components/admin/analytics/TopTopics";
import type { TopicData } from "@/components/admin/analytics/TopTopics";
import { adminService } from "@/services/admin.service";

export type AnalyticsRange = "today" | "7days" | "30days" | "month";

function Analytics() {
  const [range, setRange] = useState<AnalyticsRange>("today");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [kpis, setKpis] = useState<KPIData[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [topTopics, setTopTopics] = useState<TopicData[]>([]);
  const [agentSLA, setAgentSLA] = useState<{agent_name: string; resolved_tickets: number; compliance_rate: number}[]>([]);
  const [assignmentDistribution, setAssignmentDistribution] = useState<{name: string; value: number}[]>([]);
  const [openTicketsPerAgent, setOpenTicketsPerAgent] = useState<{name: string; open_tickets: number}[]>([]);
  const [autoAssignmentSuccessRate, setAutoAssignmentSuccessRate] = useState<number>(0);

  const fetchAnalytics = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    }
    try {
      const [analytics, stats] = await Promise.all([
        adminService.getAnalytics(),
        adminService.getStats()
      ]);
      
      const newKpis: KPIData[] = [
        { title: "Assigned Tickets", value: stats.assigned_tickets.toString(), iconKey: "Assignment" },
        { title: "Unassigned Tickets", value: stats.unassigned_tickets.toString(), iconKey: "Assignment" },
        { title: "Avg Agent Load", value: stats.average_agent_load !== null ? stats.average_agent_load.toString() : "0", iconKey: "Assignment" },
        { title: "Likes", value: stats.likes.toString(), iconKey: "Feedback" },
        { title: "Dislikes", value: stats.dislikes.toString(), iconKey: "Feedback" },
        { title: "Positive %", value: stats.positive_feedback !== null ? `${stats.positive_feedback}%` : "No Data", iconKey: "Feedback" },
        { title: "Total Reports", value: stats.total_reports.toString(), iconKey: "Flagged" },
        { title: "Open Reports", value: stats.open_reports.toString(), iconKey: "Flagged" },
        { title: "Closed Reports", value: stats.closed_reports.toString(), iconKey: "Flagged" },
        { title: "Report Rate", value: stats.report_rate !== null ? `${stats.report_rate}%` : "No Data", iconKey: "Flagged" },
        { title: "Tickets w/ Notes", value: stats.tickets_with_notes.toString(), iconKey: "Notes" },
        { title: "Total Notes", value: stats.total_internal_notes.toString(), iconKey: "Notes" },
        { title: "Avg Notes/Ticket", value: stats.average_notes_per_ticket !== null ? stats.average_notes_per_ticket.toString() : "0", iconKey: "Notes" },
        { title: "SLA Compliance", value: stats.sla_compliance_rate !== null ? `${stats.sla_compliance_rate}%` : "100%", iconKey: "Assignment" },
        { title: "SLA Breached", value: stats.sla_breached_tickets.toString(), iconKey: "Flagged" },
        { title: "Avg 1st Response", value: stats.average_first_response_time !== null ? `${stats.average_first_response_time}h` : "0h", iconKey: "Notes" },
        { title: "Avg Resolution", value: stats.average_resolution_time !== null ? `${stats.average_resolution_time}h` : "0h", iconKey: "Notes" },
        { title: "Overdue Tickets", value: stats.overdue_tickets.toString(), iconKey: "Flagged" },
      ];
      setKpis(newKpis);
      
      const maxChats = Math.max(...analytics.conversations, 1);
      const newChartData: ChartData[] = analytics.days.map((day, idx) => ({
        label: day,
        height: (analytics.conversations[idx] / maxChats) * 100,
        chats: analytics.conversations[idx],
        avgConfidence: "-",
        positiveFeedback: "-"
      }));
      setChartData(newChartData);
      
      setAgentSLA(analytics.agent_sla_performance || []);
      setAssignmentDistribution(analytics.assignment_distribution || []);
      setOpenTicketsPerAgent(analytics.open_tickets_per_agent || []);
      setAutoAssignmentSuccessRate(analytics.auto_assignment_success_rate || 0);
      setTopTopics([]);
      
    } catch {
      toast.error("Failed to load analytics");
    } finally {
      if (isManualRefresh) {
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAnalytics(false);
  }, [fetchAnalytics, range]);

  const handleRefresh = () => {
    fetchAnalytics(true).then(() => toast.success("Analytics refreshed successfully."));
  };

  return (
    <AdminLayout title="Analytics">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl md:text-2xl font-bold hidden md:block">Analytics Overview</h1>
        
        <div className="flex items-center gap-3 w-full md:w-auto ml-auto">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as AnalyticsRange)}
            className="flex-1 md:flex-none bg-slate-900 border border-slate-700 text-white text-sm rounded-lg px-4 py-2 focus:outline-none focus:border-cyan-500 transition-colors"
          >
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="month">This Month</option>
          </select>
          
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center justify-center bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={`md:mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden md:inline">Refresh</span>
          </button>
        </div>
      </div>

      <div className={`space-y-6 md:space-y-8 transition-opacity duration-300 ${isRefreshing ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
        <AnalyticsCards kpis={kpis} />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
          {chartData.length === 0 || chartData.every(d => d.chats === 0) ? (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 md:p-6 flex flex-col h-full min-h-[220px]">
              <h2 className="text-lg md:text-2xl font-semibold mb-4 md:mb-6">
                Chat Activity
              </h2>
              <div className="flex-1 flex items-center justify-center text-slate-400">
                No data available
              </div>
            </div>
          ) : (
            <ActivityChart chartData={chartData} />
          )}
          <TopTopics topics={topTopics} />
        </div>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 md:p-6 overflow-x-auto">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h2 className="text-lg md:text-2xl font-semibold">
              Agent SLA Performance
            </h2>
            <div className="text-sm font-medium text-slate-300">
              Auto Assignment Success Rate: <span className="text-cyan-400">{autoAssignmentSuccessRate}%</span>
            </div>
          </div>
          {agentSLA.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 py-8">
              No agent data available
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-800">
              <thead>
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-slate-400">Agent Name</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-slate-400">Resolved Tickets</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-slate-400">SLA Compliance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {agentSLA.map((agent, i) => (
                  <tr key={i}>
                    <td className="py-3 px-4 text-sm font-medium text-white">{agent.agent_name}</td>
                    <td className="py-3 px-4 text-sm text-slate-300">{agent.resolved_tickets}</td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        agent.compliance_rate >= 95 ? 'bg-green-900/40 text-green-400' :
                        agent.compliance_rate >= 80 ? 'bg-amber-900/40 text-amber-400' :
                        'bg-red-900/40 text-red-400'
                      }`}>
                        {agent.compliance_rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 md:p-6 overflow-x-auto">
            <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">
              Assignment Distribution
            </h2>
            {assignmentDistribution.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 py-8">
                No data available
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-800">
                <thead>
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-slate-400">Agent Name</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-slate-400">Total Assignments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {assignmentDistribution.map((dist, i) => (
                    <tr key={i}>
                      <td className="py-3 px-4 text-sm font-medium text-white">{dist.name}</td>
                      <td className="py-3 px-4 text-sm text-slate-300">{dist.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 md:p-6 overflow-x-auto">
            <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">
              Active Agent Workload
            </h2>
            {openTicketsPerAgent.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 py-8">
                No data available
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-800">
                <thead>
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-slate-400">Agent Name</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-slate-400">Open Tickets</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {openTicketsPerAgent.map((agent, i) => (
                    <tr key={i}>
                      <td className="py-3 px-4 text-sm font-medium text-white">{agent.name}</td>
                      <td className="py-3 px-4 text-sm text-slate-300">{agent.open_tickets}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default Analytics;