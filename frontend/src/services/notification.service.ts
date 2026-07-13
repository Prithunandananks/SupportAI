import apiClient from '../api/client';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  status: string;
  metadata_obj: Record<string, unknown>;
  related_ticket_id: string | null;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

export const notificationService = {
  getNotifications: async (limit: number = 50) => {
    const res = await apiClient.get<Notification[]>(`/notifications?limit=${limit}`);
    return res.data;
  },
  markAsRead: async (id: string) => {
    const res = await apiClient.patch<Notification>(`/notifications/${id}/read`);
    return res.data;
  },
  markAllAsRead: async () => {
    const res = await apiClient.patch(`/notifications/read-all`);
    return res.data;
  },
  archiveNotification: async (id: string) => {
    const res = await apiClient.patch<Notification>(`/notifications/${id}/archive`);
    return res.data;
  }
};
