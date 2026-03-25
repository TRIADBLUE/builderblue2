import { useState, useCallback, useRef } from "react";
import { api } from "../lib/api";
import { getAccessToken } from "../lib/auth";
import type {
  Conversation,
  ConversationMessage,
  AIProvider,
  ConversationRole,
} from "@shared/types";

interface UseConversationReturn {
  conversation: Conversation | null;
  conversations: Conversation[];
  isStreaming: boolean;
  streamedText: string;
  loadConversations: (projectId: string) => Promise<void>;
  createConversation: (
    projectId: string,
    role: ConversationRole,
    provider: AIProvider,
    model: string
  ) => Promise<Conversation>;
  sendMessage: (
    conversationId: string,
    content: string,
    onStagedIds?: (ids: string[]) => void
  ) => Promise<void>;
  setConversation: (convo: Conversation | null) => void;
}

export function useConversation(): UseConversationReturn {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const loadConversations = useCallback(async (projectId: string) => {
    const data = await api.fetch<Conversation[]>(
      `/api/conversations/${projectId}`
    );
    setConversations(data);
  }, []);

  const createConversation = useCallback(
    async (
      projectId: string,
      role: ConversationRole,
      provider: AIProvider,
      model: string
    ) => {
      const data = await api.fetch<Conversation>("/api/conversations", {
        method: "POST",
        body: { projectId, role, provider, model },
      });
      setConversations((prev) => [...prev, data]);
      setConversation(data);
      return data;
    },
    []
  );

  const sendMessage = useCallback(
    async (
      conversationId: string,
      content: string,
      onStagedIds?: (ids: string[]) => void
    ) => {
      setIsStreaming(true);
      setStreamedText("");

      abortRef.current = new AbortController();
      const token = getAccessToken();

      try {
        const response = await fetch(
          `/api/conversations/${conversationId}/message`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            credentials: "include",
            body: JSON.stringify({ content }),
            signal: abortRef.current.signal,
          }
        );

        if (!response.ok) {
          throw new Error("Failed to send message");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data: ")) continue;
            const data = trimmed.slice(6);

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === "chunk") {
                accumulated += parsed.text;
                setStreamedText(accumulated);
              } else if (parsed.type === "staged" && onStagedIds) {
                onStagedIds(parsed.ids);
              } else if (parsed.type === "done") {
                // Update conversation messages locally
                setConversation((prev) => {
                  if (!prev) return prev;
                  const messages = [
                    ...((prev.messages ?? []) as ConversationMessage[]),
                    {
                      role: "user" as const,
                      content,
                      timestamp: new Date().toISOString(),
                    },
                    {
                      role: "assistant" as const,
                      content: accumulated,
                      timestamp: new Date().toISOString(),
                    },
                  ];
                  return { ...prev, messages };
                });
              } else if (parsed.type === "error") {
                console.error("Stream error:", parsed.message);
              }
            } catch {
              // skip malformed SSE
            }
          }
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Send message error:", error);
          // Show the error to the user in the conversation
          setConversation((prev) => {
            if (!prev) return prev;
            const messages = [
              ...((prev.messages ?? []) as ConversationMessage[]),
              {
                role: "user" as const,
                content,
                timestamp: new Date().toISOString(),
              },
              {
                role: "assistant" as const,
                content: `⚠️ Message failed to send. ${(error as Error)?.message ?? "Check your API key configuration."}`,
                timestamp: new Date().toISOString(),
              },
            ];
            return { ...prev, messages };
          });
        }
      } finally {
        setIsStreaming(false);
        setStreamedText("");
        abortRef.current = null;
      }
    },
    []
  );

  return {
    conversation,
    conversations,
    isStreaming,
    streamedText,
    loadConversations,
    createConversation,
    sendMessage,
    setConversation,
  };
}
