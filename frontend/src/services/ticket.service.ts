import apiClient from '../api/client';

export const TicketStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
} as const;
export type TicketStatus = typeof TicketStatus[keyof typeof TicketStatus];

export const TicketPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;
export type TicketPriority = typeof TicketPriority[keyof typeof TicketPriority];

export const TicketCategory = {
  REPORT: 'REPORT',
  GENERAL: 'GENERAL',
  BUG: 'BUG',
  FEATURE: 'FEATURE',
} as const;
export type TicketCategory = typeof TicketCategory[keyof typeof TicketCategory];

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

export interface Ticket {
  id: string;
  ticket_number: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  customer_id: string;
  assigned_admin_id?: string;
  conversation_id?: string;
  chat_message_id?: string;
  report_reason?: string;
  customer_comment?: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
}

export interface TicketStatusHistory {
  id: string;
  event_type: string;
  old_value?: string;
  new_value?: string;
  changed_by: string;
  created_at: string;
}

export interface TicketDetail extends Ticket {
  messages: TicketMessage[];
  history: TicketStatusHistory[];
}

export interface AdminTicketDetail extends Ticket {
  messages: TicketMessage[];
  history: TicketStatusHistory[];
  assigned_admin_name?: string;
}

export const ticketService = {
  // Customer Methods
  createTicket: async (data: { title: string; description: string; category: TicketCategory; conversation_id?: string }) => {
    const response = await apiClient.post<Ticket>('/tickets/', data);
    return response.data;
  },
  
  getMyTickets: async () => {
    const response = await apiClient.get<Ticket[]>('/tickets/');
    return response.data;
  },
  
  getTicket: async (id: string) => {
    const response = await apiClient.get<TicketDetail>(`/tickets/${id}`);
    return response.data;
  },
  
  replyToTicket: async (id: string, message: string) => {
    const response = await apiClient.post<TicketMessage>(`/tickets/${id}/messages`, { message });
    return response.data;
  },
  

  
  // Admin Methods
  getAllTickets: async (status?: TicketStatus, priority?: TicketPriority, isFlagged?: boolean) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (priority) params.append('priority', priority);
    if (isFlagged !== undefined) params.append('is_flagged', isFlagged.toString());
    const response = await apiClient.get<Ticket[]>(`/admin/tickets?${params.toString()}`);
    return response.data;
  },
  
  getAdminTicket: async (id: string) => {
    const response = await apiClient.get<AdminTicketDetail>(`/admin/tickets/${id}`);
    return response.data;
  },
  
  assignTicket: async (id: string, adminId: string) => {
    const response = await apiClient.patch<Ticket>(`/admin/tickets/${id}/assign`, {
      assigned_admin_id: adminId
    });
    return response.data;
  },
  
  updateTicketStatus: async (id: string, status: TicketStatus) => {
    const response = await apiClient.patch<Ticket>(`/admin/tickets/${id}/status`, { status });
    return response.data;
  },
  
  adminReplyToTicket: async (id: string, message: string) => {
    const response = await apiClient.post<TicketMessage>(`/admin/tickets/${id}/messages`, { message });
    return response.data;
  }
};
