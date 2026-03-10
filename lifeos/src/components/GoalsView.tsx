import { useState } from "react";
import { Goal, Subtask } from "@/lib/types";
import { Plus, CheckCircle, Square, Calendar, Target, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProgressBar from "./ProgressBar";

interface GoalsViewProps {
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
}

export default function GoalsView({ goals, setGoals }: GoalsViewProps) {
  const [newGoal, setNewGoal] = useState("");
  const [newSubtask, setNewSubtask] = useState("");
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"all" | "daily">("all");

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
    setGoals((prev) => prev.filter((goal) => goal.id !== goalId));
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
    if (goal.subtasks.length === 0) return 0;
    const done = goal.subtasks.filter((s) => s.done).length;
    return Math.round((done / goal.subtasks.length) * 100);
  };

  const getDailyGoals = () => {
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    // For demo purposes, assign goals to days based on their ID
    return goals.map(goal => {
      const dayIndex = goal.id.charCodeAt(0) % 7; // Simple hash to assign day
      return {
        ...goal,
        assignedDay: dayNames[dayIndex],
        isToday: dayIndex === today
      };
    });
  };

  const dailyGoals = getDailyGoals();
  const todayGoals = dailyGoals.filter(g => g.isToday);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">Metas</h2>
          <p className="text-muted-foreground text-sm">Acompanhe seu progresso e alcance seus objetivos.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 bg-secondary rounded-lg p-1">
            <button
              onClick={() => setViewMode("all")}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                viewMode === "all" 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Todas as Metas
            </button>
            <button
              onClick={() => setViewMode("daily")}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                viewMode === "daily" 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Metas de Hoje
            </button>
          </div>
          <div className="flex gap-2">
            <Input
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addGoal()}
              placeholder="Nova meta..."
              className="w-64"
            />
            <Button onClick={addGoal} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Meta
            </Button>
          </div>
        </div>
      </div>

      {viewMode === "daily" && (
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                Metas de Hoje - {new Date().toLocaleDateString('pt-BR', { weekday: 'long' })}
              </h3>
              <p className="text-sm text-muted-foreground">
                {todayGoals.length} metas atribuídas para hoje
              </p>
            </div>
          </div>
          
          {todayGoals.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma meta específica atribuída para hoje. Confira todas as metas ou adicione novas!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {todayGoals.map((goal) => {
                const progress = getProgress(goal);
                return (
                  <Card key={goal.id} className="hover:border-primary/30 transition-colors">
                    <CardHeader className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Target className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{goal.name}</CardTitle>
                            <p className="text-xs text-muted-foreground">
                              {goal.subtasks.length} tarefas
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                          {goal.assignedDay}
                        </span>
                      </div>
                      <ProgressBar progress={progress} size="md" color={progress === 100 ? "success" : "primary"} />
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">
                        Progresso: {progress}%
                      </p>
                      {progress === 100 && (
                        <div className="flex items-center gap-2 text-success text-sm">
                          <CheckCircle className="h-4 w-4" />
                          Meta concluída!
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(viewMode === "all" ? goals : todayGoals).map((goal) => {
          const progress = getProgress(goal);
          const isCompleted = progress === 100;

          return (
            <Card key={goal.id} className="glass-card hover:border-primary/30 transition-colors">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{goal.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {goal.subtasks.length} tarefas • {progress}% concluído
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedGoal(selectedGoal === goal.id ? null : goal.id)}
                  >
                    {selectedGoal === goal.id ? "Hide Tasks" : "Show Tasks"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteGoal(goal.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm text-muted-foreground mb-1">
                      <span>Progresso</span>
                      <span>{progress}%</span>
                    </div>
                    <ProgressBar progress={progress} size="md" color={isCompleted ? "success" : "primary"} />
                  </div>
                  {isCompleted && (
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                  )}
                </div>

                {selectedGoal === goal.id && (
                  <div className="space-y-3 border-t border-border/50 pt-4">
                    <div className="flex gap-2">
                      <Input
                        value={newSubtask}
                        onChange={(e) => setNewSubtask(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addSubtask(goal.id)}
                        placeholder="Nova tarefa..."
                        className="flex-1"
                      />
                      <Button onClick={() => addSubtask(goal.id)}>Adicionar Tarefa</Button>
                    </div>

                    <div className="space-y-2">
                      {goal.subtasks.map((subtask) => (
                        <div
                          key={subtask.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-secondary/50 transition-colors"
                        >
                          <button
                            onClick={() => toggleSubtask(goal.id, subtask.id)}
                            className={`p-1 rounded ${
                              subtask.done
                                ? "text-success hover:text-success/80"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {subtask.done ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </button>
                          <span
                            className={`flex-1 ${
                              subtask.done ? "line-through text-muted-foreground" : ""
                            }`}
                          >
                            {subtask.text}
                          </span>
                          <button
                            onClick={() => deleteSubtask(goal.id, subtask.id)}
                            className="text-destructive hover:text-destructive/80 p-1 rounded"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}