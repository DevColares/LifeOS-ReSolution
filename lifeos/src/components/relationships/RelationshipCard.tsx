import { Relationship } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Palette, Music, Utensils, Heart, Users, Edit, Trash2, Flame } from "lucide-react";

interface RelationshipCardProps {
    relationship: Relationship;
    onEdit: (relationship: Relationship) => void;
    onDelete: (id: string) => void;
}

export default function RelationshipCard({ relationship, onEdit, onDelete }: RelationshipCardProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <Card className="glass-card overflow-hidden">
            <CardHeader className="space-y-4 pb-4">
                <div className="flex items-center gap-4">
                    {relationship.photo ? (
                        <img
                            src={relationship.photo}
                            alt={relationship.name}
                            className="w-16 h-16 rounded-2xl object-cover border-2 border-border/50 shadow-sm"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner">
                            <User className="h-8 w-8 text-primary" />
                        </div>
                    )}
                    <div className="min-w-0">
                        <CardTitle className="text-xl font-display font-bold break-words">{relationship.name}</CardTitle>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-xs font-medium px-2 py-0.5 bg-secondary rounded-full text-secondary-foreground whitespace-nowrap">
                                {relationship.age} anos
                            </span>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDate(relationship.birthday)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                    {relationship.favoriteColor && (
                        <div className="flex items-center justify-between text-sm bg-secondary/30 rounded-xl p-2 px-3">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Palette className="h-4 w-4" />
                                <span>Cor favorita</span>
                            </div>
                            <div
                                className="w-5 h-5 rounded-full border border-border/50"
                                style={{ backgroundColor: relationship.favoriteColor }}
                            />
                        </div>
                    )}

                    <div className="flex gap-2">
                        {relationship.favoriteMusic && (
                            <div className="flex-1 flex items-center gap-2 text-sm bg-secondary/30 rounded-xl p-2 px-3">
                                <Music className="h-4 w-4 text-primary" />
                                <span className="truncate">{relationship.favoriteMusic}</span>
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-0">
                {/* Características Pessoal Section */}
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-primary text-primary-foreground rounded-lg">
                            <User className="h-3.5 w-3.5" />
                        </div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-primary">Características Pessoal</h4>
                    </div>

                    <div className="space-y-3">
                        {relationship.personalityTraits.length > 0 && (
                            <div className="space-y-1.5">
                                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Personalidade</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {relationship.personalityTraits.map((trait, index) => (
                                        <span
                                            key={index}
                                            className="px-2 py-0.5 bg-background border border-border/50 rounded-lg text-xs font-medium"
                                        >
                                            {trait}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {relationship.favoriteFood && (
                            <div className="space-y-1.5">
                                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Comida Favorita</span>
                                <div className="p-2 bg-background border border-border/50 rounded-xl text-xs font-medium flex items-center gap-2">
                                    <Utensils className="h-3 w-3 text-success" />
                                    {relationship.favoriteFood}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {relationship.habits.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            <Flame className="h-3 w-3 text-streak" />
                            <span>Hábitos em Comum</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {relationship.habits.map((habit, index) => (
                                <span
                                    key={index}
                                    className="px-2.5 py-1 bg-secondary/50 rounded-lg text-xs font-medium"
                                >
                                    {habit}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {relationship.additionalInfo && (
                    <div className="p-3 bg-secondary/20 rounded-xl border-l-2 border-primary/30">
                        <p className="text-xs text-muted-foreground italic leading-relaxed">
                            "{relationship.additionalInfo}"
                        </p>
                    </div>
                )}

                <div className="flex gap-2 pt-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(relationship)}
                        className="flex-1 rounded-xl h-9 hover:bg-primary/10 hover:text-primary font-bold"
                    >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(relationship.id)}
                        className="flex-1 rounded-xl h-9 hover:bg-destructive/10 hover:text-destructive font-bold"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
