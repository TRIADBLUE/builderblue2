import { useState, useEffect, useCallback } from "react";

type GlassMode = "lab" | "flat";

const STORAGE_KEY = "bb2-glass-mode";

export function useGlassMode() {
  const [mode, setModeState] = useState<GlassMode>(() => {
    if (typeof window === "undefined") return "lab";
    return (localStorage.getItem(STORAGE_KEY) as GlassMode) || "lab";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-glass", mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const setMode = useCallback((m: GlassMode) => {
    setModeState(m);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((prev) => (prev === "lab" ? "flat" : "lab"));
  }, []);

  return { mode, setMode, toggleMode };
}
