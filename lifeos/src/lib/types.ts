export interface Habit {
  id: string;
  name: string;
  category: string;
  streak: number;
  lastCompleted: string | null; // ISO date string
  goalId?: string;
}

export interface Subtask {
  id: string;
  text: string;
  done: boolean;
}

export interface Goal {
  id: string;
  name: string;
  subtasks: Subtask[];
}

export interface Relationship {
  id: string;
  name: string;
  age: number;
  birthday: string;
  photo?: string;
  favoriteMusic?: string;
  favoriteFood?: string;
  favoriteColor?: string;
  additionalInfo?: string;
  habits: string[];
  personalityTraits: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  description: string;
  value: number;
  date: string;
  category: string;
  isCompleted: boolean;
  type: 'income' | 'expense';
}
