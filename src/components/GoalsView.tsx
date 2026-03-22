import { useState } from "react";
import { Goal, Subtask, Habit } from "@/lib/types";
import { Plus, CheckCircle, Square, Calendar, Target, Clock, TrendingUp, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProgressBar from "./ProgressBar";

interface GoalsViewProps {
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  habits: Habit[];
}

export default function GoalsView({ goals, setGoals, habits }: GoalsViewProps) {
  const [newGoal, setNewGoal] = useState("");
  const [newSubtask, setNewSubtask] = useState("");
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const today = new Date().toISOString().split("T")[0];

  const addGoal = () => {
    if (!newGoal.trim()) return;
    setGoals((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: newGoal.trim(), subtasks: [] },
    ]);
    setNewGoal("");
  };

  const addSubtask = (goalId: string) => {
    if (!newSubtask.trim()) return;
    setGoals((prev) =>
      prev.map((goal) =>
        goal.id === goalId
          ? {
            ...goal,
            subtasks: [
              ...goal.subtasks,
              { id: crypto.randomUUID(), text: newSubtask.trim(), done: false },
            ],
          }
          : goal
      )
    );
    setNewSubtask("");
  };

  const toggleSubtask = (goalId: string, subtaskId: string) => {
    setGoals((prev) =>
      prev.map((goal) =>
        goal.id === goalId
          ? {
            ...goal,
            subtasks: goal.subtasks.map((subtask) =>
              subtask.id === subtaskId ? { ...subtask, done: !subtask.done } : subtask
            ),
          }
          : goal
      )
    );
  };

  const deleteGoal = (goalId: string) => {
    if (confirm("Tem certeza que deseja excluir esta meta?")) {
      setGoals((prev) => prev.filter((goal) => goal.id !== goalId));
    }
  };

  const deleteSubtask = (goalId: string, subtaskId: string) => {
    setGoals((prev) =>
      prev.map((goal) =>
        goal.id === goalId
          ? { ...goal, subtasks: goal.subtasks.filter((s) => s.id !== subtaskId) }
          : goal
      )
    );
  };

  const getProgress = (goal: Goal) => {
    const linkedHabits = habits.filter(h => h.goalId === goal.id);
    const totalItems = goal.subtasks.length + linkedHabits.length;
    if (totalItems === 0) return 0;

    const doneSubtasks = goal.subtasks.filter((s) => s.done).length;
    // Habit progress is its streak towards consolidation (21 days)
    const habitsProgress = linkedHabits.reduce((acc, h) => acc + Math.min(1, h.streak / 21), 0);

    return Math.round(((doneSubtasks + habitsProgress) / totalItems) * 100);
  };

  const getDailyStatus = (goal: Goal) => {
    const linkedHabits = habits.filter(h => h.goalId === goal.id);
    const totalItems = goal.subtasks.length + linkedHabits.length;
    if (totalItems === 0) return 0;

    const doneSubtasks = goal.subtasks.filter((s) => s.done).length;
    const doneHabitsToday = linkedHabits.filter(h => h.lastCompleted === today).length;

    return Math.round(((doneSubtasks + doneHabitsToday) / totalItems) * 100);
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <div className="flex items-center justify-between flex-wrap gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-3xl font-display font-black tracking-tight">Metas</h2>
          </div>
          <p className="text-muted-foreground text-lg ml-11">Transforme sonhos em planos executáveis.</p>
        </div>
      </div>

      <div className="glass-card p-6 rounded-[2rem]">
        <div className="flex gap-3">
          <div className="flex-1 p-1.5 bg-secondary/50 rounded-2xl border border-border/50">
            <input
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addGoal()}
              placeholder="Ex: Aprender React Avançado..."
              className="w-full bg-transparent px-4 py-2 text-sm focus:outline-none"
            />
          </div>
          <button
            onClick={addGoal}
            className="flex items-center gap-2 px-6 rounded-2xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 shadow-lg shadow-primary/20"
          >
            <Plus className="h-5 w-5" />
            <span className="hidden sm:inline">Criar Meta</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {goals.map((goal) => {
          const progress = getProgress(goal);
          const linkedHabits = habits.filter(h => h.goalId === goal.id);
          const isCompleted = progress === 100;
          const isSelected = selectedGoal === goal.id;

          return (
            <div key={goal.id} className="glass-card group flex flex-col h-fit">
              <div className="p-6 space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <h3 className="text-xl font-display font-bold leading-tight">{goal.name}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle className="h-3 w-3 text-success" />
                        {goal.subtasks.length} {goal.subtasks.length === 1 ? "tarefa" : "tarefas"}
                      </span>
                      {linkedHabits.length > 0 && (
                        <span className="flex items-center gap-1.5">
                          <Flame className="h-3 w-3 text-streak" />
                          {linkedHabits.length} {linkedHabits.length === 1 ? "hábito" : "hábitos"}
                        </span>
                      )}
                      <span className="text-primary/60">
                        {getDailyStatus(goal)}% feito hoje
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="p-2 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                    <span>Progresso Consolidado</span>
                    <span className={isCompleted ? "text-success" : "text-primary"}>{progress}%</span>
                  </div>
                  <ProgressBar progress={progress} size="md" color={isCompleted ? "success" : "primary"} />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedGoal(isSelected ? null : goal.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${isSelected
                      ? "bg-secondary text-foreground"
                      : "bg-primary/5 text-primary hover:bg-primary/10"
                      }`}
                  >
                    {isSelected ? "Ocultar Detalhes" : "Ver Detalhes"}
                    {isSelected ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>

                {isSelected && (
                  <div className="space-y-6 pt-4 border-t border-border/50 animate-in slide-in-from-top-2 duration-300">
                    {/* Linked Habits Section */}
                    {linkedHabits.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Hábitos Vinculados</h4>
                        <div className="space-y-2">
                          {linkedHabits.map(habit => (
                            <div key={habit.id} className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10">
                              <div className="flex items-center gap-3">
                                <div className={`p-1 rounded-lg ${habit.lastCompleted === today ? "bg-success text-white" : "bg-background border border-border"}`}>
                                  <Check className="h-3 w-3" />
                                </div>
                                <span className="text-sm font-bold">{habit.name}</span>
                              </div>
                              <div className="flex items-center gap-1 text-streak">
                                <Flame className="h-3.5 w-3.5 fill-current" />
                                <span className="text-xs font-black">{habit.streak}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Subtasks Section */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Subtarefas</h4>
                      <div className="flex gap-2">
                        <input
                          value={newSubtask}
                          onChange={(e) => setNewSubtask(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addSubtask(goal.id)}
                          placeholder="Adicionar subtarefa..."
                          className="flex-1 bg-secondary/50 px-4 py-2.5 rounded-xl text-sm border-none focus:ring-2 focus:ring-primary/20"
                        />
                        <button
                          onClick={() => addSubtask(goal.id)}
                          className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90"
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {goal.subtasks.map((subtask) => (
                          <div
                            key={subtask.id}
                            className="group/item flex items-center gap-3 p-3 rounded-xl bg-secondary/20 border border-transparent hover:border-border/50 hover:bg-secondary/40 transition-all"
                          >
                            <button
                              onClick={() => toggleSubtask(goal.id, subtask.id)}
                              className={`p-1 rounded-lg transition-all ${subtask.done
                                ? "bg-success text-white"
                                : "bg-background border border-border text-transparent"
                                }`}
                            >
                              <Check className="h-3 w-3 stroke-[4px]" />
                            </button>
                            <span
                              className={`flex-1 text-sm font-medium transition-all ${subtask.done ? "line-through text-muted-foreground/60" : "text-foreground"
                                }`}
                            >
                              {subtask.text}
                            </span>
                            <button
                              onClick={() => deleteSubtask(goal.id, subtask.id)}
                              className="opacity-0 group-hover/item:opacity-100 p-1 text-muted-foreground/40 hover:text-destructive transition-all"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Import definitions fix for the refactor
import { Trash2, ChevronDown, ChevronUp, Check, X } from "lucide-react";
