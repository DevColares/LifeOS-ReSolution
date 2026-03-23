import { useEffect, useRef } from "react";

export function useNotifications(config: any | null) {
  const notifiedTimes = useRef<{ [key: string]: string }>({}); // { time: 'YYYY-MM-DD' }

  useEffect(() => {
    if (!config || !config.enabled || !config.times || config.times.length === 0) return;

    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    const checkTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const currentTime = `${hours}:${minutes}`;
      const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD

      if (config.times.includes(currentTime)) {
        const lastNotifiedDate = notifiedTimes.current[currentTime];
        
        if (lastNotifiedDate !== currentDate) {
          // Time to notify and hasn't notified today!
          new Notification("LifeOS", {
            body: config.message || "Hora de focar nos seus objetivos e hábitos!",
            icon: "/favicon.ico", 
          });
          
          notifiedTimes.current[currentTime] = currentDate;
        }
      }
    };

    const intervalId = setInterval(checkTime, 30000); // Check every 30 seconds
    checkTime(); // Initial check

    return () => clearInterval(intervalId);
  }, [config]);
}
