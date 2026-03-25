import type { Expense, CreateExpenseInput, UpdateExpenseInput } from "@/domain/entities";
import type { IExpenseService, MonthlyExpenseSummary } from "../interfaces/IExpenseService";
import type { ExpenseCategory } from "@/domain/enums";
import { mockExpenses } from "@/data";
import { format, subMonths, addMonths } from "date-fns";

export class MockExpenseService implements IExpenseService {
  private expenses = [...mockExpenses];

  async listExpenses(filters?: { month?: string; category?: ExpenseCategory; isPaid?: boolean }): Promise<Expense[]> {
    let result = [...this.expenses];
    if (filters?.month) result = result.filter((e) => e.referenceMonth === filters.month);
    if (filters?.category) result = result.filter((e) => e.category === filters.category);
    if (filters?.isPaid !== undefined) result = result.filter((e) => e.isPaid === filters.isPaid);
    return result.sort((a, b) => {
      if (a.referenceMonth !== b.referenceMonth) return b.referenceMonth.localeCompare(a.referenceMonth);
      return a.name.localeCompare(b.name);
    });
  }

  async getExpenseById(id: string): Promise<Expense | null> {
    return this.expenses.find((e) => e.id === id) ?? null;
  }

  async createExpense(input: CreateExpenseInput): Promise<Expense> {
    const now = new Date();
    const totalInstallments = input.installments && input.installments > 1 ? input.installments : undefined;
    const groupId = totalInstallments ? `grp-${Date.now()}` : undefined;

    const firstExpense: Expense = {
      id: `exp-${String(this.expenses.length + 1).padStart(3, "0")}`,
      name: input.name,
      category: input.category,
      amountInCents: input.amountInCents,
      recurrence: totalInstallments ? "monthly" : input.recurrence,
      dueDay: input.dueDay,
      isPaid: false,
      referenceMonth: input.referenceMonth,
      notes: input.notes,
      installmentTotal: totalInstallments,
      installmentCurrent: totalInstallments ? 1 : undefined,
      installmentGroupId: groupId,
      createdAt: now,
      updatedAt: now,
    };
    this.expenses.push(firstExpense);

    if (totalInstallments) {
      const baseDate = new Date(input.referenceMonth + "-01");
      for (let i = 2; i <= totalInstallments; i++) {
        const futureMonth = format(addMonths(baseDate, i - 1), "yyyy-MM");
        this.expenses.push({
          id: `exp-${String(this.expenses.length + 1).padStart(3, "0")}`,
          name: input.name,
          category: input.category,
          amountInCents: input.amountInCents,
          recurrence: "monthly",
          dueDay: input.dueDay,
          isPaid: false,
          referenceMonth: futureMonth,
          notes: input.notes,
          installmentTotal: totalInstallments,
          installmentCurrent: i,
          installmentGroupId: groupId,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return firstExpense;
  }

  async updateExpense(id: string, input: UpdateExpenseInput): Promise<Expense> {
    const expense = this.expenses.find((e) => e.id === id);
    if (!expense) throw new Error("Despesa não encontrada");
    Object.assign(expense, input, { updatedAt: new Date() });
    return expense;
  }

  async deleteExpense(id: string): Promise<void> {
    this.expenses = this.expenses.filter((e) => e.id !== id);
  }

  async markAsPaid(id: string): Promise<Expense> {
    const expense = this.expenses.find((e) => e.id === id);
    if (!expense) throw new Error("Despesa não encontrada");
    expense.isPaid = true;
    expense.paidAt = new Date();
    expense.updatedAt = new Date();
    return expense;
  }

  async getMonthlySummary(month: string): Promise<MonthlyExpenseSummary> {
    const monthExpenses = this.expenses.filter((e) => e.referenceMonth === month);
    const totalInCents = monthExpenses.reduce((sum, e) => sum + e.amountInCents, 0);
    const paidInCents = monthExpenses.filter((e) => e.isPaid).reduce((sum, e) => sum + e.amountInCents, 0);
    const byCategory: Partial<Record<ExpenseCategory, number>> = {};
    for (const e of monthExpenses) {
      byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amountInCents;
    }
    return {
      month,
      totalInCents,
      paidInCents,
      pendingInCents: totalInCents - paidInCents,
      byCategory,
    };
  }

  async getMonthlyExpenseTotals(months = 6): Promise<{ month: string; totalInCents: number }[]> {
    const result: { month: string; totalInCents: number }[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const month = format(subMonths(new Date(), i), "yyyy-MM");
      const total = this.expenses
        .filter((e) => e.referenceMonth === month)
        .reduce((sum, e) => sum + e.amountInCents, 0);
      result.push({ month, totalInCents: total });
    }
    return result;
  }

  async getMaterialPurchases(): Promise<import("../interfaces/IExpenseService").MaterialPurchase[]> {
    return [];
  }
}
