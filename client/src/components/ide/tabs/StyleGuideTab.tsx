import { useState, useEffect, useCallback } from "react";
import { api } from "../../../lib/api";

interface StyleGuideData {
  fonts: Record<string, string>;
  colors: Record<string, string>;
  spacing: Record<string, string>;
  components: string[];
  notes: string;
}

interface StyleGuideTabProps {
  projectId: string;
}

const DEFAULT_GUIDE: StyleGuideData = {
  fonts: {},
  colors: {},
  spacing: {},
  components: [],
  notes: "",
};

export function StyleGuideTab({ projectId }: StyleGuideTabProps) {
  const [guide, setGuide] = useState<StyleGuideData>(DEFAULT_GUIDE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  // New entry fields
  const [newFontKey, setNewFontKey] = useState("");
  const [newFontVal, setNewFontVal] = useState("");
  const [newColorKey, setNewColorKey] = useState("");
  const [newColorVal, setNewColorVal] = useState("");
  const [newSpaceKey, setNewSpaceKey] = useState("");
  const [newSpaceVal, setNewSpaceVal] = useState("");
  const [newComponent, setNewComponent] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await api.fetch<StyleGuideData>(`/api/memory/${projectId}/style-guide`);
        setGuide(data);
      } catch {
        setGuide(DEFAULT_GUIDE);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [projectId]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveStatus("");
    try {
      await api.fetch(`/api/memory/${projectId}/style-guide`, {
        method: "PUT",
        body: guide,
      });
      setSaveStatus("✅ Saved");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch {
      setSaveStatus("❌ Save failed");
    } finally {
      setIsSaving(false);
    }
  }, [projectId, guide]);

  const addEntry = (section: "fonts" | "colors" | "spacing", key: string, val: string) => {
    if (!key.trim() || !val.trim()) return;
    setGuide((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key.trim()]: val.trim() },
    }));
  };

  const removeEntry = (section: "fonts" | "colors" | "spacing", key: string) => {
    setGuide((prev) => {
      const copy = { ...prev[section] };
      delete copy[key];
      return { ...prev, [section]: copy };
    });
  };

  const inputStyle = {
    background: "rgba(255, 245, 237, 0.6)",
    border: "1px solid rgba(9, 8, 14, 0.15)",
    borderRadius: "4px",
    padding: "4px 8px",
    fontFamily: "var(--font-runway)",
    fontSize: "12px",
    color: "var(--triad-black)",
    outline: "none",
    flex: 1,
  };

  const sectionTitleStyle = {
    fontFamily: "var(--font-runway)",
    fontSize: "12px",
    fontWeight: 600 as const,
    color: "var(--triad-black)",
    marginBottom: "8px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: "var(--cream)" }} />
      </div>
    );
  }

  const renderSection = (
    title: string,
    emoji: string,
    section: "fonts" | "colors" | "spacing",
    newKey: string,
    setNewKey: (v: string) => void,
    newVal: string,
    setNewVal: (v: string) => void,
    placeholder: [string, string]
  ) => (
    <div className="mb-4">
      <div style={sectionTitleStyle}>
        {emoji} {title}
      </div>
      {Object.entries(guide[section]).map(([key, val]) => (
        <div
          key={key}
          className="mb-1 flex items-center justify-between rounded px-2 py-1"
          style={{ background: "rgba(255, 245, 237, 0.5)" }}
        >
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: "var(--font-runway)", fontSize: "11px", color: "var(--triad-black)", fontWeight: 600 }}>
              {key}
            </span>
            {section === "colors" && (
              <div style={{ width: "14px", height: "14px", borderRadius: "3px", background: val, border: "1px solid rgba(255,255,255,0.2)" }} />
            )}
            <span style={{ fontFamily: "var(--font-runway)", fontSize: "11px", color: "var(--triad-black)", opacity: 0.6 }}>
              {val}
            </span>
          </div>
          <button
            onClick={() => removeEntry(section, key)}
            style={{ background: "none", border: "none", color: "var(--ruby-red)", cursor: "pointer", fontFamily: "var(--font-runway)", fontSize: "10px" }}
          >
            ×
          </button>
        </div>
      ))}
      <div className="mt-1 flex gap-1">
        <input
          type="text"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder={placeholder[0]}
          style={inputStyle}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              addEntry(section, newKey, newVal);
              setNewKey("");
              setNewVal("");
            }
          }}
        />
        <input
          type="text"
          value={newVal}
          onChange={(e) => setNewVal(e.target.value)}
          placeholder={placeholder[1]}
          style={inputStyle}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              addEntry(section, newKey, newVal);
              setNewKey("");
              setNewVal("");
            }
          }}
        />
        <button
          onClick={() => {
            addEntry(section, newKey, newVal);
            setNewKey("");
            setNewVal("");
          }}
          style={{
            background: "var(--steel-blue)",
            color: "var(--triad-black)",
            border: "none",
            borderRadius: "4px",
            padding: "4px 10px",
            fontFamily: "var(--font-runway)",
            fontSize: "11px",
            cursor: "pointer",
          }}
        >
          +
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ borderBottom: "1px solid rgba(9, 8, 14, 0.1)" }}
      >
        <span style={{ fontFamily: "var(--font-runway)", fontSize: "12px", color: "var(--triad-black)", fontWeight: 600 }}>
          🎨 Style Guide
        </span>
        <div className="flex items-center gap-2">
          {saveStatus && (
            <span style={{ fontFamily: "var(--font-runway)", fontSize: "10px", color: "var(--cream)" }}>
              {saveStatus}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              background: "var(--steel-blue)",
              color: "var(--triad-black)",
              border: "none",
              borderRadius: "4px",
              padding: "3px 12px",
              fontFamily: "var(--font-runway)",
              fontSize: "11px",
              cursor: isSaving ? "wait" : "pointer",
            }}
          >
            {isSaving ? "Saving..." : "💾 Save"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {renderSection("Fonts", "🔤", "fonts", newFontKey, setNewFontKey, newFontVal, setNewFontVal, ["Name (e.g. Heading)", "Value (e.g. QTEraType)"])}
        {renderSection("Colors", "🎨", "colors", newColorKey, setNewColorKey, newColorVal, setNewColorVal, ["Name (e.g. Primary)", "Value (e.g. #1A3D8F)"])}
        {renderSection("Spacing", "📏", "spacing", newSpaceKey, setNewSpaceKey, newSpaceVal, setNewSpaceVal, ["Name (e.g. Section Gap)", "Value (e.g. 32px)"])}

        {/* Components */}
        <div className="mb-4">
          <div style={sectionTitleStyle}>🧱 Components</div>
          <div className="flex flex-wrap gap-1 mb-1">
            {guide.components.map((c, i) => (
              <span
                key={i}
                className="rounded px-2 py-0.5"
                style={{
                  background: "rgba(74, 144, 217, 0.15)",
                  fontFamily: "var(--font-runway)",
                  fontSize: "11px",
                  color: "var(--triad-black)",
                }}
              >
                {c}
                <button
                  onClick={() => setGuide((prev) => ({ ...prev, components: prev.components.filter((_, j) => j !== i) }))}
                  style={{ background: "none", border: "none", color: "var(--ruby-red)", cursor: "pointer", marginLeft: "4px", fontSize: "10px" }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-1">
            <input
              type="text"
              value={newComponent}
              onChange={(e) => setNewComponent(e.target.value)}
              placeholder="Component name (e.g. NavBar, Hero)"
              style={inputStyle}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newComponent.trim()) {
                  setGuide((prev) => ({ ...prev, components: [...prev.components, newComponent.trim()] }));
                  setNewComponent("");
                }
              }}
            />
            <button
              onClick={() => {
                if (newComponent.trim()) {
                  setGuide((prev) => ({ ...prev, components: [...prev.components, newComponent.trim()] }));
                  setNewComponent("");
                }
              }}
              style={{
                background: "var(--steel-blue)",
                color: "var(--triad-black)",
                border: "none",
                borderRadius: "4px",
                padding: "4px 10px",
                fontFamily: "var(--font-runway)",
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              +
            </button>
          </div>
        </div>

        {/* Notes */}
        <div>
          <div style={sectionTitleStyle}>📝 Design Notes</div>
          <textarea
            value={guide.notes}
            onChange={(e) => setGuide((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="General design decisions, brand rules, patterns to follow..."
            rows={5}
            style={{
              ...inputStyle,
              width: "100%",
              resize: "vertical",
              lineHeight: 1.5,
            }}
          />
        </div>
      </div>
    </div>
  );
}
