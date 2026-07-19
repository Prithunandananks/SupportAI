import {
  MessageCircle,
  FileText,
  BadgeCheck,
  UserCheck,
  Inbox,
  Users
} from "lucide-react";

import { useEffect, useState } from "react";
import StatCard from "./StatCard";
import { adminService, type DashboardStats as ApiStats } from "@/services/admin.service";

function DashboardStats() {
  const [stats, setStats] = useState<ApiStats | null>(null);

  useEffect(() => {
    adminService.getStats().then(setStats).catch(console.error);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">

      <StatCard
        title="Total Conversations"
        value={stats ? stats.total_conversations.toString() : "0"}
        icon={<MessageCircle className="w-7 h-7 md:w-9 md:h-9" />}
      />

      <StatCard
        title="Documents Uploaded"
        value={stats ? stats.total_documents.toString() : "0"}
        icon={<FileText className="w-7 h-7 md:w-9 md:h-9" />}
      />


      <StatCard
        title="Unassigned Tickets"
        value={stats ? stats.unassigned_tickets.toString() : "0"}
        icon={<Inbox className="w-7 h-7 md:w-9 md:h-9" />}
      />

      <StatCard
        title="Assigned Tickets"
        value={stats ? stats.assigned_tickets.toString() : "0"}
        icon={<UserCheck className="w-7 h-7 md:w-9 md:h-9" />}
      />

      <StatCard
        title="Avg Agent Load"
        value={stats && stats.average_agent_load !== null ? stats.average_agent_load.toString() : "0"}
        icon={<Users className="w-7 h-7 md:w-9 md:h-9" />}
      />

      <StatCard
        title="Positive Feedback"
        value={stats && stats.positive_feedback !== null ? `${stats.positive_feedback}%` : "No Data"}
        icon={<BadgeCheck className="w-7 h-7 md:w-9 md:h-9" />}
      />

      <StatCard
        title="Tickets With Notes"
        value={stats ? stats.tickets_with_notes.toString() : "0"}
        icon={<FileText className="w-7 h-7 md:w-9 md:h-9" />}
      />

      <StatCard
        title="Avg Notes/Ticket"
        value={stats && stats.average_notes_per_ticket !== null ? stats.average_notes_per_ticket.toString() : "0"}
        icon={<MessageCircle className="w-7 h-7 md:w-9 md:h-9" />}
      />

      <StatCard
        title="Auto Assigned Tickets"
        value={stats ? stats.auto_assigned_tickets.toString() : "0"}
        icon={<UserCheck className="w-7 h-7 md:w-9 md:h-9 text-cyan-500" />}
      />

      <StatCard
        title="Manual Assignments"
        value={stats ? stats.manual_assignments.toString() : "0"}
        icon={<Users className="w-7 h-7 md:w-9 md:h-9 text-yellow-500" />}
      />

    </div>
  );
}

export default DashboardStats;