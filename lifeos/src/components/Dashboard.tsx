import { Habit, Goal, Transaction } from "@/lib/types";
import { Flame, Target, CheckCircle2, User, Wallet, PieChart as PieChartIcon } from "lucide-react";
import { useMemo } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from 'recharts';
import { cn } from "@/lib/utils";

interface DashboardProps {
  habits: Habit[];
  goals: Goal[];
  transactions: Transaction[];
  userProfile: { name: string; photo: string };
}

export default function Dashboard({ habits, goals, transactions, userProfile }: DashboardProps) {
  const today = new Date().toISOString().split("T")[0];

  const activeHabits = habits.length;
  const goalsInProgress = goals.filter(
    (g) => g.subtasks.some((s) => !s.done) && g.subtasks.some((s) => s.done)
  ).length;

  const pendingHabits = habits.filter((h) => h.lastCompleted !== today);

  const totalBalance = transactions
    .filter(t => t.isCompleted)
    .reduce((acc, t) => t.type === 'income' ? acc + t.value : acc - t.value, 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Pie chart data for dashboard (top categories)
  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    transactions
      .filter(t => t.type === 'expense' && t.isCompleted)
      .filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .forEach(t => {
        cats[t.category] = (cats[t.category] || 0) + t.value;
      });

    return Object.entries(cats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [transactions]);

  const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

  const bottomCards = [
    { label: "Hábitos Ativos", value: activeHabits, icon: Flame, color: "text-streak", bg: "bg-streak/10" },
    { label: "Metas em Progresso", value: goalsInProgress, icon: Target, color: "text-primary", bg: "bg-primary/10" },
    { label: "Concluídos Hoje", value: habits.length - pendingHabits.length, icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Discreet Profile Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-4xl font-display font-black tracking-tight mb-2">Painel</h2>
          <p className="text-muted-foreground text-lg text-primary/60">Seu dia organizado em um só lugar.</p>
        </div>

        <div className="flex items-center gap-3 bg-secondary/30 p-2 pr-4 rounded-2xl border border-white/10 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-primary/10 overflow-hidden flex items-center justify-center border border-primary/20">
            {userProfile.photo ? (
              <img src={userProfile.photo} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="h-5 w-5 text-primary" />
            )}
          </div>
          <span className="text-xs sm:text-sm font-bold tracking-tight pr-1 sm:pr-0">{userProfile.name}</span>
        </div>
      </div>

      {/* Top Section: Balance + Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-8 flex flex-col justify-between min-h-[220px]">
          <div className="flex justify-between items-start">
            <div className="p-4 rounded-[2rem] bg-primary/10 text-primary">
              <Wallet className="h-8 w-8" />
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Saldo Disponível</span>
              <p className={cn("text-4xl font-display font-black mt-1", totalBalance >= 0 ? "text-foreground" : "text-destructive")}>
                {formatCurrency(totalBalance)}
              </p>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-white/5 flex gap-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Entradas (Mês)</p>
              <p className="text-xl font-display font-bold text-success">
                {formatCurrency(transactions.filter(t => t.type === 'income' && t.isCompleted && new Date(t.date).getMonth() === new Date().getMonth()).reduce((a, b) => a + b.value, 0))}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Saídas (Mês)</p>
              <p className="text-xl font-display font-bold text-destructive">
                {formatCurrency(transactions.filter(t => t.type === 'expense' && t.isCompleted && new Date(t.date).getMonth() === new Date().getMonth()).reduce((a, b) => a + b.value, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col min-h-[220px]">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Gastos por Categoria</span>
          </div>
          <div className="flex-1 flex items-center">
            <div className="h-[140px] w-[140px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={55}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="ml-6 space-y-2 flex-1">
              {categoryData.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Nenhum gasto registrado este mês.</p>
              ) : (
                categoryData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-[10px] font-bold truncate text-muted-foreground">{entry.name}</span>
                    </div>
                    <span className="text-[10px] font-black ml-2">{formatCurrency(entry.value)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Habits, Goals, Completion */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {bottomCards.map((card) => (
          <div key={card.label} className="glass-card p-6 flex items-center gap-5 hover:scale-[1.02] transition-transform min-h-[100px]">
            <div className={`p-4 rounded-2xl shrink-0 ${card.bg} ${card.color}`}>
              <card.icon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xl lg:text-3xl font-display font-black leading-none truncate">{card.value}</p>
              <p className="text-[10px] font-medium text-muted-foreground mt-1 uppercase tracking-wider">{card.label}</p>
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
