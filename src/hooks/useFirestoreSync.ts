import { useState, useEffect } from "react";
import { 
  collection, 
  onSnapshot, 
  setDoc, 
  deleteDoc,
  doc,
  writeBatch,
  query,
  getDocs,
  orderBy
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

export function useFirestoreSync<T extends { id?: string }>(
  collectionPath: string, 
  fallback: T[]
): [T[], (value: T[] | ((prev: T[]) => T[])) => void, boolean] {
  const { user } = useAuth();
  const [data, setData] = useState<T[]>(fallback);
  const [loading, setLoading] = useState(true);

  // Load and Listen to Collection
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const itemsColl = collection(db, "users", user.uid, collectionPath);
    
    // We don't use orderBy because id-based sync is simpler for now
    const unsubscribe = onSnapshot(itemsColl, (querySnap) => {
      const items: T[] = [];
      querySnap.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as T);
      });
      
      // Attempt to sort if possible (e.g. by date or id)
      setData(items.length > 0 ? items : fallback);
      setLoading(false);
    }, (error: any) => {
      console.error(`Error loading collection ${collectionPath}:`, error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, collectionPath]);

  // Sync changes (Adds, Updates, and DELETIONS)
  const syncChanges = async (newItems: T[]) => {
    if (!user) return;
    
    try {
      const batch = writeBatch(db);
      const itemsColl = collection(db, "users", user.uid, collectionPath);
      
      // 1. Detect and handle deletions
      const newItemIds = new Set(newItems.map(i => i.id).filter(Boolean));
      data.forEach(oldItem => {
        if (oldItem.id && !newItemIds.has(oldItem.id)) {
          const dRef = doc(itemsColl, oldItem.id);
          batch.delete(dRef);
        }
      });

      // 2. Handle Adds and Updates
      for (const item of newItems) {
        if (!item.id) continue;
        const dRef = doc(itemsColl, item.id);
        const cleanItem = JSON.parse(JSON.stringify(item));
        batch.set(dRef, cleanItem, { merge: true });
      }
      
      await batch.commit();
    } catch (e: any) {
      console.error(`Sync error on ${collectionPath}:`, e);
    }
  };

  const updateData = (value: T[] | ((prev: T[]) => T[])) => {
    const nextValue = value instanceof Function ? value(data) : value;
    const previousValue = [...data]; // Guardamos o estado anterior para comparar
    setData(nextValue); // Optimistic UI
    syncChanges(nextValue);
  };

  return [data, updateData, loading];
}

// Special hook for single documents (like profile)
export function useFirestoreDocSync<T>(docName: string, fallback: T): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
    const { user } = useAuth();
    const [data, setData] = useState<T>(fallback);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const dRef = doc(db, "users", user.uid, "settings", docName);
        const unsubscribe = onSnapshot(dRef, (snap) => {
            if (snap.exists()) {
                setData(snap.data() as T);
            } else {
                setData(fallback);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, docName]);

    const updateData: React.Dispatch<React.SetStateAction<T>> = async (v) => {
        if (!user) return;
        const nv = v instanceof Function ? v(data) : v;
        setData(nv);
        try {
            const dRef = doc(db, "users", user.uid, "settings", docName);
            await setDoc(dRef, JSON.parse(JSON.stringify(nv)), { merge: true });
        } catch (e: any) {
            console.error(`Error saving ${docName}:`, e);
        }
    };

    return [data, updateData, loading];
}
