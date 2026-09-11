"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";

export type Theme = "light" | "dark" | "system";
const storageKey = "kukudhamini-theme";
type ThemeContextValue = { theme: Theme; setTheme: (theme: Theme) => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme === "system" ? "light dark" : theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const subscribe = (onStoreChange: () => void) => { window.addEventListener("storage", onStoreChange); window.addEventListener("kukudhamini-theme-change", onStoreChange); return () => { window.removeEventListener("storage", onStoreChange); window.removeEventListener("kukudhamini-theme-change", onStoreChange); }; };
  const getSnapshot = (): Theme => { const stored = window.localStorage.getItem(storageKey); return stored === "dark" || stored === "system" ? stored : "light"; };
  const theme = useSyncExternalStore<Theme>(subscribe, getSnapshot, (): Theme => "light");

  useEffect(() => {
    applyTheme(theme);
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => { document.documentElement.dataset.systemDark = media.matches ? "true" : "false"; };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [theme]);

  const setTheme = (next: Theme) => { applyTheme(next); window.localStorage.setItem(storageKey, next); window.dispatchEvent(new Event("kukudhamini-theme-change")); };
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside ThemeProvider");
  return value;
}