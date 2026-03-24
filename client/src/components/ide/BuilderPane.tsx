import { useState, useRef, useEffect, type FormEvent } from "react";
import type { ConversationMessage, AIProvider } from "@shared/types";
import { ThinkingIndicator } from "./ThinkingIndicator";

interface BuilderPaneProps {
  isActive: boolean;
  messages: ConversationMessage[];
  isStreaming: boolean;
  streamedText: string;
  provider: AIProvider;
  model: string;
  inputValue: string;
  onProviderChange: (provider: AIProvider) => void;
  onModelChange: (model: string) => void;
  onSendMessage: (content: string) => void;
  onHandToArchitect: (content: string) => void;
  onFocus: () => void;
  onInputChange: (value: string) => void;
}

const PROVIDERS: { value: AIProvider; label: string }[] = [
  { value: "claude", label: "Claude" },
  { value: "groq", label: "Groq" },
  { value: "deepseek", label: "DeepSeek" },
  { value: "gemini", label: "Gemini" },
  { value: "kimi", label: "Kimi" },
];

const MODELS: Record<AIProvider, string[]> = {
  claude: ["claude-opus-4-20250514", "claude-sonnet-4-20250514", "claude-haiku-4-5-20251001"],
  groq: ["llama-3.1-70b-versatile", "llama-3.1-8b-instant", "qwen-qwq-32b", "gemma2-9b-it"],
  deepseek: ["deepseek-chat", "deepseek-coder"],
  gemini: ["gemini-2.0-flash", "gemini-1.5-pro"],
  kimi: ["moonshot-v1-8k", "moonshot-v1-32k"],
};

export function BuilderPane({
  isActive,
  messages,
  isStreaming,
  streamedText,
  provider,
  model,
  inputValue,
  onProviderChange,
  onModelChange,
  onSendMessage,
  onHandToArchitect,
  onFocus,
  onInputChange,
}: BuilderPaneProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamedText]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isStreaming) return;
    onSendMessage(inputValue.trim());
    onInputChange("");
  };

  const handleTextareaChange = (value: string) => {
    onInputChange(value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  // Detect staged code blocks in messages
  const renderContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, i) => {
      const codeMatch = part.match(/^```(\w*)\n([\s\S]*?)```$/);
      if (codeMatch) {
        const code = codeMatch[2];
        const firstLine = code.split("\n")[0]?.trim() ?? "";
        const hasFilePath = /^(?:\/\/|#|--)\s*filepath:/i.test(firstLine);
        return (
          <div key={i} className="relative my-2">
            <pre
              className="overflow-x-auto rounded-md p-3"
              style={{
                fontFamily: "var(--font-runway)",
                fontSize: "12px",
                background: "var(--triad-black)",
                color: "var(--cream)",
              }}
            >
              {code}
            </pre>
            {hasFilePath && (
              <span
                className="absolute top-1 right-1 rounded px-1.5 py-0.5"
                style={{
                  fontFamily: "var(--font-builder)",
                  fontSize: "9px",
                  fontWeight: 600,
                  background: "var(--steel-blue)",
                  color: "var(--cream)",
                }}
              >
                Staged →
              </span>
            )}
          </div>
        );
      }
      return (
        <span key={i} style={{ whiteSpace: "pre-wrap" }}>
          {part}
        </span>
      );
    });
  };

  return (
    <div
      className="flex h-full flex-col"
      style={{ background: "#FFF5ED" }}
      onClick={onFocus}
    >
      {/* Header */}
      <div
        className="flex h-8 items-center justify-between px-3"
        style={{ borderBottom: "1px solid rgba(9, 8, 14, 0.1)" }}
      >
        <span
          style={{
            fontFamily: "var(--font-label)",
            fontWeight: 600,
            fontSize: "13px",
            color: "#82323C",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Builder
        </span>
        <div className="flex items-center gap-2">
          <select
            value={provider}
            onChange={(e) => onProviderChange(e.target.value as AIProvider)}
            className="rounded border-none bg-transparent text-xs outline-none"
            style={{
              fontFamily: "var(--font-builder)",
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
              fontFamily: "var(--font-builder)",
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
                fontFamily: "var(--font-builder)",
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
              {msg.role === "assistant"
                ? renderContent(msg.content)
                : msg.content}
            </div>
          </div>
        ))}

        {isStreaming && !streamedText && (
          <ThinkingIndicator role="builder" isActive={true} />
        )}

        {isStreaming && streamedText && (
          <div className="mr-auto max-w-[85%]">
            <div
              className="rounded-xl px-3 py-2"
              style={{
                fontFamily: "var(--font-builder)",
                fontSize: "13px",
                lineHeight: 1.5,
                background: "white",
                color: "var(--triad-black)",
                borderRadius: "12px 12px 12px 2px",
              }}
            >
              {renderContent(streamedText)}
              <span className="streaming-cursor streaming-cursor-builder" />
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
            value={inputValue}
            onChange={(e) => handleTextareaChange(e.target.value)}
            onFocus={onFocus}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Tell the Builder what to build..."
            rows={1}
            className="flex-1 resize-none rounded-md border px-3 py-2 outline-none"
            style={{
              fontFamily: "var(--font-builder)",
              fontSize: "13px",
              color: "var(--triad-black)",
              background: "#FFF5ED",
              borderColor: "var(--steel-blue)",
            }}
          />
          <button
            type="submit"
            disabled={isStreaming || !inputValue.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-md"
            style={{
              background: "#82323C",
              color: "#FFF5ED",
              border: "none",
              cursor: isStreaming ? "not-allowed" : "pointer",
              opacity: isStreaming || !inputValue.trim() ? 0.5 : 1,
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

        {/* Hand to Architect */}
        <button
          onClick={() => {
            const lastAssistant = [...messages]
              .reverse()
              .find((m) => m.role === "assistant");
            if (lastAssistant) onHandToArchitect(lastAssistant.content);
          }}
          className="mt-2 w-full rounded py-1.5 text-center transition-colors"
          style={{
            fontFamily: "var(--font-builder)",
            fontWeight: 600,
            fontSize: "12px",
            background: "#82323C",
            color: "#FFF5ED",
            border: "none",
            cursor: "pointer",
          }}
        >
          ← Hand to Architect
        </button>
      </div>
    </div>
  );
}
