import type { ExpenseCategory, ExpenseRecurrence } from "../enums";

export interface Expense {
  id: string;
  name: string;
  category: ExpenseCategory;
  amountInCents: number;
  recurrence: ExpenseRecurrence;
  dueDay?: number;
  isPaid: boolean;
  paidAt?: Date;
  referenceMonth: string;
  notes?: string;
  /** Installment tracking (parcelamento) */
  installmentTotal?: number;
  installmentCurrent?: number;
  installmentGroupId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateExpenseInput = Pick<
  Expense,
  "name" | "category" | "amountInCents" | "recurrence" | "dueDay" | "referenceMonth" | "notes"
> & {
  installments?: number;
};

export type UpdateExpenseInput = Partial<CreateExpenseInput> & {
  isPaid?: boolean;
  paidAt?: Date;
};
