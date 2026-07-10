import type { ChatSessionResponse } from "../services/chat.service";

export interface ConversationGroup {
  label: string;
  conversations: ChatSessionResponse[];
}

export function formatConversationDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function filterConversations(
  conversations: ChatSessionResponse[],
  searchQuery: string
): ChatSessionResponse[] {
  if (!searchQuery.trim()) return conversations;
  
  const lowerQuery = searchQuery.trim().toLowerCase();
  
  return conversations.filter(conv => {
    // Search title
    if (conv.title && conv.title.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    return false;
  });
}

export function sortConversations(conversations: ChatSessionResponse[]): ChatSessionResponse[] {
  return [...conversations].sort((a, b) => {
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
}

export function groupConversations(conversations: ChatSessionResponse[]): ConversationGroup[] {
  const groups: { [key: string]: ChatSessionResponse[] } = {
    'Today': [],
    'Yesterday': [],
    'Previous 7 Days': [],
    'Previous 30 Days': [],
    'Older': []
  };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sorted = sortConversations(conversations);

  for (const conv of sorted) {
    const date = new Date(conv.created_at);
    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (day.getTime() === today.getTime()) {
      groups['Today'].push(conv);
    } else if (day.getTime() === yesterday.getTime()) {
      groups['Yesterday'].push(conv);
    } else if (day.getTime() >= sevenDaysAgo.getTime()) {
      groups['Previous 7 Days'].push(conv);
    } else if (day.getTime() >= thirtyDaysAgo.getTime()) {
      groups['Previous 30 Days'].push(conv);
    } else {
      groups['Older'].push(conv);
    }
  }

  const result: ConversationGroup[] = [];
  
  if (groups['Today'].length > 0) result.push({ label: 'Today', conversations: groups['Today'] });
  if (groups['Yesterday'].length > 0) result.push({ label: 'Yesterday', conversations: groups['Yesterday'] });
  if (groups['Previous 7 Days'].length > 0) result.push({ label: 'Previous 7 Days', conversations: groups['Previous 7 Days'] });
  if (groups['Previous 30 Days'].length > 0) result.push({ label: 'Previous 30 Days', conversations: groups['Previous 30 Days'] });
  if (groups['Older'].length > 0) result.push({ label: 'Older', conversations: groups['Older'] });

  return result;
}
