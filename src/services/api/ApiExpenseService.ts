import { api } from "@/lib/api";
import type { Expense, CreateExpenseInput, UpdateExpenseInput } from "@/domain/entities";
import type { IExpenseService, MonthlyExpenseSummary, MaterialPurchase } from "../interfaces/IExpenseService";
import type { ExpenseCategory } from "@/domain/enums";

export class ApiExpenseService implements IExpenseService {
  async listExpenses(filters?: { month?: string; category?: ExpenseCategory; isPaid?: boolean }): Promise<Expense[]> {
    const params = new URLSearchParams();
    if (filters?.month) params.set("month", filters.month);
    if (filters?.category) params.set("category", filters.category);
    if (filters?.isPaid !== undefined) params.set("is_paid", String(filters.isPaid));
    const qs = params.toString();
    return api.get(`/expenses/${qs ? `?${qs}` : ""}`);
  }

  getExpenseById(id: string): Promise<Expense | null> {
    return api.get(`/expenses/${id}`);
  }

  createExpense(input: CreateExpenseInput): Promise<Expense> {
    return api.post("/expenses/", input);
  }

  updateExpense(id: string, input: UpdateExpenseInput): Promise<Expense> {
    return api.patch(`/expenses/${id}`, input);
  }

  deleteExpense(id: string): Promise<void> {
    return api.delete(`/expenses/${id}`);
  }

  markAsPaid(id: string): Promise<Expense> {
    return api.patch(`/expenses/${id}/pay`);
  }

  getMonthlySummary(month: string): Promise<MonthlyExpenseSummary> {
    return api.get(`/expenses/summary?month=${month}`);
  }

  async getMonthlyExpenseTotals(months = 6): Promise<{ month: string; totalInCents: number }[]> {
    const data = await api.get<Array<{ month: string; total_in_cents?: number; totalInCents?: number }>>(`/expenses/monthly-totals?months=${months}`);
    return data.map((d) => ({ month: d.month, totalInCents: d.total_in_cents ?? d.totalInCents ?? 0 }));
  }

  getMaterialPurchases(month?: string): Promise<MaterialPurchase[]> {
    const qs = month ? `?month=${month}` : "";
    return api.get(`/expenses/material-purchases${qs}`);
  }
}
