import { LayoutDashboard, Target, Flame, Settings, Users, Download, Wallet, LogOut, NotebookPen } from "lucide-react";
import { cn } from "@/lib/utils";
import ThemeToggle from "./ThemeToggle";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

type View = "dashboard" | "habits" | "goals" | "relationships" | "finance" | "notes" | "settings" | "spinoff";

const navItems: { id: View; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Painel", icon: LayoutDashboard },
  { id: "habits", label: "Hábitos", icon: Flame },
  { id: "goals", label: "Metas", icon: Target },
  { id: "relationships", label: "Relacionamentos", icon: Users },
  { id: "finance", label: "Finanças", icon: Wallet },
  { id: "notes", label: "Anotações", icon: NotebookPen },
  { id: "settings", label: "Configurações", icon: Settings },
];

interface AppSidebarProps {
  active: View;
  onNavigate: (view: View) => void;
}

export default function AppSidebar({ active, onNavigate }: AppSidebarProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const { logout } = useAuth();

  useEffect(() => {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  const nav = (
    <nav className="flex flex-col gap-2 px-4">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            onNavigate(item.id);
          }}
          className={cn(
            "side-nav-item",
            active === item.id && "active"
          )}
        >
          <item.icon className={cn("h-5 w-5 shrink-0 transition-transform duration-300", active === item.id && "scale-110")} />
          <span className="font-display tracking-tight text-sm font-medium">{item.label}</span>
        </button>
      ))}
      {deferredPrompt && (
        <button
          onClick={handleInstall}
          className="side-nav-item text-primary bg-primary/5 border-primary/20 mt-4"
        >
          <Download className="h-5 w-5 shrink-0" />
          <span className="font-display tracking-tight text-sm font-medium">Instalar App</span>
        </button>
      )}
    </nav>
  );

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden px-4 pb-6 pt-2">
        <div className="glass-card flex items-center gap-1 p-2 rounded-[2rem] shadow-2xl border-white/10 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "flex flex-col items-center p-3 transition-all duration-300 relative rounded-2xl shrink-0",
                  isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5 transition-transform duration-300", isActive && "scale-110")} />
                {isActive && (
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full animate-pulse" />
                )}
              </button>
            );
          })}
          {deferredPrompt && (
            <button
              onClick={handleInstall}
              className="flex flex-col items-center p-3 text-primary bg-primary/10 rounded-2xl animate-bounce shrink-0"
            >
              <Download className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex fixed md:sticky top-0 left-0 z-50 h-[calc(100vh-2rem)] my-4 ml-4 w-60 bg-white/50 dark:bg-black/20 backdrop-blur-xl border border-white/20 flex-col transition-all duration-500 rounded-[2.5rem] shadow-2xl",
        )}
      >
        <div className="flex items-center justify-between px-8 py-8">
          <h1 className="text-2xl font-display font-black tracking-tighter text-foreground">
            LIFE<span className="text-primary">OS</span>
          </h1>
        </div>
        <div className="mt-2 flex-1">{nav}</div>
        <div className="px-8 py-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/50">v1.2</span>
            </div>
            <button 
                onClick={logout}
                className="p-3 rounded-2xl bg-secondary/30 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all group"
                title="Sair"
            >
                <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export type { View };
