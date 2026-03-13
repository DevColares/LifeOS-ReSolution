import { useState } from "react";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Relationship } from "@/lib/types";
import RelationshipForm from "./relationships/RelationshipForm";
import RelationshipList from "./relationships/RelationshipList";

interface RelationshipsViewProps {
  relationships: Relationship[];
  setRelationships: React.Dispatch<React.SetStateAction<Relationship[]>>;
}

export default function RelationshipsView({ relationships, setRelationships }: RelationshipsViewProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const activeRelationship = editingId
    ? relationships.find(r => r.id === editingId)
    : null;

  const handleSubmit = (data: Relationship) => {
    if (editingId) {
      setRelationships(prev => prev.map(r => r.id === editingId ? data : r));
      setEditingId(null);
    } else {
      setRelationships(prev => [...prev, data]);
      setIsAdding(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este relacionamento?")) {
      setRelationships(prev => prev.filter(r => r.id !== id));
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-3xl font-display font-extrabold tracking-tight">Relacionamentos</h2>
          </div>
          <p className="text-muted-foreground text-lg ml-11">
            Gerencie sua rede de contatos e lembre-se do que importa.
          </p>
        </div>

        {!isAdding && !editingId && (
          <Button
            onClick={() => setIsAdding(true)}
            size="lg"
            className="rounded-2xl h-12 px-6 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all hover:scale-105"
          >
            <Plus className="h-5 w-5 mr-2" />
            Adicionar Pessoa
          </Button>
        )}
      </div>

      {(isAdding || editingId) ? (
        <RelationshipForm
          initialData={activeRelationship}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsAdding(false);
            setEditingId(null);
          }}
        />
      ) : (
        <RelationshipList
          relationships={relationships}
          onEdit={(rel) => setEditingId(rel.id)}
          onDelete={handleDelete}
          onAdd={() => setIsAdding(true)}
        />
      )}
    </div>
  );
}
