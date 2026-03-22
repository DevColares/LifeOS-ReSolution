import { useTheme } from "@/hooks/useTheme";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-secondary border-border hover:bg-secondary/80 transition-colors"
      aria-label="Alternar tema"
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-warning" />
      ) : (
        <Moon className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  );
}
