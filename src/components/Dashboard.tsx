import { Habit, Goal, Transaction } from "@/lib/types";
import { Flame, Target, CheckCircle2, User, Wallet, PieChart as PieChartIcon, ArrowUp, ArrowDown, Calendar } from "lucide-react";
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

  const monthTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
      const d = new Date(t.date + 'T12:00:00');
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }, [transactions]);

  const totalBalance = useMemo(() => {
    return monthTransactions
      .filter(t => t.isCompleted)
      .reduce((acc, t) => t.type === 'income' ? acc + t.value : acc - t.value, 0);
  }, [monthTransactions]);

  const goalsInProgress = goals.filter(
    (g) => g.subtasks && g.subtasks.filter((s) => !s.done).length > 0
  ).length;

  const dailyData = useMemo(() => {
    const days: Record<string, { date: string, income: number, expense: number }> = {};
    // ONLY PENDING TRANSACTIONS
    monthTransactions.filter(t => !t.isCompleted).forEach(t => {
      const day = t.date.split('-')[2];
      if (!days[day]) days[day] = { date: day, income: 0, expense: 0 };
      if (t.type === 'income') days[day].income += t.value;
      else days[day].expense += t.value;
    });
    return days;
  }, [monthTransactions]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const pendingHabits = habits.filter((h) => h.lastCompleted !== today);

  const stats = [
    { label: "Saldo do Mês", value: formatCurrency(totalBalance), icon: Wallet, color: "text-primary", bg: "bg-primary/10" },
    { label: "Hábitos para Hoje", value: pendingHabits.length, icon: Flame, color: "text-streak", bg: "bg-streak/10" },
    { label: "Metas em Progresso", value: goalsInProgress, icon: Target, color: "text-primary", bg: "bg-primary/10" },
  ];

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    monthTransactions.filter(t => t.type === 'expense').forEach(t => {
      totals[t.category] = (totals[t.category] || 0) + t.value;
    });
    return Object.entries(totals).map(([name, value]) => ({ name, value }));
  }, [monthTransactions]);

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00c49f', '#ffbb28'];

  // Safe checks for userProfile
  const profileName = userProfile?.name || "Usuário";
  const profilePhoto = userProfile?.photo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-100 dark:border-white/5">
        <div className="space-y-2">
          <h1 className="text-4xl lg:text-5xl font-display font-black tracking-tight text-slate-950 dark:text-white">
            Olá, {profileName}
          </h1>
          <p className="text-slate-600 dark:text-muted-foreground text-lg lg:text-xl font-medium">
            Seu LifeOS está pronto para mais um dia de conquistas.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-secondary/30 p-2 pr-6 rounded-full border border-slate-200 dark:border-white/10 self-start md:self-center">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary shadow-lg shadow-primary/20">
            <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-primary">Nível 24</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">Master Architect</p>
          </div>
        </div>
      </header>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card p-8 group hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center gap-6">
              <div className={cn("p-4 rounded-[1.25rem] transition-colors duration-300", stat.bg, stat.color)}>
                <stat.icon className="h-7 w-7" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1 leading-none">{stat.label}</p>
                <p className="text-2xl lg:text-3xl font-display font-black leading-none text-slate-950 dark:text-white">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Expenditure Chart */}
        <div className="lg:col-span-8 glass-card p-8 rounded-[2.5rem] border-slate-200 dark:border-white/5 bg-secondary/30 dark:bg-card/40 backdrop-blur-2xl">
          <div className="flex items-center justify-between mb-8 text-slate-900 dark:text-white">
            <h3 className="text-xl font-display font-black flex items-center gap-2 uppercase tracking-tight">
              <PieChartIcon className="h-5 w-5 text-primary" />
              Gastos/Mês
            </h3>
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-white/10" />
            </div>
          </div>
          
          <div className="h-[280px] w-full flex items-center justify-center">
            {categoryTotals.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Sem lançamentos registrados.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryTotals}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryTotals.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                      borderRadius: '16px', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: '700'
                    }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Categories Quick List */}
        <div className="lg:col-span-4 glass-card p-8 rounded-[2.5rem] border-slate-200 dark:border-white/5 bg-secondary/30 dark:bg-card/40 backdrop-blur-2xl">
          <h3 className="text-xl font-display font-black mb-6 text-slate-900 dark:text-white uppercase tracking-tight">Categorias</h3>
          <div className="space-y-4">
            {categoryTotals.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Nenhum dado disponível.</p>
            ) : (
              categoryTotals.slice(0, 5).map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between p-3 rounded-2xl bg-white/50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-[10px] font-bold truncate text-slate-600 dark:text-muted-foreground uppercase">{entry.name}</span>
                  </div>
                  <span className="text-[10px] font-black ml-2 text-slate-900 dark:text-white">{formatCurrency(entry.value)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Daily Cards Section - Restored and Fixed */}
      <div className="glass-card p-8 rounded-[2.5rem] border-slate-200 dark:border-white/5 bg-secondary/30 dark:bg-card/40 backdrop-blur-2xl">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-display font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-tight">
            <Calendar className="h-5 w-5 text-primary" />
            Fluxo Diário
          </h3>
          <span className="text-[10px] font-black uppercase bg-primary/10 text-primary px-3 py-1 rounded-full">
            {Object.keys(dailyData).length} Dias com Movimento
          </span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto no-scrollbar pr-1 pb-4">
          {Object.keys(dailyData).length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-10 text-center space-y-2 opacity-40">
              <CheckCircle2 className="h-8 w-8 text-success" />
              <p className="text-sm font-bold italic">Nenhuma movimentação este mês.</p>
            </div>
          ) : (
            Object.values(dailyData).sort((a: any, b: any) => b.date.localeCompare(a.date)).map((day: any) => {
              const dayBalance = day.income - day.expense;
              const dateObj = new Date();
              const dateStr = `${day.date}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
              
              return (
                <div key={day.date} className="p-5 rounded-3xl bg-white/50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-primary/20 transition-all group">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-white/5">
                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter">{dateStr}</span>
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      dayBalance >= 0 ? "bg-success" : "bg-destructive"
                    )} />
                  </div>
                  
                  <div className="space-y-2">
                    {day.income > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Entrada</span>
                        <span className="text-xs font-black text-success">{formatCurrency(day.income)}</span>
                      </div>
                    )}
                    {day.expense > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Saída</span>
                        <span className="text-xs font-black text-destructive">{formatCurrency(day.expense)}</span>
                      </div>
                    )}
                    <div className="pt-2 mt-2 border-t border-slate-100 dark:border-white/5 flex justify-between items-center">
                      <span className="text-[9px] font-black text-slate-400 uppercase">Saldo</span>
                      <span className={cn("text-sm font-display font-black", dayBalance >= 0 ? "text-slate-900 dark:text-white" : "text-destructive/80")}>
                        {formatCurrency(dayBalance)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Habits of Today */}
      <div className="glass-card p-8 rounded-[2.5rem] border-slate-200 dark:border-white/5 bg-secondary/30 dark:bg-card/40 backdrop-blur-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-display font-black flex items-center gap-3 text-slate-900 dark:text-white uppercase tracking-tight">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Hábitos de Hoje
          </h3>
          <span className="text-xs font-bold tracking-widest uppercase px-3 py-1 bg-secondary rounded-full text-slate-500 dark:text-muted-foreground">
            {habits.length - pendingHabits.length} / {habits.length}
          </span>
        </div>

        {pendingHabits.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="text-4xl text-success">🏆</div>
            <p className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Tudo Feito!</p>
            <p className="text-sm text-slate-500 dark:text-muted-foreground font-medium">Você concluiu todos os hábitos de hoje.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingHabits.map((h) => (
              <div key={h.id} className="group flex items-center gap-4 py-4 px-6 rounded-3xl bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 transition-all border border-slate-100 dark:border-white/5 shadow-sm">
                <div className="h-4 w-4 rounded-full bg-warning shadow-lg shadow-warning/30 group-hover:scale-125 transition-transform" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-900 dark:text-white uppercase leading-none transition-all truncate">{h.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-muted-foreground/60 font-bold uppercase mt-1.5">{h.category}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs font-black text-streak">{h.streak}d</span>
                  <span className="text-[10px] text-slate-500 dark:text-muted-foreground/40 uppercase font-bold">Streak</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
