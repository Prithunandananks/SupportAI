import { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { notificationService } from '@/services/notification.service';
import type { Notification } from '@/services/notification.service';
import { useAuth } from '@/hooks/useAuthCore';
import { NotificationContext } from './NotificationContext';

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAuthenticated } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      if (mounted) {
        await fetchNotifications();
      }
    };
    void fetchData();
    
    // Periodic polling to update count. Future sprints can upgrade this context to use WebSockets.
    const interval = setInterval(() => {
      if (mounted) {
        void fetchNotifications();
      }
    }, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    await notificationService.markAsRead(id);
    await fetchNotifications();
  };

  const markAllAsRead = async () => {
    await notificationService.markAllAsRead();
    await fetchNotifications();
  };

  const archiveNotification = async (id: string) => {
    await notificationService.archiveNotification(id);
    await fetchNotifications();
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, archiveNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}
