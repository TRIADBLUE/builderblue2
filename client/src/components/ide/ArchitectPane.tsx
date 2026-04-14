import { useRef, useEffect, useCallback, type FormEvent } from "react";
import type { ConversationMessage, AIProvider, ActivePane } from "@shared/types";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { ModelPicker } from "./ModelPicker";
import { useVoiceInput } from "../../hooks/useVoiceInput";

interface ArchitectPaneProps {
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
  onHandToBuilder: (content: string) => void;
  onFocus: () => void;
  onInputChange: (value: string) => void;
}

// Model selection is handled by ModelPicker component

export function ArchitectPane({
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
  onHandToBuilder,
  onFocus,
  onInputChange,
}: ArchitectPaneProps) {
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

  const handleVoiceTranscript = useCallback((text: string) => {
    onInputChange(inputValue ? `${inputValue} ${text}` : text);
  }, [inputValue, onInputChange]);

  const { isListening, isSupported, toggleListening } = useVoiceInput(handleVoiceTranscript);

  return (
    <div
      className="flex h-full flex-col glass-bg"
      style={{ backgroundColor: "transparent" }}
      onClick={onFocus}
    >
      {/* Header */}
      <div
        className="flex flex-col px-3 py-1"
        style={{ borderBottom: "1px solid var(--ide-border)" }}
      >
        <div className="flex items-baseline" style={{ gap: "12px" }}>
          <span
            className="accent-outlined"
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: "bold",
              fontSize: "40px",
              color: "#043B40",
              lineHeight: 1,
              textShadow: "0 0 8px rgba(255, 255, 255, 0.6), 0 0 2px rgba(255, 255, 255, 0.9)",
            }}
          >
            Architect
          </span>
          <span
            style={{
              fontFamily: "'Allerta Stencil', sans-serif",
              fontSize: "40px",
              color: "#043B40",
              opacity: 0.5,
              lineHeight: 1,
              textShadow: "0 0 8px rgba(255, 255, 255, 0.6), 0 0 2px rgba(255, 255, 255, 0.9)",
            }}
          >
            Creator
          </span>
        </div>
        <div className="flex justify-end">
          <ModelPicker
            provider={provider}
            model={model}
            panelColor="#043B40"
            onProviderChange={onProviderChange}
            onModelChange={onModelChange}
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg, i) => {
          if (msg.role === "user") {
            return (
              <div
                key={i}
                className="text-user-message"
                style={{
                  fontSize: "var(--user-message-size, 11px)",
                  lineHeight: 1.5,
                  padding: "6px 10px",
                  marginLeft: "auto",
                  maxWidth: "85%",
                  background: "var(--ide-input-bg)",
                  borderRadius: "8px",
                  textAlign: "right" as const,
                }}
              >
                {msg.content}
              </div>
            );
          }
          const textOnly = msg.content
            .replace(/```(?:prototype|spec|html)\s*\n[\s\S]*?```/g, "")
            .trim();
          if (!textOnly) return null;
          // Render ask-builder blocks as styled cards
          const parts = textOnly.split(/(```ask-builder\s*\n[\s\S]*?```)/g);
          return (
            <div
              key={i}
              className="text-ai-architect"
              style={{
                fontSize: "var(--ai-message-size, 15px)",
                lineHeight: 1.6,
                padding: "2px 0",
              }}
            >
              {parts.map((part, idx) => {
                const askMatch = part.match(/```ask-builder\s*\n([\s\S]*?)```/);
                if (askMatch) {
                  return (
                    <div key={idx} style={{
                      margin: "8px 0", padding: "10px 14px",
                      background: "rgba(82, 3, 34, 0.06)",
                      borderRadius: "8px", borderLeft: "3px solid #520322",
                    }}>
                      <div style={{
                        fontFamily: "var(--font-label)", fontSize: "9px",
                        color: "#520322", textTransform: "uppercase",
                        letterSpacing: "0.06em", marginBottom: "4px", fontWeight: 600,
                      }}>
                        Consulting Builder...
                      </div>
                      <div style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "12px", color: "var(--ide-text-muted)", fontStyle: "italic",
                      }}>
                        "{askMatch[1].trim()}"
                      </div>
                    </div>
                  );
                }
                if (!part.trim()) return null;
                return <span key={idx} style={{ whiteSpace: "pre-wrap" }}>{part}</span>;
              })}
            </div>
          );
        })}

        {isStreaming && !streamedText && (
          <ThinkingIndicator role="architect" isActive={true} />
        )}

        {isStreaming && streamedText && (
          <div
            className="text-ai-architect"
            style={{
              fontSize: "var(--ai-message-size, 15px)",
              lineHeight: 1.5,
              padding: "2px 0",
            }}
          >
            {streamedText}
            <span className="streaming-cursor streaming-cursor-architect" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3" style={{ borderColor: "var(--ide-border)" }}>
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
            placeholder="Describe to the Architect..."
            rows={1}
            className="chat-input flex-1 resize-none rounded-md border px-3 py-2 outline-none"
            style={{
              fontSize: "11px",
              color: "var(--ide-text)",
              background: "var(--ide-input-bg)",
              borderColor: "var(--ide-border)",
            }}
          />
          {isSupported && (
            <button
              type="button"
              onClick={toggleListening}
              title={isListening ? "Stop recording" : "Speak your instruction"}
              className={`btn flex h-9 w-9 items-center justify-center rounded-md${isListening ? " mic-listening" : ""}`}
              style={{
                background: isListening ? "#E00420" : "transparent",
                color: isListening ? "#fff" : "var(--ide-text)",
                border: isListening ? "none" : "1px solid var(--ide-border)",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </button>
          )}
          <button
            type="submit"
            disabled={isStreaming || !inputValue.trim()}
            className="btn flex h-9 items-center justify-center rounded-md px-4"
            style={{
              fontFamily: "var(--font-label)",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.04em",
              background: "#043B40",
              color: "#E9ECF0",
              border: "none",
              cursor: isStreaming ? "not-allowed" : "pointer",
              opacity: isStreaming || !inputValue.trim() ? 0.5 : 1,
            }}
          >
            Send
          </button>
        </form>
      </div>

      {/* Hand to Builder — separate bottom bar */}
      <div style={{ padding: "8px 12px", borderTop: "1px solid var(--ide-border)", background: "transparent" }}>
        <button
          onClick={() => {
            const lastAssistant = [...messages]
              .reverse()
              .find((m) => {
                if (m.role !== "assistant") return false;
                if (m.content.length < 200) return false;
                if (!m.content.includes("```") && !m.content.includes("##") && !m.content.includes("spec") && !m.content.includes("prototype")) return false;
                return true;
              });
            if (lastAssistant) onHandToBuilder(lastAssistant.content);
          }}
          className="btn w-full rounded py-2 text-center transition-colors"
          style={{
            fontFamily: "var(--font-label)",
            fontWeight: 600,
            fontSize: "11px",
            letterSpacing: "0.04em",
            background: "transparent",
            color: "var(--ide-text)",
            border: "1px solid var(--ide-border)",
            cursor: "pointer",
          }}
        >
          Hand to Builder →
        </button>
      </div>
    </div>
  );
}
