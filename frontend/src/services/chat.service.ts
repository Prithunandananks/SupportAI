import apiClient from "../api/client";

export interface ChatRequest {
  message: string;
}

export interface Citation {
  document_id: string;
  filename: string;
  chunk_index: number;
  retrieved_text: string;
}

export interface ChatResponse {
  answer: string;
  sources: Citation[];
}

export interface ChatSessionResponse {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessageResponse {
  id: string;
  session_id: string;
  role: string;
  content: string;
  created_at: string;
}

export interface ChatSessionWithMessagesResponse extends ChatSessionResponse {
  messages: ChatMessageResponse[];
}

export const chatService = {
  async getSessions(): Promise<ChatSessionResponse[]> {
    const response = await apiClient.get<ChatSessionResponse[]>("/chat/session");
    return response.data;
  },

  async getSession(sessionId: string): Promise<ChatSessionWithMessagesResponse> {
    const response = await apiClient.get<ChatSessionWithMessagesResponse>(`/chat/session/${sessionId}`);
    return response.data;
  },

  async createSession(title?: string): Promise<ChatSessionResponse> {
    const response = await apiClient.post<ChatSessionResponse>("/chat/session", { title });
    return response.data;
  },

  async renameSession(sessionId: string, title: string): Promise<ChatSessionResponse> {
    const response = await apiClient.put<ChatSessionResponse>(`/chat/session/${sessionId}`, { title });
    return response.data;
  },

  async patchSession(sessionId: string, title?: string): Promise<ChatSessionResponse> {
    const response = await apiClient.patch<ChatSessionResponse>(`/chat/session/${sessionId}`, { title });
    return response.data;
  },

  async deleteSession(sessionId: string): Promise<void> {
    await apiClient.delete(`/chat/session/${sessionId}`);
  },

  async sendMessage(sessionId: string, message: string): Promise<ChatResponse> {
    const response = await apiClient.post<ChatResponse>(`/chat/session/${sessionId}/message`, { message });
    return response.data;
  },

  async streamMessage(
    sessionId: string | null,
    message: string,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void,
    signal?: AbortSignal
  ): Promise<void> {
    try {
      const token = localStorage.getItem("access_token");
      const url = sessionId 
        ? `http://127.0.0.1:8000/api/v1/chat/session/${sessionId}/stream`
        : `http://127.0.0.1:8000/api/v1/chat/stream`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message }),
        signal,
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error("Unauthorized. Please log in again.");
        if (response.status === 403) throw new Error("Forbidden. You do not have permission.");
        if (response.status === 404) throw new Error("Chat session not found.");
        throw new Error(`Server error: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body returned from server.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Split on double newline which designates the end of an SSE event
        let boundary = buffer.indexOf("\n\n");
        while (boundary !== -1) {
          const eventString = buffer.slice(0, boundary).trim();
          buffer = buffer.slice(boundary + 2);
          
          if (eventString && !eventString.startsWith(":")) {
            const lines = eventString.split("\n");
            for (const line of lines) {
              if (line.startsWith("data:")) {
                const dataStr = line.slice(5).trim();
                try {
                  const data = JSON.parse(dataStr);
                  if (data && data.content) {
                    onChunk(data.content);
                  }
                } catch {
                  // Ignore malformed JSON gracefully as requested
                }
              }
            }
          }
          
          boundary = buffer.indexOf("\n\n");
        }
      }
      
      // Flush any remaining data in the buffer just in case
      if (buffer.trim() && !buffer.startsWith(":")) {
        const lines = buffer.split("\n");
        for (const line of lines) {
          if (line.startsWith("data:")) {
            const dataStr = line.slice(5).trim();
            try {
              const data = JSON.parse(dataStr);
              if (data && data.content) {
                onChunk(data.content);
              }
            } catch {
              // Ignore malformed JSON
            }
          }
        }
      }
      
      onComplete();
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        // Ignored, just resolving stream early as intended
      } else {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  },
};

