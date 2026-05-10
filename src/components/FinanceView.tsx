import React, { useState, useMemo } from "react";
import { Transaction } from "@/lib/types";
import {
    Wallet, TrendingUp, TrendingDown, Plus, Trash2, Calendar,
    DollarSign, Check, ChevronLeft, ChevronRight, BarChart3, Repeat,
    Tag, ArrowUp, ArrowDown, Edit2, ArrowUpDown, MoreVertical,
    Settings2, CreditCard
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

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { CreditCard as CreditCardType } from "@/lib/types";

interface FinanceViewProps {
    transactions: Transaction[];
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
    categories: any;
    creditCards: CreditCardType[];
    setCreditCards: React.Dispatch<React.SetStateAction<CreditCardType[]>>;
}

const defaultCategories = {
    income: ["Salário", "Investimento", "Venda", "Presente", "Outros"],
    expense: ["Alimentação", "Transporte", "Moradia", "Lazer", "Saúde", "Educação", "Outros"]
};

export default function FinanceView({ transactions, setTransactions, categories, creditCards, setCreditCards }: FinanceViewProps) {
    // Add Form State
    const [description, setDescription] = useState("");
    const [value, setValue] = useState("");
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [category, setCategory] = useState((categories || defaultCategories).expense[0]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [filter, setFilter] = useState<'all' | 'income' | 'expense' | 'credit'>('all');
    const [repeatCount, setRepeatCount] = useState("1");
    const [paymentMethod, setPaymentMethod] = useState<'balance' | 'credit'>('balance');
    const [selectedCardId, setSelectedCardId] = useState("");
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

    // Credit Card Form State
    const [newCardName, setNewCardName] = useState("");
    const [newCardLimit, setNewCardLimit] = useState("");
    const [newCardClosingDay, setNewCardClosingDay] = useState("10");
    const [newCardDueDay, setNewCardDueDay] = useState("20");
    const [newCardColor, setNewCardColor] = useState("#3b82f6");
    const [isAddCardOpen, setIsAddCardOpen] = useState(false);
    const [editingCardId, setEditingCardId] = useState<string | null>(null);

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
        if (paymentMethod === 'credit' && !selectedCardId) {
            alert("Selecione um cartão de crédito.");
            return;
        }

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
                isCompleted: paymentMethod === 'credit' ? false : false, // Credit is usually pending until paid
                installments: count > 1 ? count : undefined,
                currentInstallment: count > 1 ? i + 1 : undefined,
                groupId: isInstallment ? groupId : undefined,
                paymentMethod,
                creditCardId: paymentMethod === 'credit' ? selectedCardId : undefined
            });
        }

        setTransactions(prev => [...newTransactions, ...prev]);
        setDescription("");
        setValue("");
        setRepeatCount("1");
    };

    const addCreditCard = () => {
        if (!newCardName || !newCardLimit) return;
        
        if (editingCardId) {
            setCreditCards(prev => prev.map(c => c.id === editingCardId ? {
                ...c,
                name: newCardName,
                limit: parseFloat(newCardLimit),
                closingDay: parseInt(newCardClosingDay),
                dueDay: parseInt(newCardDueDay),
                color: newCardColor
            } : c));
            setEditingCardId(null);
        } else {
            const newCard: CreditCardType = {
                id: crypto.randomUUID(),
                name: newCardName,
                limit: parseFloat(newCardLimit),
                closingDay: parseInt(newCardClosingDay),
                dueDay: parseInt(newCardDueDay),
                color: newCardColor
            };
            setCreditCards(prev => [...prev, newCard]);
        }
        
        setNewCardName("");
        setNewCardLimit("");
        setNewCardClosingDay("10");
        setNewCardDueDay("20");
        setNewCardColor("#3b82f6");
        setIsAddCardOpen(false);
    };

    const startEditingCard = (card: CreditCardType) => {
        setEditingCardId(card.id);
        setNewCardName(card.name);
        setNewCardLimit(card.limit.toString());
        setNewCardClosingDay(card.closingDay.toString());
        setNewCardDueDay(card.dueDay.toString());
        setNewCardColor(card.color);
    };

    const deleteCreditCard = (id: string) => {
        if (confirm("Deseja excluir este cartão? Todas as transações vinculadas a ele perderão a referência.")) {
            setCreditCards(prev => prev.filter(c => c.id !== id));
        }
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

    const toggleInvoiceComplete = (cardId: string, month: number, year: number, currentStatus: boolean) => {
        setTransactions(prev => prev.map(t => {
            if (t.paymentMethod !== 'credit' || t.creditCardId !== cardId) return t;
            const inv = getInvoiceMonth(t.date, t.creditCardId);
            if (inv?.month === month && inv?.year === year) {
                return { ...t, isCompleted: !currentStatus };
            }
            return t;
        }));
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const getInvoiceMonth = (dateStr: string, cardId: string | undefined) => {
        if (!cardId) return null;
        const card = creditCards.find(c => c.id === cardId);
        if (!card) return null;

        const purchaseDate = new Date(dateStr + 'T12:00:00');
        const day = purchaseDate.getDate();
        
        let invoiceMonth = purchaseDate.getMonth();
        let invoiceYear = purchaseDate.getFullYear();

        if (day > card.closingDay) {
            invoiceMonth++;
            if (invoiceMonth > 11) {
                invoiceMonth = 0;
                invoiceYear++;
            }
        }
        return { month: invoiceMonth, year: invoiceYear };
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

    const creditExpensesOfMonth = useMemo(() => {
        const allInMonth = transactions.filter(t => {
            if (t.paymentMethod !== 'credit' || t.type !== 'expense') return false;
            const inv = getInvoiceMonth(t.date, t.creditCardId);
            return inv?.month === viewingMonth && inv?.year === viewingYear;
        });
        
        const total = allInMonth.reduce((acc, t) => acc + t.value, 0);
        const paid = allInMonth.filter(t => t.isCompleted).reduce((acc, t) => acc + t.value, 0);
        
        return { total, paid, allCompleted: allInMonth.length > 0 && allInMonth.every(t => t.isCompleted) };
    }, [transactions, viewingMonth, viewingYear, creditCards]);

    const totalExpense = useMemo(() => {
        const normalExpenses = monthlyTransactions
            .filter(t => t.type === 'expense' && t.paymentMethod !== 'credit' && t.isCompleted)
            .reduce((acc, t) => acc + t.value, 0);
        return normalExpenses + creditExpensesOfMonth.paid;
    }, [monthlyTransactions, creditExpensesOfMonth]);

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
        // 1. Get non-credit transactions for the month
        const normalTransactions = monthlyTransactions.filter(t => t.paymentMethod !== 'credit');

        // 2. Generate aggregated 'Fatura' entries for each card for THIS viewingMonth
        const aggregatedFaturas: any[] = creditCards.map(card => {
            const invoiceTransactions = transactions.filter(t => {
                if (t.paymentMethod !== 'credit' || t.creditCardId !== card.id || t.type !== 'expense') return false;
                const inv = getInvoiceMonth(t.date, t.creditCardId);
                return inv?.month === viewingMonth && inv?.year === viewingYear;
            });

            if (invoiceTransactions.length === 0) return null;

            const total = invoiceTransactions.reduce((acc, t) => acc + t.value, 0);
            const isCompleted = invoiceTransactions.length > 0 && invoiceTransactions.every(t => t.isCompleted);
            
            return {
                id: `fatura-${card.id}-${viewingMonth}-${viewingYear}`,
                description: `Fatura ${card.name}`,
                value: total,
                type: 'expense',
                category: 'Cartão de Crédito',
                date: `${viewingYear}-${String(viewingMonth + 1).padStart(2, '0')}-${String(card.dueDay).padStart(2, '0')}`,
                isCompleted: isCompleted,
                isAggregate: true,
                creditCardId: card.id,
                details: invoiceTransactions
            };
        }).filter(Boolean);

        const allVisible = filter === 'credit' 
            ? transactions.filter(t => {
                if (t.paymentMethod !== 'credit') return false;
                const inv = getInvoiceMonth(t.date, t.creditCardId);
                return inv?.month === viewingMonth && inv?.year === viewingYear;
            })
            : [...normalTransactions, ...aggregatedFaturas];

        return allVisible
            .filter(t => {
                if (filter === 'all') return true;
                if (filter === 'credit') return true; // Already filtered above
                return t.type === filter;
            })
            .sort((a, b) => {
                if (sortOrder === 'desc') return b.date.localeCompare(a.date);
                return a.date.localeCompare(b.date);
            });
    }, [monthlyTransactions, transactions, filter, sortOrder, viewingMonth, viewingYear, creditCards]);

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

                <Dialog open={isAddCardOpen} onOpenChange={setIsAddCardOpen}>
                    <DialogTrigger asChild>
                        <button className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold hover:scale-105 transition-all text-sm shadow-lg shadow-primary/20">
                            <Plus className="h-5 w-5" />
                            Gerenciar Cartões
                        </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl bg-background/95 backdrop-blur-xl border-white/10">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-slate-950 dark:text-white">
                                <CreditCard className="h-5 w-5 text-primary" />
                                Meus Cartões de Crédito
                            </DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-6 pt-4">
                            {/* Card List */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {creditCards.map(card => (
                                    <div key={card.id} className="relative group p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl overflow-hidden border border-white/5">
                                        <div className="absolute top-0 right-0 p-3 flex gap-2">
                                            <button onClick={() => startEditingCard(card)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                                                <Edit2 className="h-4 w-4 text-white/40 group-hover:text-white/80" />
                                            </button>
                                            <button onClick={() => deleteCreditCard(card.id)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                                                <Trash2 className="h-4 w-4 text-white/40 group-hover:text-white/80" />
                                            </button>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Nome do Cartão</p>
                                                <p className="text-lg font-display font-black">{card.name}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Fechamento</p>
                                                    <p className="font-bold">Dia {card.closingDay}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Vencimento</p>
                                                    <p className="font-bold">Dia {card.dueDay}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Limite Total</p>
                                                <p className="text-xl font-display font-black">{formatCurrency(card.limit)}</p>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-0 left-0 w-full h-1" style={{ backgroundColor: card.color }} />
                                    </div>
                                ))}
                                
                                <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center gap-3 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-muted-foreground group">
                                    <CreditCard className="h-8 w-8 opacity-20 group-hover:opacity-40" />
                                    <p className="text-xs font-bold uppercase tracking-widest">Novo Cartão</p>
                                </div>
                            </div>

                            {/* Add New Card Form */}
                            <div className="p-6 rounded-2xl bg-secondary/30 border border-slate-200 dark:border-white/5 space-y-4">
                                <h4 className="text-sm font-black uppercase tracking-widest flex justify-between">
                                    <span>{editingCardId ? "Editar Cartão" : "Adicionar Cartão"}</span>
                                    {editingCardId && <button onClick={() => {
                                        setEditingCardId(null);
                                        setNewCardName("");
                                        setNewCardLimit("");
                                    }} className="text-[10px] text-primary hover:underline">Cancelar</button>}
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {/* ... existing inputs ... */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nome</label>
                                        <input value={newCardName} onChange={e => setNewCardName(e.target.value)} placeholder="Ex: Nubank" className="w-full bg-background border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2 text-sm font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Limite</label>
                                        <input type="number" value={newCardLimit} onChange={e => setNewCardLimit(e.target.value)} placeholder="0,00" className="w-full bg-background border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2 text-sm font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Dia Fechamento</label>
                                        <input type="number" min="1" max="31" value={newCardClosingDay} onChange={e => setNewCardClosingDay(e.target.value)} className="w-full bg-background border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2 text-sm font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Dia Vencimento</label>
                                        <input type="number" min="1" max="31" value={newCardDueDay} onChange={e => setNewCardDueDay(e.target.value)} className="w-full bg-background border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2 text-sm font-bold" />
                                    </div>
                                </div>
                                <button onClick={addCreditCard} className="w-full py-3 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all">
                                    {editingCardId ? "Salvar Alterações" : "Adicionar Cartão"}
                                </button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="glass-card p-6 flex items-center gap-5 border-l-4 border-l-primary relative overflow-hidden group hover:scale-[1.02] transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary/10 transition-all" />
                    <div className="p-4 rounded-2xl bg-primary/10 text-primary shrink-0 relative z-10 shadow-inner">
                        <Wallet className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 relative z-10 flex-1">
                        <p className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-muted-foreground/60">Saldo do Mês</p>
                        <p className={cn("text-2xl md:text-3xl font-display font-black leading-none mt-2 truncate", monthlyBalance >= 0 ? "text-slate-950 dark:text-white" : "text-destructive")}>
                            {formatCurrency(monthlyBalance)}
                        </p>
                    </div>
                </div>

                {creditCards.map(card => {
                    const invoiceTransactions = transactions.filter(t => {
                        if (t.paymentMethod !== 'credit' || t.creditCardId !== card.id) return false;
                        const inv = getInvoiceMonth(t.date, t.creditCardId);
                        return inv?.month === viewingMonth && inv?.year === viewingYear;
                    });
                    const cardTotal = invoiceTransactions.reduce((acc, t) => acc + t.value, 0);
                    
                    const paidInvoice = invoiceTransactions.filter(t => t.isCompleted).reduce((acc, t) => acc + t.value, 0);
                    const invoicePercentage = (cardTotal > 0 ? (paidInvoice / cardTotal) * 100 : 0);
                    
                    const usedLimit = transactions
                        .filter(t => t.paymentMethod === 'credit' && t.creditCardId === card.id && !t.isCompleted)
                        .reduce((acc, t) => acc + t.value, 0);
                    const availableLimit = card.limit - usedLimit;
                    
                    return (
                        <div key={card.id} className="glass-card p-6 flex items-center gap-5 border-l-4 relative overflow-hidden group hover:scale-[1.02] transition-all" style={{ borderLeftColor: card.color }}>
                            <div className="absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 blur-2xl group-hover:opacity-30 transition-all opacity-10" style={{ backgroundColor: card.color }} />
                            <div className="p-4 rounded-2xl bg-orange-500/10 text-orange-500 shrink-0 relative z-10 shadow-inner">
                                <CreditCard className="h-6 w-6" />
                            </div>
                            <div className="min-w-0 relative z-10 flex-1">
                                <div className="flex justify-between items-start">
                                    <p className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-muted-foreground/60">Fatura {card.name}</p>
                                    <p className="text-[11px] font-black text-success">
                                        {formatCurrency(availableLimit)} <span className="opacity-50 lowercase font-medium">livre</span>
                                    </p>
                                </div>
                                <div className="flex justify-between items-end mt-2">
                                    <p className="text-2xl md:text-3xl font-display font-black text-slate-950 dark:text-white leading-none truncate">
                                        {formatCurrency(cardTotal)}
                                    </p>
                                    <span className="text-[10px] font-black text-orange-500 whitespace-nowrap">
                                        {Math.round(invoicePercentage)}% Pago
                                    </span>
                                </div>
                                <div className="mt-3 w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, invoicePercentage)}%`, backgroundColor: card.color }} />
                                </div>
                            </div>
                        </div>
                    );
                })}

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
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center">
                                    <p className="text-[10px] font-black uppercase text-primary/60">No Saldo</p>
                                    <p className="text-lg font-display font-black text-slate-950 dark:text-white">
                                        {formatCurrency(monthlyTransactions.filter(t => t.type === 'income' && t.paymentMethod !== 'credit').reduce((acc, t) => acc + t.value, 0))}
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center">
                                    <p className="text-[10px] font-black uppercase text-orange-500/60">No Cartão</p>
                                    <p className="text-lg font-display font-black text-slate-950 dark:text-white">
                                        {formatCurrency(monthlyTransactions.filter(t => t.type === 'income' && t.paymentMethod === 'credit').reduce((acc, t) => acc + t.value, 0))}
                                    </p>
                                </div>
                            </div>
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
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center">
                                    <p className="text-[10px] font-black uppercase text-primary/60">No Saldo</p>
                                    <p className="text-lg font-display font-black text-slate-950 dark:text-white">
                                        {formatCurrency(monthlyTransactions.filter(t => t.type === 'expense' && t.paymentMethod !== 'credit').reduce((acc, t) => acc + t.value, 0))}
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center">
                                    <p className="text-[10px] font-black uppercase text-orange-500/60">No Cartão</p>
                                    <p className="text-lg font-display font-black text-slate-950 dark:text-white">
                                        {formatCurrency(monthlyTransactions.filter(t => t.type === 'expense' && t.paymentMethod === 'credit').reduce((acc, t) => acc + t.value, 0))}
                                    </p>
                                </div>
                            </div>
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

                    <div className="flex bg-secondary/50 dark:bg-black/40 p-1.5 rounded-2xl border border-slate-200 dark:border-white/5">
                        <button
                            onClick={() => setPaymentMethod('balance')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                paymentMethod === 'balance' 
                                    ? "bg-primary/20 text-primary border border-primary/20" 
                                    : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            <Wallet className="h-3 w-3" />
                            Saldo
                        </button>
                        <button
                            onClick={() => setPaymentMethod('credit')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                paymentMethod === 'credit' 
                                    ? "bg-orange-500/20 text-orange-500 border border-orange-500/20" 
                                    : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            <CreditCard className="h-3 w-3" />
                            Crédito
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

                    {paymentMethod === 'credit' && (
                        <div className="space-y-3 md:col-span-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Selecione o Cartão</label>
                            <div className="relative">
                                <CreditCard className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                                <select
                                    value={selectedCardId}
                                    onChange={(e) => setSelectedCardId(e.target.value)}
                                    className="w-full bg-background/50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 text-slate-950 dark:text-white transition-all outline-none appearance-none cursor-pointer"
                                >
                                    <option value="" disabled className="dark:bg-slate-900">Selecione um cartão</option>
                                    {creditCards.map(card => (
                                        <option key={card.id} value={card.id} className="dark:bg-slate-900">{card.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

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
                            <button
                                onClick={() => setFilter('credit')}
                                className={cn("px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", filter === 'credit' ? "bg-orange-500/10 text-orange-500 shadow-sm" : "text-muted-foreground hover:text-foreground")}
                            >
                                Cartão
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
                            <div key={t.id} className="glass-card p-4 sm:p-5 flex items-center gap-3 sm:gap-4 group hover:scale-[1.01] transition-all relative overflow-hidden">
                                {/* Left: Action Icon */}
                                <button
                                    onClick={() => t.isAggregate 
                                        ? toggleInvoiceComplete(t.creditCardId, viewingMonth, viewingYear, t.isCompleted) 
                                        : toggleComplete(t.id)}
                                    className={cn(
                                        "p-2.5 sm:p-3 rounded-2xl transition-all shrink-0",
                                        t.isAggregate 
                                            ? (t.isCompleted ? "bg-orange-500/20 text-orange-500 shadow-lg shadow-orange-500/10" : "bg-secondary text-muted-foreground/30 hover:bg-secondary/80")
                                            : (t.isCompleted
                                                ? (t.type === 'income' ? "bg-success/20 text-success shadow-lg shadow-success/10" : "bg-destructive/20 text-destructive shadow-lg shadow-destructive/10")
                                                : "bg-secondary text-muted-foreground/30 hover:bg-secondary/80")
                                    )}
                                >
                                    {t.isAggregate ? <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 stroke-[3px]" /> :
                                     t.isCompleted ? <Check className="h-4 w-4 sm:h-5 sm:w-5 stroke-[3px]" /> : <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />}
                                </button>

                                {/* Middle: Description & Info */}
                                <div className="min-w-0 flex-1">
                                    <p className={cn("font-bold text-xs sm:text-base truncate leading-tight", t.isCompleted ? "text-slate-950 dark:text-white" : "text-slate-500 dark:text-muted-foreground/60")}>
                                        {t.description}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-muted-foreground/60">{t.category}</span>
                                        <span className="text-slate-400 dark:text-muted-foreground/30 hidden sm:inline">•</span>
                                        <span className="text-[9px] sm:text-[10px] font-medium text-slate-500 dark:text-muted-foreground/40 italic">
                                            {t.isAggregate ? `Vence em ${new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')}` : new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                                        </span>
                                        {t.isAggregate && (
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <button className="text-[9px] sm:text-[10px] font-bold text-primary/60 hover:text-primary transition-colors flex items-center gap-1">
                                                        <span className="hidden sm:inline">•</span>
                                                        <span className="underline decoration-primary/20 underline-offset-2">Detalhes ({t.details.length})</span>
                                                    </button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-md bg-background/95 backdrop-blur-xl border-white/10">
                                                    <DialogHeader>
                                                        <DialogTitle>Detalhamento: {t.description}</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="space-y-3 mt-4 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
                                                        {t.details.map((detail: any) => (
                                                            <div key={detail.id} className="flex justify-between items-center p-3 rounded-xl bg-secondary/30 border border-slate-200 dark:border-white/5">
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-bold truncate">{detail.description}</p>
                                                                    <p className="text-[10px] text-muted-foreground">{new Date(detail.date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <p className="text-sm font-black text-destructive">{formatCurrency(detail.value)}</p>
                                                                    <button onClick={() => deleteTransaction(detail.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors">
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        )}
                                    </div>
                                </div>

                                {/* Right: Value & Actions */}
                                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                                    <div className="text-right">
                                        <p className={cn("font-display font-black text-sm sm:text-lg leading-none", t.isCompleted ? (t.type === 'income' ? "text-success" : "text-destructive") : "text-slate-400 dark:text-muted-foreground/30")}>
                                            {t.type === 'income' ? '+' : '-'} {formatCurrency(t.value)}
                                        </p>
                                        <div className="flex items-center justify-end gap-1 mt-1 opacity-60">
                                            {t.paymentMethod === 'credit' ? <CreditCard className="h-2.5 w-2.5" /> : <Wallet className="h-2.5 w-2.5" />}
                                            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest">{t.paymentMethod === 'credit' ? 'Crédito' : 'Saldo'}</span>
                                        </div>
                                    </div>

                                    {/* Action Submenu */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors text-muted-foreground/40 hover:text-foreground">
                                                <MoreVertical className="h-4 w-4" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-40 bg-background/95 backdrop-blur-xl border-white/10">
                                            {!t.isAggregate ? (
                                                <>
                                                    <DropdownMenuItem onClick={() => handleEdit(t)} className="flex items-center gap-2 cursor-pointer">
                                                        <Edit2 className="h-4 w-4" />
                                                        <span>Editar</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => deleteTransaction(t.id)} className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                        <span>Excluir</span>
                                                    </DropdownMenuItem>
                                                </>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
