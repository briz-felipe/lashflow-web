import type { Expense, CreateExpenseInput, UpdateExpenseInput } from "@/domain/entities";
import type { IExpenseService, MonthlyExpenseSummary } from "../interfaces/IExpenseService";
import type { ExpenseCategory } from "@/domain/enums";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export class ApiExpenseService implements IExpenseService {
  async listExpenses(filters?: { month?: string; category?: ExpenseCategory; isPaid?: boolean }): Promise<Expense[]> {
    const params = new URLSearchParams();
    if (filters?.month) params.set("month", filters.month);
    if (filters?.category) params.set("category", filters.category);
    if (filters?.isPaid !== undefined) params.set("isPaid", String(filters.isPaid));
    const res = await fetch(`${BASE_URL}/expenses?${params}`);
    if (!res.ok) throw new Error("Erro ao listar despesas");
    return res.json();
  }

  async getExpenseById(id: string): Promise<Expense | null> {
    const res = await fetch(`${BASE_URL}/expenses/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Erro ao buscar despesa");
    return res.json();
  }

  async createExpense(input: CreateExpenseInput): Promise<Expense> {
    const res = await fetch(`${BASE_URL}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Erro ao criar despesa");
    return res.json();
  }

  async updateExpense(id: string, input: UpdateExpenseInput): Promise<Expense> {
    const res = await fetch(`${BASE_URL}/expenses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Erro ao atualizar despesa");
    return res.json();
  }

  async deleteExpense(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/expenses/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Erro ao deletar despesa");
  }

  async markAsPaid(id: string): Promise<Expense> {
    const res = await fetch(`${BASE_URL}/expenses/${id}/pay`, { method: "POST" });
    if (!res.ok) throw new Error("Erro ao marcar como pago");
    return res.json();
  }

  async getMonthlySummary(month: string): Promise<MonthlyExpenseSummary> {
    const res = await fetch(`${BASE_URL}/expenses/summary?month=${month}`);
    if (!res.ok) throw new Error("Erro ao buscar resumo mensal");
    return res.json();
  }

  async getMonthlyExpenseTotals(months = 6): Promise<{ month: string; totalInCents: number }[]> {
    const res = await fetch(`${BASE_URL}/expenses/monthly-totals?months=${months}`);
    if (!res.ok) throw new Error("Erro ao buscar totais mensais");
    return res.json();
  }
}
