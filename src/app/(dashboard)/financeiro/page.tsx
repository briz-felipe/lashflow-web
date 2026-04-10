"use client";

import { ArrowDownRight, Calendar, CreditCard, DollarSign, Package, Receipt, TrendingUp } from "lucide-react";
import type { CashFlowEntry, MonthlyRevenue, RevenueStats } from "@/services/interfaces/IPaymentService";
import { addMonths, endOfMonth, format, isValid, parse, startOfMonth, subMonths } from "date-fns";
import { expenseService, paymentService, stockService } from "@/services";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { useEffect, useState } from "react";

import { ExpenseCostChart } from "@/components/dashboard/ExpenseCostChart";
import { IncomeVsExpenseChart } from "@/components/dashboard/IncomeVsExpenseChart";
import Link from "next/link";
import { LoadingPage } from "@/components/shared/LoadingSpinner";

import { PAYMENT_METHOD_LABELS } from "@/domain/enums";
import type { PaymentMethod } from "@/domain/enums";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { Topbar } from "@/components/layout/Topbar";
import { ptBR } from "date-fns/locale";

const METHOD_COLORS: Record<PaymentMethod, string> = {
  pix: "bg-emerald-400",
  credit_card: "bg-brand-500",
  debit_card: "bg-blue-500",
  cash: "bg-amber-500",
  bank_transfer: "bg-indigo-500",
  other: "bg-neutral-400",
};

