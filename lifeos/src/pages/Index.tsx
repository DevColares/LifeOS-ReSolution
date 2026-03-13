import { useState } from "react";
import AppSidebar, { View } from "@/components/AppSidebar";
import Dashboard from "@/components/Dashboard";
import HabitsView from "@/components/HabitsView";
import GoalsView from "@/components/GoalsView";
import RelationshipsView from "@/components/RelationshipsView";
import Settings from "@/components/Settings";
import FinanceView from "@/components/FinanceView";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Habit, Goal, Relationship, Transaction } from "@/lib/types";

const Index = () => {
  const [view, setView] = useState<View>("dashboard");
  const [habits, setHabits] = useLocalStorage<Habit[]>("lifeos-habits", []);
  const [goals, setGoals] = useLocalStorage<Goal[]>("lifeos-goals", []);
  const [relationships, setRelationships] = useLocalStorage<Relationship[]>("lifeos-relationships", []);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>("lifeos-finance", []);
  const [userProfile, setUserProfile] = useLocalStorage<{ name: string, photo: string }>("lifeos-user-profile", { name: "Usuário", photo: "" });

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <AppSidebar active={view} onNavigate={setView} />
      <main className="flex-1 h-full overflow-y-auto no-scrollbar pb-32 md:pb-8">
        <div className="max-w-6xl mx-auto p-6 md:p-12 lg:p-16">
          {view === "dashboard" && (
            <Dashboard habits={habits} goals={goals} transactions={transactions} userProfile={userProfile} />
          )}
          {view === "habits" && <HabitsView habits={habits} setHabits={setHabits} goals={goals} />}
          {view === "goals" && <GoalsView goals={goals} setGoals={setGoals} habits={habits} />}
          {view === "relationships" && <RelationshipsView relationships={relationships} setRelationships={setRelationships} />}
          {view === "finance" && <FinanceView transactions={transactions} setTransactions={setTransactions} />}
          {view === "settings" && <Settings userProfile={userProfile} setUserProfile={setUserProfile} />}
        </div>
      </main>
    </div>
  );
};

export default Index;
