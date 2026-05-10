import { useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy, limit, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useRealtimeNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    console.log("Iniciando escuta de notificações para UID:", user.uid);

    // Escuta notificações não lidas dos últimos minutos
    const q = query(
      collection(db, "users", user.uid, "notifications"),
      where("read", "==", false),
      orderBy("timestamp", "desc"),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log(`Snapshot recebido: ${snapshot.size} notificações não lidas.`);
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          console.log("Nova notificação detectada:", data);
          
          // 1. Mostrar Toast no sistema (UI interna)
          toast(data.title || "Notificação LifeOS", {
            description: data.message,
          });

          // 2. Mostrar Notificação Nativa (Sistema Operacional)
          if ("serviceWorker" in navigator && "Notification" in window) {
            Notification.requestPermission().then(permission => {
              if (permission === "granted") {
                navigator.serviceWorker.ready.then(registration => {
                  registration.showNotification(data.title || "LifeOS", {
                    body: data.message,
                    icon: "/icon-192.png",
                    badge: "/favicon.ico",
                    vibrate: [200, 100, 200],
                    tag: "lifeos-notification", // Evita duplicados
                    requireInteraction: true // Fica no Windows até o usuário fechar
                  });
                });
              }
            });
          }

          // 3. Marcar como lida
          const docRef = doc(db, "users", user.uid, "notifications", change.doc.id);
          updateDoc(docRef, { read: true }).catch(err => console.error("Erro ao marcar como lida:", err));
        }
      });
    }, (error) => {
      console.error("ERRO NO SNAPSHOT DE NOTIFICAÇÕES:", error);
      if (error.message.includes("index")) {
        console.warn("⚠️ ALERTA: Você precisa criar um índice no Firestore. Verifique o link no erro acima.");
      }
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