export default function FinanceiroPage() {
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [monthly, setMonthly] = useState<MonthlyRevenue[]>([]);
  const [cashFlow, setCashFlow] = useState<CashFlowEntry[]>([]);
  const [breakdown, setBreakdown] = useState<Partial<Record<PaymentMethod, number>>>({});
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [expensePending, setExpensePending] = useState(0);
  const [expenseTotals, setExpenseTotals] = useState<{ month: string; totalInCents: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [materialCosts, setMaterialCosts] = useState<{ month: string; totalCostInCents: number }[]>([]);
  const [projectedRevenue, setProjectedRevenue] = useState<{ month: string; projectedInCents: number }[]>([]);
  const [projectedExpenses, setProjectedExpenses] = useState<{ month: string; projectedInCents: number }[]>([]);

  const currentMonth = format(new Date(), "yyyy-MM");

  useEffect(() => {
    async function load() {
      const from = startOfMonth(subMonths(new Date(), 0));
      const to = endOfMonth(new Date());
      try {
      const [s, m, cf, bd, expSummary, et, mc, pr, pe] = await Promise.all([
        paymentService.getRevenueStats(),
        paymentService.getMonthlyRevenue(12),
        paymentService.getCashFlow(subMonths(new Date(), 2), to),
        paymentService.getPaymentMethodBreakdown(from, to),
        expenseService.getMonthlySummary(currentMonth),
        expenseService.getMonthlyExpenseTotals(12),
        stockService.getMonthlyStockCosts(12),
        paymentService.getProjectedRevenue(),
        expenseService.getProjectedExpenses(),
      ]);
      setStats(s);
      setMonthly(m);
      setCashFlow(cf);
      setBreakdown(bd);
      setExpenseTotal(expSummary.totalInCents);
      setExpensePending(expSummary.pendingInCents);
      setExpenseTotals(et);
      setMaterialCosts(mc);
      setProjectedRevenue(pr);
      setProjectedExpenses(pe);
    } catch (err) {
      console.error("[financeiro] load error:", err);
    } finally {
      setLoading(false);
    }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <LoadingPage />;

  const totalBreakdown = Object.values(breakdown).reduce((sum, v) => sum + v, 0);
  const thisMonthRevenue = stats?.thisMonthInCents ?? 0;
  const totalExpenses = expenseTotal;
  const profit = thisMonthRevenue - totalExpenses;

  function parseMonthLabel(month: string): string {
    const d = parse(month, "yyyy-MM", new Date());
    return isValid(d) ? format(d, "MMM yy", { locale: ptBR }) : month;
  }

  // Build cost chart data (12 months) — expenses only
  const costChartData = expenseTotals
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((e) => ({
      month: parseMonthLabel(e.month),
      despesas: e.totalInCents,
      materiais: materialCosts.find((mc) => mc.month === e.month)?.totalCostInCents ?? 0,
    }));

  // Build income vs expense chart data (12 months)
  const incomeVsExpenseData = monthly.map((m) => {
    const label = parseMonthLabel(m.month);
    const receita = m.amountInCents;
    const custos = expenseTotals.find((e) => e.month === m.month)?.totalInCents ?? 0;
    return { month: label, receita, custos };
  });

  return (
    <div>
      <Topbar title="Financeiro" subtitle="Fluxo de caixa e receitas" />

      <div className="p-4 sm:p-6 animate-fade-in space-y-4">
        {/* Stats — compact layout */}
        <div className="space-y-2">
          {/* Receita do mês — destaque principal */}
          <div className="bg-white rounded-2xl border border-brand-100 shadow-card px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-muted-foreground font-medium">
                Receita do Mês — {format(new Date(), "MMM yyyy", { locale: ptBR })}
              </p>
              <p className="text-lg font-bold text-foreground truncate">{formatCurrency(thisMonthRevenue)}</p>
            </div>
            {stats?.growthPercent != null && stats.growthPercent !== 0 && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                stats.growthPercent > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
              }`}>
                {stats.growthPercent > 0 ? "+" : ""}{stats.growthPercent.toFixed(0)}%
              </span>
            )}
          </div>

          {/* 2x2 grid — Hoje, Semana, Custos, Lucro */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white rounded-2xl border border-brand-100 shadow-card px-3 py-2.5 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium">Hoje</p>
                <p className="text-sm font-bold text-foreground truncate">{formatCurrency(stats?.todayInCents ?? 0)}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-brand-100 shadow-card px-3 py-2.5 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium">Semana</p>
                <p className="text-sm font-bold text-foreground truncate">{formatCurrency(stats?.thisWeekInCents ?? 0)}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-brand-100 shadow-card px-3 py-2.5 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium">Custos</p>
                <p className="text-sm font-bold text-foreground truncate">{formatCurrency(totalExpenses)}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-brand-100 shadow-card px-3 py-2.5 flex items-center gap-2.5">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${profit >= 0 ? "bg-brand-100" : "bg-red-100"}`}>
                <DollarSign className={`w-3.5 h-3.5 ${profit >= 0 ? "text-brand-600" : "text-red-600"}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium">Lucro</p>
                <p className={`text-sm font-bold truncate ${profit >= 0 ? "text-brand-700" : "text-red-600"}`}>{formatCurrency(profit)}</p>
              </div>
            </div>
          </div>

          {/* Mês anterior — linha compacta */}
          <div className="bg-white rounded-2xl border border-brand-100 shadow-card px-3 py-2.5 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground font-medium">Mês Anterior</p>
              <p className="text-sm font-bold text-foreground truncate">{formatCurrency(stats?.lastMonthInCents ?? 0)}</p>
            </div>
          </div>

          {expensePending > 0 && (
            <p className="text-xs text-amber-600 flex items-center gap-1 px-1">
              <Receipt className="w-3 h-3" />
              {formatCurrency(expensePending)} em despesas pendentes
            </p>
          )}
        </div>


        {/* Quick links */}
        <div className="grid grid-cols-2 gap-2">
          <Link href="/estoque" className="bg-white rounded-2xl border border-brand-100 shadow-card px-3 py-2.5 hover:shadow-card-hover transition-shadow flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
              <Package className="w-3.5 h-3.5 text-brand-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold truncate">Estoque</p>
              <p className="text-[10px] text-muted-foreground truncate">Materiais e insumos</p>
            </div>
          </Link>
          <Link href="/despesas" className="bg-white rounded-2xl border border-brand-100 shadow-card px-3 py-2.5 hover:shadow-card-hover transition-shadow flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
              <Receipt className="w-3.5 h-3.5 text-brand-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold truncate">Despesas</p>
              <p className="text-[10px] text-muted-foreground truncate">{formatCurrency(expenseTotal)}</p>
            </div>
          </Link>
        </div>

        {/* Projeção — presente e futuro */}
        {(() => {
          const projectionMonths = [0, 1, 2].map((offset) =>
            format(addMonths(new Date(), offset), "yyyy-MM")
          );
          return (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold">Projeção</h2>
                <span className="text-xs text-muted-foreground">Entradas e saídas esperadas</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
                {projectionMonths.map((monthKey, idx) => {
                  const isCurrentMonth = idx === 0;
                  const projRev = projectedRevenue.find((p) => p.month === monthKey)?.projectedInCents ?? 0;
                  const projExp = projectedExpenses.find((p) => p.month === monthKey)?.projectedInCents ?? 0;
                  const saldo = projRev - projExp;
                  const label = parseMonthLabel(monthKey);
                  return (
                    <div
                      key={monthKey}
                      className={`flex-shrink-0 w-44 rounded-2xl border shadow-card p-3 ${
                        isCurrentMonth ? "bg-brand-50 border-brand-200" : "bg-white border-brand-100"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <p className="text-xs font-semibold capitalize">{label}</p>
                        {isCurrentMonth && (
                          <span className="text-[9px] font-semibold bg-brand-200 text-brand-700 px-1.5 py-0.5 rounded-full">
                            Atual
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">A receber</span>
                          <span className="text-xs font-semibold text-emerald-600">
                            {formatCurrency(projRev)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">A pagar</span>
                          <span className="text-xs font-semibold text-red-500">
                            {formatCurrency(projExp)}
                          </span>
                        </div>
                        <div className="border-t border-brand-100 pt-1.5 flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground font-medium">Saldo</span>
                          <span className={`text-xs font-bold ${saldo >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                            {saldo >= 0 ? "+" : ""}{formatCurrency(Math.abs(saldo))}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <div className="xl:col-span-2 bg-white rounded-2xl border border-brand-100 shadow-card p-6">
            <h3 className="font-semibold mb-6">Receita Mensal (12 meses)</h3>
            <RevenueChart data={monthly} />
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-6">
            <h3 className="font-semibold mb-4">Métodos de Pagamento</h3>
            <p className="text-xs text-muted-foreground mb-4">Mês atual</p>
            <div className="space-y-3">
              {(Object.entries(breakdown) as [PaymentMethod, number][])
                .filter(([, v]) => v > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([method, amount]) => {
                  const pct = totalBreakdown > 0 ? (amount / totalBreakdown) * 100 : 0;
                  return (
                    <div key={method}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{PAYMENT_METHOD_LABELS[method]}</span>
                        <span className="font-semibold">{formatCurrency(amount)}</span>
                      </div>
                      <div className="h-2 bg-brand-50 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${METHOD_COLORS[method]}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 text-right">
                        {pct.toFixed(1)}%
                      </p>
                    </div>
                  );
                })}
              {totalBreakdown === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum pagamento este mês
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Cost breakdown chart (12 months) */}
        <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-6">
          <h3 className="font-semibold mb-1">Custos ao Longo do Tempo</h3>
          <p className="text-xs text-muted-foreground mb-6">Despesas nos últimos 12 meses</p>
          <ExpenseCostChart data={costChartData} />
        </div>

        {/* Income vs Expense chart (12 months) */}
        <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-6">
          <h3 className="font-semibold mb-1">Entrada vs Saída</h3>
          <p className="text-xs text-muted-foreground mb-6">Receita comparada com custos totais nos últimos 12 meses</p>
          <IncomeVsExpenseChart data={incomeVsExpenseData} />
        </div>

        {/* Cash Flow Table */}
        <div className="bg-white rounded-2xl border border-brand-100 shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-brand-50">
            <h3 className="font-semibold">Fluxo de Caixa</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Últimos 2 meses</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-50">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-3">Data</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Cliente</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 hidden md:table-cell">Procedimento</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 hidden sm:table-cell">Método</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-6 py-3">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50">
                {cashFlow.slice(0, 30).map((entry, i) => (
                  <tr key={i} className="hover:bg-brand-50/50 transition-colors">
                    <td className="px-6 py-3 text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(entry.date)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{entry.clientName}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                      {entry.procedureName}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${METHOD_COLORS[entry.method]}`} />
                        <span className="text-sm text-muted-foreground">
                          {PAYMENT_METHOD_LABELS[entry.method]}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="text-sm font-semibold text-emerald-600">
                        {formatCurrency(entry.amountInCents)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
