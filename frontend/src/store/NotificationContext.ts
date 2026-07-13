import { createContext } from 'react';
import type { Notification } from '@/services/notification.service';

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  archiveNotification: (id: string) => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
