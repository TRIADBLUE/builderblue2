import { useState, useEffect, useCallback } from "react";

type Theme = "light" | "dark" | "auto";

const STORAGE_KEY = "bb2-theme";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    return (localStorage.getItem(STORAGE_KEY) as Theme) || "light";
  });

  // Apply theme to <html> element
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
  }, []);

  const cycleTheme = useCallback(() => {
    setThemeState((prev) => {
      if (prev === "light") return "dark";
      if (prev === "dark") return "auto";
      return "light";
    });
  }, []);

  // Resolve effective theme (for components that need to know)
  const [effective, setEffective] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (theme !== "auto") {
      setEffective(theme);
      return;
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setEffective(mq.matches ? "dark" : "light");
    const handler = (e: MediaQueryListEvent) => setEffective(e.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  return { theme, effective, setTheme, cycleTheme };
}
