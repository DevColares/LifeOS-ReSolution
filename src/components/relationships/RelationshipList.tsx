import { Relationship } from "@/lib/types";
import RelationshipCard from "./RelationshipCard";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RelationshipListProps {
    relationships: Relationship[];
    onEdit: (relationship: Relationship) => void;
    onDelete: (id: string) => void;
    onAdd: () => void;
}

export default function RelationshipList({ relationships, onEdit, onDelete, onAdd }: RelationshipListProps) {
    if (relationships.length === 0) {
        return (
            <div className="glass-card p-12 text-center flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-primary/5 rounded-3xl flex items-center justify-center mb-2">
                    <User className="h-10 w-10 text-primary/40" />
                </div>
                <div className="space-y-2 max-w-sm">
                    <h3 className="text-xl font-display font-bold">Nenhum relacionamento</h3>
                    <p className="text-muted-foreground">
                        Sua rede está vazia. Comece adicionando pessoas importantes para ver detalhes e lembrar preferências.
                    </p>
                </div>
                <Button onClick={onAdd} className="mt-4 px-8 rounded-2xl bg-primary shadow-lg shadow-primary/10">
                    Adicionar Primeiro
                </Button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {relationships.map((rel) => (
                <RelationshipCard
                    key={rel.id}
                    relationship={rel}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
}
