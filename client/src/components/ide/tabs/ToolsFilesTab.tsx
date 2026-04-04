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
          fontSize: "11px",
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
    <div className="h-full overflow-y-auto glass-bg" style={{ background: "#FFF5ED" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "24px 20px" }}>

        {/* Tools section */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{
            fontFamily: "var(--font-label)",
            fontSize: "10px",
            fontWeight: 700,
            color: "#00203A",
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
                  borderBottom: "1px solid rgba(9,8,14,0.04)",
                  cursor: "pointer",
                }}
              >
                <div style={{
                  fontFamily: "var(--font-runway)",
                  fontSize: "13px",
                  color: "#09080E",
                  fontWeight: 500,
                }}>
                  {tool.name}
                </div>
                <div style={{
                  fontFamily: "var(--font-content)",
                  fontSize: "11px",
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
        <div style={{ height: "1px", background: "rgba(9,8,14,0.06)", marginBottom: "24px" }} />

        {/* Design Import */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{
            fontFamily: "var(--font-label)",
            fontSize: "10px",
            fontWeight: 700,
            color: "#043B40",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: "8px",
          }}>
            Design Import
          </div>
          <div className="space-y-2">
            <label
              className="flex items-center gap-2 rounded-md px-3 py-2 transition-all"
              style={{
                border: "1px solid rgba(9,8,14,0.08)",
                cursor: "pointer",
                background: "rgba(4,59,64,0.02)",
              }}
            >
              <span style={{ fontSize: "16px" }}>🎨</span>
              <div>
                <div style={{ fontFamily: "var(--font-content)", fontSize: "12px", fontWeight: 600, color: "#09080E" }}>
                  Upload Design
                </div>
                <div style={{ fontFamily: "var(--font-content)", fontSize: "10px", color: "var(--steel-blue)" }}>
                  Screenshot, mockup, or design file — Architect converts to prototype
                </div>
              </div>
              <input
                type="file"
                accept="image/*,.pdf,.fig"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // TODO: Upload file, add to architect conversation as image
                    console.log("Design file selected:", file.name);
                  }
                }}
              />
            </label>
            <div
              className="flex items-center gap-2 rounded-md px-3 py-2 transition-all"
              style={{
                border: "1px solid rgba(9,8,14,0.08)",
                cursor: "pointer",
                background: "rgba(4,59,64,0.02)",
              }}
              onClick={() => {
                const url = window.prompt("Paste Figma share URL:");
                if (url) {
                  // TODO: Process Figma URL, pass to Architect
                  console.log("Figma URL:", url);
                }
              }}
            >
              <span style={{ fontSize: "16px" }}>📐</span>
              <div>
                <div style={{ fontFamily: "var(--font-content)", fontSize: "12px", fontWeight: 600, color: "#09080E" }}>
                  Figma Import
                </div>
                <div style={{ fontFamily: "var(--font-content)", fontSize: "10px", color: "var(--steel-blue)" }}>
                  Paste a Figma share link — Architect converts to clickable prototype
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: "rgba(9,8,14,0.06)", marginBottom: "24px" }} />

        {/* Files section */}
        <div>
          <div style={{
            fontFamily: "var(--font-label)",
            fontSize: "10px",
            fontWeight: 700,
            color: "#00203A",
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
              fontSize: "12px",
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
                fontSize: "12px",
                color: "#00203A",
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
                fontSize: "12px",
                color: "#00203A",
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
                fontSize: "12px",
                color: "#00203A",
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
                  fontSize: "12px",
                  color: "#09080E",
                  background: "transparent",
                  border: "none",
                  borderBottom: "1px solid rgba(9,8,14,0.15)",
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
                  fontSize: "12px",
                  color: "#00203A",
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
