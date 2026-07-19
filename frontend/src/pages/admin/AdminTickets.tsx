import React, { useEffect, useState } from 'react';
import { type AdminTicketResponse, ticketService, TicketStatus, TicketPriority } from '../../services/ticket.service';
import { Link } from 'react-router-dom';
import AdminLayout from '@/components/admin/layout/AdminLayout';

const AdminTickets: React.FC = () => {
  const [tickets, setTickets] = useState<AdminTicketResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'ALL'>('ALL');
  const [assignmentFilter, setAssignmentFilter] = useState<'ALL' | 'ASSIGNED_TO_ME' | 'UNASSIGNED'>('ALL');
  const [slaFilter, setSlaFilter] = useState<'ALL' | 'BREACHED' | 'OVERDUE' | 'DUE_SOON'>('ALL');

  const fetchTickets = async () => {
    try {
      setLoading(true);
      let data: AdminTicketResponse[] = [];
      if (assignmentFilter === 'ASSIGNED_TO_ME') {
        data = await ticketService.getAssignedToMe();
      } else if (assignmentFilter === 'UNASSIGNED') {
        data = await ticketService.getUnassigned();
      } else {
        data = await ticketService.getAllTickets(
          statusFilter !== 'ALL' ? statusFilter : undefined,
          priorityFilter !== 'ALL' ? priorityFilter : undefined
        );
      }
      
      if (assignmentFilter !== 'ALL') {
        if (statusFilter !== 'ALL') {
          data = data.filter(t => t.status === statusFilter);
        }
        if (priorityFilter !== 'ALL') {
          data = data.filter(t => t.priority === priorityFilter);
        }
      }
      
      if (slaFilter !== 'ALL') {
        if (slaFilter === 'BREACHED') data = data.filter(t => t.is_breached);
        else if (slaFilter === 'OVERDUE') data = data.filter(t => t.is_overdue);
        else if (slaFilter === 'DUE_SOON') data = data.filter(t => t.is_due_soon);
      }
      
      setTickets(data);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, priorityFilter, assignmentFilter, slaFilter]);

  const getStatusBadge = (status: TicketStatus) => {
    const styles = {
      [TicketStatus.OPEN]: 'bg-blue-100 text-blue-800 border-blue-200',
      [TicketStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      [TicketStatus.WAITING_FOR_CUSTOMER]: 'bg-purple-100 text-purple-800 border-purple-200',
      [TicketStatus.RESOLVED]: 'bg-green-100 text-green-800 border-green-200',
      [TicketStatus.CLOSED]: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  const getPriorityBadge = (priority: TicketPriority) => {
    const styles = {
      [TicketPriority.LOW]: 'bg-gray-100 text-gray-800',
      [TicketPriority.MEDIUM]: 'bg-blue-100 text-blue-800',
      [TicketPriority.HIGH]: 'bg-orange-100 text-orange-800',
      [TicketPriority.URGENT]: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[priority]}`}>
        {priority}
      </span>
    );
  };

  const getSlaBadge = (ticket: AdminTicketResponse) => {
    if (ticket.is_breached) {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-900/40 text-red-400 border border-red-500/50 uppercase tracking-wider">Breached</span>;
    }
    if (ticket.is_overdue) {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-900/40 text-red-400 border border-red-500/50 uppercase tracking-wider">Overdue</span>;
    }
    if (ticket.is_due_soon) {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-900/40 text-amber-400 border border-amber-500/50 uppercase tracking-wider">Due Soon</span>;
    }
    if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
      return null;
    }
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-900/40 text-green-400 border border-green-500/50 uppercase tracking-wider">On Track</span>;
  };

  return (
    <AdminLayout title="Tickets">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-white">Ticket Dashboard</h1>
          <p className="mt-2 text-sm text-slate-400">
            Manage all customer support tickets across the platform.
          </p>
        </div>
      </div>
      
      <div className="mt-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
        <div>
          <select
            value={assignmentFilter}
            onChange={(e) => setAssignmentFilter(e.target.value as 'ALL' | 'ASSIGNED_TO_ME' | 'UNASSIGNED')}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-slate-800 border-slate-700 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md"
          >
            <option value="ALL">All Assignments</option>
            <option value="ASSIGNED_TO_ME">Assigned To Me</option>
            <option value="UNASSIGNED">Unassigned</option>
          </select>
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TicketStatus | 'ALL')}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-slate-800 border-slate-700 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md"
          >
            <option value="">All Statuses</option>
            {Object.values(TicketStatus).map((status) => (
              <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as TicketPriority | 'ALL')}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-slate-800 border-slate-700 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md"
          >
            <option value="">All Priorities</option>
            {Object.values(TicketPriority).map((priority) => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={slaFilter}
            onChange={(e) => setSlaFilter(e.target.value as 'ALL' | 'DUE_SOON' | 'OVERDUE' | 'BREACHED')}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-slate-800 border-slate-700 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md"
          >
            <option value="ALL">All SLA Status</option>
            <option value="DUE_SOON">Due Soon</option>
            <option value="OVERDUE">Overdue</option>
            <option value="BREACHED">Breached</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="mt-8 text-center text-slate-400">Loading tickets...</div>
      ) : (
        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden border border-slate-800 md:rounded-lg">
                <table className="min-w-full divide-y divide-slate-800">
                  <thead className="bg-slate-900">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-6">
                        Ticket ID
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">
                        Title
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">
                        SLA Status
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">
                        Status
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">
                        Priority
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">
                        Category
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">
                        Created
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">View</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900">
                    {tickets.map((ticket) => (
                      <tr key={ticket.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-white sm:pl-6">
                          {ticket.ticket_number}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-400">
                          {ticket.title}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-400">
                          {getSlaBadge(ticket)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-400">
                          {getStatusBadge(ticket.status)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-400">
                          {getPriorityBadge(ticket.priority)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-400">
                          {ticket.category.replace(/_/g, ' ')}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-400">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <Link to={`/admin/tickets/${ticket.id}`} className="text-cyan-500 hover:text-cyan-400">
                            Manage<span className="sr-only">, {ticket.ticket_number}</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {tickets.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          No tickets found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminTickets;
