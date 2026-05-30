import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Load settings from localStorage or defaults
  const [background, setBackground] = useState(() => {
    return localStorage.getItem("clonetwitter_bg") || "dark";
  });
  
  const [accent, setAccent] = useState(() => {
    return localStorage.getItem("clonetwitter_accent") || "blue";
  });

  // Apply theme classes to document.body
  useEffect(() => {
    // Background classes
    document.body.classList.remove("bg-light", "bg-dim", "bg-dark");
    document.body.classList.add(`bg-${background}`);
    localStorage.setItem("clonetwitter_bg", background);
  }, [background]);

  useEffect(() => {
    // Accent classes
    document.body.classList.remove(
      "accent-blue",
      "accent-yellow",
      "accent-pink",
      "accent-purple",
      "accent-orange",
      "accent-green"
    );
    document.body.classList.add(`accent-${accent}`);
    localStorage.setItem("clonetwitter_accent", accent);
  }, [accent]);

  return (
    <ThemeContext.Provider value={{ background, setBackground, accent, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
