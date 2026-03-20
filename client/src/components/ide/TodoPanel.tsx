import { useState, useEffect, useCallback } from "react";
import { api } from "../../lib/api";

interface Todo {
  id: string;
  content: string;
  status: "pending" | "in_progress" | "done";
  priority: number;
  source: "user" | "architect" | "builder";
  createdAt: string;
}

interface TodoPanelProps {
  projectId: string;
}

const SOURCE_COLORS: Record<string, string> = {
  user: "#09080E",
  architect: "#3E806B",
  builder: "#82323C",
};

export function TodoPanel({ projectId }: TodoPanelProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newContent, setNewContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Load todos
  useEffect(() => {
    async function load() {
      try {
        const data = await api.fetch<Todo[]>(`/api/todos/${projectId}`);
        setTodos(data);
      } catch {
        setTodos([]);
      } finally {
        setIsLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [projectId]);

  // Add todo
  const handleAdd = useCallback(async () => {
    if (!newContent.trim()) return;
    try {
      const todo = await api.fetch<Todo>(`/api/todos/${projectId}`, {
        method: "POST",
        body: { content: newContent.trim(), source: "user" },
      });
      setTodos((prev) => [...prev, todo]);
      setNewContent("");
    } catch {}
  }, [projectId, newContent]);

  // Toggle status
  const handleToggle = useCallback(async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "pending" ? "in_progress" : currentStatus === "in_progress" ? "done" : "pending";
    try {
      const updated = await api.fetch<Todo>(`/api/todos/${projectId}/${id}`, {
        method: "PATCH",
        body: { status: nextStatus },
      });
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch {}
  }, [projectId]);

  // Delete todo
  const handleDelete = useCallback(async (id: string) => {
    try {
      await api.fetch(`/api/todos/${projectId}/${id}`, { method: "DELETE" });
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch {}
  }, [projectId]);

  const pending = todos.filter((t) => t.status !== "done");
  const done = todos.filter((t) => t.status === "done");

  return (
    <div className="flex h-full flex-col" style={{ background: "#FFF5ED", borderRight: "1px solid rgba(9,8,14,0.08)", width: "220px", minWidth: "220px" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: "1px solid rgba(9,8,14,0.06)" }}
      >
        <span style={{ fontFamily: "var(--font-label)", fontSize: "10px", fontWeight: 700, color: "#3E806B", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Notes & TODOs
        </span>
        <span style={{ fontFamily: "var(--font-runway)", fontSize: "9px", color: "var(--steel-blue)", opacity: 0.5 }}>
          {pending.length} open
        </span>
      </div>

      {/* Add todo */}
      <div className="px-2 py-2" style={{ borderBottom: "1px solid rgba(9,8,14,0.04)" }}>
        <div className="flex gap-1">
          <input
            type="text"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Add a note..."
            style={{
              flex: 1,
              background: "rgba(255,245,237,0.6)",
              border: "1px solid rgba(9,8,14,0.1)",
              borderRadius: "4px",
              padding: "4px 6px",
              fontFamily: "var(--font-content)",
              fontSize: "11px",
              color: "#09080E",
              outline: "none",
            }}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
          />
          <button
            onClick={handleAdd}
            disabled={!newContent.trim()}
            style={{
              background: newContent.trim() ? "#3E806B" : "rgba(62,128,107,0.3)",
              color: "#FFF5ED",
              border: "none",
              borderRadius: "4px",
              padding: "4px 8px",
              fontFamily: "var(--font-runway)",
              fontSize: "10px",
              cursor: newContent.trim() ? "pointer" : "not-allowed",
            }}
          >
            +
          </button>
        </div>
      </div>

      {/* Todo list */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="h-4 w-4 animate-spin rounded-full border-b-2" style={{ borderColor: "#3E806B" }} />
          </div>
        ) : pending.length === 0 && done.length === 0 ? (
          <div className="py-6 text-center" style={{ opacity: 0.3 }}>
            <span style={{ fontFamily: "var(--font-content)", fontSize: "11px", color: "#09080E" }}>
              No notes yet
            </span>
          </div>
        ) : (
          <>
            {pending.map((todo) => (
              <div
                key={todo.id}
                className="mb-1 flex items-start gap-1.5 rounded px-1.5 py-1"
                style={{ background: "rgba(9,8,14,0.02)" }}
              >
                <button
                  onClick={() => handleToggle(todo.id, todo.status)}
                  style={{
                    flexShrink: 0,
                    width: "14px",
                    height: "14px",
                    borderRadius: "3px",
                    border: `1.5px solid ${todo.status === "in_progress" ? "#3E806B" : "rgba(9,8,14,0.2)"}`,
                    background: todo.status === "in_progress" ? "rgba(62,128,107,0.15)" : "transparent",
                    cursor: "pointer",
                    marginTop: "2px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "8px",
                    color: "#3E806B",
                  }}
                >
                  {todo.status === "in_progress" ? "●" : ""}
                </button>
                <div className="flex-1 min-w-0">
                  <p style={{
                    fontFamily: "var(--font-content)",
                    fontSize: "11px",
                    color: "#09080E",
                    lineHeight: 1.4,
                    margin: 0,
                    wordBreak: "break-word",
                  }}>
                    {todo.content}
                  </p>
                  {todo.source !== "user" && (
                    <span style={{
                      fontFamily: "var(--font-runway)",
                      fontSize: "8px",
                      color: SOURCE_COLORS[todo.source],
                      textTransform: "uppercase",
                    }}>
                      {todo.source}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(todo.id)}
                  style={{
                    flexShrink: 0,
                    background: "none",
                    border: "none",
                    color: "var(--ruby-red)",
                    cursor: "pointer",
                    fontSize: "10px",
                    opacity: 0.4,
                    padding: "0 2px",
                  }}
                >
                  ×
                </button>
              </div>
            ))}

            {/* Done section */}
            {done.length > 0 && (
              <div className="mt-2 pt-2" style={{ borderTop: "1px solid rgba(9,8,14,0.04)" }}>
                <span style={{ fontFamily: "var(--font-runway)", fontSize: "9px", color: "var(--steel-blue)", opacity: 0.4 }}>
                  Done ({done.length})
                </span>
                {done.slice(0, 5).map((todo) => (
                  <div
                    key={todo.id}
                    className="mb-0.5 flex items-center gap-1.5 px-1.5 py-0.5"
                    style={{ opacity: 0.35 }}
                  >
                    <span style={{ fontSize: "10px", color: "#008060" }}>✓</span>
                    <span style={{
                      fontFamily: "var(--font-content)",
                      fontSize: "10px",
                      color: "#09080E",
                      textDecoration: "line-through",
                      flex: 1,
                    }}>
                      {todo.content}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
