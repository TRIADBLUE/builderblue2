import { useState, useRef, useEffect, type FormEvent } from "react";
import type { ConversationMessage, AIProvider, ActivePane } from "@shared/types";

interface ArchitectPaneProps {
  isActive: boolean;
  messages: ConversationMessage[];
  isStreaming: boolean;
  streamedText: string;
  provider: AIProvider;
  model: string;
  onProviderChange: (provider: AIProvider) => void;
  onModelChange: (model: string) => void;
  onSendMessage: (content: string) => void;
  onHandToBuilder: (content: string) => void;
  onFocus: () => void;
}

const PROVIDERS: { value: AIProvider; label: string }[] = [
  { value: "claude", label: "Claude" },
  { value: "deepseek", label: "DeepSeek" },
  { value: "gemini", label: "Gemini" },
  { value: "kimi", label: "Kimi" },
];

const MODELS: Record<AIProvider, string[]> = {
  claude: ["claude-sonnet-4-20250514", "claude-haiku-4-5-20251001"],
  deepseek: ["deepseek-chat", "deepseek-coder"],
  gemini: ["gemini-2.0-flash", "gemini-1.5-pro"],
  kimi: ["moonshot-v1-8k", "moonshot-v1-32k"],
};

export function ArchitectPane({
  isActive,
  messages,
  isStreaming,
  streamedText,
  provider,
  model,
  onProviderChange,
  onModelChange,
  onSendMessage,
  onHandToBuilder,
  onFocus,
}: ArchitectPaneProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamedText]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const handleTextareaChange = (value: string) => {
    setInput(value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  return (
    <div
      className="flex h-full flex-col"
      style={{ background: "var(--cream)" }}
      onClick={onFocus}
    >
      {/* Header */}
      <div
        className="flex h-8 items-center justify-between px-3"
        style={{ borderBottom: "1px solid rgba(9, 8, 14, 0.1)" }}
      >
        <span
          style={{
            fontFamily: "var(--font-architect)",
            fontWeight: "bold",
            fontSize: "13px",
            color: "var(--triad-black)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Architect
        </span>
        <div className="flex items-center gap-2">
          <select
            value={provider}
            onChange={(e) => onProviderChange(e.target.value as AIProvider)}
            className="rounded border-none bg-transparent text-xs outline-none"
            style={{
              fontFamily: "var(--font-architect)",
              color: "var(--triad-black)",
              fontSize: "11px",
            }}
          >
            {PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <select
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            className="rounded border-none bg-transparent text-xs outline-none"
            style={{
              fontFamily: "var(--font-architect)",
              color: "var(--triad-black)",
              fontSize: "11px",
            }}
          >
            {(MODELS[provider] ?? []).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[85%] ${msg.role === "user" ? "ml-auto" : "mr-auto"}`}
          >
            <div
              className="rounded-xl px-3 py-2"
              style={{
                fontFamily: "var(--font-architect)",
                fontSize: "13px",
                lineHeight: 1.5,
                background:
                  msg.role === "user" ? "var(--steel-blue)" : "white",
                color:
                  msg.role === "user" ? "var(--cream)" : "var(--triad-black)",
                borderRadius:
                  msg.role === "user"
                    ? "12px 12px 2px 12px"
                    : "12px 12px 12px 2px",
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isStreaming && streamedText && (
          <div className="mr-auto max-w-[85%]">
            <div
              className="rounded-xl px-3 py-2"
              style={{
                fontFamily: "var(--font-architect)",
                fontSize: "13px",
                lineHeight: 1.5,
                background: "white",
                color: "var(--triad-black)",
                borderRadius: "12px 12px 12px 2px",
              }}
            >
              {streamedText}
              <span className="streaming-cursor streaming-cursor-architect" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3" style={{ borderColor: "rgba(9, 8, 14, 0.1)" }}>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => handleTextareaChange(e.target.value)}
            onFocus={onFocus}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Ask the Architect..."
            rows={1}
            className="flex-1 resize-none rounded-md border px-3 py-2 outline-none"
            style={{
              fontFamily: "var(--font-architect)",
              fontSize: "13px",
              color: "var(--triad-black)",
              background: "var(--cream)",
              borderColor: "var(--steel-blue)",
            }}
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-md"
            style={{
              background: "var(--steel-blue)",
              color: "var(--cream)",
              border: "none",
              cursor: isStreaming ? "not-allowed" : "pointer",
              opacity: isStreaming || !input.trim() ? 0.5 : 1,
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>

        {/* Hand to Builder */}
        <button
          onClick={() => {
            const lastAssistant = [...messages]
              .reverse()
              .find((m) => m.role === "assistant");
            if (lastAssistant) onHandToBuilder(lastAssistant.content);
          }}
          className="mt-2 w-full rounded py-1.5 text-center transition-colors"
          style={{
            fontFamily: "var(--font-architect)",
            fontWeight: "bold",
            fontSize: "12px",
            background: "var(--steel-blue)",
            color: "var(--cream)",
            border: "none",
            cursor: "pointer",
          }}
        >
          Hand to Builder →
        </button>
      </div>
    </div>
  );
}
