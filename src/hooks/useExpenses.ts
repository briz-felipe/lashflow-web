"use client";

import { useState, useEffect, useCallback } from "react";
import { expenseService } from "@/services";
import type { Expense, CreateExpenseInput, UpdateExpenseInput } from "@/domain/entities";
import type { ExpenseCategory } from "@/domain/enums";
import type { MonthlyExpenseSummary, MaterialPurchase } from "@/services/interfaces/IExpenseService";

export function useExpenses(filters?: { month?: string; category?: ExpenseCategory; isPaid?: boolean }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const filtersKey = JSON.stringify(filters);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await expenseService.listExpenses(filters);
    setExpenses(result);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  useEffect(() => { load(); }, [load]);

  const createExpense = useCallback(async (input: CreateExpenseInput) => {
    const exp = await expenseService.createExpense(input);
    await load();
    return exp;
  }, [load]);

  const updateExpense = useCallback(async (id: string, input: UpdateExpenseInput) => {
    const exp = await expenseService.updateExpense(id, input);
    await load();
    return exp;
  }, [load]);

  const deleteExpense = useCallback(async (id: string) => {
    await expenseService.deleteExpense(id);
    await load();
  }, [load]);

  const markAsPaid = useCallback(async (id: string) => {
    await expenseService.markAsPaid(id);
    await load();
  }, [load]);

  return { expenses, loading, reload: load, createExpense, updateExpense, deleteExpense, markAsPaid };
}

export function useExpenseSummary(month: string) {
  const [summary, setSummary] = useState<MonthlyExpenseSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    expenseService.getMonthlySummary(month).then((s) => {
      if (mounted) { setSummary(s); setLoading(false); }
    });
    return () => { mounted = false; };
  }, [month]);

  return { summary, loading };
}

export function useMonthlyExpenseTotals(months = 6) {
  const [totals, setTotals] = useState<{ month: string; totalInCents: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    expenseService.getMonthlyExpenseTotals(months).then((t) => {
      if (mounted) { setTotals(t); setLoading(false); }
    });
    return () => { mounted = false; };
  }, [months]);

  return { totals, loading };
}

export function useMaterialPurchases(month?: string) {
  const [purchases, setPurchases] = useState<MaterialPurchase[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await expenseService.getMaterialPurchases(month);
    setPurchases(result);
    setLoading(false);
  }, [month]);

  useEffect(() => { load(); }, [load]);

  return { purchases, loading, reload: load };
}
