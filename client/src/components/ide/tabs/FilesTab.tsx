import { useState } from "react";
import type { ProjectFile } from "@shared/types";

interface FilesTabProps {
  files: ProjectFile[];
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

function FileTreeItem({
  node,
  depth,
  activeFile,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  activeFile: string | null;
  onSelect: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const isActive = node.path === activeFile;

  if (node.isDir) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center gap-1 py-0.5 text-left"
          style={{
            paddingLeft: `${depth * 12 + 4}px`,
            fontFamily: "var(--font-runway)",
            fontSize: "11px",
            color: "var(--triad-black)",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          <span style={{ opacity: 0.5 }}>{expanded ? "▾" : "▸"}</span>
          {node.name}
        </button>
        {expanded &&
          node.children.map((child) => (
            <FileTreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              activeFile={activeFile}
              onSelect={onSelect}
            />
          ))}
      </div>
    );
  }

  return (
    <button
      onClick={() => onSelect(node.path)}
      className="flex w-full items-center py-0.5 text-left"
      style={{
        paddingLeft: `${depth * 12 + 4}px`,
        fontFamily: "var(--font-runway)",
        fontSize: "11px",
        color: "var(--triad-black)",
        background: "none",
        border: "none",
        borderLeft: isActive ? "3px solid var(--steel-blue)" : "3px solid transparent",
        cursor: "pointer",
      }}
    >
      {node.name}
    </button>
  );
}

export function FilesTab({ files, onSaveAsProposal }: FilesTabProps) {
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const tree = buildTree(files);
  const selectedFile = files.find((f) => f.path === activeFile);

  const handleSelectFile = (path: string) => {
    setActiveFile(path);
    const file = files.find((f) => f.path === path);
    setEditContent(file?.content ?? "");
  };

  return (
    <div className="flex h-full">
      {/* File tree */}
      <div
        className="w-1/4 overflow-y-auto border-r py-2"
        style={{
          background: "var(--triad-black)",
          borderColor: "rgba(233, 236, 240, 0.1)",
        }}
      >
        {tree.length === 0 ? (
          <div
            className="p-4 text-center"
            style={{
              fontFamily: "var(--font-runway)",
              fontSize: "11px",
              color: "var(--triad-black)",
              opacity: 0.4,
            }}
          >
            No files yet
          </div>
        ) : (
          tree.map((node) => (
            <FileTreeItem
              key={node.path}
              node={node}
              depth={0}
              activeFile={activeFile}
              onSelect={handleSelectFile}
            />
          ))
        )}
      </div>

      {/* Editor */}
      <div className="flex w-3/4 flex-col" style={{ background: "var(--triad-black)" }}>
        {selectedFile ? (
          <>
            <div
              className="flex items-center justify-between border-b px-3 py-1.5"
              style={{ borderColor: "rgba(233, 236, 240, 0.1)" }}
            >
              <span
                style={{
                  fontFamily: "var(--font-runway)",
                  fontSize: "11px",
                  color: "var(--triad-black)",
                  opacity: 0.6,
                }}
              >
                {selectedFile.path}
              </span>
              <button
                onClick={() =>
                  onSaveAsProposal(selectedFile.path, editContent)
                }
                className="rounded px-2 py-0.5 text-xs"
                style={{
                  fontFamily: "var(--font-runway)",
                  background: "var(--steel-blue)",
                  color: "var(--triad-black)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Save as Proposal
              </button>
            </div>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="flex-1 resize-none border-none p-3 outline-none"
              style={{
                fontFamily: "var(--font-runway)",
                fontSize: "12px",
                lineHeight: 1.6,
                color: "var(--triad-black)",
                background: "var(--triad-black)",
                tabSize: 2,
              }}
              spellCheck={false}
            />
          </>
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
            Select a file to edit
          </div>
        )}
      </div>
    </div>
  );
}
