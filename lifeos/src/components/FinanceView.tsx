import { useState } from "react";
import { Transaction } from "@/lib/types";
import { Wallet, TrendingUp, TrendingDown, Plus, Trash2, Calendar, Tag, DollarSign, Check, X } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { cn } from "@/lib/utils";

interface FinanceViewProps {
    transactions: Transaction[];
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

const categories = {
    income: ["Salário", "Investimento", "Venda", "Presente", "Outros"],
    expense: ["Alimentação", "Transporte", "Moradia", "Lazer", "Saúde", "Educação", "Outros"]
};

export default function FinanceView({ transactions, setTransactions }: FinanceViewProps) {
    const [description, setDescription] = useState("");
    const [value, setValue] = useState("");
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [category, setCategory] = useState(categories.expense[0]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

    const addTransaction = () => {
        if (!description || !value) return;

        const newTransaction: Transaction = {
            id: crypto.randomUUID(),
            description,
            value: parseFloat(value),
            type,
            category,
            date,
            isCompleted: false
        };

        setTransactions(prev => [newTransaction, ...prev]);
        setDescription("");
        setValue("");
    };

    const deleteTransaction = (id: string) => {
        if (confirm("Deseja excluir este lançamento?")) {
            setTransactions(prev => prev.filter(t => t.id !== id));
        }
    };

    const toggleComplete = (id: string) => {
        setTransactions(prev => prev.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t));
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    // Only sum completed transactions for the top cards
    const totalIncome = transactions
        .filter(t => t.type === 'income' && t.isCompleted)
        .reduce((acc, t) => acc + t.value, 0);

    const totalExpense = transactions
        .filter(t => t.type === 'expense' && t.isCompleted)
        .reduce((acc, t) => acc + t.value, 0);

    const balance = totalIncome - totalExpense;

    const filteredTransactions = transactions.filter(t => {
        if (filter === 'all') return true;
        return t.type === filter;
    });

    return (
        <div className="space-y-10 pb-20 animate-in fade-in duration-700">
            <div className="space-y-1">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl">
                        <Wallet className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-3xl font-display font-black tracking-tight">Finanças</h2>
                </div>
                <p className="text-muted-foreground text-lg ml-11">Gerencie seu dinheiro com inteligência e clareza.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="glass-card p-6 flex items-center gap-5">
                    <div className="p-4 rounded-2xl bg-primary/10 text-primary">
                        <Wallet className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Saldo Atual</p>
                        <p className={cn("text-2xl font-display font-black leading-none mt-1", balance >= 0 ? "text-foreground" : "text-destructive")}>
                            {formatCurrency(balance)}
                        </p>
                    </div>
                </div>

                <div className="glass-card p-6 flex items-center gap-5">
                    <div className="p-4 rounded-2xl bg-success/10 text-success">
                        <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Entradas</p>
                        <p className="text-2xl font-display font-black text-success leading-none mt-1">
                            {formatCurrency(totalIncome)}
                        </p>
                    </div>
                </div>

                <div className="glass-card p-6 flex items-center gap-5">
                    <div className="p-4 rounded-2xl bg-destructive/10 text-destructive">
                        <TrendingDown className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Saídas</p>
                        <p className="text-2xl font-display font-black text-destructive leading-none mt-1">
                            {formatCurrency(totalExpense)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="glass-card p-8 rounded-[2rem]">
                <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
                    <Plus className="h-5 w-5 text-primary" />
                    Novo Lançamento
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Descrição</label>
                        <input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ex: Mercado mensal"
                            className="w-full bg-secondary/50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Valor (R$)</label>
                        <input
                            type="number"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder="0,00"
                            className="w-full bg-secondary/50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Categoria</label>
                        <div className="flex gap-2">
                            <select
                                value={type}
                                onChange={(e) => {
                                    const newType = e.target.value as 'income' | 'expense';
                                    setType(newType);
                                    setCategory(categories[newType][0]);
                                }}
                                className="bg-secondary/50 px-3 py-3 rounded-xl text-xs font-bold border-none focus:ring-2 focus:ring-primary/20 cursor-pointer appearance-none"
                            >
                                <option value="expense">Saída</option>
                                <option value="income">Entrada</option>
                            </select>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="flex-1 bg-secondary/50 px-4 py-3 rounded-xl text-xs font-bold border-none focus:ring-2 focus:ring-primary/20 cursor-pointer appearance-none"
                            >
                                {categories[type].map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={addTransaction}
                            className="w-full h-[48px] rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Plus className="h-5 w-5" />
                            <span>Adicionar</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-display font-bold">Transações Recentes</h3>
                    <div className="flex gap-2 bg-secondary/30 p-1 rounded-xl">
                        <button
                            onClick={() => setFilter('all')}
                            className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", filter === 'all' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setFilter('income')}
                            className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", filter === 'income' ? "bg-success/10 text-success shadow-sm" : "text-muted-foreground hover:text-foreground")}
                        >
                            Entradas
                        </button>
                        <button
                            onClick={() => setFilter('expense')}
                            className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", filter === 'expense' ? "bg-destructive/10 text-destructive shadow-sm" : "text-muted-foreground hover:text-foreground")}
                        >
                            Saídas
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                    {filteredTransactions.length === 0 ? (
                        <div className="glass-card p-12 text-center text-muted-foreground italic">
                            Nenhuma transação encontrada.
                        </div>
                    ) : (
                        filteredTransactions.map((t) => (
                            <div key={t.id} className="glass-card p-4 px-6 flex items-center justify-between group hover:scale-[1.01] transition-all">
                                <div className="flex items-center gap-4 min-w-0">
                                    <button
                                        onClick={() => toggleComplete(t.id)}
                                        className={cn(
                                            "p-3 rounded-2xl transition-all shrink-0",
                                            t.isCompleted
                                                ? (t.type === 'income' ? "bg-success/20 text-success shadow-lg shadow-success/10" : "bg-destructive/20 text-destructive shadow-lg shadow-destructive/10")
                                                : "bg-secondary text-muted-foreground/30 hover:bg-secondary/80"
                                        )}
                                    >
                                        {t.isCompleted ? <Check className="h-5 w-5 stroke-[3px]" /> : <DollarSign className="h-5 w-5" />}
                                    </button>
                                    <div className="min-w-0">
                                        <p className={cn("font-bold text-sm sm:text-base truncate", !t.isCompleted && "text-muted-foreground/60")}>{t.description}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{t.category}</span>
                                            <span className="text-muted-foreground/30">•</span>
                                            <span className="text-[10px] font-medium text-muted-foreground italic">{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                                            {!t.isCompleted && (
                                                <span className="ml-2 py-0.5 px-1.5 bg-warning/10 text-warning text-[8px] font-black uppercase rounded">Pendente</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                                    <p className={cn("font-display font-black text-base sm:text-lg", t.isCompleted ? (t.type === 'income' ? "text-success" : "text-destructive") : "text-muted-foreground/40")}>
                                        {t.type === 'income' ? '+' : '-'} {formatCurrency(t.value)}
                                    </p>
                                    <button
                                        onClick={() => deleteTransaction(t.id)}
                                        className="p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground/40 hover:text-destructive transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
