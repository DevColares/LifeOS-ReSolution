import { useState, useEffect } from "react";

export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lifeos-theme");
      if (saved) return saved === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove existing style if exists
    const existingStyle = document.getElementById("theme-styles");
    if (existingStyle) {
      existingStyle.remove();
    }

    // Create CSS-in-JS styles
    const themeStyles = `
      :root {
        --bg-primary: ${isDark ? '#0a0f1f' : '#ffffff'};
        --bg-secondary: ${isDark ? '#0f172a' : '#ffffff'};
        --bg-tertiary: ${isDark ? '#1e293b' : '#f8fafc'};
        --text-primary: ${isDark ? '#f8fafc' : '#0f172a'};
        --text-secondary: ${isDark ? '#cbd5e1' : '#334155'};
        --text-muted: ${isDark ? '#94a3b8' : '#64748b'};
        --border: ${isDark ? '#334155' : '#e2e8f0'};
        --primary: ${isDark ? '#60a5fa' : '#2563eb'};
        --primary-foreground: ${isDark ? '#0a0f1f' : '#ffffff'};
        --success: ${isDark ? '#34d399' : '#10b981'};
        --warning: ${isDark ? '#f59e0b' : '#f59e0b'};
        --destructive: ${isDark ? '#ef4444' : '#ef4444'};
        --streak: ${isDark ? '#f472b6' : '#ec4899'};
        --glass: ${isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)'};
        --glass-border: ${isDark ? 'rgba(148, 163, 184, 0.4)' : 'rgba(148, 163, 184, 0.2)'};
        --shadow: ${isDark ? '0 10px 25px -3px rgba(0, 0, 0, 0.7), 0 4px 6px -2px rgba(0, 0, 0, 0.5)' : '0 10px 25px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)'};
        --shadow-hover: ${isDark ? '0 20px 40px -6px rgba(0, 0, 0, 0.8), 0 8px 12px -4px rgba(0, 0, 0, 0.6)' : '0 20px 40px -6px rgba(0, 0, 0, 0.12), 0 8px 12px -4px rgba(0, 0, 0, 0.08)'};
        --glass-hover: ${isDark ? 'rgba(15, 23, 42, 0.98)' : 'rgba(255, 255, 255, 0.98)'};
      }
      
      /* Cantos arredondados em todos os componentes */
      .rounded-lg, .rounded-xl, .rounded-2xl, .rounded-full {
        border-radius: 1.5rem !important;
      }
      
      /* Botões com cantos arredondados */
      button, input, select, textarea {
        border-radius: 1.5rem !important;
      }
      
      /* Cards com cantos arredondados */
      .card, .glass-card, .glass {
        border-radius: 1.5rem !important;
      }
      
      /* Sidebar e layout */
      aside, main, section, article, div[role="main"] {
        border-radius: 1.5rem !important;
      }
      
      /* Componentes específicos do LifeOS */
      .dashboard-card, .habit-card, .goal-card, .stat-card {
        border-radius: 1.5rem !important;
      }
    `;

    // Apply styles
    const style = document.createElement("style");
    style.id = "theme-styles";
    style.textContent = themeStyles;
    document.head.appendChild(style);

    // Update class and localStorage
    if (isDark) {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
    }
    localStorage.setItem("lifeos-theme", isDark ? "dark" : "light");
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return { isDark, toggleTheme };
}
