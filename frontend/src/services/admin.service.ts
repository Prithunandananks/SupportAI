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
  assigned_tickets: number;
  unassigned_tickets: number;
  average_agent_load: number | null;
  tickets_with_notes: number;
  total_internal_notes: number;
  average_notes_per_ticket: number | null;
  sla_compliance_rate: number | null;
  sla_breached_tickets: number;
  average_first_response_time: number | null;
  average_resolution_time: number | null;
  overdue_tickets: number;
  auto_assigned_tickets: number;
  manual_assignments: number;
}

export interface AgentSLA {
  agent_name: string;
  compliance_rate: number;
  resolved_tickets: number;
}

export interface AgentDistribution {
  name: string;
  value: number;
}

export interface AgentOpenTickets {
  name: string;
  open_tickets: number;
}

export interface AnalyticsData {
  days: string[];
  uploads: number[];
  conversations: number[];
  sla_compliance_trend: number[];
  resolution_time_trend: number[];
  priority_resolution_time: Record<string, number>;
  agent_sla_performance: AgentSLA[];
  assignment_distribution: AgentDistribution[];
  open_tickets_per_agent: AgentOpenTickets[];
  auto_assignment_success_rate: number;
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

  async getKnowledgeImpact(): Promise<KnowledgeImpactAnalytics> {
    const response = await apiClient.get<KnowledgeImpactAnalytics>("/admin/knowledge-impact");
    return response.data;
  }

  async detectKnowledgeGaps(): Promise<KnowledgeGapResponse[]> {
    const response = await apiClient.post<KnowledgeGapResponse[]>("/admin/knowledge-gaps/detect");
    return response.data;
  }

  async getKnowledgeGaps(): Promise<KnowledgeGapResponse[]> {
    const response = await apiClient.get<KnowledgeGapResponse[]>("/admin/knowledge-gaps");
    return response.data;
  }

  async generateRecommendations(): Promise<ImprovementRecommendationResponse[]> {
    const response = await apiClient.post<ImprovementRecommendationResponse[]>("/admin/recommendations/generate");
    return response.data;
  }

  async getRecommendations(): Promise<ImprovementRecommendationResponse[]> {
    const response = await apiClient.get<ImprovementRecommendationResponse[]>("/admin/recommendations");
    return response.data;
  }

  async updateRecommendationStatus(id: string, status: string): Promise<ImprovementRecommendationResponse> {
    const response = await apiClient.patch<ImprovementRecommendationResponse>(`/admin/recommendations/${id}/status`, { status });
    return response.data;
  }

  async getReviewTasks(): Promise<KnowledgeReviewTaskResponse[]> {
    const response = await apiClient.get<KnowledgeReviewTaskResponse[]>("/admin/review-tasks");
    return response.data;
  }

  async getReviewTask(id: string): Promise<KnowledgeReviewTaskResponse> {
    const response = await apiClient.get<KnowledgeReviewTaskResponse>(`/admin/review-tasks/${id}`);
    return response.data;
  }

  async createReviewTask(data: KnowledgeReviewTaskCreate): Promise<KnowledgeReviewTaskResponse> {
    const response = await apiClient.post<KnowledgeReviewTaskResponse>("/admin/review-tasks", data);
    return response.data;
  }

  async updateReviewTask(id: string, data: KnowledgeReviewTaskUpdate): Promise<KnowledgeReviewTaskResponse> {
    const response = await apiClient.patch<KnowledgeReviewTaskResponse>(`/admin/review-tasks/${id}`, data);
    return response.data;
  }
}

export interface TopDocument {
  document_id: string;
  filename: string;
  count: number;
}

export interface ProblematicChunk {
  chunk_index: number;
  document_id: string;
  filename: string;
  flag_count: number;
}

export interface DocumentHealth {
  document_id: string;
  filename: string;
  total_references: number;
  flagged_responses: number;
  health_score: number;
}

export interface KnowledgeGapResponse {
  id: string;
  document_id: string;
  filename: string;
  gap_type: string;
  severity: string;
  description: string;
  created_at: string;
  resolved_at: string | null;
}

export interface GapTrend {
  date: string;
  count: number;
}

export interface AffectedDocument {
  document_id: string;
  filename: string;
  gap_count: number;
}

export interface ImprovementRecommendationResponse {
  id: string;
  document_id: string;
  filename: string;
  knowledge_gap_id: string | null;
  recommendation_type: string;
  severity: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

export interface KnowledgeReviewTaskResponse {
  id: string;
  recommendation_id: string;
  document_id: string;
  filename: string;
  assigned_admin_id: string | null;
  assigned_admin_name: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  recommendation_title: string | null;
}

export interface KnowledgeReviewTaskCreate {
  recommendation_id: string;
  document_id: string;
  assigned_admin_id?: string | null;
  notes?: string | null;
}

export interface KnowledgeReviewTaskUpdate {
  assigned_admin_id?: string | null;
  status?: string | null;
  notes?: string | null;
}

export interface KnowledgeImpactAnalytics {
  top_flagged_documents: TopDocument[];
  top_referenced_documents: TopDocument[];
  top_problematic_chunks: ProblematicChunk[];
  document_health_ranking: DocumentHealth[];
  total_open_gaps: number;
  critical_gaps: number;
  gap_resolution_rate: number;
  gap_trend: GapTrend[];
  most_affected_documents: AffectedDocument[];
  recent_gaps: KnowledgeGapResponse[];
  open_recommendations: number;
  critical_recommendations: number;
  completed_recommendations: number;
  recommendation_resolution_rate: number;
  most_recommended_documents: AffectedDocument[];
  recent_recommendations: ImprovementRecommendationResponse[];
  open_review_tasks: number;
  completed_reviews: number;
  review_completion_rate: number;
  average_review_time: number | null;
  reviewer_workload: Array<{admin_id: string, name: string, active_tasks: number}>;
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

