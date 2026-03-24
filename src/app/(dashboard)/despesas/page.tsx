"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { useExpenses, useExpenseSummary } from "@/hooks/useExpenses";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "@/components/ui/toaster";
import {
  Receipt,
  Plus,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Repeat,
  CircleDot,
  LayoutGrid,
  List,
  CreditCard,
  Settings2,
  Pencil,
  ChevronDown,
} from "lucide-react";
import type { ExpenseCategory, ExpenseRecurrence } from "@/domain/enums";
import {
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_RECURRENCE_LABELS,
} from "@/domain/enums";
import { format, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

const DEFAULT_CATEGORIES: ExpenseCategory[] = [
  "aluguel", "energia", "agua", "internet", "telefone",
  "material", "marketing", "software", "manutencao",
  "transporte", "alimentacao", "impostos", "outros",
];

const RECURRENCES: ExpenseRecurrence[] = ["one_time", "monthly", "weekly", "yearly"];

const CATEGORY_ICON_COLORS = [
  "bg-purple-100 text-purple-700",
  "bg-amber-100 text-amber-700",
  "bg-blue-100 text-blue-700",
  "bg-indigo-100 text-indigo-700",
  "bg-teal-100 text-teal-700",
  "bg-brand-100 text-brand-700",
  "bg-pink-100 text-pink-700",
  "bg-sky-100 text-sky-700",
  "bg-orange-100 text-orange-700",
  "bg-lime-100 text-lime-700",
  "bg-rose-100 text-rose-700",
  "bg-red-100 text-red-700",
  "bg-emerald-100 text-emerald-700",
  "bg-cyan-100 text-cyan-700",
  "bg-violet-100 text-violet-700",
];

const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  aluguel: "bg-purple-100 text-purple-700",
  energia: "bg-amber-100 text-amber-700",
  agua: "bg-blue-100 text-blue-700",
  internet: "bg-indigo-100 text-indigo-700",
  telefone: "bg-teal-100 text-teal-700",
  material: "bg-brand-100 text-brand-700",
  marketing: "bg-pink-100 text-pink-700",
  software: "bg-sky-100 text-sky-700",
  manutencao: "bg-orange-100 text-orange-700",
  transporte: "bg-lime-100 text-lime-700",
  alimentacao: "bg-rose-100 text-rose-700",
  impostos: "bg-red-100 text-red-700",
  outros: "bg-neutral-100 text-neutral-700",
};

interface CustomCategory {
  id: string;
  label: string;
  color: string;
}

const STORAGE_KEY = "lashflow-custom-expense-categories";

function loadCustomCategories(): CustomCategory[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomCategories(cats: CustomCategory[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cats));
}

function getCategoryColor(cat: string, customCategories: CustomCategory[]): string {
  if (DEFAULT_CATEGORY_COLORS[cat]) return DEFAULT_CATEGORY_COLORS[cat];
  const custom = customCategories.find((c) => c.id === cat);
  return custom?.color ?? "bg-neutral-100 text-neutral-700";
}

function getCategoryLabel(cat: string, customCategories: CustomCategory[]): string {
  if (EXPENSE_CATEGORY_LABELS[cat as ExpenseCategory]) return EXPENSE_CATEGORY_LABELS[cat as ExpenseCategory];
  const custom = customCategories.find((c) => c.id === cat);
  return custom?.label ?? cat;
}

type ViewMode = "cards" | "table";

const EMPTY_FORM = {
  name: "",
  category: "outros" as string,
  amountInCents: "",
  recurrence: "one_time" as ExpenseRecurrence,
  dueDay: "",
  notes: "",
  installments: "",
};

