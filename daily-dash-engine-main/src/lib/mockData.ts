import { Habit, Goal, Relationship } from "@/lib/types";

const today = new Date().toISOString().split("T")[0];
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};

export const mockHabits: Habit[] = [
  { id: "1", name: "Morning Meditation", category: "Health", streak: 5, lastCompleted: daysAgo(1) },
  { id: "2", name: "Read 30 Minutes", category: "Learning", streak: 12, lastCompleted: daysAgo(1) },
];

export const mockGoals: Goal[] = [
  {
    id: "1",
    name: "Launch Side Project",
    subtasks: [
      { id: "s1", text: "Design wireframes", done: true },
      { id: "s2", text: "Build MVP", done: false },
      { id: "s3", text: "Deploy to production", done: false },
    ],
  },
  {
    id: "2",
    name: "Get Fit",
    subtasks: [
      { id: "s4", text: "Join a gym", done: true },
      { id: "s5", text: "Complete 30 workouts", done: false },
    ],
  },
];

export const mockRelationships: Relationship[] = [
  {
    id: "rel-1",
    name: "Ana Silva",
    age: 28,
    birthday: "1995-03-15",
    photo: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    favoriteMusic: "Indie Rock, Jazz",
    favoriteFood: "Sushi, Pizza",
    favoriteColor: "#ff6b6b",
    additionalInfo: "Ama viajar, fotografia e cozinhar. Trabalha como designer gráfica.",
    habits: ["Ler antes de dormir", "Praticar yoga", "Caminhar no parque"],
    personalityTraits: ["Criativa", "Extrovertida", "Organizada"],
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "rel-2",
    name: "Carlos Santos",
    age: 32,
    birthday: "1991-08-22",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    favoriteMusic: "MPB, Clássica",
    favoriteFood: "Feijoada, Churrasco",
    favoriteColor: "#4ecdc4",
    additionalInfo: "Engenheiro de software, apaixonado por tecnologia e games.",
    habits: ["Jogar videogame", "Estudar programação", "Malhar"],
    personalityTraits: ["Racional", "Metódico", "Leal"],
    createdAt: "2024-01-10T14:30:00Z",
    updatedAt: "2024-01-10T14:30:00Z",
  },
  {
    id: "rel-3",
    name: "Mariana Lima",
    age: 25,
    birthday: "1998-12-05",
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    favoriteMusic: "Pop internacional",
    favoriteFood: "Pasta, Salada",
    favoriteColor: "#9b59b6",
    additionalInfo: "Estudante de medicina, ama animais e natureza.",
    habits: ["Estudar", "Cuidar de plantas", "Passear com o cachorro"],
    personalityTraits: ["Empática", "Dedicada", "Calma"],
    createdAt: "2024-01-20T09:15:00Z",
    updatedAt: "2024-01-20T09:15:00Z",
  },
];
