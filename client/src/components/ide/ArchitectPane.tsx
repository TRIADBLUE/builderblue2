import { useState, useRef, useEffect, type FormEvent } from "react";
import type { ConversationMessage, AIProvider, ActivePane } from "@shared/types";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { ModelPicker } from "./ModelPicker";

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

// Model selection is handled by ModelPicker component

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
            fontWeight: "bold",
            fontSize: "13px",
            color: "#3E806B",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Architect
        </span>
        <div className="flex items-center">
          <ModelPicker
            provider={provider}
            model={model}
            panelColor="#3E806B"
            onProviderChange={onProviderChange}
            onModelChange={onModelChange}
          />
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

        {isStreaming && !streamedText && (
          <ThinkingIndicator role="architect" isActive={true} />
        )}

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
              background: "#FFF5ED",
              borderColor: "var(--steel-blue)",
            }}
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-md"
            style={{
              background: "#3E806B",
              color: "#E9ECF0",
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
            background: "#3E806B",
            color: "#E9ECF0",
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
