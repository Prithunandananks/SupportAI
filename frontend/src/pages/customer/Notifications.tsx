import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { Trash, CheckCircle2 } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';

export default function Notifications() {
  const { notifications, markAsRead, markAllAsRead, archiveNotification } = useNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = async (id: string, related_ticket_id: string | null) => {
    await markAsRead(id);
    if (related_ticket_id) {
      navigate(`/customer/tickets/${related_ticket_id}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <button 
            onClick={() => markAllAsRead()}
            className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300"
          >
            <CheckCircle2 size={16} /> Mark all as read
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              You have no notifications.
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {notifications.map(n => (
                <div 
                  key={n.id} 
                  onClick={() => handleNotificationClick(n.id, n.related_ticket_id)}
                  className={`p-4 hover:bg-slate-800 cursor-pointer transition-colors flex gap-4 ${!n.is_read ? 'bg-cyan-950/20 border-l-2 border-l-cyan-500' : 'pl-[18px]'}`}
                >
                  <div className="flex-1">
                    <h3 className={`text-base ${!n.is_read ? 'text-white font-medium' : 'text-slate-300'}`}>{n.title}</h3>
                    <p className="text-sm text-slate-400 mt-1">{n.message}</p>
                    <p className="text-xs text-slate-500 mt-2">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-start">
                    <button 
                      onClick={(e) => { e.stopPropagation(); archiveNotification(n.id); }}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Archive"
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
