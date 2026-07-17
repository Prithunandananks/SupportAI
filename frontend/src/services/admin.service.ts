import apiClient from "../api/client";
import type { AxiosProgressEvent } from "axios";

export interface DashboardStats {
  total_users: number;
  active_users: number;
  total_conversations: number;
  total_ai_messages: number;
  total_documents: number;
  flagged_questions: number;
  average_confidence: number | null;
  positive_feedback: number | null;
  negative_feedback: number | null;
  likes: number;
  dislikes: number;
  total_reports: number;
  open_reports: number;
  closed_reports: number;
  report_rate: number | null;
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

export interface AdminActivity {
  id: string;
  type: string;
  description: string;
  created_at: string;
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
    const response = await apiClient.get<AdminDocument[]>("/admin/documents", {
      params: { limit },
    });
    return response.data;
  }

  async getRecentConversations(limit = 10): Promise<AdminConversation[]> {
    const response = await apiClient.get<AdminConversation[]>(
      "/admin/conversations",
      { params: { limit } },
    );
    return response.data;
  }

  async getHealth(): Promise<AdminHealth> {
    const response = await apiClient.get<AdminHealth>("/admin/health");
    return response.data;
  }

  async getRecentActivity(limit = 10): Promise<AdminActivity[]> {
    const response = await apiClient.get<AdminActivity[]>("/admin/recent-activity", {
      params: { limit },
    });
    return response.data;
  }

  async deleteDocument(id: string): Promise<void> {
    await apiClient.delete(`/documents/${id}`);
  }

  async uploadDocument(
    file: File,
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void,
  ): Promise<AdminDocument> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post("/documents/upload", formData, {
      onUploadProgress,
    });

    const data = response.data;

    return {
      id: data.document_id,
      filename: data.filename,
      user_id: "",
      file_size: file.size,
      content_type: file.type,
      created_at: new Date().toISOString(),
    };
  }

  async getDocumentPreview(id: string): Promise<Blob> {
    const response = await apiClient.get<Blob>(`/documents/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async downloadDocument(id: string, filename: string): Promise<void> {
    const blob = await this.getDocumentPreview(id);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Strip the emoji prefix if it exists
    a.download = filename.replace(/^📄\s*/, '');
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  async getQualityAnalytics(): Promise<QualityAnalyticsResponse> {
    const response = await apiClient.get<QualityAnalyticsResponse>("/admin/quality/analytics");
    return response.data;
  }
}

export interface ReportReasonStat {
  reason: string;
  count: number;
}

export interface StatusStat {
  status: string;
  count: number;
}

export interface RecentFlaggedResponse {
  ticket_id: string;
  ticket_number: string;
  title: string;
  reason: string | null;
  created_at: string;
  status: string;
}

export interface ReportedQuestionStat {
  message_id: string;
  customer_question: string;
  ai_response: string;
  report_count: number;
}

export interface QualityAnalyticsResponse {
  total_flagged: number;
  open_tickets: number;
  resolved_tickets: number;
  average_resolution_time_hours: number | null;
  report_reasons: ReportReasonStat[];
  status_distribution: StatusStat[];
  recent_flags: RecentFlaggedResponse[];
  most_reported_questions: ReportedQuestionStat[];
}

export const adminService = new AdminService();

