import { useEffect, useRef } from "react";
import { toast } from "sonner";

export function useNotifications(config: any | null) {
  const notifiedTimes = useRef<{ [key: string]: string }>({});

  useEffect(() => {
    if (!config || !config.enabled || !config.times || config.times.length === 0) return;

    const checkTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const currentTime = `${hours}:${minutes}`;
      const currentDate = now.toDateString(); 

      if (config.times.includes(currentTime)) {
        const lastNotifiedDate = notifiedTimes.current[currentTime];
        
        if (lastNotifiedDate !== currentDate) {
          notifiedTimes.current[currentTime] = currentDate;
          
          const message = config.message || "Hora de focar nos seus objetivos e hábitos!";
          
          // In-app Notification fallback
          toast("Lembrete LifeOS", {
            description: message,
          });

          // OS Notification
          if ("Notification" in window && Notification.permission === "granted") {
            try {
              console.log("Tentando notificação nativa direta...");
              new Notification("LifeOS", {
                body: message
              });
            } catch (e) {
              console.log("Navegador rejeitou construtor direto (Mobile). Tentando via ServiceWorker...");
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js').then((registration) => {
                  return registration.showNotification("LifeOS", {
                    body: message,
                    vibrate: [200, 100, 200, 100, 200], 
                    requireInteraction: true
                  } as any);
                }).catch(err => console.error("Falha no SW ready:", err));
              }
            }
          } else {
              console.warn("Notificações da Web bloqueadas ou não suportadas: ", Notification.permission);
          }
        }
      }
    };

    const intervalId = setInterval(checkTime, 10000); // Check every 10 seconds
    checkTime(); 

    return () => clearInterval(intervalId);
  }, [config]);
}
