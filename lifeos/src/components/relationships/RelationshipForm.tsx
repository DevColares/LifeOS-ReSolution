import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Relationship } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, X, Camera, Upload } from "lucide-react";
import { useState, useRef } from "react";

const relationshipSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    age: z.coerce.number().min(0, "Idade inválida"),
    birthday: z.string().min(1, "Data é obrigatória"),
    photo: z.string().optional(),
    favoriteMusic: z.string().optional(),
    favoriteFood: z.string().optional(),
    favoriteColor: z.string().optional(),
    additionalInfo: z.string().optional(),
    habits: z.string().optional(),
    personalityTraits: z.string().optional(),
});

type RelationshipFormValues = z.infer<typeof relationshipSchema>;

interface RelationshipFormProps {
    initialData?: Relationship | null;
    onSubmit: (data: Relationship) => void;
    onCancel: () => void;
}

export default function RelationshipForm({ initialData, onSubmit, onCancel }: RelationshipFormProps) {
    const [photoBase64, setPhotoBase64] = useState<string>(initialData?.photo || "");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RelationshipFormValues>({
        resolver: zodResolver(relationshipSchema),
        defaultValues: initialData ? {
            ...initialData,
            habits: initialData.habits.join(", "),
            personalityTraits: initialData.personalityTraits.join(", "),
        } : {
            favoriteColor: "#2563eb"
        },
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoBase64(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFormSubmit = (values: RelationshipFormValues) => {
        const formattedData: Relationship = {
            id: initialData?.id || crypto.randomUUID(),
            name: values.name,
            age: values.age,
            birthday: values.birthday,
            photo: photoBase64,
            favoriteMusic: values.favoriteMusic || "",
            favoriteFood: values.favoriteFood || "",
            favoriteColor: values.favoriteColor || "",
            additionalInfo: values.additionalInfo || "",
            habits: values.habits ? values.habits.split(",").map(s => s.trim()).filter(Boolean) : [],
            personalityTraits: values.personalityTraits ? values.personalityTraits.split(",").map(s => s.trim()).filter(Boolean) : [],
            createdAt: initialData?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        onSubmit(formattedData);
    };

    return (
        <Card className="glass-card mb-8 border-primary/20 bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-xl font-display font-bold flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    {initialData ? "Editar Relacionamento" : "Novo Relacionamento"}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-full">
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                    <div className="flex flex-col items-center gap-4 mb-6">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="relative w-24 h-24 rounded-3xl bg-secondary/50 border-2 border-dashed border-primary/30 flex items-center justify-center overflow-hidden cursor-pointer group hover:border-primary transition-all"
                        >
                            {photoBase64 ? (
                                <img src={photoBase64} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <Camera className="h-8 w-8 text-primary/40 group-hover:text-primary transition-all" />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                <Upload className="h-5 w-5 text-white" />
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Foto de Perfil</Label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium">Nome Completo</Label>
                            <Input
                                id="name"
                                {...register("name")}
                                placeholder="Ex: Maria Silva"
                                className="bg-background/50 border-border/50 focus:border-primary"
                            />
                            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="age" className="text-sm font-medium">Idade</Label>
                            <Input
                                id="age"
                                type="number"
                                {...register("age")}
                                placeholder="Ex: 25"
                                className="bg-background/50 border-border/50"
                            />
                            {errors.age && <p className="text-xs text-destructive">{errors.age.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="birthday">Data de Aniversário</Label>
                            <Input
                                id="birthday"
                                type="date"
                                {...register("birthday")}
                                className="bg-background/50 border-border/50"
                            />
                            {errors.birthday && <p className="text-xs text-destructive">{errors.birthday.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="favoriteMusic">Música Favorita</Label>
                            <Input id="favoriteMusic" {...register("favoriteMusic")} placeholder="Gênero ou artista" className="bg-background/50 border-border/50" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="favoriteFood">Comida Favorita</Label>
                            <Input id="favoriteFood" {...register("favoriteFood")} placeholder="Prato preferido" className="bg-background/50 border-border/50" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="favoriteColor">Cor Favorita</Label>
                            <div className="flex gap-2">
                                <Input id="favoriteColor" type="color" {...register("favoriteColor")} className="w-12 h-10 p-1 bg-background/50 border-border/50 cursor-pointer" />
                                <Input value={register("favoriteColor").name} disabled className="flex-1 bg-background/50 border-border/50" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="habits">Hábitos (separados por vírgula)</Label>
                            <Textarea
                                id="habits"
                                {...register("habits")}
                                placeholder="Ler, caminhar, meditar..."
                                className="bg-background/50 border-border/50 resize-none h-24"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="personalityTraits">Traços de Personalidade</Label>
                            <Textarea
                                id="personalityTraits"
                                {...register("personalityTraits")}
                                placeholder="Extrovertido, focado, gentil..."
                                className="bg-background/50 border-border/50 resize-none h-24"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="additionalInfo">Notas Adicionais</Label>
                        <Textarea
                            id="additionalInfo"
                            {...register("additionalInfo")}
                            placeholder="Mais detalhes importantes..."
                            className="bg-background/50 border-border/50 min-h-[100px]"
                        />
                    </div>

                    <div className="modal-footer pt-4 border-t border-border/50">
                        <Button type="submit" className="h-11 px-8 rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-bold">
                            {initialData ? "Salvar Alterações" : "Salvar Perfil"}
                        </Button>
                        <Button type="button" variant="outline" onClick={onCancel} className="h-11 rounded-2xl px-8 border-border/50 font-bold">
                            Cancelar
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
