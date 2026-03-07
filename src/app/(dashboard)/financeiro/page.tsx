"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { ExpenseCostChart } from "@/components/dashboard/ExpenseCostChart";
import { IncomeVsExpenseChart } from "@/components/dashboard/IncomeVsExpenseChart";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { paymentService, stockService, expenseService } from "@/services";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { DollarSign, TrendingUp, Calendar, CreditCard, Package, Receipt, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { RevenueStats, MonthlyRevenue, CashFlowEntry } from "@/services/interfaces/IPaymentService";
import type { MonthlyStockCost } from "@/services/interfaces/IStockService";
import type { PaymentMethod } from "@/domain/enums";
import { PAYMENT_METHOD_LABELS } from "@/domain/enums";
import Link from "next/link";

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
  const [stockCosts, setStockCosts] = useState<MonthlyStockCost[]>([]);
  const [stockValue, setStockValue] = useState(0);
  const [expenseTotals, setExpenseTotals] = useState<{ month: string; totalInCents: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const currentMonth = format(new Date(), "yyyy-MM");

  useEffect(() => {
    async function load() {
      const from = startOfMonth(subMonths(new Date(), 0));
      const to = endOfMonth(new Date());
      const [s, m, cf, bd, expSummary, sc, sv, et] = await Promise.all([
        paymentService.getRevenueStats(),
        paymentService.getMonthlyRevenue(12),
        paymentService.getCashFlow(subMonths(new Date(), 2), to),
        paymentService.getPaymentMethodBreakdown(from, to),
        expenseService.getMonthlySummary(currentMonth),
        stockService.getMonthlyStockCosts(12),
        stockService.getTotalStockValueInCents(),
        expenseService.getMonthlyExpenseTotals(12),
      ]);
      setStats(s);
      setMonthly(m);
      setCashFlow(cf);
      setBreakdown(bd);
      setExpenseTotal(expSummary.totalInCents);
      setExpensePending(expSummary.pendingInCents);
      setStockCosts(sc);
      setStockValue(sv);
      setExpenseTotals(et);
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <LoadingPage />;

  const totalBreakdown = Object.values(breakdown).reduce((sum, v) => sum + v, 0);
  const thisMonthRevenue = stats?.thisMonthInCents ?? 0;
  const thisMonthStockCost = stockCosts.length > 0 ? stockCosts[stockCosts.length - 1].totalCostInCents : 0;
  const totalExpenses = expenseTotal + thisMonthStockCost;
  const profit = thisMonthRevenue - totalExpenses;

  // Build cost chart data (12 months): despesas + materiais stacked
  const allMonths = new Set([
    ...expenseTotals.map((e) => e.month),
    ...stockCosts.map((s) => s.month),
  ]);
  const costChartData = Array.from(allMonths)
    .sort()
    .map((month) => {
      const label = format(new Date(month + "-01"), "MMM yy", { locale: ptBR });
      const despesas = expenseTotals.find((e) => e.month === month)?.totalInCents ?? 0;
      const materiais = stockCosts.find((s) => s.month === month)?.totalCostInCents ?? 0;
      return { month: label, despesas, materiais };
    });

  // Build income vs expense chart data (12 months)
  const incomeVsExpenseData = monthly.map((m) => {
    const label = format(new Date(m.month + "-01"), "MMM yy", { locale: ptBR });
    const receita = m.amountInCents;
    const despesaVal = expenseTotals.find((e) => e.month === m.month)?.totalInCents ?? 0;
    const materialVal = stockCosts.find((s) => s.month === m.month)?.totalCostInCents ?? 0;
    return { month: label, receita, custos: despesaVal + materialVal };
  });

  return (
    <div>
      <Topbar title="Financeiro" subtitle="Fluxo de caixa e receitas" />

      <div className="p-6 animate-fade-in space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatsCard
            title="Hoje"
            value={formatCurrency(stats?.todayInCents ?? 0)}
            icon={<DollarSign className="w-5 h-5" />}
            color="green"
          />
          <StatsCard
            title="Esta Semana"
            value={formatCurrency(stats?.thisWeekInCents ?? 0)}
            icon={<Calendar className="w-5 h-5" />}
            color="blue"
          />
          <StatsCard
            title="Este Mês"
            value={formatCurrency(stats?.thisMonthInCents ?? 0)}
            icon={<TrendingUp className="w-5 h-5" />}
            trend={stats?.growthPercent}
            color="purple"
          />
          <StatsCard
            title="Mês Anterior"
            value={formatCurrency(stats?.lastMonthInCents ?? 0)}
            icon={<CreditCard className="w-5 h-5" />}
            color="amber"
          />
        </div>

        {/* Monthly Balance */}
        <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-6">
          <h3 className="font-semibold mb-4">
            Balanço do Mês — {format(new Date(), "MMMM yyyy", { locale: ptBR })}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                <p className="text-xs text-muted-foreground">Receita (Atendimentos)</p>
              </div>
              <p className="text-xl font-bold text-emerald-600">{formatCurrency(thisMonthRevenue)}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <ArrowDownRight className="w-4 h-4 text-red-500" />
                <p className="text-xs text-muted-foreground">Despesas + Materiais</p>
              </div>
              <p className="text-xl font-bold text-red-500">{formatCurrency(totalExpenses)}</p>
              <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                <Link href="/despesas" className="hover:text-brand-600">Contas: {formatCurrency(expenseTotal)}</Link>
                <Link href="/estoque" className="hover:text-brand-600">Estoque: {formatCurrency(thisMonthStockCost)}</Link>
              </div>
            </div>
            <div className={`p-4 rounded-xl ${profit >= 0 ? "bg-brand-50" : "bg-amber-50"}`}>
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-brand-600" />
                <p className="text-xs text-muted-foreground">Lucro Líquido</p>
              </div>
              <p className={`text-xl font-bold ${profit >= 0 ? "text-brand-700" : "text-red-600"}`}>
                {formatCurrency(profit)}
              </p>
            </div>
          </div>
          {expensePending > 0 && (
            <p className="text-xs text-amber-600 mt-3 flex items-center gap-1">
              <Receipt className="w-3 h-3" />
              {formatCurrency(expensePending)} em despesas pendentes este mês
            </p>
          )}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/estoque" className="bg-white rounded-2xl border border-brand-100 shadow-card p-5 hover:shadow-card-hover transition-shadow flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <Package className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <p className="text-sm font-semibold">Estoque de Materiais</p>
              <p className="text-xs text-muted-foreground">Valor em estoque: {formatCurrency(stockValue)}</p>
            </div>
          </Link>
          <Link href="/despesas" className="bg-white rounded-2xl border border-brand-100 shadow-card p-5 hover:shadow-card-hover transition-shadow flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <p className="text-sm font-semibold">Despesas Mensais</p>
              <p className="text-xs text-muted-foreground">Este mês: {formatCurrency(expenseTotal)}</p>
            </div>
          </Link>
        </div>

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
          <p className="text-xs text-muted-foreground mb-6">Despesas fixas/variáveis + materiais nos últimos 12 meses</p>
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
