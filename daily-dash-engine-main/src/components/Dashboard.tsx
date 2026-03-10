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
    { label: "Hábitos Ativos", value: activeHabits, icon: Flame, color: "text-streak" },
    { label: "Metas em Progresso", value: goalsInProgress, icon: Target, color: "text-primary" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-1">Painel</h2>
        <p className="text-muted-foreground text-sm">Seu sistema operacional pessoal em um relance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="glass-card p-5 flex items-center gap-4 hover:border-primary/30 transition-colors rounded-2xl">
            <div className={`p-3 rounded-lg bg-secondary ${card.color}`}>
              <card.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card p-6 rounded-2xl">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          Hábitos Pendentes de Hoje
        </h3>
        {pendingHabits.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todos os hábitos concluídos hoje! 🎉</p>
        ) : (
          <div className="space-y-2">
            {pendingHabits.map((h) => (
              <div key={h.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-secondary/50">
                <div className="h-2 w-2 rounded-full bg-warning" />
                <span className="text-sm">{h.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {h.streak} dias consecutivos
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
