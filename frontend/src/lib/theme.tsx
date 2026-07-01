"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
});

const themeListeners = new Set<() => void>();

function readStoredTheme(): Theme {
  const stored =
    (localStorage.getItem("privora-theme") as Theme | null) ??
    (localStorage.getItem("sb-theme") as Theme | null);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function subscribeTheme(onStoreChange: () => void) {
  themeListeners.add(onStoreChange);
  return () => themeListeners.delete(onStoreChange);
}

function notifyThemeListeners() {
  themeListeners.forEach((cb) => cb());
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const storedTheme = useSyncExternalStore(
    subscribeTheme,
    readStoredTheme,
    () => "dark" as Theme
  );
  const [override, setOverride] = useState<Theme | null>(null);
  const theme = override ?? storedTheme;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("privora-theme", theme);
    notifyThemeListeners();
  }, [theme]);

  const setTheme = useCallback((t: Theme) => setOverride(t), []);
  const toggleTheme = useCallback(
    () => setOverride((t) => (t ?? storedTheme) === "dark" ? "light" : "dark"),
    [storedTheme]
  );

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
