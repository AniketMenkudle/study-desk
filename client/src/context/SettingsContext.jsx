import { createContext, useContext, useEffect, useState } from "react";

const SettingsContext = createContext(null);

const DEFAULTS = {
  model: "gemini-3.5-flash",
  temperature: 0.7,
  studyMode: "Balanced",
};

function initialTheme() {
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* ignore */
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function SettingsProvider({ children }) {
  const [model, setModel] = useState(DEFAULTS.model);
  const [temperature, setTemperature] = useState(DEFAULTS.temperature);
  const [studyMode, setStudyMode] = useState(DEFAULTS.studyMode);
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("theme", theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const value = {
    model, setModel,
    temperature, setTemperature,
    studyMode, setStudyMode,
    theme, toggleTheme,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

// Read the shared model / temperature / study-mode / theme settings from any page.
export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside a SettingsProvider");
  return ctx;
}
