import { useState, useMemo } from "react";
import { Transaction } from "@/lib/types";
import {
    Wallet, TrendingUp, TrendingDown, Plus, Trash2, Calendar,
    Tag, DollarSign, Check, X, ChevronLeft, ChevronRight, BarChart3, PieChart as PieChartIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

interface FinanceViewProps {
    transactions: Transaction[];
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

const defaultCategories = {
    income: ["Salário", "Investimento", "Venda", "Presente", "Outros"],
    expense: ["Alimentação", "Transporte", "Moradia", "Lazer", "Saúde", "Educação", "Outros"]
};

export default function FinanceView({ transactions, setTransactions }: FinanceViewProps) {
    const [categories, setCategories] = useLocalStorage("lifeos-finance-categories", defaultCategories);
    const [newCatName, setNewCatName] = useState("");
    const [showAddCat, setShowAddCat] = useState(false);

    const [description, setDescription] = useState("");
    const [value, setValue] = useState("");
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [category, setCategory] = useState(defaultCategories.expense[0]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

    const addCategory = () => {
        if (!newCatName) return;
        setCategories((prev: any) => ({
            ...prev,
            [type]: [...prev[type as keyof typeof prev], newCatName]
        }));
        setCategory(newCatName);
        setNewCatName("");
        setShowAddCat(false);
    };

    // Month selection state
    const [viewingMonth, setViewingMonth] = useState(new Date().getMonth());
    const [viewingYear, setViewingYear] = useState(new Date().getFullYear());

    const monthNames = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const handlePrevMonth = () => {
        if (viewingMonth === 0) {
            setViewingMonth(11);
            setViewingYear(v => v - 1);
        } else {
            setViewingMonth(v => v - 1);
        }
    };

    const handleNextMonth = () => {
        if (viewingMonth === 11) {
            setViewingMonth(0);
            setViewingYear(v => v + 1);
        } else {
            setViewingMonth(v => v + 1);
        }
    };

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

    // Filter transactions for the selected month
    const monthlyTransactions = useMemo(() => {
        return transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getMonth() === viewingMonth && tDate.getFullYear() === viewingYear;
        });
    }, [transactions, viewingMonth, viewingYear]);

    // Totals for top cards (only completed)
    const totalIncome = monthlyTransactions
        .filter(t => t.type === 'income' && t.isCompleted)
        .reduce((acc, t) => acc + t.value, 0);

    const totalExpense = monthlyTransactions
        .filter(t => t.type === 'expense' && t.isCompleted)
        .reduce((acc, t) => acc + t.value, 0);

    const balance = totalIncome - totalExpense;

    // General Report Logic (All transactions, even pending)
    const reportTotalIncome = monthlyTransactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => acc + t.value, 0);

    const reportTotalExpense = monthlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + t.value, 0);

    const filteredTransactions = monthlyTransactions.filter(t => {
        if (filter === 'all') return true;
        return t.type === filter;
    });

    // Graph data: Transactions grouped by day
    const dailyData = useMemo(() => {
        const days: Record<string, { date: string, income: number, expense: number }> = {};
        monthlyTransactions.forEach(t => {
            const day = t.date;
            if (!days[day]) days[day] = { date: day.split('-')[2], income: 0, expense: 0 };
            if (t.type === 'income') days[day].income += t.value;
            else days[day].expense += t.value;
        });
        return Object.values(days).sort((a, b) => a.date.localeCompare(b.date));
    }, [monthlyTransactions]);

    // Pie chart data: Transactions grouped by category
    const categoryData = useMemo(() => {
        const cats: Record<string, number> = {};
        monthlyTransactions.filter(t => t.type === 'expense').forEach(t => {
            cats[t.category] = (cats[t.category] || 0) + t.value;
        });
        return Object.entries(cats).map(([name, value]) => ({ name, value }));
    }, [monthlyTransactions]);

    const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00c49f', '#ffbb28'];

    return (
        <div className="space-y-10 pb-20 animate-in fade-in duration-700">
            {/* Header with Month Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <Wallet className="h-6 w-6 text-primary" />
                        </div>
                        <h2 className="text-3xl font-display font-black tracking-tight">Finanças</h2>
                    </div>
                    <p className="text-muted-foreground text-lg ml-11">Gerencie seu dinheiro com inteligência e clareza.</p>
                </div>

                <div className="flex items-center gap-4 bg-secondary/30 p-2 px-4 rounded-2xl border border-white/10 self-start sm:self-center">
                    <button onClick={handlePrevMonth} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="font-display font-bold text-sm min-w-[120px] text-center">
                        {monthNames[viewingMonth]} {viewingYear}
                    </span>
                    <button onClick={handleNextMonth} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="glass-card p-6 flex items-center gap-5">
                    <div className="p-4 rounded-2xl bg-primary/10 text-primary">
                        <Wallet className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Saldo Líquido</p>
                        <p className={cn("text-2xl font-display font-black leading-none mt-1", balance >= 0 ? "text-foreground" : "text-destructive")}>
                            {formatCurrency(balance)}
                        </p>
                    </div>
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <button className="glass-card p-6 flex items-center gap-5 hover:scale-[1.02] transition-all text-left">
                            <div className="p-4 rounded-2xl bg-success/10 text-success">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Entradas do Mês</p>
                                <p className="text-2xl font-display font-black text-success leading-none mt-1">
                                    {formatCurrency(totalIncome)}
                                </p>
                            </div>
                        </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl bg-background/95 backdrop-blur-xl border-white/10">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-success" />
                                Resumo de Entradas - {monthNames[viewingMonth]}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dailyData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                        <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val}`} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '12px', color: '#fff' }}
                                            itemStyle={{ color: '#82ca9d' }}
                                        />
                                        <Bar dataKey="income" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog>
                    <DialogTrigger asChild>
                        <button className="glass-card p-6 flex items-center gap-5 hover:scale-[1.02] transition-all text-left">
                            <div className="p-4 rounded-2xl bg-destructive/10 text-destructive">
                                <TrendingDown className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Saídas do Mês</p>
                                <p className="text-2xl font-display font-black text-destructive leading-none mt-1">
                                    {formatCurrency(totalExpense)}
                                </p>
                            </div>
                        </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl bg-background/95 backdrop-blur-xl border-white/10">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <TrendingDown className="h-5 w-5 text-destructive" />
                                Resumo de Saídas - {monthNames[viewingMonth]}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dailyData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                        <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val}`} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '12px', color: '#fff' }}
                                            itemStyle={{ color: '#ef4444' }}
                                        />
                                        <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Action Bar & General Report */}
            <div className="flex justify-end">
                <Dialog>
                    <DialogTrigger asChild>
                        <button className="flex items-center gap-2 px-6 py-3 bg-secondary/50 rounded-2xl font-bold hover:bg-secondary transition-all text-sm border border-white/5">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            Relatório Geral do Mês
                        </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl bg-background/95 backdrop-blur-xl border-white/10">
                        <DialogHeader>
                            <DialogTitle>Relatório Geral: {monthNames[viewingMonth]} {viewingYear}</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
                            <div className="space-y-4">
                                <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Visão Comparativa (Total Lançado)</h4>
                                <div className="space-y-3">
                                    <div className="p-4 rounded-2xl bg-secondary/20 border border-white/5 flex justify-between items-center">
                                        <span className="text-sm font-medium">Total de Entradas</span>
                                        <span className="font-display font-black text-success">{formatCurrency(reportTotalIncome)}</span>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-secondary/20 border border-white/5 flex justify-between items-center">
                                        <span className="text-sm font-medium">Total de Saídas</span>
                                        <span className="font-display font-black text-destructive">{formatCurrency(reportTotalExpense)}</span>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex justify-between items-center">
                                        <span className="text-sm font-bold">Saldo Planejado</span>
                                        <span className="font-display font-black">{formatCurrency(reportTotalIncome - reportTotalExpense)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4 text-center">
                                <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground text-left ml-2">Distribuição de Gastos</h4>
                                <div className="h-[200px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={categoryData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {categoryData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {categoryData.map((entry, index) => (
                                        <div key={entry.name} className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                            <span className="text-[10px] font-bold text-muted-foreground">{entry.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Add Transaction Form */}
            <div className="glass-card p-8 rounded-[2rem]">
                <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
                    <Plus className="h-5 w-5 text-primary" />
                    Novo Lançamento
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="space-y-2 lg:col-span-1">
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
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Data</label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full bg-secondary/50 border-none rounded-xl pl-11 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 appearance-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-2 lg:col-span-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Categoria</label>
                        <div className="flex gap-2">
                            <select
                                value={type}
                                onChange={(e) => {
                                    const newType = e.target.value as 'income' | 'expense';
                                    setType(newType);
                                    setCategory(defaultCategories[newType][0]);
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
                                {categories[type].map((cat: string) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <button
                                onClick={() => setShowAddCat(!showAddCat)}
                                className="p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-all"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                        {showAddCat && (
                            <div className="flex gap-2 mt-2">
                                <input
                                    value={newCatName}
                                    onChange={(e) => setNewCatName(e.target.value)}
                                    placeholder="Nova categoria..."
                                    className="flex-1 bg-secondary/50 border-none rounded-xl px-3 py-2 text-xs font-bold"
                                />
                                <button onClick={addCategory} className="px-3 py-2 bg-primary text-white rounded-xl text-xs font-bold shrink-0">Add</button>
                            </div>
                        )}
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

            {/* Transactions List */}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h3 className="text-xl font-display font-bold">Transações de {monthNames[viewingMonth]}</h3>
                    <div className="flex gap-2 bg-secondary/30 p-1 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setFilter('all')}
                            className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap", filter === 'all' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setFilter('income')}
                            className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap", filter === 'income' ? "bg-success/10 text-success shadow-sm" : "text-muted-foreground hover:text-foreground")}
                        >
                            Entradas
                        </button>
                        <button
                            onClick={() => setFilter('expense')}
                            className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap", filter === 'expense' ? "bg-destructive/10 text-destructive shadow-sm" : "text-muted-foreground hover:text-foreground")}
                        >
                            Saídas
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                    {filteredTransactions.length === 0 ? (
                        <div className="glass-card p-12 text-center text-muted-foreground italic">
                            Nenhuma transação encontrada para este mês.
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
