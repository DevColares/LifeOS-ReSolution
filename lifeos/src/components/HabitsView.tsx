import { Habit, Goal } from "@/lib/types";
import { Flame, Check, Plus, Trash2, Tag } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface HabitsViewProps {
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
  goals: Goal[];
}

const defaultCategories = ["Saúde", "Produtividade", "Aprendizado", "Pessoal", "Financeiro"];

export default function HabitsView({ habits, setHabits, goals }: HabitsViewProps) {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const [newHabit, setNewHabit] = useState("");
  const [categories, setCategories] = useLocalStorage<string[]>("lifeos-habit-categories", defaultCategories);
  const [newCategory, setNewCategory] = useState(categories[0]);
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Streak reset logic
  useEffect(() => {
    setHabits((prev) =>
      prev.map((h) => {
        if (!h.lastCompleted) return h;
        // If last completed is before yesterday, reset streak
        if (h.lastCompleted < yesterdayStr && h.lastCompleted !== today) {
          return { ...h, streak: 0 };
        }
        return h;
      })
    );
  }, []);

  const completeHabit = (id: string) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        const streakContinues = h.lastCompleted === yesterdayStr || h.lastCompleted === today;
        return {
          ...h,
          lastCompleted: today,
          streak: streakContinues ? (h.lastCompleted === today ? h.streak : h.streak + 1) : 1,
        };
      })
    );
  };

  const addHabit = () => {
    if (!newHabit.trim()) return;
    setHabits((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: newHabit.trim(),
        category: newCategory,
        streak: 0,
        lastCompleted: null,
        goalId: selectedGoalId || undefined
      },
    ]);
    setNewHabit("");
    setSelectedGoalId("");
  };

  const deleteHabit = (id: string) => {
    if (confirm("Deseja realmente excluir este hábito?")) {
      setHabits(prev => prev.filter(h => h.id !== id));
    }
  };

  const filteredHabits = selectedCategory === "All"
    ? habits
    : habits.filter(h => h.category === selectedCategory);

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <div className="flex items-center justify-between flex-wrap gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-streak/10 rounded-xl">
              <Flame className="h-6 w-6 text-streak" />
            </div>
            <h2 className="text-3xl font-display font-black tracking-tight">Hábitos</h2>
          </div>
          <p className="text-muted-foreground text-lg ml-11">Consistência é a chave para a transformação.</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="glass-card p-2 px-3 flex items-center sm:justify-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedCategory("All")}
            className={`whitespace-nowrap px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 ${selectedCategory === "All"
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
              : "hover:bg-secondary text-muted-foreground hover:text-foreground"
              }`}
          >
            Todos
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`whitespace-nowrap px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 ${selectedCategory === category
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card p-6 rounded-[2rem]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex flex-col sm:flex-row p-1.5 bg-secondary/50 rounded-2xl border border-border/50 gap-2">
              <input
                value={newHabit}
                onChange={(e) => setNewHabit(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addHabit()}
                placeholder="Ex: Meditar por 10 minutos..."
                className="flex-1 bg-transparent px-4 py-2 text-sm focus:outline-none"
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="bg-background/80 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border-none focus:ring-2 focus:ring-primary/20 min-w-[140px] appearance-none cursor-pointer hover:bg-background transition-colors"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <button
              onClick={addHabit}
              className="flex items-center justify-center gap-2 h-12 px-8 rounded-2xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              <Plus className="h-5 w-5" />
              <span>Adicionar</span>
            </button>
          </div>

          <div className="flex items-center gap-3 px-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Vincular à Meta:</span>
            <select
              value={selectedGoalId}
              onChange={(e) => setSelectedGoalId(e.target.value)}
              className="bg-secondary/50 px-4 py-2 rounded-xl text-xs font-bold border border-border/50 focus:ring-2 focus:ring-primary/20 cursor-pointer hover:bg-secondary transition-colors appearance-none min-w-[160px]"
            >
              <option value="">Nenhuma meta associada</option>
              {goals.map(goal => (
                <option key={goal.id} value={goal.id}>{goal.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHabits.map((habit) => {
          const doneToday = habit.lastCompleted === today;
          const parentGoal = goals.find(g => g.id === habit.goalId);
          const isHighStreak = habit.streak >= 5;

          return (
            <div key={habit.id} className="glass-card group overflow-hidden relative">
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex flex-col items-start gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">{habit.category}</span>
                      {parentGoal && (
                        <span
                          className="truncate max-w-full text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 bg-primary/10 text-primary rounded-md border border-primary/20"
                          title={parentGoal.name}
                        >
                          {parentGoal.name}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-display font-bold leading-tight break-words">{habit.name}</h3>
                      <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">
                        {habit.streak >= 21
                          ? "✨ Hábito Consolidado"
                          : `Faltam ${21 - habit.streak} dias para consolidar`}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Flame className={`h-5 w-5 fill-current ${isHighStreak ? "streak-blue" : "text-streak"}`} />
                      <span className={`text-xl font-black font-display ${isHighStreak ? "text-blue-500" : "text-streak"}`}>{habit.streak}</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground/40">Dias</span>
                  </div>
                </div>

                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => !doneToday && completeHabit(habit.id)}
                    disabled={doneToday}
                    className={`flex-1 py-4 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-3 ${doneToday
                      ? "bg-success/10 text-success cursor-default"
                      : "bg-secondary hover:bg-primary hover:text-primary-foreground group-hover:shadow-xl group-hover:shadow-primary/10"
                      }`}
                  >
                    {doneToday ? (
                      <>
                        <Check className="h-5 w-5 stroke-[3px]" />
                        Concluído
                      </>
                    ) : (
                      "Marcar feito"
                    )}
                  </button>
                  <button
                    onClick={() => deleteHabit(habit.id)}
                    className="p-4 rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all"
                    title="Excluir hábito"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
              {!doneToday && (
                <div className="h-1 bg-secondary w-full">
                  <div className="h-full bg-primary/20 w-0 group-hover:w-full transition-all duration-[2000ms]" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
