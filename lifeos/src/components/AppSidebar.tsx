import { useState, useEffect, useRef } from "react";
import { LayoutDashboard, Target, Flame, Settings, X, Users, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import ThemeToggle from "./ThemeToggle";

type View = "dashboard" | "habits" | "goals" | "relationships" | "settings";

const navItems: { id: View; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Painel", icon: LayoutDashboard },
  { id: "habits", label: "Hábitos", icon: Flame },
  { id: "goals", label: "Metas", icon: Target },
  { id: "relationships", label: "Relacionamentos", icon: Users },
  { id: "settings", label: "Configurações", icon: Settings },
];

interface AppSidebarProps {
  active: View;
  onNavigate: (view: View) => void;
}

export default function AppSidebar({ active, onNavigate }: AppSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col gap-1 px-3">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            onNavigate(item.id);
            setMobileOpen(false);
          }}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
            active === item.id
              ? "bg-primary/15 text-primary glow-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          )}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile trigger - posicionado acima do conteúdo principal */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-20 left-4 z-50 md:hidden p-2 rounded-lg bg-background/80 backdrop-blur-sm border border-border/50 hover:border-border/80 transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
      >
        <Menu className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-secondary border-r border-border flex flex-col transition-transform duration-300 rounded-2xl",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h1 className="text-xl font-bold tracking-tight">
            Life<span className="text-primary">OS</span>
          </h1>
          <button onClick={() => setMobileOpen(false)} className="md:hidden">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
        <div className="mt-4 flex-1">{nav}</div>
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <p className="text-xs text-muted-foreground">LifeOS v1.0</p>
          </div>
        </div>
      </aside>
    </>
  );
}

export type { View };
