import React, { useState, useMemo } from "react";
import { Transaction } from "@/lib/types";
import {
    Wallet, TrendingUp, TrendingDown, Plus, Trash2, Calendar,
    DollarSign, Check, ChevronLeft, ChevronRight, BarChart3, Repeat,
    Tag, ArrowUp, ArrowDown, Edit2, ArrowUpDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { addMonths, format, parseISO } from 'date-fns';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

interface FinanceViewProps {
    transactions: Transaction[];
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
    categories: any;
}

const defaultCategories = {
    income: ["Salário", "Investimento", "Venda", "Presente", "Outros"],
    expense: ["Alimentação", "Transporte", "Moradia", "Lazer", "Saúde", "Educação", "Outros"]
};

export default function FinanceView({ transactions, setTransactions, categories }: FinanceViewProps) {
    // Add Form State
    const [description, setDescription] = useState("");
    const [value, setValue] = useState("");
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [category, setCategory] = useState((categories || defaultCategories).expense[0]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
    const [repeatCount, setRepeatCount] = useState("1");
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

    // Edit State
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [editDesc, setEditDesc] = useState("");
    const [editValue, setEditValue] = useState("");
    const [editCategory, setEditCategory] = useState("");
    const [editDate, setEditDate] = useState("");

    // Month selection state
    const [viewingMonth, setViewingMonth] = useState(new Date().getMonth());
    const [viewingYear, setViewingYear] = useState(new Date().getFullYear());

    // State for deletion
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

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

        const count = parseInt(repeatCount) || 1;
        const baseDate = parseISO(date);
        const newTransactions: Transaction[] = [];

        for (let i = 0; i < count; i++) {
            const transactionDate = addMonths(baseDate, i);
            const isInstallment = count > 1;
            const groupId = isInstallment ? crypto.randomUUID() : undefined;
            
            newTransactions.push({
                id: crypto.randomUUID(),
                description: isInstallment ? `${description} (${i + 1}/${count})` : description,
                value: parseFloat(value),
                type,
                category,
                date: format(transactionDate, 'yyyy-MM-dd'),
                isCompleted: false,
                installments: count > 1 ? count : undefined,
                currentInstallment: count > 1 ? i + 1 : undefined,
                groupId: isInstallment ? groupId : undefined
            });
        }

        setTransactions(prev => [...newTransactions, ...prev]);
        setDescription("");
        setValue("");
        setRepeatCount("1");
    };

    const handleEdit = (t: Transaction) => {
        setEditingTransaction(t);
        setEditDesc(t.description);
        setEditValue(t.value.toString());
        setEditCategory(t.category);
        setEditDate(t.date);
    };

    const saveEdit = () => {
        if (!editingTransaction || !editDesc || !editValue) return;
        
        setTransactions(prev => prev.map(t => 
            t.id === editingTransaction.id 
                ? { 
                    ...t, 
                    description: editDesc, 
                    value: parseFloat(editValue), 
                    category: editCategory, 
                    date: editDate 
                  } 
                : t
        ));
        setEditingTransaction(null);
    };

    const deleteTransaction = (id: string) => {
        const transaction = transactions.find(t => t.id === id);
        if (!transaction) return;

        if (transaction.groupId || transaction.installments) {
            setTransactionToDelete(transaction);
            setIsDeleteDialogOpen(true);
        } else {
            if (confirm("Deseja excluir este lançamento?")) {
                setTransactions(prev => prev.filter(t => t.id !== id));
            }
        }
    };

    const confirmDelete = (deleteAll: boolean) => {
        if (!transactionToDelete) return;

        if (deleteAll) {
            if (transactionToDelete.groupId) {
                setTransactions(prev => prev.filter(t => t.groupId !== transactionToDelete.groupId));
            } else {
                const baseDescription = transactionToDelete.description.replace(/\s\(\d+\/\d+\)$/, "");
                setTransactions(prev => prev.filter(t => {
                    const tBase = t.description.replace(/\s\(\d+\/\d+\)$/, "");
                    return tBase !== baseDescription || t.value !== transactionToDelete.value || t.type !== transactionToDelete.type;
                }));
            }
        } else {
            setTransactions(prev => prev.filter(t => t.id !== transactionToDelete.id));
        }

        setIsDeleteDialogOpen(false);
        setTransactionToDelete(null);
    };

    const toggleComplete = (id: string) => {
        setTransactions(prev => prev.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t));
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const monthlyTransactions = useMemo(() => {
        return transactions.filter(t => {
            const tDate = new Date(t.date + 'T12:00:00');
            return tDate.getMonth() === viewingMonth && tDate.getFullYear() === viewingYear;
        });
    }, [transactions, viewingMonth, viewingYear]);

    const totalIncome = monthlyTransactions
        .filter(t => t.type === 'income' && t.isCompleted)
        .reduce((acc, t) => acc + t.value, 0);

    const totalExpense = monthlyTransactions
        .filter(t => t.type === 'expense' && t.isCompleted)
        .reduce((acc, t) => acc + t.value, 0);

    const monthlyBalance = totalIncome - totalExpense;

    const reportTotalIncome = monthlyTransactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => acc + t.value, 0);

    const reportTotalExpense = monthlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + t.value, 0);

    const reportPendingIncome = reportTotalIncome - totalIncome;
    const reportPendingExpense = reportTotalExpense - totalExpense;

    const reportRealizedBalance = totalIncome - totalExpense;
    const reportPendingBalance = reportPendingIncome - reportPendingExpense;

    const filteredTransactions = useMemo(() => {
        return monthlyTransactions
            .filter(t => {
                if (filter === 'all') return true;
                return t.type === filter;
            })
            .sort((a, b) => {
                if (sortOrder === 'desc') return b.date.localeCompare(a.date);
                return a.date.localeCompare(b.date);
            });
    }, [monthlyTransactions, filter, sortOrder]);

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
                        <h2 className="text-3xl font-display font-black tracking-tight text-slate-950 dark:text-white">Finanças</h2>
                    </div>
                    <p className="text-slate-600 dark:text-muted-foreground text-lg ml-11">Gerencie seu dinheiro com inteligência e clareza.</p>
                </div>

                <div className="flex items-center gap-4 bg-secondary/30 p-2 px-4 rounded-2xl border border-slate-200 dark:border-white/10 self-start sm:self-center">
                    <button onClick={handlePrevMonth} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors text-slate-950 dark:text-white">
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="font-display font-bold text-sm min-w-[120px] text-center text-slate-950 dark:text-white">
                        {monthNames[viewingMonth]} {viewingYear}
                    </span>
                    <button onClick={handleNextMonth} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors text-slate-950 dark:text-white">
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="glass-card p-6 flex items-center gap-5">
                    <div className="p-4 rounded-2xl bg-primary/10 text-primary shrink-0">
                        <Wallet className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-600 dark:text-muted-foreground">Saldo do Mês (Concluído)</p>
                        <p className={cn("text-xl md:text-2xl font-display font-black leading-none mt-1 truncate", monthlyBalance >= 0 ? "text-slate-950 dark:text-white" : "text-destructive")}>
                            {formatCurrency(monthlyBalance)}
                        </p>
                    </div>
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <button className="glass-card p-6 flex items-center gap-5 hover:scale-[1.02] transition-all text-left">
                            <div className="p-4 rounded-2xl bg-success/10 text-success shrink-0">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-600 dark:text-muted-foreground">Entradas do Mês</p>
                                <p className="text-xl md:text-2xl font-display font-black text-success leading-none mt-1 truncate">
                                    {formatCurrency(totalIncome)}
                                </p>
                            </div>
                        </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl bg-background/95 backdrop-blur-xl border-white/10">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-slate-950 dark:text-white">
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
                            <div className="p-4 rounded-2xl bg-destructive/10 text-destructive shrink-0">
                                <TrendingDown className="h-6 w-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-600 dark:text-muted-foreground">Saídas do Mês</p>
                                <p className="text-xl md:text-2xl font-display font-black text-destructive leading-none mt-1 truncate">
                                    {formatCurrency(totalExpense)}
                                </p>
                            </div>
                        </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl bg-background/95 backdrop-blur-xl border-white/10">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-slate-950 dark:text-white">
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
                        <button className="flex items-center gap-2 px-6 py-3 bg-secondary/80 dark:bg-secondary/50 rounded-2xl font-bold hover:bg-secondary transition-all text-sm border border-slate-200 dark:border-white/5 text-slate-950 dark:text-white">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            Relatório Geral
                        </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl bg-background/95 backdrop-blur-xl border-slate-200 dark:border-white/10 shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-slate-950 dark:text-white">Relatório Geral: {monthNames[viewingMonth]} {viewingYear}</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
                            {/* Single Master Cash Flow Summary Card */}
                            <div className="space-y-6">
                                <div className="p-6 rounded-[2rem] bg-secondary/20 border border-slate-200 dark:border-white/5 space-y-6">
                                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-muted-foreground flex items-center gap-2">
                                        <Wallet className="h-4 w-4 text-primary" />
                                        Resumo Geral de Caixa
                                    </h4>
                                    
                                    {/* Entradas Row */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Entradas Totais</span>
                                            <span className="font-display font-black text-success">{formatCurrency(reportTotalIncome)}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-success/30 pb-2">
                                            <div>
                                                <p className="text-[9px] font-bold uppercase text-slate-500">Já Recebido</p>
                                                <p className="text-xs font-black text-success/80">{formatCurrency(totalIncome)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold uppercase text-slate-500">Ainda por Entrar</p>
                                                <p className="text-xs font-black text-orange-500">{formatCurrency(reportPendingIncome)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Saídas Row */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-white/5">
                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Saídas Totais</span>
                                            <span className="font-display font-black text-destructive">{formatCurrency(reportTotalExpense)}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-destructive/30 pb-2">
                                            <div>
                                                <p className="text-[9px] font-bold uppercase text-slate-500">Já Pago</p>
                                                <p className="text-xs font-black text-destructive/80">{formatCurrency(totalExpense)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold uppercase text-slate-500">Ainda por Sair</p>
                                                <p className="text-xs font-black text-orange-500">{formatCurrency(reportPendingExpense)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Final Summary Row */}
                                    <div className="pt-4 border-t-2 border-slate-950/5 dark:border-white/5 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-slate-900 dark:text-white">Saldo Realizado (Hoje)</span>
                                            <span className={cn("text-lg font-display font-black leading-none", reportRealizedBalance >= 0 ? "text-success" : "text-destructive")}>
                                                {formatCurrency(reportRealizedBalance)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center p-4 rounded-2xl bg-primary/10 border border-primary/20">
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black uppercase text-primary/60">Saldo Final do Mês (Previsto)</p>
                                                <p className="text-base font-display font-black text-slate-950 dark:text-white mt-0.5 truncate">{formatCurrency(reportTotalIncome - reportTotalExpense)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[8px] font-bold uppercase text-slate-500">Pendente Total</p>
                                                <p className={cn("text-xs font-black", reportPendingBalance >= 0 ? "text-orange-500" : "text-destructive/80")}>
                                                    {reportPendingBalance >= 0 ? '+' : ''}{formatCurrency(reportPendingBalance)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-muted-foreground ml-2">Distribuição de Gastos</h4>
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
                                <div className="flex flex-wrap justify-center gap-2 mb-6">
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
            <div className="glass-card p-10 rounded-[2.5rem] border-slate-200 dark:border-white/5 shadow-2xl bg-secondary/30 dark:bg-card/40 backdrop-blur-2xl">
                <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                    <h3 className="text-2xl font-display font-black tracking-tight text-slate-950 dark:text-white flex items-center gap-2">
                        + Novo Lançamento
                    </h3>
                    
                    {/* Segmented Control for Type */}
                    <div className="flex bg-secondary/50 dark:bg-black/40 p-1.5 rounded-2xl border border-slate-200 dark:border-white/5">
                        <button
                            onClick={() => {
                                setType('income');
                                setCategory(categories.income[0]);
                            }}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                type === 'income' 
                                    ? "bg-success/20 text-success shadow-lg shadow-success/10 border border-success/20" 
                                    : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            <ArrowUp className="h-3 w-3" />
                            Receita
                        </button>
                        <button
                            onClick={() => {
                                setType('expense');
                                setCategory(categories.expense[0]);
                            }}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                type === 'expense' 
                                    ? "bg-destructive/20 text-destructive shadow-lg shadow-destructive/10 border border-destructive/20" 
                                    : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            <ArrowDown className="h-3 w-3" />
                            Despesa
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* First Row: Description and Value */}
                    <div className="space-y-3 md:col-span-8">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Descrição</label>
                        <input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ex: Mercado mensal"
                            className="w-full bg-background/50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 text-slate-950 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all outline-none"
                        />
                    </div>

                    <div className="space-y-3 md:col-span-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Valor (R$)</label>
                        <div className="relative">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">R$</span>
                            <input
                                type="number"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                placeholder="0,00"
                                className="w-full bg-background/50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 text-slate-950 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all outline-none"
                            />
                        </div>
                    </div>

                    {/* Second Row: Date, Category, Repeat */}
                    <div className="space-y-3 md:col-span-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Data</label>
                        <div className="relative group">
                            <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full bg-background/50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 text-slate-950 dark:text-white transition-all outline-none appearance-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-3 md:col-span-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Categoria</label>
                        <div className="relative">
                            <Tag className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-background/50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 text-slate-950 dark:text-white transition-all outline-none appearance-none cursor-pointer"
                            >
                                {categories[type].map((cat: string) => (
                                    <option key={cat} value={cat} className="bg-white dark:bg-slate-900 border-none text-slate-900 dark:text-white">{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-3 md:col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Repetir</label>
                        <div className="relative">
                            <Repeat className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                            <input
                                type="number"
                                min="1"
                                max="60"
                                value={repeatCount}
                                onChange={(e) => setRepeatCount(e.target.value)}
                                className="w-full bg-background/50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 text-slate-950 dark:text-white transition-all outline-none"
                            />
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex items-end md:col-span-2">
                        <button
                            onClick={addTransaction}
                            className="w-full h-[58px] rounded-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-black uppercase tracking-widest text-xs hover:scale-[1.05] shadow-2xl dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2 group"
                        >
                            <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                            <span>Lançar</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Transactions List */}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h3 className="text-xl font-display font-black">Transações de {monthNames[viewingMonth]}</h3>
                    <div className="flex flex-wrap gap-2 bg-secondary/30 p-1 rounded-xl w-full sm:w-auto">
                        <div className="flex gap-1 pr-2 border-r border-slate-200 dark:border-white/10 mr-1">
                            <button
                                onClick={() => setFilter('all')}
                                className={cn("px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", filter === 'all' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                            >
                                Todos
                            </button>
                            <button
                                onClick={() => setFilter('income')}
                                className={cn("px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", filter === 'income' ? "bg-success/10 text-success shadow-sm" : "text-muted-foreground hover:text-foreground")}
                            >
                                Entradas
                            </button>
                            <button
                                onClick={() => setFilter('expense')}
                                className={cn("px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", filter === 'expense' ? "bg-destructive/10 text-destructive shadow-sm" : "text-muted-foreground hover:text-foreground")}
                            >
                                Saídas
                            </button>
                        </div>
                        
                        <button
                            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all bg-primary/10 text-primary hover:bg-primary/20"
                        >
                            <ArrowUpDown className="h-3 w-3" />
                            {sortOrder === 'desc' ? 'Mais recente' : 'Mais antigo'}
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
                                        <p className={cn("font-bold text-sm sm:text-base truncate", t.isCompleted ? "text-slate-950 dark:text-white" : "text-slate-500 dark:text-muted-foreground/60")}>{t.description}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-muted-foreground/60">{t.category}</span>
                                            <span className="text-slate-400 dark:text-muted-foreground/30">•</span>
                                            <span className="text-[10px] font-medium text-slate-600 dark:text-muted-foreground italic">{new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 sm:gap-6 shrink-0">
                                    <p className={cn("font-display font-black text-base sm:text-lg", t.isCompleted ? (t.type === 'income' ? "text-success" : "text-destructive") : "text-muted-foreground/40")}>
                                        {t.type === 'income' ? '+' : '-'} {formatCurrency(t.value)}
                                    </p>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all capitalize">
                                        <button
                                            onClick={() => handleEdit(t)}
                                            className="p-2 rounded-xl hover:bg-primary/10 text-muted-foreground/40 hover:text-primary transition-all"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteTransaction(t.id)}
                                            className="p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground/40 hover:text-destructive transition-all"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Edit Transaction Dialog */}
            <Dialog open={!!editingTransaction} onOpenChange={(open) => !open && setEditingTransaction(null)}>
                <DialogContent className="max-w-xl bg-background/95 backdrop-blur-xl border-slate-200 dark:border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-display font-black">Editar Lançamento</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Descrição</label>
                            <input
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                                className="w-full bg-secondary/30 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Valor (R$)</label>
                            <input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-full bg-secondary/30 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Data</label>
                            <input
                                type="date"
                                value={editDate}
                                onChange={(e) => setEditDate(e.target.value)}
                                className="w-full bg-secondary/30 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Categoria</label>
                            <select
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value)}
                                className="w-full bg-secondary/30 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                            >
                                {editingTransaction && categories[editingTransaction.type].map((cat: string) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <button
                            onClick={() => setEditingTransaction(null)}
                            className="px-6 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-secondary transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={saveEdit}
                            className="px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-slate-950 dark:bg-white text-white dark:text-slate-950 hover:scale-105 transition-all"
                        >
                            Salvar Alterações
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Alert Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="bg-background/95 backdrop-blur-xl border-slate-200 dark:border-white/10">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Lançamento Parcelado</AlertDialogTitle>
                        <AlertDialogDescription>
                            Este lançamento possui parcelas. Deseja excluir apenas esta parcela ou todas as outras parcelas relacionadas?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel onClick={() => {
                            setIsDeleteDialogOpen(false);
                            setTransactionToDelete(null);
                        }}>
                            Cancelar
                        </AlertDialogCancel>
                        <button
                            onClick={() => confirmDelete(false)}
                            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                            Apenas esta
                        </button>
                        <AlertDialogAction
                            onClick={() => confirmDelete(true)}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                            Excluir todas
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
