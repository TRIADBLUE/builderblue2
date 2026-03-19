import { useEffect, useRef, useState, useCallback } from "react";

interface TerminalTabProps {
  projectId: string;
  projectName: string;
}

export function TerminalTab({ projectId, projectName }: TerminalTabProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const [connected, setConnected] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Connect to WebSocket terminal
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/api/ide/terminal/${projectId}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setOutput((prev) => [...prev, "\x1b[32mConnected to terminal\x1b[0m"]);
    };

    ws.onmessage = (event) => {
      const data = event.data as string;
      // Split by newlines but preserve them for display
      const lines = data.split(/\r?\n/);
      setOutput((prev) => [...prev, ...lines.filter((l: string) => l.length > 0)]);
    };

    ws.onclose = () => {
      setConnected(false);
      setOutput((prev) => [...prev, "\x1b[31mDisconnected from terminal\x1b[0m"]);
    };

    ws.onerror = () => {
      setConnected(false);
      setOutput((prev) => [...prev, "\x1b[31mConnection error\x1b[0m"]);
    };

    return () => {
      ws.close();
    };
  }, [projectId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  // Focus input on click
  const handleContainerClick = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  // Send command
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

      const cmd = inputValue.trim();
      if (cmd) {
        setHistory((prev) => [...prev, cmd]);
        setHistoryIndex(-1);
      }

      // Send command with newline
      wsRef.current.send(inputValue + "\n");
      setOutput((prev) => [...prev, `$ ${inputValue}`]);
      setInputValue("");
    },
    [inputValue]
  );

  // Handle up/down arrow for history
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (history.length === 0) return;
        const newIndex =
          historyIndex === -1
            ? history.length - 1
            : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInputValue(history[newIndex]);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (historyIndex === -1) return;
        const newIndex = historyIndex + 1;
        if (newIndex >= history.length) {
          setHistoryIndex(-1);
          setInputValue("");
        } else {
          setHistoryIndex(newIndex);
          setInputValue(history[newIndex]);
        }
      } else if (e.key === "c" && e.ctrlKey) {
        // Ctrl+C
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send("\x03");
        }
        setOutput((prev) => [...prev, "^C"]);
        setInputValue("");
      }
    },
    [history, historyIndex]
  );

  // Strip ANSI codes for display (simplified)
  const stripAnsi = (str: string) =>
    str.replace(/\x1b\[[0-9;]*m/g, "");

  // Colorize ANSI codes (simplified)
  const renderLine = (line: string, i: number) => {
    // Check for basic color codes
    let color = "var(--cream)";
    if (line.includes("\x1b[32m")) color = "#008060";
    if (line.includes("\x1b[31m")) color = "var(--ruby-red)";
    if (line.includes("\x1b[33m")) color = "#D4A843";
    if (line.includes("\x1b[34m")) color = "var(--steel-blue)";

    const clean = stripAnsi(line);

    return (
      <div key={i} style={{ color, minHeight: "18px" }}>
        {clean}
      </div>
    );
  };

  return (
    <div
      ref={terminalRef}
      className="flex h-full flex-col"
      style={{ background: "var(--triad-black)" }}
      onClick={handleContainerClick}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 border-b px-3 py-1.5"
        style={{ borderColor: "rgba(233, 236, 240, 0.1)" }}
      >
        <div
          className="rounded-full"
          style={{
            width: "8px",
            height: "8px",
            background: connected ? "#008060" : "var(--ruby-red)",
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-runway)",
            fontSize: "11px",
            color: "var(--triad-black)",
            opacity: 0.6,
          }}
        >
          {projectName}
        </span>
        <span
          style={{
            fontFamily: "var(--font-runway)",
            fontSize: "11px",
            color: "var(--triad-black)",
            opacity: 0.3,
          }}
        >
          {connected ? "connected" : "disconnected"}
        </span>
        <button
          onClick={() => setOutput([])}
          className="ml-auto"
          style={{
            fontFamily: "var(--font-runway)",
            fontSize: "10px",
            color: "var(--triad-black)",
            opacity: 0.4,
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          Clear
        </button>
      </div>

      {/* Output area */}
      <div
        ref={outputRef}
        className="flex-1 overflow-y-auto p-3"
        style={{
          fontFamily: "var(--font-runway)",
          fontSize: "13px",
          color: "var(--triad-black)",
          lineHeight: "1.4",
        }}
      >
        {output.map((line, i) => renderLine(line, i))}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center border-t px-3 py-2"
        style={{ borderColor: "rgba(233, 236, 240, 0.1)" }}
      >
        <span
          style={{
            fontFamily: "var(--font-runway)",
            fontSize: "13px",
            color: "#008060",
            marginRight: "8px",
          }}
        >
          $
        </span>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          className="flex-1 bg-transparent outline-none"
          style={{
            fontFamily: "var(--font-runway)",
            fontSize: "13px",
            color: "var(--triad-black)",
            border: "none",
          }}
          placeholder={connected ? "Type a command..." : "Connecting..."}
          disabled={!connected}
        />
      </form>
    </div>
  );
}
