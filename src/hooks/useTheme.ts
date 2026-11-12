import { useCallback, useState } from "react";

export type Theme = "light" | "dark";

function read(key: string): Theme {
  try {
    return localStorage.getItem(key) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

/** Per-viewer theme preference, remembered in the browser. Defaults to light. */
export function useTheme(key: string): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() => read(key));
  const toggle = useCallback(() => {
    // Marks the page for ~250ms so CSS can fade every colour together (see Portal.css)
    const root = document.documentElement;
    root.setAttribute("data-theme-switching", "");
    window.setTimeout(() => root.removeAttribute("data-theme-switching"), 250);
    setTheme((current) => {
      const next: Theme = current === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(key, next);
      } catch {
        /* storage unavailable: keep the choice for this visit only */
      }
      return next;
    });
  }, [key]);
  return [theme, toggle];
}
