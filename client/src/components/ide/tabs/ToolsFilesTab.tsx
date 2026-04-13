import { useState, useRef } from "react";
import type { ProjectFile, CenterTab } from "@shared/types";

interface ToolsFilesTabProps {
  files: ProjectFile[];
  onOpenTool: (tab: CenterTab) => void;
  onSaveAsProposal: (filePath: string, content: string) => void;
}

interface TreeNode {
  name: string;
  path: string;
  isDir: boolean;
  children: TreeNode[];
}

function buildTree(files: ProjectFile[]): TreeNode[] {
  const root: TreeNode[] = [];
  for (const file of files) {
    const parts = file.path.split("/");
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isLast = i === parts.length - 1;
      const path = parts.slice(0, i + 1).join("/");
      let node = current.find((n) => n.name === name);
      if (!node) {
        node = { name, path, isDir: !isLast, children: [] };
        current.push(node);
      }
      current = node.children;
    }
  }
  return root;
}

function MiniTreeItem({ node, depth }: { node: TreeNode; depth: number }) {
  const [open, setOpen] = useState(depth < 2);
  return (
    <div>
      <div
        className="flex items-center gap-1 py-0.5"
        style={{ paddingLeft: `${depth * 14 + 4}px`, cursor: node.isDir ? "pointer" : "default" }}
        onClick={() => node.isDir && setOpen(!open)}
      >
        {node.isDir ? (
          <span style={{ fontSize: "10px", color: "rgba(9,8,14,0.4)", width: "12px" }}>{open ? "▾" : "▸"}</span>
        ) : (
          <span style={{ width: "12px" }} />
        )}
        <span style={{
          fontFamily: "var(--font-runway)",
          fontSize: "13px",
          color: node.isDir ? "#09080E" : "rgba(9,8,14,0.7)",
          fontWeight: node.isDir ? 600 : 400,
        }}>
          {node.name}
        </span>
      </div>
      {node.isDir && open && node.children.map((child) => (
        <MiniTreeItem key={child.path} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

const TOOLS: { key: CenterTab; name: string; description: string }[] = [
  { key: "staging", name: "Staging", description: "Review and approve code changes from Builder" },
  { key: "terminal", name: "Terminal", description: "Run commands in a project shell" },
  { key: "preview", name: "Preview", description: "Live preview of your running app" },
  { key: "git", name: "Git", description: "Version control, commits, and pull requests" },
  { key: "thread", name: "Thread", description: "Construction log of all AI activity" },
  { key: "style-guide", name: "Style Guide", description: "Design system — fonts, colors, spacing" },
  { key: "secrets", name: "Secrets", description: "Environment variables and API keys" },
  { key: "database", name: "Database", description: "View and manage database tables" },
  { key: "services", name: "Services", description: "Connected integrations and webhooks" },
];

export function ToolsFilesTab({ files, onOpenTool, onSaveAsProposal }: ToolsFilesTabProps) {
  const tree = buildTree(files);
  const [showNewFile, setShowNewFile] = useState(false);
  const [newFilePath, setNewFilePath] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const designInputRef = useRef<HTMLInputElement>(null);
  const [designFiles, setDesignFiles] = useState<{ name: string; url: string }[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDesignUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setDesignFiles((prev) => [...prev, { name: file.name, url }]);
  };

  const handleCreateFile = () => {
    if (!newFilePath.trim()) return;
    onSaveAsProposal(newFilePath.trim(), "");
    setNewFilePath("");
    setShowNewFile(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    onSaveAsProposal(file.name, text);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="h-full overflow-y-auto glass-bg" style={{ background: "transparent" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "24px 20px" }}>

        {/* Tools section */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{
            fontFamily: "var(--font-label)",
            fontSize: "14px",
            fontWeight: 700,
            color: "#09080E",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: "12px",
          }}>
            Tools
          </div>

          <div>
            {TOOLS.map((tool) => (
              <button
                key={tool.key}
                onClick={() => onOpenTool(tool.key)}
                className="w-full text-left"
                style={{
                  display: "block",
                  padding: "10px 0",
                  background: "none",
                  border: "none",
                  borderBottom: "1px solid rgba(251,246,238,0.04)",
                  cursor: "pointer",
                }}
              >
                <div style={{
                  fontFamily: "var(--font-runway)",
                  fontSize: "16px",
                  color: "#09080E",
                  fontWeight: 500,
                }}>
                  {tool.name}
                </div>
                <div style={{
                  fontFamily: "var(--font-content)",
                  fontSize: "13px",
                  color: "rgba(9,8,14,0.45)",
                  marginTop: "2px",
                }}>
                  {tool.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: "rgba(251,246,238,0.06)", marginBottom: "24px" }} />

        {/* Design Import */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{
            fontFamily: "var(--font-label)",
            fontSize: "14px",
            fontWeight: 700,
            color: "#043B40",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: "8px",
          }}>
            Design Import
          </div>
          <div
            onClick={() => designInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              const file = e.dataTransfer.files[0];
              if (file) handleDesignUpload(file);
            }}
            style={{
              border: isDragOver ? "2px dashed #043B40" : "1px dashed rgba(4, 59, 64, 0.3)",
              borderRadius: "8px",
              padding: "16px",
              textAlign: "center",
              cursor: "pointer",
              background: isDragOver ? "rgba(4, 59, 64, 0.04)" : "transparent",
              transition: "all 150ms",
            }}
          >
            <input
              ref={designInputRef}
              type="file"
              accept="image/*,.pdf,.fig"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleDesignUpload(file);
                if (designInputRef.current) designInputRef.current.value = "";
              }}
            />
            <span style={{ fontFamily: "var(--font-content)", fontSize: "14px", color: "var(--steel-blue)" }}>
              Drop a screenshot, mockup, or design file
            </span>
          </div>
          {designFiles.length > 0 && (
            <div className="flex flex-wrap gap-2" style={{ marginTop: "8px" }}>
              {designFiles.map((df, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <img
                    src={df.url}
                    alt={df.name}
                    style={{ width: "64px", height: "64px", objectFit: "cover", borderRadius: "6px", border: "1px solid rgba(251,246,238,0.1)" }}
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); setDesignFiles((prev) => prev.filter((_, j) => j !== i)); }}
                    style={{
                      position: "absolute", top: "-4px", right: "-4px",
                      width: "16px", height: "16px", borderRadius: "50%",
                      background: "var(--ruby-red)", color: "#fff",
                      border: "none", cursor: "pointer", fontSize: "10px", lineHeight: "16px",
                      textAlign: "center", padding: 0,
                    }}
                  >
                    x
                  </button>
                  <div style={{ fontFamily: "var(--font-content)", fontSize: "9px", color: "rgba(9,8,14,0.5)", textAlign: "center", marginTop: "2px", maxWidth: "64px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {df.name}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div
            className="flex items-center gap-2 rounded-md px-3 py-2 transition-all"
            style={{
              border: "1px solid rgba(251,246,238,0.08)",
              cursor: "pointer",
              background: "rgba(4,59,64,0.02)",
              marginTop: "8px",
            }}
            onClick={() => {
              const url = window.prompt("Paste Figma share URL:");
              if (url) {
                console.log("Figma URL:", url);
              }
            }}
          >
            <div>
              <div style={{ fontFamily: "var(--font-content)", fontSize: "14px", fontWeight: 600, color: "#09080E" }}>
                Figma Import
              </div>
              <div style={{ fontFamily: "var(--font-content)", fontSize: "10px", color: "var(--steel-blue)" }}>
                Paste a Figma share link — Architect converts to clickable prototype
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: "rgba(251,246,238,0.06)", marginBottom: "24px" }} />

        {/* Files section */}
        <div>
          <div style={{
            fontFamily: "var(--font-label)",
            fontSize: "14px",
            fontWeight: 700,
            color: "#09080E",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: "12px",
          }}>
            Files
          </div>

          {tree.length > 0 ? (
            <div style={{ marginBottom: "12px" }}>
              {tree.map((node) => (
                <MiniTreeItem key={node.path} node={node} depth={0} />
              ))}
            </div>
          ) : (
            <div style={{
              fontFamily: "var(--font-content)",
              fontSize: "14px",
              color: "rgba(9,8,14,0.4)",
              marginBottom: "12px",
            }}>
              No files yet. Ask the Builder to write code.
            </div>
          )}

          {/* Hidden file input for upload */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleUpload}
            style={{ display: "none" }}
          />

          <div className="flex gap-4 flex-wrap">
            <button
              onClick={() => onOpenTool("files")}
              style={{
                fontFamily: "var(--font-content)",
                fontSize: "14px",
                color: "#09080E",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Browse & edit
            </button>
            <button
              onClick={() => setShowNewFile(!showNewFile)}
              style={{
                fontFamily: "var(--font-content)",
                fontSize: "14px",
                color: "#09080E",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Create new file
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                fontFamily: "var(--font-content)",
                fontSize: "14px",
                color: "#09080E",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Upload
            </button>
          </div>

          {/* New file inline form */}
          {showNewFile && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={newFilePath}
                onChange={(e) => setNewFilePath(e.target.value)}
                placeholder="src/components/MyFile.tsx"
                autoFocus
                style={{
                  flex: 1,
                  fontFamily: "var(--font-runway)",
                  fontSize: "14px",
                  color: "#09080E",
                  background: "transparent",
                  border: "none",
                  borderBottom: "1px solid rgba(251,246,238,0.15)",
                  outline: "none",
                  padding: "4px 0",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFile();
                  if (e.key === "Escape") { setShowNewFile(false); setNewFilePath(""); }
                }}
              />
              <button
                onClick={handleCreateFile}
                style={{
                  fontFamily: "var(--font-content)",
                  fontSize: "14px",
                  color: "#09080E",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Create
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
