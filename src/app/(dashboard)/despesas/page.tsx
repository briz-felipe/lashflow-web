"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
} from "lucide-react";
import type { ExpenseCategory, ExpenseRecurrence } from "@/domain/enums";
import {
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_RECURRENCE_LABELS,
} from "@/domain/enums";
import { format, addMonths, subMonths, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

const CATEGORIES: ExpenseCategory[] = [
  "aluguel", "energia", "agua", "internet", "telefone",
  "material", "marketing", "software", "manutencao",
  "transporte", "alimentacao", "impostos", "outros",
];

const RECURRENCES: ExpenseRecurrence[] = ["one_time", "monthly", "weekly", "yearly"];

const CATEGORY_ICON_COLOR: Record<string, string> = {
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

type Tab = "list" | "new";
type ViewMode = "cards" | "table";

export default function DespesasPage() {
  const [tab, setTab] = useState<Tab>("list");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [currentMonth, setCurrentMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [catFilter, setCatFilter] = useState<ExpenseCategory | "all">("all");
  const [paidFilter, setPaidFilter] = useState<"all" | "paid" | "pending">("all");

  const { expenses, loading, createExpense, markAsPaid, deleteExpense } = useExpenses({
    month: currentMonth,
    category: catFilter !== "all" ? catFilter : undefined,
    isPaid: paidFilter === "all" ? undefined : paidFilter === "paid",
  });
  const { summary, loading: summaryLoading } = useExpenseSummary(currentMonth);

  // Form state
  const [form, setForm] = useState({
    name: "", category: "outros" as ExpenseCategory,
    amountInCents: "", recurrence: "one_time" as ExpenseRecurrence,
    dueDay: "", notes: "",
  });

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
    await createExpense({
      name: form.name,
      category: form.category,
      amountInCents: amount,
      recurrence: form.recurrence,
      dueDay: form.dueDay ? parseInt(form.dueDay) : undefined,
      referenceMonth: currentMonth,
      notes: form.notes || undefined,
    });
    toast({ title: "Despesa cadastrada!", variant: "success" });
    setForm({ name: "", category: "outros", amountInCents: "", recurrence: "one_time", dueDay: "", notes: "" });
    setTab("list");
  };

  const handleMarkPaid = async (id: string) => {
    await markAsPaid(id);
    toast({ title: "Despesa marcada como paga!", variant: "success" });
  };

  const handleDelete = async (id: string) => {
    await deleteExpense(id);
    toast({ title: "Despesa removida", variant: "destructive" });
  };

  const monthLabel = format(new Date(currentMonth + "-01"), "MMMM yyyy", { locale: ptBR });

  if (loading && summaryLoading) return <LoadingPage />;

  return (
    <div>
      <Topbar title="Despesas" subtitle="Contas fixas, variáveis e pontuais" />

      <div className="p-4 sm:p-6 animate-fade-in space-y-6">
        {/* Month calendar picker */}
        <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="icon" onClick={() => setViewYear((y) => y - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold">{viewYear}</h2>
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
            <Button variant="ghost" size="icon" onClick={() => setViewYear((y) => y + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
            {MONTH_NAMES.map((name, i) => {
              const monthKey = `${viewYear}-${String(i + 1).padStart(2, "0")}`;
              const isSelected = monthKey === currentMonth;
              const isToday = isSameMonth(new Date(monthKey + "-01"), new Date());
              const isFuture = new Date(monthKey + "-01") > new Date();
              return (
                <button
                  key={monthKey}
                  onClick={() => setCurrentMonth(monthKey)}
                  className={cn(
                    "relative py-2.5 px-1 rounded-xl text-sm font-medium transition-all duration-200",
                    isSelected
                      ? "bg-brand-600 text-white shadow-sm"
                      : isFuture
                        ? "text-muted-foreground/50 hover:bg-brand-50"
                        : "text-foreground hover:bg-brand-50",
                  )}
                >
                  {name}
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-500" />
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center capitalize">
            {monthLabel}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard
            title="Total do Mês"
            value={formatCurrency(summary?.totalInCents ?? 0)}
            icon={<DollarSign className="w-5 h-5" />}
            color="purple"
          />
          <StatsCard
            title="Pago"
            value={formatCurrency(summary?.paidInCents ?? 0)}
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="green"
          />
          <StatsCard
            title="Pendente"
            value={formatCurrency(summary?.pendingInCents ?? 0)}
            icon={<AlertCircle className="w-5 h-5" />}
            color={summary?.pendingInCents ? "red" : "green"}
          />
        </div>

        {/* Category breakdown */}
        {summary && Object.keys(summary.byCategory).length > 0 && (
          <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-6">
            <h3 className="font-semibold mb-4">Despesas por Categoria</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {(Object.entries(summary.byCategory) as [ExpenseCategory, number][])
                .sort(([, a], [, b]) => b - a)
                .map(([cat, amount]) => (
                  <div key={cat} className={`rounded-xl p-3 ${CATEGORY_ICON_COLOR[cat]?.split(" ")[0] ?? "bg-neutral-100"}`}>
                    <p className="text-xs text-muted-foreground">{EXPENSE_CATEGORY_LABELS[cat]}</p>
                    <p className="text-sm font-bold mt-1">{formatCurrency(amount)}</p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2">
          <Button variant={tab === "list" ? "default" : "outline"} size="sm" onClick={() => setTab("list")}>
            <Receipt className="w-4 h-4" /> Lista
          </Button>
          <Button variant={tab === "new" ? "default" : "outline"} size="sm" onClick={() => setTab("new")}>
            <Plus className="w-4 h-4" /> Nova Despesa
          </Button>
        </div>

        {/* Expense list */}
        {tab === "list" && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <Select value={catFilter} onValueChange={(v) => setCatFilter(v as ExpenseCategory | "all")}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{EXPENSE_CATEGORY_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={paidFilter} onValueChange={(v) => setPaidFilter(v as "all" | "paid" | "pending")}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="paid">Pagos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {expenses.map((exp) => (
                <div
                  key={exp.id}
                  className={`bg-white rounded-2xl border shadow-card p-5 transition-all ${
                    exp.isPaid ? "border-emerald-100" : "border-amber-100"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${CATEGORY_ICON_COLOR[exp.category] ?? "bg-neutral-100 text-neutral-700"}`}>
                        {EXPENSE_CATEGORY_LABELS[exp.category].charAt(0)}
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{exp.name}</p>
                        <p className="text-xs text-muted-foreground">{EXPENSE_CATEGORY_LABELS[exp.category]}</p>
                      </div>
                    </div>
                    <span className="text-base font-bold">{formatCurrency(exp.amountInCents)}</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    {exp.recurrence === "one_time" ? (
                      <span className="flex items-center gap-1"><CircleDot className="w-3 h-3" /> Pontual</span>
                    ) : (
                      <span className="flex items-center gap-1"><Repeat className="w-3 h-3" /> {EXPENSE_RECURRENCE_LABELS[exp.recurrence]}</span>
                    )}
                    {exp.dueDay && (
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Vence dia {exp.dueDay}</span>
                    )}
                  </div>

                  {exp.notes && (
                    <p className="text-xs text-muted-foreground mb-3 italic">{exp.notes}</p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-brand-50">
                    {exp.isPaid ? (
                      <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Pago
                      </span>
                    ) : (
                      <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => handleMarkPaid(exp.id)}>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Marcar Pago
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-600" onClick={() => handleDelete(exp.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {expenses.length === 0 && (
                <div className="col-span-full text-center py-8 text-sm text-muted-foreground">
                  Nenhuma despesa neste mês
                </div>
              )}
            </div>
          </div>
        )}

        {/* New expense form */}
        {tab === "new" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-6 sm:p-8">
              <h3 className="font-semibold mb-5 flex items-center gap-2 text-brand-700 text-base">
                <Plus className="w-4 h-4" /> Nova Despesa — {monthLabel}
              </h3>
              <div className="space-y-4">
                <div>
                  <Label>Nome da Despesa *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Ex: Aluguel, Conta de luz..."
                    className="mt-1.5"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Descrição curta para identificar a conta</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Categoria</Label>
                    <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as ExpenseCategory }))}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>{EXPENSE_CATEGORY_LABELS[c]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">Tipo de gasto para organizar</p>
                  </div>
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
                    <p className="text-xs text-muted-foreground mt-1">Quanto custa essa despesa</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                    <p className="text-xs text-muted-foreground mt-1">
                      {form.recurrence === "one_time" ? "Gasto único, não se repete" : form.recurrence === "monthly" ? "Paga todo mês (aluguel, internet...)" : form.recurrence === "weekly" ? "Paga toda semana" : "Paga uma vez por ano"}
                    </p>
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
                <div>
                  <Label>Observações</Label>
                  <Input
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Detalhes opcionais"
                    className="mt-1.5"
                  />
                </div>
                <Button className="w-full h-11" onClick={handleCreate}>
                  <Plus className="w-4 h-4" /> Cadastrar Despesa
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
