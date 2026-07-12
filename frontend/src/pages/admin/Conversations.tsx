import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import ConversationTable from "@/components/admin/conversations/ConversationTable";
import ConversationDetailsModal from "@/components/admin/conversations/ConversationDetailsModal";
import { adminService } from "@/services/admin.service";
import { chatService } from "@/services/chat.service";
import { formatTimeAgo } from "@/utils/dateFormatter";
import { toast } from "sonner";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  customerName: string;
  status: "Completed" | "Flagged";
  startedAt: string;
  duration: string;
  messageCount: number;
  summary: string;
  messages: Message[];
}

function Conversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const convs = await adminService.getRecentConversations(100);
        const mapped = convs.map(c => ({
          id: c.id,
          customerName: c.user ? `${c.user.first_name} ${c.user.last_name}`.trim() : "Unknown",
          status: "Completed" as const,
          startedAt: formatTimeAgo(c.created_at),
          duration: "-",
          messageCount: c.message_count,
          summary: c.title || "No summary",
          messages: []
        }));
        setConversations(mapped);
      } catch {
        console.error("Failed to load conversations");
      }
    };
    fetchConversations();
  }, []);

  const handleOpen = async (conv: Conversation) => {
    setSelectedConversation(conv); // Optimistic UI
    
    try {
      const fullSession = await chatService.getSession(conv.id);
      
      const mappedMessages = fullSession.messages.map(m => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        timestamp: formatTimeAgo(m.created_at)
      }));
      
      setSelectedConversation(prev => {
        if (!prev || prev.id !== conv.id) return prev;
        return { ...prev, messages: mappedMessages };
      });
      
      setConversations(prev => 
        prev.map(c => c.id === conv.id ? { ...c, messages: mappedMessages } : c)
      );
    } catch {
      console.error("Failed to load full session messages");
    }
  };

  const handleClose = () => {
    setSelectedConversation(null);
  };

  const handleDelete = async () => {
    if (!selectedConversation) return;
    try {
      await chatService.deleteSession(selectedConversation.id);
      setConversations(prev => prev.filter(c => c.id !== selectedConversation.id));
      setSelectedConversation(null);
      toast.success("Conversation deleted successfully");
    } catch {
      toast.error("Failed to delete conversation");
    }
  };

  return (
    <AdminLayout title="Conversations">
      <ConversationTable conversations={conversations} onOpen={handleOpen} />
      <ConversationDetailsModal 
        isOpen={!!selectedConversation} 
        onClose={handleClose} 
        onDelete={handleDelete}
        conversation={selectedConversation} 
      />
    </AdminLayout>
  );
}

export default Conversations;