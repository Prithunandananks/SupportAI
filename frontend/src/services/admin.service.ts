import apiClient from "../api/client";

export interface DashboardStats {
  total_users: number;
  active_users: number;
  total_conversations: number;
  total_ai_messages: number;
  total_documents: number;
}

export interface AnalyticsData {
  days: string[];
  uploads: number[];
  conversations: number[];
}

export interface AdminDocument {
  id: string;
  filename: string;
  user_id: string;
  file_size: number;
  content_type: string;
  created_at: string;
}

export interface AdminConversation {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  message_count: number;
}

export interface AdminHealth {
  database: string;
  qdrant: string;
  documents: number;
  users: number;
  conversations: number;
}

class AdminService {
  async getStats(): Promise<DashboardStats> {
    const response = await apiClient.get<DashboardStats>("/admin/stats");
    return response.data;
  }

  async getAnalytics(): Promise<AnalyticsData> {
    const response = await apiClient.get<AnalyticsData>("/admin/analytics");
    return response.data;
  }

  async getRecentDocuments(limit = 10): Promise<AdminDocument[]> {
    const response = await apiClient.get<AdminDocument[]>("/admin/documents", { params: { limit } });
    return response.data;
  }

  async getRecentConversations(limit = 10): Promise<AdminConversation[]> {
    const response = await apiClient.get<AdminConversation[]>("/admin/conversations", { params: { limit } });
    return response.data;
  }

  async getHealth(): Promise<AdminHealth> {
    const response = await apiClient.get<AdminHealth>("/admin/health");
    return response.data;
  }

  async deleteDocument(id: string): Promise<void> {
    await apiClient.delete(`/documents/${id}`);
  }
}

export const adminService = new AdminService();
