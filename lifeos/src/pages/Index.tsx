import { useState } from "react";
import AppSidebar, { View } from "@/components/AppSidebar";
import Dashboard from "@/components/Dashboard";
import HabitsView from "@/components/HabitsView";
import GoalsView from "@/components/GoalsView";
import RelationshipsView from "@/components/RelationshipsView";
import Settings from "@/components/Settings";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Habit, Goal, Relationship } from "@/lib/types";
import { mockHabits, mockGoals, mockRelationships } from "@/lib/mockData";

const Index = () => {
  const [view, setView] = useState<View>("dashboard");
  const [habits, setHabits] = useLocalStorage<Habit[]>("lifeos-habits", [], mockHabits);
  const [goals, setGoals] = useLocalStorage<Goal[]>("lifeos-goals", [], mockGoals);
  const [relationships, setRelationships] = useLocalStorage<Relationship[]>("lifeos-relationships", [], mockRelationships);

  return (
    <div className="flex min-h-screen">
      <AppSidebar active={view} onNavigate={setView} />
      <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-auto">
        <div className="max-w-5xl mx-auto">
          {view === "dashboard" && (
            <Dashboard habits={habits} goals={goals} />
          )}
          {view === "habits" && <HabitsView habits={habits} setHabits={setHabits} />}
          {view === "goals" && <GoalsView goals={goals} setGoals={setGoals} />}
          {view === "relationships" && <RelationshipsView relationships={relationships} setRelationships={setRelationships} />}
          {view === "settings" && <Settings />}
        </div>
      </main>
    </div>
  );
};

export default Index;
