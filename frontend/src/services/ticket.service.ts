import apiClient from '../api/client';

export const TicketStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  WAITING_FOR_CUSTOMER: 'WAITING_FOR_CUSTOMER',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
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
  assigned_at?: string;
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

export interface TicketInternalNote {
  id: string;
  ticket_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface TicketDetail extends Ticket {
  messages: TicketMessage[];
  history: TicketStatusHistory[];
}

export interface AdminTicketResponse extends Ticket {
  first_response_due?: string;
  resolution_due?: string;
  first_response_at?: string;
  is_breached: boolean;
  is_overdue: boolean;
  is_due_soon: boolean;
}

export interface AdminTicketDetail extends AdminTicketResponse {
  messages: TicketMessage[];
  history: TicketStatusHistory[];
  internal_notes: TicketInternalNote[];
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
  
  closeTicket: async (id: string) => {
    const response = await apiClient.patch<Ticket>(`/tickets/${id}/close`);
    return response.data;
  },
  
  // Admin Methods
  getAllTickets: async (status?: TicketStatus, priority?: TicketPriority, isFlagged?: boolean) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (priority) params.append('priority', priority);
    if (isFlagged !== undefined) params.append('is_flagged', isFlagged.toString());
    const response = await apiClient.get<AdminTicketResponse[]>(`/admin/tickets?${params.toString()}`);
    return response.data;
  },
  
  getAdminTicket: async (id: string) => {
    const response = await apiClient.get<AdminTicketDetail>(`/admin/tickets/${id}`);
    return response.data;
  },
  
  assignTicket: async (id: string, assigneeId?: string) => {
    const response = await apiClient.patch<AdminTicketResponse>(`/admin/tickets/${id}/assign`, {
      assignee_id: assigneeId
    });
    return response.data;
  },
  
  unassignTicket: async (id: string) => {
    const response = await apiClient.patch<AdminTicketResponse>(`/admin/tickets/${id}/unassign`);
    return response.data;
  },
  
  getAssignedToMe: async () => {
    const response = await apiClient.get<AdminTicketResponse[]>('/admin/tickets/assigned/me');
    return response.data;
  },
  
  getUnassigned: async () => {
    const response = await apiClient.get<AdminTicketResponse[]>('/admin/tickets/unassigned');
    return response.data;
  },
  
  updateTicketStatus: async (id: string, status: TicketStatus) => {
    const response = await apiClient.patch<AdminTicketResponse>(`/admin/tickets/${id}/status`, { status });
    return response.data;
  },
  
  adminReplyToTicket: async (id: string, message: string) => {
    const response = await apiClient.post<TicketMessage>(`/admin/tickets/${id}/messages`, { message });
    return response.data;
  },
  
  adminAddInternalNote: async (id: string, content: string) => {
    const response = await apiClient.post<TicketInternalNote>(`/admin/tickets/${id}/notes`, { content });
    return response.data;
  }
};
