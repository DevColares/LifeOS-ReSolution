import { useState } from "react";
import { 
  Plus, 
  Edit, 
  Trash2, 
  User, 
  Calendar, 
  Music, 
  Utensils, 
  Palette, 
  Heart, 
  Users, 
  Plus as PlusIcon 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Relationship } from "@/lib/types";

interface RelationshipsViewProps {
  relationships: Relationship[];
  setRelationships: React.Dispatch<React.SetStateAction<Relationship[]>>;
}

export default function RelationshipsView({ relationships, setRelationships }: RelationshipsViewProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [birthday, setBirthday] = useState("");
  const [photo, setPhoto] = useState("");
  const [favoriteMusic, setFavoriteMusic] = useState("");
  const [favoriteFood, setFavoriteFood] = useState("");
  const [favoriteColor, setFavoriteColor] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [habits, setHabits] = useState("");
  const [personalityTraits, setPersonalityTraits] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newRelationship: Relationship = {
      id: editingId || crypto.randomUUID(),
      name: name.trim(),
      age: parseInt(age),
      birthday,
      photo: photo.trim(),
      favoriteMusic: favoriteMusic.trim(),
      favoriteFood: favoriteFood.trim(),
      favoriteColor: favoriteColor.trim(),
      additionalInfo: additionalInfo.trim(),
      habits: habits.split(',').map(h => h.trim()).filter(h => h),
      personalityTraits: personalityTraits.split(',').map(p => p.trim()).filter(p => p),
      createdAt: editingId ? relationships.find(r => r.id === editingId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (editingId) {
      setRelationships(prev => prev.map(r => r.id === editingId ? newRelationship : r));
      setEditingId(null);
    } else {
      setRelationships(prev => [...prev, newRelationship]);
    }

    // Reset form
    resetForm();
  };

  const resetForm = () => {
    setName("");
    setAge("");
    setBirthday("");
    setPhoto("");
    setFavoriteMusic("");
    setFavoriteFood("");
    setFavoriteColor("");
    setAdditionalInfo("");
    setHabits("");
    setPersonalityTraits("");
    setIsAdding(false);
  };

  const handleEdit = (relationship: Relationship) => {
    setEditingId(relationship.id);
    setName(relationship.name);
    setAge(relationship.age.toString());
    setBirthday(relationship.birthday);
    setPhoto(relationship.photo || "");
    setFavoriteMusic(relationship.favoriteMusic || "");
    setFavoriteFood(relationship.favoriteFood || "");
    setFavoriteColor(relationship.favoriteColor || "");
    setAdditionalInfo(relationship.additionalInfo || "");
    setHabits(relationship.habits.join(', '));
    setPersonalityTraits(relationship.personalityTraits.join(', '));
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este relacionamento?")) {
      setRelationships(prev => prev.filter(r => r.id !== id));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">Relacionamentos</h2>
          <p className="text-muted-foreground text-sm">Gerencie suas relações e informações pessoais.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => {
              if (editingId) {
                setEditingId(null);
                resetForm();
              } else {
                setIsAdding(!isAdding);
              }
            }}
            className="bg-primary hover:bg-primary/90"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            {editingId ? "Cancelar Edição" : isAdding ? "Cancelar" : "Novo Relacionamento"}
          </Button>
        </div>
      </div>

      {/* Formulário de Cadastro/Edição */}
      {(isAdding || editingId) && (
        <Card className="glass-card rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <User className="h-5 w-5 text-primary" />
              {editingId ? "Editar Relacionamento" : "Novo Relacionamento"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Digite o nome da pessoa"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Idade</Label>
                  <Input
                    id="age"
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Digite a idade"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthday">Data de Aniversário</Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="photo">URL da Foto</Label>
                  <Input
                    id="photo"
                    value={photo}
                    onChange={(e) => setPhoto(e.target.value)}
                    placeholder="URL da foto (opcional)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="favoriteMusic">Música Favorita</Label>
                  <Input
                    id="favoriteMusic"
                    value={favoriteMusic}
                    onChange={(e) => setFavoriteMusic(e.target.value)}
                    placeholder="Ex: Indie Rock, Jazz"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="favoriteFood">Comida Favorita</Label>
                  <Input
                    id="favoriteFood"
                    value={favoriteFood}
                    onChange={(e) => setFavoriteFood(e.target.value)}
                    placeholder="Ex: Sushi, Pizza"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="favoriteColor">Cor Favorita</Label>
                  <Input
                    id="favoriteColor"
                    type="color"
                    value={favoriteColor}
                    onChange={(e) => setFavoriteColor(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="habits">Hábitos</Label>
                <Textarea
                  id="habits"
                  value={habits}
                  onChange={(e) => setHabits(e.target.value)}
                  placeholder="Ex: Ler antes de dormir, praticar yoga, caminhar no parque (separados por vírgula)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="personalityTraits">Traços de Personalidade</Label>
                <Textarea
                  id="personalityTraits"
                  value={personalityTraits}
                  onChange={(e) => setPersonalityTraits(e.target.value)}
                  placeholder="Ex: Criativa, extrovertida, organizada (separados por vírgula)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalInfo">Informações Adicionais</Label>
                <Textarea
                  id="additionalInfo"
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder="Informações adicionais sobre a pessoa"
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  {editingId ? "Atualizar" : "Salvar"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={resetForm}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Relacionamentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {relationships.map((relationship) => (
          <Card key={relationship.id} className="glass-card rounded-2xl hover:border-primary/30 transition-colors">
            <CardHeader className="space-y-4">
              {/* Foto e Nome */}
              <div className="flex items-center gap-4">
                {relationship.photo ? (
                  <img
                    src={relationship.photo}
                    alt={relationship.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-border shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shadow-sm">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                )}
                <div>
                  <CardTitle className="text-xl font-bold">{relationship.name}</CardTitle>
                  <p className="text-sm text-muted-foreground font-medium">{relationship.age} anos</p>
                  <p className="text-xs text-muted-foreground">{formatDate(relationship.birthday)}</p>
                </div>
              </div>

              {/* Informações Principais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {relationship.favoriteColor && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 rounded-lg p-2">
                    <Palette className="h-4 w-4" />
                    <span>Cor favorita</span>
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-border"
                      style={{ backgroundColor: relationship.favoriteColor }}
                    />
                  </div>
                )}
                {relationship.favoriteMusic && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 rounded-lg p-2">
                    <Music className="h-4 w-4 text-primary" />
                    <span>{relationship.favoriteMusic}</span>
                  </div>
                )}
                {relationship.favoriteFood && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 rounded-lg p-2">
                    <Utensils className="h-4 w-4 text-success" />
                    <span>{relationship.favoriteFood}</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Hábitos */}
              {relationship.habits.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Heart className="h-4 w-4 text-streak" />
                    <span>Hábitos</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {relationship.habits.map((habit, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-secondary rounded-full text-xs text-muted-foreground"
                      >
                        {habit}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Personalidade */}
              {relationship.personalityTraits.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Users className="h-4 w-4 text-primary" />
                    <span>Personalidade</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {relationship.personalityTraits.map((trait, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-secondary rounded-full text-xs text-muted-foreground"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Informações Adicionais */}
              {relationship.additionalInfo && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{relationship.additionalInfo}</p>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="flex gap-2 pt-2 border-t border-border/50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(relationship)}
                  className="flex-1 text-sm"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(relationship.id)}
                  className="flex-1 text-sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {relationships.length === 0 && !isAdding && (
        <div className="glass-card p-8 text-center rounded-2xl">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">Nenhum relacionamento cadastrado</h3>
          <p className="text-muted-foreground mb-4">
            Comece adicionando as pessoas importantes da sua vida para manter contato e lembrar detalhes importantes sobre elas.
          </p>
          <Button onClick={() => setIsAdding(true)} className="bg-primary hover:bg-primary/90">
            <PlusIcon className="h-4 w-4 mr-2" />
            Adicionar Primeiro Relacionamento
          </Button>
        </div>
      )}
    </div>
  );
}