import { useState } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import AnalyticsCards from "@/components/admin/analytics/AnalyticsCards";
import ActivityChart from "@/components/admin/analytics/ActivityChart";
import TopTopics from "@/components/admin/analytics/TopTopics";

export type AnalyticsRange = "today" | "7days" | "30days" | "month";

export interface KPIData {
  title: string;
  value: string | number;
  iconKey: "Chats" | "Confidence" | "Feedback" | "Flagged";
  trend?: number;
  trendLabel?: string;
}

export interface ChartData {
  label: string;
  height: number;
  chats: number;
  avgConfidence: string;
  positiveFeedback: string;
}

export interface TopicData {
  name: string;
  conversations: number;
  popularity: number;
}

export interface AnalyticsData {
  kpis: KPIData[];
  chartData: ChartData[];
  topTopics: TopicData[];
}

export const mockAnalyticsData: Record<AnalyticsRange, AnalyticsData> = {
  today: {
    kpis: [
      { title: "Chats Today", value: "128", iconKey: "Chats", trend: 14, trendLabel: "vs yesterday" },
      { title: "Avg Confidence", value: "91%", iconKey: "Confidence", trend: 2, trendLabel: "vs yesterday" },
      { title: "Positive Feedback", value: "84%", iconKey: "Feedback", trend: -3, trendLabel: "vs yesterday" },
      { title: "Flagged Questions", value: "12", iconKey: "Flagged", trend: -18, trendLabel: "vs yesterday" },
    ],
    chartData: [
      { label: "8 AM", height: 20, chats: 12, avgConfidence: "89%", positiveFeedback: "80%" },
      { label: "10 AM", height: 60, chats: 35, avgConfidence: "92%", positiveFeedback: "85%" },
      { label: "12 PM", height: 80, chats: 50, avgConfidence: "90%", positiveFeedback: "82%" },
      { label: "2 PM", height: 100, chats: 65, avgConfidence: "93%", positiveFeedback: "88%" },
      { label: "4 PM", height: 50, chats: 28, avgConfidence: "91%", positiveFeedback: "84%" },
      { label: "6 PM", height: 30, chats: 18, avgConfidence: "94%", positiveFeedback: "89%" },
      { label: "8 PM", height: 10, chats: 5, avgConfidence: "95%", positiveFeedback: "90%" },
    ],
    topTopics: [
      { name: "Refund Policy", conversations: 48, popularity: 38 },
      { name: "VPN Setup", conversations: 33, popularity: 26 },
      { name: "Employee Handbook", conversations: 23, popularity: 18 },
      { name: "Leave Policy", conversations: 15, popularity: 12 },
      { name: "Payroll", conversations: 9, popularity: 6 },
    ],
  },
  "7days": {
    kpis: [
      { title: "Chats (7 Days)", value: "845", iconKey: "Chats", trend: 8, trendLabel: "vs prev 7 days" },
      { title: "Avg Confidence", value: "92%", iconKey: "Confidence", trend: 1, trendLabel: "vs prev 7 days" },
      { title: "Positive Feedback", value: "86%", iconKey: "Feedback", trend: 2, trendLabel: "vs prev 7 days" },
      { title: "Flagged Questions", value: "54", iconKey: "Flagged", trend: -12, trendLabel: "vs prev 7 days" },
    ],
    chartData: [
      { label: "Mon", height: 45, chats: 110, avgConfidence: "91%", positiveFeedback: "85%" },
      { label: "Tue", height: 80, chats: 145, avgConfidence: "93%", positiveFeedback: "88%" },
      { label: "Wed", height: 65, chats: 125, avgConfidence: "90%", positiveFeedback: "82%" },
      { label: "Thu", height: 100, chats: 160, avgConfidence: "94%", positiveFeedback: "89%" },
      { label: "Fri", height: 70, chats: 130, avgConfidence: "92%", positiveFeedback: "86%" },
      { label: "Sat", height: 30, chats: 75, avgConfidence: "89%", positiveFeedback: "80%" },
      { label: "Sun", height: 40, chats: 100, avgConfidence: "91%", positiveFeedback: "84%" },
    ],
    topTopics: [
      { name: "VPN Setup", conversations: 215, popularity: 25 },
      { name: "Refund Policy", conversations: 180, popularity: 21 },
      { name: "Password Reset", conversations: 150, popularity: 18 },
      { name: "Leave Policy", conversations: 110, popularity: 13 },
      { name: "Employee Handbook", conversations: 95, popularity: 11 },
    ],
  },
  "30days": {
    kpis: [
      { title: "Chats (30 Days)", value: "3,240", iconKey: "Chats", trend: 12, trendLabel: "vs prev 30 days" },
      { title: "Avg Confidence", value: "93%", iconKey: "Confidence", trend: 3, trendLabel: "vs prev 30 days" },
      { title: "Positive Feedback", value: "88%", iconKey: "Feedback", trend: 4, trendLabel: "vs prev 30 days" },
      { title: "Flagged Questions", value: "185", iconKey: "Flagged", trend: -22, trendLabel: "vs prev 30 days" },
    ],
    chartData: [
      { label: "Wk 1", height: 60, chats: 750, avgConfidence: "91%", positiveFeedback: "85%" },
      { label: "Wk 2", height: 85, chats: 890, avgConfidence: "93%", positiveFeedback: "89%" },
      { label: "Wk 3", height: 70, chats: 810, avgConfidence: "92%", positiveFeedback: "87%" },
      { label: "Wk 4", height: 95, chats: 790, avgConfidence: "94%", positiveFeedback: "90%" },
      { label: "", height: 0, chats: 0, avgConfidence: "", positiveFeedback: "" },
      { label: "", height: 0, chats: 0, avgConfidence: "", positiveFeedback: "" },
      { label: "", height: 0, chats: 0, avgConfidence: "", positiveFeedback: "" },
    ],
    topTopics: [
      { name: "Password Reset", conversations: 850, popularity: 26 },
      { name: "VPN Setup", conversations: 720, popularity: 22 },
      { name: "Onboarding", conversations: 540, popularity: 17 },
      { name: "Refund Policy", conversations: 410, popularity: 13 },
      { name: "Hardware Request", conversations: 320, popularity: 10 },
    ],
  },
  month: {
    kpis: [
      { title: "Chats (This Month)", value: "1,120", iconKey: "Chats", trend: 5, trendLabel: "vs last month" },
      { title: "Avg Confidence", value: "91%", iconKey: "Confidence", trend: -1, trendLabel: "vs last month" },
      { title: "Positive Feedback", value: "85%", iconKey: "Feedback", trend: -2, trendLabel: "vs last month" },
      { title: "Flagged Questions", value: "82", iconKey: "Flagged", trend: 10, trendLabel: "vs last month" },
    ],
    chartData: [
      { label: "Jul 1", height: 40, chats: 100, avgConfidence: "90%", positiveFeedback: "84%" },
      { label: "Jul 5", height: 60, chats: 150, avgConfidence: "91%", positiveFeedback: "85%" },
      { label: "Jul 10", height: 50, chats: 120, avgConfidence: "89%", positiveFeedback: "82%" },
      { label: "Jul 15", height: 80, chats: 200, avgConfidence: "93%", positiveFeedback: "88%" },
      { label: "Jul 20", height: 70, chats: 180, avgConfidence: "92%", positiveFeedback: "86%" },
      { label: "Jul 25", height: 90, chats: 220, avgConfidence: "94%", positiveFeedback: "89%" },
      { label: "Jul 30", height: 85, chats: 150, avgConfidence: "91%", positiveFeedback: "85%" },
    ],
    topTopics: [
      { name: "VPN Setup", conversations: 280, popularity: 25 },
      { name: "Password Reset", conversations: 240, popularity: 21 },
      { name: "Holiday Calendar", conversations: 190, popularity: 17 },
      { name: "Refund Policy", conversations: 150, popularity: 13 },
      { name: "Expense Reports", conversations: 90, popularity: 8 },
    ],
  },
};

function Analytics() {
  const [range, setRange] = useState<AnalyticsRange>("today");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Analytics refreshed successfully.");
    }, 1500);
  };

  const data = mockAnalyticsData[range];

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
        <AnalyticsCards kpis={data.kpis} />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
          <ActivityChart chartData={data.chartData} />
          <TopTopics topics={data.topTopics} />
        </div>
      </div>
    </AdminLayout>
  );
}

export default Analytics;