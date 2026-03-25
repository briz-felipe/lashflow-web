import type { Expense, CreateExpenseInput, UpdateExpenseInput } from "@/domain/entities";
import type { ExpenseCategory } from "@/domain/enums";

export interface MonthlyExpenseSummary {
  month: string;
  totalInCents: number;
  paidInCents: number;
  pendingInCents: number;
  byCategory: Partial<Record<ExpenseCategory, number>>;
}

export interface LinkedMaterialItem {
  materialName: string;
  quantity: number;
  unitCostInCents: number;
  totalCostInCents: number;
  date: string;
}

export interface MaterialPurchase {
  expense: Expense;
  linkedMaterials: LinkedMaterialItem[];
}

export interface IExpenseService {
  listExpenses(filters?: { month?: string; category?: ExpenseCategory; isPaid?: boolean }): Promise<Expense[]>;
  getExpenseById(id: string): Promise<Expense | null>;
  createExpense(input: CreateExpenseInput): Promise<Expense>;
  updateExpense(id: string, input: UpdateExpenseInput): Promise<Expense>;
  deleteExpense(id: string): Promise<void>;
  markAsPaid(id: string): Promise<Expense>;

  // Analytics
  getMonthlySummary(month: string): Promise<MonthlyExpenseSummary>;
  getMonthlyExpenseTotals(months?: number): Promise<{ month: string; totalInCents: number }[]>;

  // Material purchases
  getMaterialPurchases(month?: string): Promise<MaterialPurchase[]>;
}
