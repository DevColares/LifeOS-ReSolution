import { useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy, limit, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useRealtimeNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Escuta notificações não lidas dos últimos minutos
    const q = query(
      collection(db, "users", user.uid, "notifications"),
      where("read", "==", false),
      orderBy("timestamp", "desc"),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          
          // 1. Mostrar Toast no sistema
          toast(data.title || "Notificação LifeOS", {
            description: data.message,
          });

          // 2. Mostrar Notificação Nativa do Sistema Operacional (Mobile/Desktop)
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(data.title || "LifeOS", {
              body: data.message,
              icon: "/favicon.ico"
            });
          }

          // 3. Marcar como lida para não repetir
          const docRef = doc(db, "users", user.uid, "notifications", change.doc.id);
          updateDoc(docRef, { read: true });
        }
      });
    });

    return () => unsubscribe();
  }, [user]);

  // Função para pedir permissão (pode ser chamada ao clicar em um botão)
  const requestPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        toast.success("Notificações ativadas com sucesso!");
      }
    }
  };

  return { requestPermission };
}
