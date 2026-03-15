import { api } from "@/lib/api";
import type { Expense, CreateExpenseInput, UpdateExpenseInput } from "@/domain/entities";
import type { IExpenseService, MonthlyExpenseSummary } from "../interfaces/IExpenseService";
import type { ExpenseCategory } from "@/domain/enums";

export class ApiExpenseService implements IExpenseService {
  async listExpenses(filters?: { month?: string; category?: ExpenseCategory; isPaid?: boolean }): Promise<Expense[]> {
    const params = new URLSearchParams();
    if (filters?.month) params.set("month", filters.month);
    if (filters?.category) params.set("category", filters.category);
    if (filters?.isPaid !== undefined) params.set("isPaid", String(filters.isPaid));
    return api.get(`/expenses/?${params}`);
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

  getMonthlyExpenseTotals(months = 6): Promise<{ month: string; totalInCents: number }[]> {
    return api.get(`/expenses/monthly-totals?months=${months}`);
  }
}
