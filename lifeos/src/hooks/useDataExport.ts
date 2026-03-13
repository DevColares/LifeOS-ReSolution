import { Habit, Goal, Relationship } from "@/lib/types";

export function useDataExport() {
  const exportData = () => {
    const habits = JSON.parse(localStorage.getItem("lifeos-habits") || "[]");
    const goals = JSON.parse(localStorage.getItem("lifeos-goals") || "[]");
    const relationships = JSON.parse(localStorage.getItem("lifeos-relationships") || "[]");
    const finance = JSON.parse(localStorage.getItem("lifeos-finance") || "[]");
    const userProfile = JSON.parse(localStorage.getItem("lifeos-user-profile") || '{"name":"Usuário","photo":""}');
    const categories = JSON.parse(localStorage.getItem("lifeos-finance-categories") || "null");
    
    const data = {
      version: "1.1",
      timestamp: new Date().toISOString(),
      habits,
      goals,
      relationships,
      finance,
      userProfile,
      categories
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
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          
          if (data.habits && Array.isArray(data.habits)) {
            localStorage.setItem("lifeos-habits", JSON.stringify(data.habits));
          }
          
          if (data.goals && Array.isArray(data.goals)) {
            localStorage.setItem("lifeos-goals", JSON.stringify(data.goals));
          }
          
          if (data.relationships && Array.isArray(data.relationships)) {
            localStorage.setItem("lifeos-relationships", JSON.stringify(data.relationships));
          }

          if (data.finance && Array.isArray(data.finance)) {
            localStorage.setItem("lifeos-finance", JSON.stringify(data.finance));
          }

          if (data.userProfile && typeof data.userProfile === 'object') {
            localStorage.setItem("lifeos-user-profile", JSON.stringify(data.userProfile));
          }

          if (data.categories && typeof data.categories === 'object') {
            localStorage.setItem("lifeos-finance-categories", JSON.stringify(data.categories));
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

  const clearData = () => {
    localStorage.removeItem("lifeos-habits");
    localStorage.removeItem("lifeos-goals");
    localStorage.removeItem("lifeos-relationships");
    localStorage.removeItem("lifeos-finance");
    localStorage.removeItem("lifeos-user-profile");
    localStorage.removeItem("lifeos-finance-categories");
    localStorage.removeItem("lifeos-theme");
  };

  return { exportData, importData, clearData };
}