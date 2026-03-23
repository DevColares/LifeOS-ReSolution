# 📘 Guia de Implementação Firebase PRO (Auth + Firestore)

Este guia cobre a configuração inicial, o sistema de autenticação com verificação de e-mail e a sincronização inteligente com o banco de dados via subcoleções.

---

### 1. Dependências Necessárias
Certifique-se de instalar o SDK do Firebase no seu novo projeto:
```bash
npm install firebase
```

### 2. Configuração Inicial (`src/lib/firebase.ts`)
Conecta o seu app ao projeto Firebase.
```typescript
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.firebasestorage.app",
  messagingSenderId: "SEU_ID",
  appId: "SEU_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### 3. Provedor de Autenticação (`src/contexts/AuthContext.tsx`)
Gerencia o estado do usuário, cadastro, login e verificação de e-mail.
```typescript
import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  User, onAuthStateChanged, signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, signOut, sendEmailVerification 
} from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (e: string, p: string) => Promise<void>;
  signUp: (e: string, p: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const signIn = (e: string, p: string) => signInWithEmailAndPassword(auth, e, p).then(() => {});
  const signUp = async (e: string, p: string) => {
    const res = await createUserWithEmailAndPassword(auth, e, p);
    await sendEmailVerification(res.user);
  };
  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext)!;
```

### 4. Motor de Sincronização (`src/hooks/useFirestoreSync.ts`)
Sincroniza listas (Coleções) e objetos únicos (Configurações) de forma inteligente com detecção de exclusão.
```typescript
import { useState, useEffect } from "react";
import { collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

// Para Listas (ex: Finanças, Tarefas)
export function useFirestoreSync<T extends { id?: string }>(path: string, fallback: T[]) {
  const { user } = useAuth();
  const [data, setData] = useState<T[]>(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const coll = collection(db, "users", user.uid, path);
    return onSnapshot(coll, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as T));
      setData(items.length > 0 ? items : fallback);
      setLoading(false);
    });
  }, [user, path]);

  const updateData = async (value: T[] | ((p: T[]) => T[])) => {
    if (!user) return;
    const nextArr = value instanceof Function ? value(data) : value;
    const batch = writeBatch(db);
    const coll = collection(db, "users", user.uid, path);

    // Detectar Exclusões
    const nextIds = new Set(nextArr.map(i => i.id));
    data.forEach(old => {
      if (old.id && !nextIds.has(old.id)) batch.delete(doc(coll, old.id));
    });

    // Atualizar/Adicionar
    nextArr.forEach(item => {
      if (item.id) batch.set(doc(coll, item.id), JSON.parse(JSON.stringify(item)), { merge: true });
    });
    
    setData(nextArr);
    await batch.commit();
  };

  return [data, updateData, loading] as const;
}

// Para Objetos Únicos (ex: Perfil, Preferências)
export function useFirestoreDocSync<T>(docName: string, fallback: T) {
  const { user } = useAuth();
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const dRef = doc(db, "users", user.uid, "settings", docName);
    return onSnapshot(dRef, (snap) => {
      if (snap.exists()) setData(snap.data() as T);
      setLoading(false);
    });
  }, [user, docName]);

  const updateData = async (v: any) => {
    if (!user) return;
    const nv = v instanceof Function ? v(data) : v;
    setData(nv);
    await setDoc(doc(db, "users", user.uid, "settings", docName), JSON.parse(JSON.stringify(nv)), { merge: true });
  };

  return [data, updateData, loading] as const;
}
```

### 5. Regras de Segurança (Firestore Rules)
Copie e cole na aba "Rules" do console do Firebase.
```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permite que cada usuário acesse apenas sua própria "gaveta" de dados
    match /users/{userId}/{collection}/{document} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/settings/{document} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

### 🚀 Exemplo de Uso (no App Principal):

```tsx
const [finance, setFinance] = useFirestoreSync("finance", []);
const [profile, setProfile] = useFirestoreDocSync("profile", { name: "" });

// Ao excluir um item localmente:
const deleteItem = (id) => {
  setFinance(prev => prev.filter(i => i.id !== id)); // O hook cuida da exclusão no banco!
};
```
