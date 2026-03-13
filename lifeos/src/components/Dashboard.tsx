import { Habit, Goal } from "@/lib/types";
import { Flame, Target, CheckCircle2 } from "lucide-react";

interface DashboardProps {
  habits: Habit[];
  goals: Goal[];
}

export default function Dashboard({ habits, goals }: DashboardProps) {
  const today = new Date().toISOString().split("T")[0];

  const activeHabits = habits.length;
  const goalsInProgress = goals.filter(
    (g) => g.subtasks.some((s) => !s.done) && g.subtasks.some((s) => s.done)
  ).length;

  const pendingHabits = habits.filter((h) => h.lastCompleted !== today);

  const cards = [
    { label: "Hábitos Ativos", value: activeHabits, icon: Flame, color: "text-streak", bg: "bg-streak/10" },
    { label: "Metas em Progresso", value: goalsInProgress, icon: Target, color: "text-primary", bg: "bg-primary/10" },
    { label: "Concluídos Hoje", value: habits.length - pendingHabits.length, icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h2 className="text-4xl font-display font-black tracking-tight mb-2">Painel</h2>
        <p className="text-muted-foreground text-lg">Seu dia organizado em um só lugar.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div key={card.label} className="glass-card p-6 flex items-center gap-5 hover:scale-[1.02]">
            <div className={`p-4 rounded-2xl ${card.bg} ${card.color}`}>
              <card.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-3xl font-display font-bold leading-none">{card.value}</p>
              <p className="text-sm font-medium text-muted-foreground mt-1">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-display font-bold flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Hábitos de Hoje
          </h3>
          <span className="text-xs font-bold tracking-widest uppercase px-3 py-1 bg-secondary rounded-full text-muted-foreground">
            {habits.length - pendingHabits.length} / {habits.length}
          </span>
        </div>

        {pendingHabits.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="text-4xl">🎉</div>
            <p className="text-lg font-medium text-foreground">Incrível! Todos os hábitos concluídos.</p>
            <p className="text-sm text-muted-foreground">Você está no caminho certo para o sucesso.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingHabits.map((h) => (
              <div key={h.id} className="group flex items-center gap-4 py-4 px-5 rounded-2xl bg-secondary/30 hover:bg-secondary/50 transition-all cursor-pointer">
                <div className="h-3 w-3 rounded-full bg-warning shadow-sm shadow-warning/20 group-hover:scale-125 transition-transform" />
                <div className="flex-1">
                  <p className="text-sm font-bold">{h.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{h.category}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs font-black text-streak">{h.streak}d</span>
                  <span className="text-[10px] text-muted-foreground/50 uppercase">Streak</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

