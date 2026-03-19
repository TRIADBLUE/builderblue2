import { useState } from "react";

interface DatabaseTabProps {
  projectId: string;
}

export function DatabaseTab({ projectId }: DatabaseTabProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Record<string, unknown>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = async () => {
    const trimmed = query.trim().toUpperCase();
    if (!trimmed.startsWith("SELECT")) {
      setError("Only SELECT queries are allowed. INSERT, UPDATE, DELETE, and DROP operations are not permitted.");
      setResults([]);
      setColumns([]);
      return;
    }

    setIsRunning(true);
    setError("");

    try {
      // Database query API will be implemented with project-scoped DB access
      setError("Database browser requires project database configuration.");
      setResults([]);
      setColumns([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setIsRunning(false);
    }
  };

  const exportCsv = () => {
    if (results.length === 0) return;
    const header = columns.join(",");
    const rows = results.map((row) =>
      columns.map((col) => JSON.stringify(row[col] ?? "")).join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "query-results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="flex h-full flex-col"
      style={{ background: "var(--triad-black)" }}
    >
      {/* SQL Editor */}
      <div className="border-b p-3" style={{ borderColor: "rgba(233, 236, 240, 0.1)" }}>
        <div className="flex gap-2">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SELECT * FROM ..."
            rows={3}
            className="flex-1 resize-none rounded border bg-transparent p-2 text-xs outline-none"
            style={{
              fontFamily: "var(--font-runway)",
              color: "var(--triad-black)",
              borderColor: "rgba(233, 236, 240, 0.2)",
            }}
            spellCheck={false}
          />
          <div className="flex flex-col gap-1">
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="rounded px-3 py-1.5 text-xs"
              style={{
                fontFamily: "var(--font-runway)",
                background: "var(--steel-blue)",
                color: "var(--triad-black)",
                border: "none",
                cursor: "pointer",
                opacity: isRunning ? 0.5 : 1,
              }}
            >
              {isRunning ? "Running..." : "Run"}
            </button>
            {results.length > 0 && (
              <button
                onClick={exportCsv}
                className="rounded px-3 py-1.5 text-xs"
                style={{
                  fontFamily: "var(--font-runway)",
                  background: "transparent",
                  color: "var(--triad-black)",
                  border: "1px solid rgba(233, 236, 240, 0.2)",
                  cursor: "pointer",
                }}
              >
                CSV
              </button>
            )}
          </div>
        </div>

        {error && (
          <div
            className="mt-2 rounded p-2 text-xs"
            style={{
              fontFamily: "var(--font-runway)",
              color: "var(--ruby-red)",
              background: "rgba(130, 50, 60, 0.1)",
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-auto p-3">
        {results.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="border-b px-2 py-1 text-left"
                    style={{
                      fontFamily: "var(--font-runway)",
                      fontSize: "10px",
                      color: "var(--triad-black)",
                      opacity: 0.5,
                      borderColor: "rgba(233, 236, 240, 0.1)",
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((row, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td
                      key={col}
                      className="border-b px-2 py-1"
                      style={{
                        fontFamily: "var(--font-runway)",
                        fontSize: "11px",
                        color: "var(--triad-black)",
                        borderColor: "rgba(233, 236, 240, 0.05)",
                      }}
                    >
                      {String(row[col] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div
            className="flex h-full items-center justify-center"
            style={{
              fontFamily: "var(--font-runway)",
              fontSize: "13px",
              color: "var(--triad-black)",
              opacity: 0.3,
            }}
          >
            Run a SELECT query to see results
          </div>
        )}
      </div>
    </div>
  );
}
