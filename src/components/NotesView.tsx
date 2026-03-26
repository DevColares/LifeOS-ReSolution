import React, { useState, useMemo, useRef, useEffect } from "react";
import { Note } from "@/lib/types";
import {
    NotebookPen, Plus, Search, Trash2, Pin, PinOff,
    Tag, X, Check, Palette, Clock, StickyNote
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NotesViewProps {
    notes: Note[];
    setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
}

const NOTE_COLORS = [
    { value: "default", label: "Padrão", bg: "bg-card", border: "border-white/10" },
    { value: "yellow",  label: "Amarelo", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
    { value: "blue",    label: "Azul",    bg: "bg-blue-500/10",   border: "border-blue-500/30" },
    { value: "green",   label: "Verde",   bg: "bg-emerald-500/10",border: "border-emerald-500/30" },
    { value: "pink",    label: "Rosa",    bg: "bg-pink-500/10",   border: "border-pink-500/30" },
    { value: "purple",  label: "Roxo",    bg: "bg-purple-500/10", border: "border-purple-500/30" },
    { value: "orange",  label: "Laranja", bg: "bg-orange-500/10", border: "border-orange-500/30" },
];

const getColorClasses = (color: string) => {
    return NOTE_COLORS.find(c => c.value === color) ?? NOTE_COLORS[0];
};

// ── Editor Modal ────────────────────────────────────────────────────────────
interface NoteEditorProps {
    note: Note | null; // null = new note
    onSave: (n: Note) => void;
    onClose: () => void;
}

function NoteEditor({ note, onSave, onClose }: NoteEditorProps) {
    const [title, setTitle]     = useState(note?.title   ?? "");
    const [content, setContent] = useState(note?.content ?? "");
    const [color, setColor]     = useState(note?.color   ?? "default");
    const [tagInput, setTagInput] = useState("");
    const [tags, setTags]       = useState<string[]>(note?.tags ?? []);
    const [showPalette, setShowPalette] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const colorObj = getColorClasses(color);

    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

    const addTag = () => {
        const t = tagInput.trim().toLowerCase();
        if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
        setTagInput("");
    };

    const removeTag = (t: string) => setTags(prev => prev.filter(x => x !== t));

    const handleSave = () => {
        if (!title.trim() && !content.trim()) { onClose(); return; }
        const now = new Date().toISOString();
        onSave({
            id:        note?.id        ?? crypto.randomUUID(),
            title:     title.trim()    || "Sem título",
            content:   content.trim(),
            color,
            tags,
            pinned:    note?.pinned    ?? false,
            createdAt: note?.createdAt ?? now,
            updatedAt: now,
        });
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSave();
        if (e.key === "Escape") onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Card */}
            <div
                onClick={e => e.stopPropagation()}
                onKeyDown={handleKeyDown}
                className={cn(
                    "relative w-full max-w-xl rounded-3xl border shadow-2xl flex flex-col",
                    "max-h-[90vh] overflow-hidden",
                    colorObj.bg, colorObj.border,
                    "bg-background/95 backdrop-blur-xl"
                )}
            >
                {/* Top bar */}
                <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-white/5">
                    <input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Título da anotação..."
                        className="flex-1 text-lg font-display font-black bg-transparent outline-none text-slate-950 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    />
                    <div className="flex items-center gap-2 ml-4">
                        {/* Palette */}
                        <div className="relative">
                            <button
                                onClick={() => setShowPalette(p => !p)}
                                className="p-2 rounded-xl hover:bg-white/10 text-slate-500 dark:text-muted-foreground transition-colors"
                                title="Cor"
                            >
                                <Palette className="h-4 w-4" />
                            </button>
                            {showPalette && (
                                <div className="absolute right-0 top-10 z-10 flex gap-2 p-3 rounded-2xl bg-background/95 backdrop-blur-xl border border-white/10 shadow-2xl">
                                    {NOTE_COLORS.map(c => (
                                        <button
                                            key={c.value}
                                            onClick={() => { setColor(c.value); setShowPalette(false); }}
                                            title={c.label}
                                            className={cn(
                                                "w-6 h-6 rounded-full border-2 transition-transform hover:scale-110",
                                                c.bg,
                                                color === c.value ? "border-primary scale-110" : "border-transparent"
                                            )}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                        <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-slate-500 dark:text-muted-foreground transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Escreva sua anotação aqui... (Ctrl+Enter para salvar)"
                    rows={10}
                    className="flex-1 resize-none px-6 py-4 bg-transparent outline-none text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 leading-relaxed overflow-y-auto"
                />

                {/* Tags */}
                <div className="px-6 pb-3 border-t border-white/5 pt-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <Tag className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        {tags.map(t => (
                            <span key={t} className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-[11px] font-bold">
                                {t}
                                <button onClick={() => removeTag(t)} className="hover:text-destructive transition-colors"><X className="h-2.5 w-2.5" /></button>
                            </span>
                        ))}
                        <input
                            value={tagInput}
                            onChange={e => setTagInput(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); }}}
                            placeholder="+ tag..."
                            className="text-[11px] font-bold bg-transparent outline-none text-slate-500 placeholder:text-slate-500 w-16"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {content.length} caracteres
                    </span>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-full font-black uppercase tracking-widest text-xs hover:scale-105 transition-all active:scale-95 shadow-lg"
                    >
                        <Check className="h-3.5 w-3.5" />
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Note Card ───────────────────────────────────────────────────────────────
interface NoteCardProps {
    note: Note;
    onEdit: (n: Note) => void;
    onDelete: (id: string) => void;
    onTogglePin: (id: string) => void;
}

function NoteCard({ note, onEdit, onDelete, onTogglePin }: NoteCardProps) {
    const colorObj = getColorClasses(note.color);
    const date = useMemo(() => {
        try { return format(parseISO(note.updatedAt), "d 'de' MMM, HH:mm", { locale: ptBR }); }
        catch { return ""; }
    }, [note.updatedAt]);

    return (
        <div
            className={cn(
                "group relative rounded-2xl border p-5 cursor-pointer transition-all duration-300",
                "hover:shadow-xl hover:scale-[1.015] hover:-translate-y-0.5",
                colorObj.bg, colorObj.border
            )}
            onClick={() => onEdit(note)}
        >
            {/* Pin badge */}
            {note.pinned && (
                <div className="absolute top-3 right-3 text-primary">
                    <Pin className="h-3.5 w-3.5 fill-primary" />
                </div>
            )}

            {/* Title */}
            <h3 className="font-display font-black text-sm text-slate-950 dark:text-white mb-2 pr-6 line-clamp-1">
                {note.title}
            </h3>

            {/* Content preview */}
            {note.content && (
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-4 mb-3">
                    {note.content}
                </p>
            )}

            {/* Tags */}
            {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                    {note.tags.slice(0, 3).map(t => (
                        <span key={t} className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold">
                            {t}
                        </span>
                    ))}
                    {note.tags.length > 3 && (
                        <span className="px-2 py-0.5 bg-secondary/50 text-muted-foreground rounded-full text-[10px] font-bold">
                            +{note.tags.length - 3}
                        </span>
                    )}
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Clock className="h-3 w-3" />
                    <span>{date}</span>
                </div>

                {/* Actions (show on hover) */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={e => { e.stopPropagation(); onTogglePin(note.id); }}
                        className="p-1.5 rounded-lg hover:bg-primary/10 text-slate-400 hover:text-primary transition-colors"
                        title={note.pinned ? "Desafixar" : "Fixar"}
                    >
                        {note.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                    </button>
                    <button
                        onClick={e => { e.stopPropagation(); onDelete(note.id); }}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-slate-400 hover:text-destructive transition-colors"
                        title="Excluir"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main View ───────────────────────────────────────────────────────────────
export default function NotesView({ notes, setNotes }: NotesViewProps) {
    const [search, setSearch]     = useState("");
    const [tagFilter, setTagFilter] = useState<string | null>(null);
    const [editingNote, setEditingNote] = useState<Note | null | "new">(null);

    const allTags = useMemo(() => {
        const set = new Set<string>();
        notes.forEach(n => n.tags.forEach(t => set.add(t)));
        return Array.from(set).sort();
    }, [notes]);

    const filtered = useMemo(() => {
        let list = [...notes];
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(n =>
                n.title.toLowerCase().includes(q) ||
                n.content.toLowerCase().includes(q) ||
                n.tags.some(t => t.includes(q))
            );
        }
        if (tagFilter) list = list.filter(n => n.tags.includes(tagFilter));
        // pinned first, then by updatedAt desc
        list.sort((a, b) => {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
            return b.updatedAt.localeCompare(a.updatedAt);
        });
        return list;
    }, [notes, search, tagFilter]);

    const pinned   = filtered.filter(n => n.pinned);
    const unpinned = filtered.filter(n => !n.pinned);

    const handleSave = (n: Note) => {
        setNotes(prev => {
            const exists = prev.find(x => x.id === n.id);
            return exists ? prev.map(x => x.id === n.id ? n : x) : [n, ...prev];
        });
    };

    const handleDelete = (id: string) => {
        if (confirm("Excluir esta anotação?")) {
            setNotes(prev => prev.filter(n => n.id !== id));
        }
    };

    const handleTogglePin = (id: string) => {
        setNotes(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
    };

    const openNew  = () => setEditingNote("new");
    const openEdit = (n: Note) => setEditingNote(n);
    const closeEditor = () => setEditingNote(null);

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <NotebookPen className="h-6 w-6 text-primary" />
                        </div>
                        <h2 className="text-3xl font-display font-black tracking-tight text-slate-950 dark:text-white">
                            Anotações
                        </h2>
                    </div>
                    <p className="text-slate-600 dark:text-muted-foreground text-lg ml-11">
                        Capture ideias, pensamentos e tudo que importa.
                    </p>
                </div>

                <button
                    onClick={openNew}
                    id="btn-nova-anotacao"
                    className="flex items-center gap-2 px-6 py-3 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-full font-black uppercase tracking-widest text-xs hover:scale-105 transition-all active:scale-95 shadow-lg shrink-0"
                >
                    <Plus className="h-4 w-4" />
                    Nova Anotação
                </button>
            </div>

            {/* Search + Tag Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar anotações..."
                        className="w-full pl-11 pr-4 py-3 bg-secondary/30 border border-slate-200 dark:border-white/5 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 text-slate-950 dark:text-white placeholder:text-slate-400 transition-all"
                    />
                    {search && (
                        <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {allTags.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                        <button
                            onClick={() => setTagFilter(null)}
                            className={cn(
                                "px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0",
                                tagFilter === null ? "bg-primary/10 text-primary" : "bg-secondary/30 text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Todas
                        </button>
                        {allTags.map(t => (
                            <button
                                key={t}
                                onClick={() => setTagFilter(prev => prev === t ? null : t)}
                                className={cn(
                                    "px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0",
                                    tagFilter === t ? "bg-primary/10 text-primary" : "bg-secondary/30 text-muted-foreground hover:text-foreground"
                                )}
                            >
                                #{t}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Stats bar */}
            {notes.length > 0 && (
                <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    <span>{notes.length} anotações</span>
                    {pinned.length > 0 && <><span>·</span><span className="text-primary">{pinned.length} fixadas</span></>}
                    {filtered.length !== notes.length && <><span>·</span><span>{filtered.length} exibidas</span></>}
                </div>
            )}

            {/* Empty State */}
            {notes.length === 0 && (
                <div className="glass-card p-16 text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="p-6 bg-primary/10 rounded-3xl">
                            <StickyNote className="h-12 w-12 text-primary/50" />
                        </div>
                    </div>
                    <div>
                        <p className="text-xl font-display font-black text-slate-950 dark:text-white">Nenhuma anotação ainda</p>
                        <p className="text-sm text-muted-foreground mt-1">Clique em "Nova Anotação" para começar.</p>
                    </div>
                    <button
                        onClick={openNew}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 text-primary rounded-full font-bold text-sm hover:bg-primary/20 transition-colors"
                    >
                        <Plus className="h-4 w-4" /> Criar primeira anotação
                    </button>
                </div>
            )}

            {/* No results */}
            {notes.length > 0 && filtered.length === 0 && (
                <div className="glass-card p-12 text-center text-muted-foreground italic">
                    Nenhuma anotação encontrada para esta busca.
                </div>
            )}

            {/* Pinned Section */}
            {pinned.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <Pin className="h-3 w-3 fill-current" />
                        <span>Fixadas</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pinned.map(n => (
                            <NoteCard key={n.id} note={n} onEdit={openEdit} onDelete={handleDelete} onTogglePin={handleTogglePin} />
                        ))}
                    </div>
                </div>
            )}

            {/* All Notes */}
            {unpinned.length > 0 && (
                <div className="space-y-3">
                    {pinned.length > 0 && (
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Outras</div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {unpinned.map(n => (
                            <NoteCard key={n.id} note={n} onEdit={openEdit} onDelete={handleDelete} onTogglePin={handleTogglePin} />
                        ))}
                    </div>
                </div>
            )}

            {/* Editor Modal */}
            {editingNote !== null && (
                <NoteEditor
                    note={editingNote === "new" ? null : editingNote}
                    onSave={handleSave}
                    onClose={closeEditor}
                />
            )}
        </div>
    );
}
