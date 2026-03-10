import { Habit } from "@/lib/types";
import { Flame, Check, Plus, Filter, Calendar } from "lucide-react";
import { useState } from "react";

interface HabitsViewProps {
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
}

export default function HabitsView({ habits, setHabits }: HabitsViewProps) {
  const today = new Date().toISOString().split("T")[0];
  const [newHabit, setNewHabit] = useState("");
  const [newCategory, setNewCategory] = useState<"Health" | "Productivity" | "Learning" | "Personal" | "Finance">("Health");
  const [viewMode, setViewMode] = useState<"grid" | "daily">("grid");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const completeHabit = (id: string) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().split("T")[0];
        const streakContinues = h.lastCompleted === yStr || h.lastCompleted === today;
        return {
          ...h,
          lastCompleted: today,
          streak: streakContinues ? h.streak + 1 : 1,
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
        lastCompleted: null 
      },
    ]);
    setNewHabit("");
  };

  const getCategories = () => {
    const categories = habits.map(h => h.category);
    return Array.from(new Set(categories));
  };

  const getDailyHabits = () => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayIndex = new Date().getDay();
    
    return days.map((day, index) => {
      const dayHabits = habits.filter(h => {
        // Simple algorithm to distribute habits across days
        const habitIndex = h.id.charCodeAt(0) % 7;
        return habitIndex === index;
      });
      
      return {
        day,
        habits: dayHabits,
        isToday: index === todayIndex
      };
    });
  };

  const filteredHabits = selectedCategory === "All" 
    ? habits 
    : habits.filter(h => h.category === selectedCategory);

  const dailyHabits = getDailyHabits();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">Hábitos</h2>
          <p className="text-muted-foreground text-sm">Construa consistência, um dia de cada vez.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 bg-secondary rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                viewMode === "grid" 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Visualização Grade
            </button>
            <button
              onClick={() => setViewMode("daily")}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                viewMode === "daily" 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Visualização Diária
            </button>
          </div>
        </div>
      </div>

      {viewMode === "grid" && (
        <>
          {/* Filtro de Categorias */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory("All")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === "All"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground hover:bg-secondary/80"
              }`}
            >
              Todas as Categorias
            </button>
            {getCategories().map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                }`}
              >
                {category === "Health" ? "Saúde" : 
                 category === "Productivity" ? "Produtividade" : 
                 category === "Learning" ? "Aprendizado" : 
                 category === "Personal" ? "Pessoal" : "Financeiro"}
              </button>
            ))}
          </div>

          {/* Formulário de Adicionar Hábito */}
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="font-semibold mb-3">Adicionar Novo Hábito</h3>
            <div className="flex gap-2 flex-wrap">
              <input
                value={newHabit}
                onChange={(e) => setNewHabit(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addHabit()}
                placeholder="Novo hábito..."
                className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="Health">Saúde</option>
                <option value="Productivity">Produtividade</option>
                <option value="Learning">Aprendizado</option>
                <option value="Personal">Pessoal</option>
                <option value="Finance">Financeiro</option>
              </select>
              <button onClick={addHabit} className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Habits Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredHabits.map((habit) => {
              const doneToday = habit.lastCompleted === today;
              const categoryColors = {
                Health: "bg-green-500/20 text-green-600",
                Productivity: "bg-blue-500/20 text-blue-600",
                Learning: "bg-purple-500/20 text-purple-600",
                Personal: "bg-pink-500/20 text-pink-600",
                Finance: "bg-yellow-500/20 text-yellow-600",
              };

              return (
                <div key={habit.id} className="glass-card p-5 space-y-4 hover:border-primary/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{habit.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[habit.category]}`}>
                        {habit.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-streak">
                      <Flame className="h-4 w-4" />
                      <span className="text-sm font-bold">{habit.streak}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => !doneToday && completeHabit(habit.id)}
                    disabled={doneToday}
                    className={`w-full py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                      doneToday
                        ? "bg-success/20 text-success cursor-default"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                  >
                    <Check className="h-4 w-4" />
                    {doneToday ? "Concluído Hoje" : "Concluir Hoje"}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {viewMode === "daily" && (
        <div className="space-y-4">
          {dailyHabits.map((dayData) => (
            <div key={dayData.day} className={`glass-card p-6 ${dayData.isToday ? "border-primary/50 ring-1 ring-primary/20" : ""}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Calendar className={`h-5 w-5 ${dayData.isToday ? "text-primary" : "text-muted-foreground"}`} />
                  <h3 className={`text-lg font-semibold ${dayData.isToday ? "text-primary" : ""}`}>
                    {dayData.day} {dayData.isToday && "(Today)"}
                  </h3>
                </div>
                <span className="text-sm text-muted-foreground">
                  {dayData.habits.length} hábitos
                </span>
              </div>
              
              {dayData.habits.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum hábito atribuído para este dia
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {dayData.habits.map((habit) => {
                    const doneToday = habit.lastCompleted === today;
                    const categoryColors = {
                      Health: "bg-green-500/20 text-green-600",
                      Productivity: "bg-blue-500/20 text-blue-600",
                      Learning: "bg-purple-500/20 text-purple-600",
                      Personal: "bg-pink-500/20 text-pink-600",
                      Finance: "bg-yellow-500/20 text-yellow-600",
                    };

                    return (
                      <div key={habit.id} className="p-3 rounded-lg border border-border/50 hover:bg-secondary/50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-sm">{habit.name}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[habit.category]}`}>
                              {habit.category === "Health" ? "Saúde" : 
                               habit.category === "Productivity" ? "Produtividade" : 
                               habit.category === "Learning" ? "Aprendizado" : 
                               habit.category === "Personal" ? "Pessoal" : "Financeiro"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-streak">
                            <Flame className="h-3 w-3" />
                            <span className="text-xs font-bold">{habit.streak}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => !doneToday && completeHabit(habit.id)}
                          disabled={doneToday}
                          className={`w-full py-1.5 rounded text-xs font-medium transition-all ${
                            doneToday
                              ? "bg-success/20 text-success cursor-default"
                              : "bg-primary/10 text-primary hover:bg-primary/20"
                          }`}
                        >
                          {doneToday ? "Concluído" : "Concluir"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
