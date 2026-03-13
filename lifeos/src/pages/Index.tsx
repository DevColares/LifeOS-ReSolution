import { useState } from "react";
import AppSidebar, { View } from "@/components/AppSidebar";
import Dashboard from "@/components/Dashboard";
import HabitsView from "@/components/HabitsView";
import GoalsView from "@/components/GoalsView";
import RelationshipsView from "@/components/RelationshipsView";
import Settings from "@/components/Settings";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Habit, Goal, Relationship } from "@/lib/types";

const Index = () => {
  const [view, setView] = useState<View>("dashboard");
  const [habits, setHabits] = useLocalStorage<Habit[]>("lifeos-habits", []);
  const [goals, setGoals] = useLocalStorage<Goal[]>("lifeos-goals", []);
  const [relationships, setRelationships] = useLocalStorage<Relationship[]>("lifeos-relationships", []);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar active={view} onNavigate={setView} />
      <main className="flex-1 p-6 md:p-12 lg:p-16 overflow-auto">
        <div className="max-w-6xl mx-auto border-none">
          {view === "dashboard" && (
            <Dashboard habits={habits} goals={goals} />
          )}
          {view === "habits" && <HabitsView habits={habits} setHabits={setHabits} goals={goals} />}
          {view === "goals" && <GoalsView goals={goals} setGoals={setGoals} habits={habits} />}
          {view === "relationships" && <RelationshipsView relationships={relationships} setRelationships={setRelationships} />}
          {view === "settings" && <Settings />}
        </div>
      </main>
    </div>
  );
};

export default Index;
