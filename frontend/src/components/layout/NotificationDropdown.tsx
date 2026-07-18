import { useState, useRef, useEffect } from 'react';
import { Bell, Trash } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';

export default function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, archiveNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (id: string) => {
    await markAsRead(id);
    setIsOpen(false);
  };

  const handleArchive = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await archiveNotification(id);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-white transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col">
          <div className="p-3 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
            <span className="font-medium text-white">Notifications</span>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[300px] custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-sm">No new notifications</div>
            ) : (
              notifications.slice(0, 5).map(n => (
                <div 
                  key={n.id} 
                  onClick={() => handleNotificationClick(n.id)}
                  className={`p-3 border-b border-slate-800 hover:bg-slate-800 cursor-pointer transition-colors relative group ${!n.is_read ? 'bg-cyan-900/10' : ''}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <p className={`text-sm ${!n.is_read ? 'text-white font-medium' : 'text-slate-300'}`}>{n.title}</p>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                    <button 
                      onClick={(e) => handleArchive(e, n.id)}
                      className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-2 border-t border-slate-700 bg-slate-800/50 text-center">
            <button 
              onClick={() => {
                setIsOpen(false);
                navigate('/notifications');
              }}
              className="text-sm text-cyan-400 hover:text-cyan-300 w-full"
            >
              View All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
