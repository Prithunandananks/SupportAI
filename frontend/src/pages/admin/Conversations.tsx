import { useState } from "react";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import ConversationTable from "@/components/admin/conversations/ConversationTable";
import ConversationDetailsModal from "@/components/admin/conversations/ConversationDetailsModal";

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

const mockConversations: Conversation[] = [
  {
    id: "conv-1",
    customerName: "John",
    status: "Completed",
    startedAt: "10:22 AM",
    duration: "5m 12s",
    messageCount: 4,
    summary: "Customer inquired about the refund policy. Provided the standard 30-day refund link and resolved the issue.",
    messages: [
      { id: "m1", role: "user", content: "Hi, I need to know your refund policy.", timestamp: "10:22 AM" },
      { id: "m2", role: "assistant", content: "Hello John! We offer a 30-day money-back guarantee. You can read the full policy here: [Link].", timestamp: "10:23 AM" },
      { id: "m3", role: "user", content: "Perfect, thank you.", timestamp: "10:24 AM" },
      { id: "m4", role: "assistant", content: "You're welcome! Is there anything else I can help you with?", timestamp: "10:24 AM" }
    ]
  },
  {
    id: "conv-2",
    customerName: "Sarah",
    status: "Flagged",
    startedAt: "Yesterday",
    duration: "12m 45s",
    messageCount: 6,
    summary: "Customer couldn't set up the VPN despite following the guide. AI confidence dropped below threshold.",
    messages: [
      { id: "m1", role: "user", content: "My VPN setup is failing.", timestamp: "14:10 PM" },
      { id: "m2", role: "assistant", content: "Hi Sarah. Are you using Windows or Mac?", timestamp: "14:11 PM" },
      { id: "m3", role: "user", content: "Mac. It says authentication failed.", timestamp: "14:12 PM" },
      { id: "m4", role: "assistant", content: "Please ensure you're using the credentials sent to your email.", timestamp: "14:13 PM" },
      { id: "m5", role: "user", content: "I am! It still doesn't work.", timestamp: "14:18 PM" },
      { id: "m6", role: "assistant", content: "I've flagged this conversation for a human agent to review. Someone will reach out shortly.", timestamp: "14:19 PM" }
    ]
  },
  {
    id: "conv-3",
    customerName: "David",
    status: "Completed",
    startedAt: "Monday",
    duration: "2m 10s",
    messageCount: 2,
    summary: "Quick inquiry about the company's leave policy. Provided the direct PDF link.",
    messages: [
      { id: "m1", role: "user", content: "Where can I find the leave policy?", timestamp: "09:00 AM" },
      { id: "m2", role: "assistant", content: "Hi David. The leave policy is documented in the HR Guide here: [Link].", timestamp: "09:01 AM" }
    ]
  }
];

function Conversations() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const handleOpen = (conv: Conversation) => {
    setSelectedConversation(conv);
  };

  const handleClose = () => {
    setSelectedConversation(null);
  };

  return (
    <AdminLayout title="Conversations">
      <ConversationTable conversations={mockConversations} onOpen={handleOpen} />
      <ConversationDetailsModal 
        isOpen={!!selectedConversation} 
        onClose={handleClose} 
        conversation={selectedConversation} 
      />
    </AdminLayout>
  );
}

export default Conversations;