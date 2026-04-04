import { useState, useRef, useEffect, useCallback, type FormEvent } from "react";
import type { ConversationMessage, AIProvider } from "@shared/types";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { ModelPicker } from "./ModelPicker";
import { useVoiceInput } from "../../hooks/useVoiceInput";

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

// Model selection is handled by ModelPicker component

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

  const handleVoiceTranscript = useCallback((text: string) => {
    onInputChange(inputValue ? `${inputValue} ${text}` : text);
  }, [inputValue, onInputChange]);

  const { isListening, isSupported, toggleListening } = useVoiceInput(handleVoiceTranscript);

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
      className="flex h-full flex-col glass-bg"
      style={{ background: "#FFF5ED" }}
      onClick={onFocus}
    >
      {/* Header */}
      <div
        className="flex h-8 items-center justify-between px-3"
        style={{ borderBottom: "1px solid rgba(9, 8, 14, 0.1)" }}
      >
        <span
          className="accent-outlined"
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
        <div className="flex items-center">
          <ModelPicker
            provider={provider}
            model={model}
            panelColor="#82323C"
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
              className={`rounded-xl px-3 py-2 ${msg.role === "assistant" ? "text-outlined-builder" : ""}`}
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
          {isSupported && (
            <button
              type="button"
              onClick={toggleListening}
              title={isListening ? "Stop recording" : "Speak your instruction"}
              className={`btn flex h-9 w-9 items-center justify-center rounded-md${isListening ? " mic-listening" : ""}`}
              style={{
                background: isListening ? "#E00420" : "transparent",
                color: isListening ? "#fff" : "#82323C",
                border: isListening ? "none" : "1px solid rgba(130,50,60,0.4)",
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
              background: "#82323C",
              color: "#FFF5ED",
              border: "none",
              cursor: isStreaming ? "not-allowed" : "pointer",
              opacity: isStreaming || !inputValue.trim() ? 0.5 : 1,
            }}
          >
            Send
          </button>
        </form>
      </div>

      {/* Hand to Architect — separate bottom bar */}
      <div style={{ padding: "8px 12px", borderTop: "1px solid rgba(62, 128, 107, 0.15)", background: "rgba(62, 128, 107, 0.04)" }}>
        <button
          onClick={() => {
            const lastAssistant = [...messages]
              .reverse()
              .find((m) => m.role === "assistant");
            if (lastAssistant) onHandToArchitect(lastAssistant.content);
          }}
          className="btn w-full rounded py-2 text-center transition-colors"
          style={{
            fontFamily: "var(--font-label)",
            fontWeight: 600,
            fontSize: "11px",
            letterSpacing: "0.04em",
            background: "transparent",
            color: "#3E806B",
            border: "1px solid rgba(62, 128, 107, 0.3)",
            cursor: "pointer",
          }}
        >
          ← Hand to Architect
        </button>
      </div>
    </div>
  );
}
