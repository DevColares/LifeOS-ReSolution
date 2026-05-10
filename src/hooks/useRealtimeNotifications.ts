import { useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy, limit, doc, updateDoc, arrayUnion, getDoc, setDoc } from "firebase/firestore";
import { db, messaging } from "@/lib/firebase";
import { getToken } from "firebase/messaging";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useRealtimeNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Tentar registrar o token automaticamente se a permissão já existir
    if ("Notification" in window && Notification.permission === "granted") {
      registerPushToken();
    }

    console.log("Iniciando escuta de notificações para UID:", user.uid);

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

          // Removemos o toast e a notificação manual daqui
          // para deixar apenas a notificação de segundo plano (FCM) agir.

          const docRef = doc(db, "users", user.uid, "notifications", change.doc.id);
          updateDoc(docRef, { read: true }).catch(err => console.error("Erro ao marcar como lida:", err));
        }
      });
    }, (error) => {
      console.error("ERRO NO SNAPSHOT DE NOTIFICAÇÕES:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const registerPushToken = async () => {
    if (!user || !messaging) return;

    try {
      // Corrigido: removido o "AQUI" que ficou no final da chave
      const VAPID_KEY = "BPAiqMDAWIaOtyLHJ9c8MuytiQxq4zT8Br3fB9pSwkpnVz0RaNqtW6RqWtt9-a_RdZvDeNHimsQZhHmu2nlNojY"; 
      
      const currentToken = await getToken(messaging, { 
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: await navigator.serviceWorker.ready
      });

      if (currentToken) {
        console.log("🚀 Token FCM obtido com sucesso:", currentToken);
        const settingsRef = doc(db, "users", user.uid, "settings", "notifications");


        // Garantir que o documento existe antes de dar update com arrayUnion
        const snap = await getDoc(settingsRef);
        if (snap.exists()) {
          await updateDoc(settingsRef, {
            tokens: arrayUnion(currentToken)
          });
        } else {
          await setDoc(settingsRef, {
            tokens: [currentToken],
            enabled: true
          });
        }
      } else {
        console.warn("Nenhum token disponível. Verifique as permissões.");
      }
    } catch (err) {
      console.error("Erro ao registrar token de push:", err);
    }
  };

  const requestPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        await registerPushToken();
        toast.success("Notificações em tempo real (Push) ativadas!");
      }
    }
  };

  return { requestPermission };
}

