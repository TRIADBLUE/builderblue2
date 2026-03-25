import { useState } from "react";
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

  return (
    <div className="h-full overflow-y-auto" style={{ background: "#FFF5ED" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "24px 20px" }}>

        {/* Files section */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{
            fontFamily: "var(--font-label)",
            fontSize: "10px",
            fontWeight: 700,
            color: "#14287D",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: "12px",
          }}>
            Files
          </div>

          {/* File tree */}
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

          {/* File actions */}
          <div className="flex gap-4">
            <button
              onClick={() => onOpenTool("files")}
              style={{
                fontFamily: "var(--font-content)",
                fontSize: "12px",
                color: "#14287D",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Browse & edit files
            </button>
            <button
              style={{
                fontFamily: "var(--font-content)",
                fontSize: "12px",
                color: "#14287D",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Create new file
            </button>
            <button
              style={{
                fontFamily: "var(--font-content)",
                fontSize: "12px",
                color: "#14287D",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Upload
            </button>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: "rgba(9,8,14,0.06)", marginBottom: "24px" }} />

        {/* Tools section */}
        <div>
          <div style={{
            fontFamily: "var(--font-label)",
            fontSize: "10px",
            fontWeight: 700,
            color: "#14287D",
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
      </div>
    </div>
  );
}