export default function DespesasPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [currentMonth, setCurrentMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [catFilter, setCatFilter] = useState<string>("all");
  const [paidFilter, setPaidFilter] = useState<"all" | "paid" | "pending">("all");

  // Custom categories
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<CustomCategory | null>(null);
  const [catForm, setCatForm] = useState({ label: "", color: CATEGORY_ICON_COLORS[0] });

  // New expense modal
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCustomCategories(loadCustomCategories());
  }, []);

  const allCategoryIds = [...DEFAULT_CATEGORIES, ...customCategories.map((c) => c.id)];

  const { expenses, loading, createExpense, markAsPaid, deleteExpense } = useExpenses({
    month: currentMonth,
    category: catFilter !== "all" ? (catFilter as ExpenseCategory) : undefined,
    isPaid: paidFilter === "all" ? undefined : paidFilter === "paid",
  });
  const { summary, loading: summaryLoading } = useExpenseSummary(currentMonth);

  const [_y, _m] = currentMonth.split("-").map(Number);
  const monthLabel = format(new Date(_y, _m - 1, 1), "MMMM yyyy", { locale: ptBR });

  const showInstallments = form.recurrence !== "one_time";
  const recurrenceUnitLabel =
    form.recurrence === "monthly" ? "meses" :
    form.recurrence === "weekly" ? "semanas" :
    form.recurrence === "yearly" ? "anos" : "";

  const openForm = () => {
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    const amount = Math.round(parseFloat(form.amountInCents || "0") * 100);
    if (amount <= 0) {
      toast({ title: "Valor deve ser maior que 0", variant: "destructive" });
      return;
    }
    const installments = form.installments ? parseInt(form.installments) : undefined;
    if (installments !== undefined && installments < 1) {
      toast({ title: "Parcelas deve ser pelo menos 1", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await createExpense({
        name: form.name,
        category: form.category as ExpenseCategory,
        amountInCents: amount,
        recurrence: form.recurrence,
        dueDay: form.dueDay ? parseInt(form.dueDay) : undefined,
        referenceMonth: currentMonth,
        notes: form.notes || undefined,
        installments: installments && installments > 1 ? installments : undefined,
      });
      toast({ title: "Despesa cadastrada!", variant: "success" });
      setFormOpen(false);
    } catch {
      toast({ title: "Erro ao cadastrar despesa", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleMarkPaid = async (id: string) => {
    await markAsPaid(id);
    toast({ title: "Despesa marcada como paga!", variant: "success" });
  };

  const handleDelete = async (id: string) => {
    await deleteExpense(id);
    toast({ title: "Despesa removida", variant: "destructive" });
  };

  // Category CRUD
  const handleSaveCategory = () => {
    if (!catForm.label.trim()) {
      toast({ title: "Nome da categoria é obrigatório", variant: "destructive" });
      return;
    }
    let updated: CustomCategory[];
    if (editingCat) {
      updated = customCategories.map((c) =>
        c.id === editingCat.id ? { ...c, label: catForm.label.trim(), color: catForm.color } : c
      );
    } else {
      const id = catForm.label.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
      if (allCategoryIds.includes(id as ExpenseCategory)) {
        toast({ title: "Categoria já existe", variant: "destructive" });
        return;
      }
      updated = [...customCategories, { id, label: catForm.label.trim(), color: catForm.color }];
    }
    setCustomCategories(updated);
    saveCustomCategories(updated);
    setEditingCat(null);
    setCatForm({ label: "", color: CATEGORY_ICON_COLORS[0] });
    toast({ title: editingCat ? "Categoria atualizada!" : "Categoria criada!", variant: "success" });
  };

  const handleDeleteCategory = (id: string) => {
    const updated = customCategories.filter((c) => c.id !== id);
    setCustomCategories(updated);
    saveCustomCategories(updated);
    toast({ title: "Categoria removida", variant: "destructive" });
  };

  const startEditCategory = (cat: CustomCategory) => {
    setEditingCat(cat);
    setCatForm({ label: cat.label, color: cat.color });
  };

  const [calOpen, setCalOpen] = useState(true);

  if (loading && summaryLoading) return <LoadingPage />;

  return (
    <div>
      <Topbar title="Despesas" subtitle="Contas fixas, variáveis e pontuais" />

      <div className="p-4 sm:p-6 animate-fade-in space-y-5">

        {/* Stats — compact layout */}
        <div className="space-y-2">
          <div className="bg-white rounded-2xl border border-brand-100 shadow-card px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-4 h-4 text-brand-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-muted-foreground font-medium">Total do mês</p>
              <p className="text-lg font-bold text-foreground truncate">{formatCurrency(summary?.totalInCents ?? 0)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white rounded-2xl border border-brand-100 shadow-card px-3 py-2.5 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium">Pago</p>
                <p className="text-sm font-bold text-foreground truncate">{formatCurrency(summary?.paidInCents ?? 0)}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-brand-100 shadow-card px-3 py-2.5 flex items-center gap-2.5">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${summary?.pendingInCents ? "bg-red-100" : "bg-emerald-100"}`}>
                <AlertCircle className={`w-3.5 h-3.5 ${summary?.pendingInCents ? "text-red-600" : "text-emerald-600"}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium">Pendente</p>
                <p className="text-sm font-bold text-foreground truncate">{formatCurrency(summary?.pendingInCents ?? 0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Month calendar picker — collapsible */}
        <div className="bg-white rounded-2xl border border-brand-100 shadow-card overflow-hidden">
          <button
            onClick={() => setCalOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 sm:px-5 py-3 hover:bg-brand-50/50 transition-colors"
          >
            <span className="text-sm font-semibold capitalize">{monthLabel}</span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${calOpen ? "rotate-180" : ""}`} />
          </button>
          {calOpen && (
            <div className="px-4 sm:px-5 pb-4">
              <div className="flex items-center justify-between mb-3">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewYear((y) => y - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold">{viewYear}</h2>
                  {(viewYear !== new Date().getFullYear() || currentMonth !== format(new Date(), "yyyy-MM")) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2"
                      onClick={() => {
                        const today = format(new Date(), "yyyy-MM");
                        setCurrentMonth(today);
                        setViewYear(new Date().getFullYear());
                      }}
                    >
                      Hoje
                    </Button>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewYear((y) => y + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                {MONTH_NAMES.map((name, i) => {
                  const monthKey = `${viewYear}-${String(i + 1).padStart(2, "0")}`;
                  const isSelected = monthKey === currentMonth;
                  const monthDate = new Date(viewYear, i, 1);
                  const isToday = isSameMonth(monthDate, new Date());
                  const isFuture = monthDate > new Date();
                  return (
                    <button
                      key={monthKey}
                      onClick={() => setCurrentMonth(monthKey)}
                      className={cn(
                        "relative py-2 px-1 rounded-xl text-sm font-medium transition-all duration-200",
                        isSelected
                          ? "bg-brand-600 text-white shadow-sm"
                          : isFuture
                            ? "text-muted-foreground/50 hover:bg-brand-50"
                            : "text-foreground hover:bg-brand-50",
                      )}
                    >
                      {name}
                      {isToday && !isSelected && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Category breakdown */}
        {summary && Object.keys(summary.byCategory).length > 0 && (
          <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-4 sm:p-5">
            <h3 className="font-semibold mb-3 text-sm">Por Categoria</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
              {(Object.entries(summary.byCategory) as [string, number][])
                .sort(([, a], [, b]) => b - a)
                .map(([cat, amount]) => (
                  <div key={cat} className={`rounded-xl p-3 ${getCategoryColor(cat, customCategories).split(" ")[0]}`}>
                    <p className="text-xs text-muted-foreground truncate">{getCategoryLabel(cat, customCategories)}</p>
                    <p className="text-sm font-bold mt-1">{formatCurrency(amount)}</p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Action bar: filters + add button */}
        <div className="flex flex-wrap items-center gap-2">
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-[140px] sm:w-[180px] h-9 text-sm">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {DEFAULT_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{EXPENSE_CATEGORY_LABELS[c]}</SelectItem>
              ))}
              {customCategories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={paidFilter} onValueChange={(v) => setPaidFilter(v as "all" | "paid" | "pending")}>
            <SelectTrigger className="w-[120px] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="paid">Pagos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1 bg-brand-50 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-7 w-7 p-0", viewMode === "cards" && "bg-white shadow-sm")}
              onClick={() => setViewMode("cards")}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-7 w-7 p-0", viewMode === "table" && "bg-white shadow-sm")}
              onClick={() => setViewMode("table")}
            >
              <List className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-3 text-muted-foreground"
              onClick={() => {
                setEditingCat(null);
                setCatForm({ label: "", color: CATEGORY_ICON_COLORS[0] });
                setCatDialogOpen(true);
              }}
            >
              <Settings2 className="w-4 h-4" />
              <span className="hidden sm:inline ml-1.5">Categorias</span>
            </Button>
            <Button size="sm" className="h-9" onClick={openForm}>
              <Plus className="w-4 h-4" />
              <span className="hidden xs:inline sm:inline ml-1">Nova despesa</span>
            </Button>
          </div>
        </div>

        {/* Cards view */}
        {viewMode === "cards" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {expenses.map((exp) => (
              <div
                key={exp.id}
                className={`bg-white rounded-2xl border shadow-card p-4 transition-all ${
                  exp.isPaid ? "border-emerald-100" : "border-amber-100"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${getCategoryColor(exp.category, customCategories)}`}>
                      {getCategoryLabel(exp.category, customCategories).charAt(0)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{exp.name}</p>
                      <p className="text-xs text-muted-foreground">{getCategoryLabel(exp.category, customCategories)}</p>
                    </div>
                  </div>
                  <span className="flex-shrink-0 text-base font-bold ml-2">{formatCurrency(exp.amountInCents)}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-3">
                  {exp.recurrence === "one_time" ? (
                    <span className="flex items-center gap-1"><CircleDot className="w-3 h-3" /> Pontual</span>
                  ) : (
                    <span className="flex items-center gap-1"><Repeat className="w-3 h-3" /> {EXPENSE_RECURRENCE_LABELS[exp.recurrence]}</span>
                  )}
                  {exp.installmentTotal && exp.installmentTotal > 1 && (
                    <span className="flex items-center gap-1 font-semibold text-brand-600">
                      <CreditCard className="w-3 h-3" /> {exp.installmentCurrent}/{exp.installmentTotal}
                    </span>
                  )}
                  {exp.dueDay && (
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Vence dia {exp.dueDay}</span>
                  )}
                </div>

                {exp.notes && (
                  <p className="text-xs text-muted-foreground mb-3 italic truncate">{exp.notes}</p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-brand-50">
                  {exp.isPaid ? (
                    <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Pago
                    </span>
                  ) : (
                    <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 h-8 text-xs" onClick={() => handleMarkPaid(exp.id)}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Marcar Pago
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-600 h-8 w-8 p-0" onClick={() => handleDelete(exp.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            {expenses.length === 0 && (
              <div className="col-span-full text-center py-12 text-sm text-muted-foreground border border-dashed border-brand-200 rounded-2xl">
                Nenhuma despesa em {monthLabel}
              </div>
            )}
          </div>
        )}

        {/* List view */}
        {viewMode === "table" && (
          <div className="bg-white rounded-2xl border border-brand-100 shadow-card overflow-hidden">
            {expenses.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                Nenhuma despesa em {monthLabel}
              </div>
            ) : (
              <div className="divide-y divide-brand-50">
                {[...expenses]
                  .sort((a, b) => (a.dueDay ?? 32) - (b.dueDay ?? 32))
                  .map((exp) => (
                    <div
                      key={exp.id}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-brand-50/50",
                        exp.isPaid && "bg-emerald-50/30"
                      )}
                    >
                      {/* Due day */}
                      <div className="flex-shrink-0 w-8 text-center">
                        {exp.dueDay ? (
                          <span className={cn("text-base font-bold tabular-nums", exp.isPaid ? "text-emerald-500" : "text-amber-500")}>
                            {String(exp.dueDay).padStart(2, "0")}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground/40">—</span>
                        )}
                      </div>

                      {/* Category icon */}
                      <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${getCategoryColor(exp.category, customCategories)}`}>
                        {getCategoryLabel(exp.category, customCategories).charAt(0)}
                      </span>

                      {/* Name & details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold truncate">{exp.name}</p>
                          {exp.installmentTotal && exp.installmentTotal > 1 && (
                            <span className="flex-shrink-0 text-xs font-semibold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">
                              {exp.installmentCurrent}/{exp.installmentTotal}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                          <span>{getCategoryLabel(exp.category, customCategories)}</span>
                          <span className="text-muted-foreground/30">·</span>
                          <span>{exp.recurrence === "one_time" ? "Pontual" : EXPENSE_RECURRENCE_LABELS[exp.recurrence]}</span>
                          {exp.notes && (
                            <>
                              <span className="text-muted-foreground/30">·</span>
                              <span className="truncate italic max-w-[120px]">{exp.notes}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Amount */}
                      <span className="flex-shrink-0 text-sm font-bold">{formatCurrency(exp.amountInCents)}</span>

                      {/* Status & actions */}
                      <div className="flex-shrink-0 flex items-center gap-0.5">
                        {exp.isPaid ? (
                          <span className="w-8 h-8 flex items-center justify-center text-emerald-500">
                            <CheckCircle2 className="w-4 h-4" />
                          </span>
                        ) : (
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => handleMarkPaid(exp.id)} title="Marcar como pago">
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-300 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(exp.id)} title="Remover">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Nova Despesa modal ── */}
      <Dialog open={formOpen} onOpenChange={(o) => { if (!o) setFormOpen(false); }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-brand-500" />
              Nova Despesa — <span className="capitalize">{monthLabel}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nome da Despesa *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Aluguel, Conta de luz..."
                className="mt-1.5"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Valor (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.amountInCents}
                  onChange={(e) => setForm((f) => ({ ...f, amountInCents: e.target.value }))}
                  placeholder="0,00"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Dia de Vencimento</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={form.dueDay}
                  onChange={(e) => setForm((f) => ({ ...f, dueDay: e.target.value }))}
                  placeholder="—"
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between">
                  <Label>Categoria</Label>
                  <button
                    type="button"
                    className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-0.5"
                    onClick={() => {
                      setEditingCat(null);
                      setCatForm({ label: "", color: CATEGORY_ICON_COLORS[0] });
                      setFormOpen(false);
                      setCatDialogOpen(true);
                    }}
                  >
                    <Settings2 className="w-3 h-3" /> Gerenciar
                  </button>
                </div>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEFAULT_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{EXPENSE_CATEGORY_LABELS[c]}</SelectItem>
                    ))}
                    {customCategories.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">Personalizadas</div>
                        {customCategories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Recorrência</Label>
                <Select value={form.recurrence} onValueChange={(v) => setForm((f) => ({ ...f, recurrence: v as ExpenseRecurrence }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RECURRENCES.map((r) => (
                      <SelectItem key={r} value={r}>{EXPENSE_RECURRENCE_LABELS[r]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {showInstallments && (
              <div className="bg-brand-50/50 rounded-xl p-3 border border-brand-100">
                <Label className="flex items-center gap-1.5 text-sm">
                  <CreditCard className="w-3.5 h-3.5 text-brand-600" />
                  Quantidade de {recurrenceUnitLabel}
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="120"
                  value={form.installments}
                  onChange={(e) => setForm((f) => ({ ...f, installments: e.target.value }))}
                  placeholder="Ex: 3, 6, 12... (vazio = sem limite)"
                  className="mt-1.5"
                />
                {form.installments && parseInt(form.installments) > 1 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Serão criadas {form.installments} despesas (1/{form.installments}, 2/{form.installments}...)
                  </p>
                )}
              </div>
            )}

            <div>
              <Label>Observações</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Detalhes opcionais"
                className="mt-1.5"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setFormOpen(false)}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleCreate} disabled={saving}>
                {saving ? "Salvando..." : "Cadastrar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Category management modal ── */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="w-4 h-4" /> Gerenciar Categorias
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {customCategories.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Personalizadas</p>
                {customCategories.map((cat) => (
                  <div key={cat.id} className="flex items-center gap-2 p-2 rounded-lg border border-brand-50 bg-brand-50/30">
                    <span className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold ${cat.color}`}>
                      {cat.label.charAt(0)}
                    </span>
                    <span className="flex-1 text-sm font-medium">{cat.label}</span>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-brand-600" onClick={() => startEditCategory(cat)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-300 hover:text-red-600" onClick={() => handleDeleteCategory(cat.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className={cn("space-y-3", customCategories.length > 0 && "border-t pt-4")}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {editingCat ? "Editar categoria" : "Nova categoria"}
              </p>
              <div>
                <Label>Nome</Label>
                <Input
                  value={catForm.label}
                  onChange={(e) => setCatForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder="Ex: Assinatura, Seguro..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Cor</Label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {CATEGORY_ICON_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setCatForm((f) => ({ ...f, color }))}
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all",
                        color,
                        catForm.color === color ? "ring-2 ring-brand-500 ring-offset-1 scale-110" : "opacity-60 hover:opacity-100"
                      )}
                    >
                      {catForm.label ? catForm.label.charAt(0).toUpperCase() : "A"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleSaveCategory}>
                  {editingCat ? "Salvar" : "Criar Categoria"}
                </Button>
                {editingCat && (
                  <Button variant="outline" onClick={() => { setEditingCat(null); setCatForm({ label: "", color: CATEGORY_ICON_COLORS[0] }); }}>
                    Cancelar
                  </Button>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Categorias padrão</p>
              <div className="flex flex-wrap gap-1.5">
                {DEFAULT_CATEGORIES.map((c) => (
                  <span key={c} className={`text-xs px-2 py-1 rounded-md ${DEFAULT_CATEGORY_COLORS[c]}`}>
                    {EXPENSE_CATEGORY_LABELS[c]}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
