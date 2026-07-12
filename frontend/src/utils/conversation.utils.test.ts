import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  filterConversations, 
  sortConversations, 
  groupConversations 
} from './conversation.utils';
import type { ChatSessionResponse } from '../services/chat.service';

describe('conversation.utils', () => {
  
  const mockConversations: ChatSessionResponse[] = [
    {
      id: '1',
      title: 'First Chat',

      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Second Discussion',

      created_at: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
      updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    }
  ];

  describe('filterConversations', () => {
    it('returns all when query is empty', () => {
      const result = filterConversations(mockConversations, '');
      expect(result).toHaveLength(2);
    });

    it('filters by title case-insensitive', () => {
      const result = filterConversations(mockConversations, 'first');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('First Chat');
    });

    it('returns empty when no match', () => {
      const result = filterConversations(mockConversations, 'xyz');
      expect(result).toHaveLength(0);
    });
  });

  describe('sortConversations', () => {
    it('sorts newest first', () => {
      const result = sortConversations(mockConversations);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
    });
  });

  describe('groupConversations', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      // Set system time to a fixed date to avoid timezone/flaky issues
      vi.setSystemTime(new Date(2024, 1, 15, 12, 0, 0)); 
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('groups correctly into Today, Yesterday, Previous 7 Days', () => {
      const convs: ChatSessionResponse[] = [
        {
          id: '1',
          title: 'Today Chat',
    
          created_at: new Date(2024, 1, 15, 10, 0, 0).toISOString(),
          updated_at: new Date(2024, 1, 15, 10, 0, 0).toISOString(),
        },
        {
          id: '2',
          title: 'Yesterday Chat',
    
          created_at: new Date(2024, 1, 14, 10, 0, 0).toISOString(),
          updated_at: new Date(2024, 1, 14, 10, 0, 0).toISOString(),
        },
        {
          id: '3',
          title: 'Last Week Chat',
    
          created_at: new Date(2024, 1, 10, 10, 0, 0).toISOString(),
          updated_at: new Date(2024, 1, 10, 10, 0, 0).toISOString(),
        }
      ];

      const groups = groupConversations(convs);
      
      expect(groups).toHaveLength(3);
      expect(groups[0].label).toBe('Today');
      expect(groups[0].conversations).toHaveLength(1);
      expect(groups[1].label).toBe('Yesterday');
      expect(groups[1].conversations).toHaveLength(1);
      expect(groups[2].label).toBe('Previous 7 Days');
      expect(groups[2].conversations).toHaveLength(1);
    });
  });
});
