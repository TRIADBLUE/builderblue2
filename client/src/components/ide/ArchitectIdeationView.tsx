import { useRef, useEffect } from "react";
import type { ConversationMessage } from "@shared/types";

interface ArchitectIdeationViewProps {
  messages: ConversationMessage[];
  isStreaming: boolean;
  streamedText: string;
}

/** Minimal markdown-to-JSX: headers, bold, code blocks, lists, paragraphs */
function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: JSX.Element[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <pre
          key={elements.length}
          style={{
            fontFamily: "var(--font-builder)",
            fontSize: "12px",
            background: "rgba(9, 8, 14, 0.06)",
            borderRadius: "6px",
            padding: "12px 14px",
            overflowX: "auto",
            margin: "8px 0",
            border: "1px solid rgba(9, 8, 14, 0.08)",
            lineHeight: 1.5,
          }}
        >
          {lang && (
            <div style={{ fontFamily: "var(--font-label)", fontSize: "9px", color: "rgba(9,8,14,0.35)", textTransform: "uppercase", marginBottom: "6px", letterSpacing: "0.06em" }}>
              {lang}
            </div>
          )}
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }

    // Heading
    if (line.startsWith("### ")) {
      elements.push(<h4 key={elements.length} style={{ fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: 700, color: "#09080E", margin: "14px 0 6px" }}>{line.slice(4)}</h4>);
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(<h3 key={elements.length} style={{ fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: 700, color: "#09080E", margin: "16px 0 8px" }}>{line.slice(3)}</h3>);
      i++;
      continue;
    }
    if (line.startsWith("# ")) {
      elements.push(<h2 key={elements.length} style={{ fontFamily: "var(--font-heading)", fontSize: "18px", fontWeight: 700, color: "#09080E", margin: "18px 0 8px" }}>{line.slice(2)}</h2>);
      i++;
      continue;
    }

    // List item
    if (line.match(/^[-*] /)) {
      elements.push(
        <div key={elements.length} style={{ display: "flex", gap: "8px", margin: "3px 0", paddingLeft: "4px" }}>
          <span style={{ color: "#3E806B", flexShrink: 0 }}>-</span>
          <span style={{ fontFamily: "var(--font-content)", fontSize: "13px", color: "#09080E", lineHeight: 1.6 }}>
            {renderInline(line.slice(2))}
          </span>
        </div>
      );
      i++;
      continue;
    }

    // Numbered list
    if (line.match(/^\d+\. /)) {
      const num = line.match(/^(\d+)\. /)?.[1];
      const rest = line.replace(/^\d+\. /, "");
      elements.push(
        <div key={elements.length} style={{ display: "flex", gap: "8px", margin: "3px 0", paddingLeft: "4px" }}>
          <span style={{ color: "#3E806B", flexShrink: 0, fontWeight: 600, fontSize: "12px" }}>{num}.</span>
          <span style={{ fontFamily: "var(--font-content)", fontSize: "13px", color: "#09080E", lineHeight: 1.6 }}>
            {renderInline(rest)}
          </span>
        </div>
      );
      i++;
      continue;
    }

    // Empty line = spacing
    if (line.trim() === "") {
      elements.push(<div key={elements.length} style={{ height: "8px" }} />);
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={elements.length} style={{ fontFamily: "var(--font-content)", fontSize: "13px", color: "#09080E", lineHeight: 1.6, margin: "4px 0" }}>
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return elements;
}

/** Inline formatting: **bold**, `code`, *italic* */
function renderInline(text: string): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = [];
  const regex = /(\*\*.*?\*\*|`[^`]+`|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const token = match[0];
    if (token.startsWith("**"))
      parts.push(<strong key={parts.length} style={{ fontWeight: 700 }}>{token.slice(2, -2)}</strong>);
    else if (token.startsWith("`"))
      parts.push(<code key={parts.length} style={{ fontFamily: "var(--font-builder)", fontSize: "12px", background: "rgba(9,8,14,0.06)", padding: "1px 5px", borderRadius: "3px" }}>{token.slice(1, -1)}</code>);
    else if (token.startsWith("*"))
      parts.push(<em key={parts.length}>{token.slice(1, -1)}</em>);
    lastIndex = match.index + token.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

export function ArchitectIdeationView({ messages, isStreaming, streamedText }: ArchitectIdeationViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new content
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamedText]);

  const assistantMessages = messages.filter((m) => m.role === "assistant");

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto glass-bg"
      style={{ background: "#FFF5ED", padding: "16px 20px" }}
    >
      {assistantMessages.length === 0 && !isStreaming && (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "16px", color: "rgba(9,8,14,0.25)", marginBottom: "8px" }}>
            Architect Ideation
          </div>
          <div style={{ fontFamily: "var(--font-content)", fontSize: "13px", color: "rgba(9,8,14,0.3)", lineHeight: 1.6 }}>
            Start a conversation with the Architect. Research, wireframes, and prompt drafts will appear here.
          </div>
        </div>
      )}

      {assistantMessages.map((msg, idx) => (
        <div
          key={idx}
          style={{
            marginBottom: "16px",
            padding: "16px 18px",
            background: "rgba(62, 128, 107, 0.04)",
            borderRadius: "8px",
            borderLeft: "3px solid #3E806B",
          }}
        >
          <div style={{ fontFamily: "var(--font-label)", fontSize: "9px", color: "#3E806B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px", fontWeight: 600 }}>
            Architect {idx === assistantMessages.length - 1 ? "— Latest" : `— Step ${idx + 1}`}
          </div>
          {renderMarkdown(msg.content)}
        </div>
      ))}

      {/* Streaming content */}
      {isStreaming && streamedText && (
        <div
          style={{
            marginBottom: "16px",
            padding: "16px 18px",
            background: "rgba(62, 128, 107, 0.06)",
            borderRadius: "8px",
            borderLeft: "3px solid #3E806B",
            opacity: 0.9,
          }}
        >
          <div style={{ fontFamily: "var(--font-label)", fontSize: "9px", color: "#3E806B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px", fontWeight: 600 }}>
            Architect — Thinking...
          </div>
          {renderMarkdown(streamedText)}
        </div>
      )}
    </div>
  );
}
