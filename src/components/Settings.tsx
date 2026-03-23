import { useState, useRef } from "react";
import { Download, Upload, Trash2, AlertCircle, Settings as SettingsIcon, User, Camera, Sun, Moon, X, Plus, Bell, BellOff, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDataExport } from "@/hooks/useDataExport";
import { useTheme } from "@/hooks/useTheme";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useAuth } from "@/contexts/AuthContext";
import { Habit, Goal, Relationship, Transaction } from "@/lib/types";

const defaultCategories = {
  income: ["Salário", "Investimento", "Venda", "Presente", "Outros"],
  expense: ["Alimentação", "Transporte", "Moradia", "Lazer", "Saúde", "Educação", "Outros"]
};

interface SettingsProps {
  userProfile: { name: string; photo: string };
  setUserProfile: React.Dispatch<React.SetStateAction<{ name: string; photo: string }>>;
  habits: Habit[];
  goals: Goal[];
  relationships: Relationship[];
  transactions: Transaction[];
  categories: any;
  setCategories: React.Dispatch<React.SetStateAction<any>>;
  notificationsConfig: any;
  setNotificationsConfig: React.Dispatch<React.SetStateAction<any>>;
}

export default function Settings({ 
    userProfile, setUserProfile, 
    habits, goals, relationships, transactions,
    categories, setCategories,
    notificationsConfig, setNotificationsConfig
}: SettingsProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [, setImportError] = useState<string | null>(null);
  const { user } = useAuth();
  const { exportData, importData, clearData } = useDataExport(user);
  const { isDark, toggleTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newCatName, setNewCatName] = useState("");
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('expense');
  const [newNotifTime, setNewNotifTime] = useState("");

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("Este navegador não suporta notificações de desktop.");
      return;
    }
    
    if (Notification.permission === "granted") {
      setNotificationsConfig((prev: any) => ({ ...prev, enabled: !prev.enabled }));
    } else if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setNotificationsConfig((prev: any) => ({ ...prev, enabled: true }));
      }
    } else {
      alert("Você bloqueou as notificações. Por favor, libere nas configurações do navegador.");
    }
  };

  const addNotificationTime = () => {
    if (!newNotifTime || notificationsConfig?.times?.includes(newNotifTime)) return;
    setNotificationsConfig((prev: any) => ({
      ...prev,
      times: [...(prev.times || []), newNotifTime].sort(),
      count: (prev.times?.length || 0) + 1
    }));
    setNewNotifTime("");
  };

  const removeNotificationTime = (time: string) => {
    setNotificationsConfig((prev: any) => ({
      ...prev,
      times: prev.times.filter((t: string) => t !== time),
      count: prev.times.length - 1
    }));
  };

  const testNotification = async () => {
    const msg = "🔔 Teste de Notificação LifeOS funcionando perfeitamente!";
    
    // Auto-request permission if currently default (happens when synced from desktop via Firestore but phone never asked)
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
      await Notification.requestPermission();
    }
    
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("LifeOS - Teste", { body: msg });
      } catch (e) {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification("LifeOS - Teste", {
              body: msg,
              vibrate: [200, 100, 200, 100, 200]
            } as any);
          });
        }
      }
    } else {
      alert("Este dispositivo não tem permissão para notificações. Acesse as configurações de notificação local para permitir.");
    }
  };

  const addCategory = () => {
    if (!newCatName.trim()) return;
    setCategories((prev: any) => ({
      ...prev,
      [activeTab]: [...prev[activeTab], newCatName.trim()]
    }));
    setNewCatName("");
  };

  const removeCategory = (type: 'income' | 'expense', name: string) => {
    setCategories((prev: any) => ({
      ...prev,
      [type]: prev[type].filter((cat: string) => cat !== name)
    }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("A imagem é muito grande! Por favor, escolha uma imagem com menos de 2MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          setUserProfile(prev => ({ ...prev, photo: reader.result as string }));
        } catch (error) {
          console.error("Erro ao salvar foto:", error);
          alert("Erro ao salvar a foto. Tente uma imagem menor.");
        }
      };
      reader.onerror = () => alert("Erro ao ler o arquivo.");
      reader.readAsDataURL(file);
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);

    importData(file)
      .then(() => {
        alert("Dados importados com sucesso!");
        window.location.reload();
      })
      .catch((error) => {
        setImportError(error.message || "Falha ao importar dados");
      })
      .finally(() => {
        setIsImporting(false);
        event.target.value = "";
      });
  };

  const handleClearData = () => {
    if (confirm("Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.")) {
      clearData();
      alert("Todos os dados foram limpos com sucesso!");
      window.location.reload();
    }
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-secondary rounded-xl">
            <SettingsIcon className="h-6 w-6 text-foreground" />
          </div>
          <h2 className="text-3xl font-display font-black tracking-tight">Configurações</h2>
        </div>
        <p className="text-muted-foreground text-lg ml-11">Gerencie seu ambiente e dados.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Management */}
        <div className="glass-card p-8 space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl font-display font-bold">Seu Perfil</h3>
            <p className="text-sm text-muted-foreground">Como você aparece no sistema.</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-2xl bg-secondary/50 border-2 border-dashed border-primary/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary transition-all"
              >
                {userProfile.photo ? (
                  <img src={userProfile.photo} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-8 w-8 text-primary/40 group-hover:text-primary transition-all" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                  <Camera className="h-5 w-5 text-white" />
                </div>
              </div>
              <input type="file" ref={fileInputRef} onChange={handlePhotoChange} accept="image/*" className="hidden" />
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Seu Nome</label>
                {userProfile.photo && (
                  <button
                    onClick={() => setUserProfile(prev => ({ ...prev, photo: "" }))}
                    className="text-[10px] font-bold text-destructive hover:underline flex items-center gap-1"
                  >
                    <X className="h-3 w-3" /> Remover Foto
                  </button>
                )}
              </div>
              <input
                value={userProfile.name}
                onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-secondary/50 border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                placeholder="Ex: Seu Nome"
              />
            </div>
          </div>
        </div>

        {/* Theme Management */}
        <div className="glass-card p-8 space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl font-display font-bold">Aparência</h3>
            <p className="text-sm text-muted-foreground">Escolha o tema do seu sistema.</p>
          </div>

          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-secondary/50 hover:bg-secondary transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-background rounded-xl">
                {isDark ? <Sun className="h-5 w-5 text-warning" /> : <Moon className="h-5 w-5 text-primary" />}
              </div>
              <div className="text-left">
                <p className="text-sm font-bold">{isDark ? "Modo Claro" : "Modo Escuro"}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Clique para alternar</p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isDark ? 'bg-primary' : 'bg-muted/30'}`}>
              <div className={`h-4 w-4 bg-white rounded-full transition-transform ${isDark ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </button>
        </div>

        {/* Notifications Management */}
        <div className="glass-card p-8 space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl font-display font-bold">Notificações</h3>
            <p className="text-sm text-muted-foreground">Lembretes sobre seus hábitos e metas.</p>
          </div>

          <button
            onClick={requestNotificationPermission}
            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${notificationsConfig?.enabled ? 'bg-primary/20 hover:bg-primary/30 border border-primary/20' : 'bg-secondary/50 hover:bg-secondary border border-transparent'}`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-xl transition-colors ${notificationsConfig?.enabled ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>
                {notificationsConfig?.enabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5 text-muted-foreground" />}
              </div>
              <div className="text-left">
                <p className="text-sm font-bold">{notificationsConfig?.enabled ? "Notificações Ativas" : "Notificações Desativadas"}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Clique para alternar permissão</p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${notificationsConfig?.enabled ? 'bg-primary' : 'bg-muted/30'}`}>
              <div className={`h-4 w-4 bg-white rounded-full transition-transform ${notificationsConfig?.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </button>

          {notificationsConfig?.enabled && (
             <div className="space-y-4 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-2">
               <div>
                 <p className="text-sm font-bold">Horários</p>
                 <p className="text-xs text-muted-foreground">Defina quando deseja ser lembrado ({(notificationsConfig?.times || []).length} configurados)</p>
               </div>
               
               <div className="flex gap-2 items-center">
                 <input
                   type="time"
                   value={newNotifTime}
                   onChange={(e) => setNewNotifTime(e.target.value)}
                   className="flex-1 bg-secondary/50 border-none rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                 />
                 <button 
                    onClick={addNotificationTime}
                    disabled={!newNotifTime}
                    className="p-2.5 bg-primary text-primary-foreground rounded-xl disabled:opacity-50 hover:scale-105 active:scale-95 transition-all"
                  >
                   <Plus className="h-5 w-5" />
                 </button>
               </div>

               <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                 {(notificationsConfig?.times || []).map((time: string) => (
                   <div key={time} className="group flex items-center justify-between bg-secondary/30 hover:bg-secondary/50 border border-border/50 p-2 px-3 rounded-xl transition-all">
                     <span className="text-sm font-bold flex items-center gap-2 text-foreground"><Clock className="h-4 w-4 text-primary" />{time}</span>
                     <button onClick={() => removeNotificationTime(time)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                       <X className="h-4 w-4" />
                     </button>
                   </div>
                 ))}
               </div>

               <div className="pt-2">
                 <button
                    onClick={testNotification}
                    className="w-full py-3 rounded-xl border border-primary/20 text-primary font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/10 transition-all active:scale-95"
                 >
                   <Bell className="h-4 w-4" />
                   Testar Notificação Agora
                 </button>
               </div>
             </div>
          )}
        </div>

        <div className="glass-card p-8 space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl font-display font-bold">Importar & Exportar</h3>
            <p className="text-sm text-muted-foreground">Mantenha seus dados seguros fora do navegador.</p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              disabled={isImporting}
              onClick={() => exportData({
                  habits,
                  goals,
                  relationships,
                  finance: transactions,
                  userProfile,
                  categories
              })}
              className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold hover:shadow-xl hover:shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
            >
              <Download className="h-5 w-5" />
              Backup Completo (.json)
            </button>
            <button
              disabled={isImporting}
              onClick={() => document.getElementById("file-input")?.click()}
              className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-secondary text-foreground font-bold hover:bg-secondary/80 transition-all active:scale-95 disabled:opacity-50"
            >
              <Upload className="h-5 w-5" />
              {isImporting ? "Importando..." : "Restaurar Backup"}
            </button>
            <input
              id="file-input"
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
          </div>
        </div>

        <div className="glass-card p-8 space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl font-display font-bold">Zona de Risco</h3>
            <p className="text-sm text-muted-foreground">Ações irreversíveis sobre seus dados.</p>
          </div>

          <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/10 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-destructive font-medium leading-relaxed">
              Limpar os dados removerá permanentemente todos os seus hábitos, metas, relacionamentos e histórico local.
            </p>
          </div>

          <button
            onClick={handleClearData}
            className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl border-2 border-destructive/20 text-destructive font-bold hover:bg-destructive hover:text-white transition-all active:scale-95"
          >
            <Trash2 className="h-5 w-5" />
            Limpar Todo o Sistema
          </button>
        </div>

        {/* Finance Categories Management */}
        <div className="glass-card p-8 space-y-6 md:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-xl font-display font-bold">Categorias do Financeiro</h3>
              <p className="text-sm text-muted-foreground">Personalize as categorias de suas entradas e saídas.</p>
            </div>
            <div className="flex bg-secondary/50 p-1 rounded-xl self-start">
              <button
                onClick={() => setActiveTab('expense')}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                  activeTab === 'expense' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Saídas
              </button>
              <button
                onClick={() => setActiveTab('income')}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                  activeTab === 'income' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Entradas
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder={`Nova categoria de ${activeTab === 'income' ? 'entrada' : 'saída'}...`}
              className="flex-1 bg-secondary/50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-primary/20 text-slate-950 dark:text-white"
            />
            <button
              onClick={addCategory}
              className="px-6 rounded-2xl bg-primary text-white font-bold hover:scale-[1.02] transition-all flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {categories[activeTab].map((cat: string) => (
              <div
                key={cat}
                className="group flex items-center justify-between bg-secondary/30 hover:bg-secondary/50 border border-slate-100 dark:border-white/5 rounded-xl px-4 py-3 transition-all"
              >
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{cat}</span>
                <button
                  onClick={() => removeCategory(activeTab, cat)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card p-8 flex flex-col items-center justify-center text-center space-y-4">
        <div className="h-16 w-16 rounded-3xl bg-secondary flex items-center justify-center">
          <h1 className="text-2xl font-display font-black tracking-tighter">
            L<span className="text-primary">O</span>
          </h1>
        </div>
        <div>
          <h3 className="font-display font-black text-xl">LifeOS Premium</h3>
          <p className="text-sm text-muted-foreground">Versão 1.2.0 • 2024</p>
        </div>
        <div className="flex gap-4">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <div className="h-2 w-2 rounded-full bg-streak animate-pulse delay-75" />
          <div className="h-2 w-2 rounded-full bg-success animate-pulse delay-150" />
        </div>
      </div>
    </div>
  );
}
