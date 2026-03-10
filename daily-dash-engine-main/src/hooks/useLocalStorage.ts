import { useState, useEffect } from "react";

export function useLocalStorage<T>(key: string, fallback: T, mockData: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
      // First load — use mock data
      return mockData;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
