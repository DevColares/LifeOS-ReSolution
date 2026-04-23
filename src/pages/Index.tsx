import { useState } from "react";
import AppSidebar, { View } from "@/components/AppSidebar";
import Dashboard from "@/components/Dashboard";
import HabitsView from "@/components/HabitsView";
import GoalsView from "@/components/GoalsView";
import RelationshipsView from "@/components/RelationshipsView";
import Settings from "@/components/Settings";
import FinanceView from "@/components/FinanceView";
import NotesView from "@/components/NotesView";
import SpinOffView from "@/components/SpinOffView";
import { Habit, Goal, Relationship, Transaction, Note } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { AuthScreen } from "@/components/AuthScreen";
import { Loader2 } from "lucide-react";
import { useFirestoreSync, useFirestoreDocSync } from "@/hooks/useFirestoreSync";
import { useNotifications } from "@/hooks/useNotifications";

const Index = () => {
  const [view, setView] = useState<View>("dashboard");
  const [habits, setHabits, hLoading] = useFirestoreSync<Habit>("habits", []);
  const [goals, setGoals, gLoading] = useFirestoreSync<Goal>("goals", []);
  const [relationships, setRelationships, rLoading] = useFirestoreSync<Relationship>("relationships", []);
  const [transactions, setTransactions, tLoading] = useFirestoreSync<Transaction>("finance", []);
  const [notes, setNotes, notesLoading] = useFirestoreSync<Note>("notes", []);
  const [userProfile, setUserProfile, pLoading] = useFirestoreDocSync<{ name: string, photo: string }>("profile", { name: "Usuário", photo: "" });
  const [categories, setCategories, cLoading] = useFirestoreDocSync<any>("categories", {
    income: ["Salário", "Investimento", "Venda", "Presente", "Outros"],
    expense: ["Alimentação", "Transporte", "Moradia", "Lazer", "Saúde", "Educação", "Outros"]
  });
  const [notificationsConfig, setNotificationsConfig, nLoading] = useFirestoreDocSync<any>("notifications", {
    enabled: false,
    count: 1, // Optional: number of times, mainly represented via 'times' array length
    times: ["08:00"],
    message: "Hora de focar nos seus objetivos e hábitos!"
  });

  const { user, loading: authLoading } = useAuth();
  const isSyncing = hLoading || gLoading || rLoading || tLoading || pLoading || cLoading || nLoading || notesLoading || authLoading;

  useNotifications(notificationsConfig);

  if (isSyncing) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sincronizando com a Nuvem...</p>
        </div>
      </div>
    );
  }

  if (!user || !user.emailVerified) {
    return <AuthScreen />;
  }

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
          {view === "finance" && <FinanceView transactions={transactions} setTransactions={setTransactions} categories={categories} />}
          {view === "notes" && <NotesView notes={notes} setNotes={setNotes} />}
          {view === "spinoff" && <SpinOffView />}
          {view === "settings" && (
            <Settings 
                userProfile={userProfile} 
                setUserProfile={setUserProfile} 
                habits={habits}
                goals={goals}
                relationships={relationships}
                transactions={transactions}
                categories={categories}
                setCategories={setCategories}
                notificationsConfig={notificationsConfig}
                setNotificationsConfig={setNotificationsConfig}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
