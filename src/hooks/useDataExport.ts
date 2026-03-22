import { Habit, Goal, Relationship, Transaction } from "@/lib/types";
import { doc, writeBatch, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User } from "firebase/auth";

interface ExportDataArgs {
    habits: Habit[];
    goals: Goal[];
    relationships: Relationship[];
    finance: Transaction[];
    userProfile: { name: string; photo: string };
    categories: any;
}

export function useDataExport(user: User | null) {
  const exportData = (currentData: ExportDataArgs) => {
    const data = {
      version: "1.2",
      timestamp: new Date().toISOString(),
      ...currentData
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lifeos-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          
          const findData = (keys: string[]) => {
            for (const key of keys) {
              if (data[key] && Array.isArray(data[key])) return data[key];
            }
            return null;
          };

          const habits = findData(["habits", "habitos", "tasks", "tarefas"]);
          const goals = findData(["goals", "metas", "objetivos"]);
          const relationships = findData(["relationships", "relacionamentos", "contacts", "pessoas"]);
          const finance = findData(["finance", "financeiro", "transactions", "transacoes", "lancamentos"]);
          const userProfile = data.userProfile || data.perfil || data.user;
          const categories = data.categories || data.categorias;

          // 1. Update LocalStorage
          if (habits) localStorage.setItem("lifeos-habits", JSON.stringify(habits));
          if (goals) localStorage.setItem("lifeos-goals", JSON.stringify(goals));
          if (relationships) localStorage.setItem("lifeos-relationships", JSON.stringify(relationships));
          if (finance) localStorage.setItem("lifeos-finance", JSON.stringify(finance));
          if (userProfile) localStorage.setItem("lifeos-user-profile", JSON.stringify(userProfile));
          if (categories) localStorage.setItem("lifeos-finance-categories", JSON.stringify(categories));

          // 2. Update Firestore if user is logged in
          if (user) {
            console.log("Iniciando sincronização cloud manual (Reforçada)...");

            const clean = (obj: any): any => {
              return JSON.parse(JSON.stringify(obj, (key, value) => {
                return value === undefined ? null : value;
              }));
            };

            const promises: Promise<any>[] = [];

            // Itens de Coleção
            const collections = [
                { name: "habits", data: habits },
                { name: "goals", data: goals },
                { name: "relationships", data: relationships },
                { name: "finance", data: finance }
            ];

            for (const col of collections) {
                if (col.data && Array.isArray(col.data)) {
                    console.log(`Fila de sincronização: ${col.name} (${col.data.length} itens)`);
                    for (const item of col.data) {
                        const itemId = item.id || Math.random().toString(36).slice(2);
                        const docRef = doc(db, "users", user.uid, col.name, itemId);
                        promises.push(setDoc(docRef, clean(item), { merge: true }));
                    }
                }
            }

            // Perfil e Categorias
            if (userProfile) {
                const cleanProfile = clean(userProfile);
                if (JSON.stringify(cleanProfile).length > 1000000) cleanProfile.photo = "";
                promises.push(setDoc(doc(db, "users", user.uid, "settings", "profile"), cleanProfile, { merge: true }));
            }
            if (categories) {
                promises.push(setDoc(doc(db, "users", user.uid, "settings", "categories"), clean(categories), { merge: true }));
            }

            try {
                console.log(`Aguardando conclusão de ${promises.length} operações no Firebase...`);
                await Promise.all(promises);
                console.log("Backup sincronizado com sucesso no Firebase!");
                // Pequena pausa para garantir a rede
                await new Promise(r => setTimeout(r, 1000));
            } catch (e: any) {
                console.error("Erro na sincronização:", e);
                alert("Erro ao enviar dados para o Google. Verifique sua conexão.");
            }
          }
          
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  };

  const clearData = async () => {
    // 1. Clear LocalStorage
    localStorage.removeItem("lifeos-habits");
    localStorage.removeItem("lifeos-goals");
    localStorage.removeItem("lifeos-relationships");
    localStorage.removeItem("lifeos-finance");
    localStorage.removeItem("lifeos-user-profile");
    localStorage.removeItem("lifeos-finance-categories");
    localStorage.removeItem("lifeos-theme");

    // 2. Clear Firestore
    if (user) {
        const batch = writeBatch(db);
        ["habits", "goals", "relationships", "finance", "profile", "categories"].forEach(col => {
            const docRef = doc(db, "users", user.uid, "data", col);
            batch.delete(docRef);
        });
        await batch.commit();
    }
  };

  return { exportData, importData, clearData };
}