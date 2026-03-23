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

          // OS Notification (Requires try/catch due to mobile browsers throwing Illegal Constructor)
          if ("Notification" in window && Notification.permission === "granted") {
            try {
              new Notification("LifeOS", {
                body: message,
                icon: "/favicon.ico", 
              });
            } catch (e) {
              console.warn("Navegador requer Service Worker para notificações nativas.", e);
            }
          }
        }
      }
    };

    const intervalId = setInterval(checkTime, 10000); // Check every 10 seconds
    checkTime(); 

    return () => clearInterval(intervalId);
  }, [config]);
}
