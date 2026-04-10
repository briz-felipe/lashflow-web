import type { Payment, CreatePaymentInput } from "@/domain/entities";
import type { PaymentMethod } from "@/domain/enums";

export interface CashFlowEntry {
  date: Date;
  amountInCents: number;
  method: PaymentMethod;
  appointmentId: string;
  clientName: string;
  procedureName: string;
}

export interface RevenueStats {
  todayInCents: number;
  thisWeekInCents: number;
  thisMonthInCents: number;
  lastMonthInCents: number;
  growthPercent: number;
}

export interface MonthlyRevenue {
  month: string;
  amountInCents: number;
}

export interface ProjectedMonthItem {
  month: string;
  projectedInCents: number;
}

export interface IPaymentService {
  createPayment(input: CreatePaymentInput): Promise<Payment>;
  updatePayment(id: string, input: Partial<Payment>): Promise<Payment>;
  getPaymentByAppointmentId(appointmentId: string): Promise<Payment | null>;
  listPayments(): Promise<Payment[]>;
  getCashFlow(from: Date, to: Date): Promise<CashFlowEntry[]>;
  getRevenueStats(): Promise<RevenueStats>;
  getMonthlyRevenue(months?: number): Promise<MonthlyRevenue[]>;
  getPaymentMethodBreakdown(from: Date, to: Date): Promise<Record<PaymentMethod, number>>;
  getProjectedRevenue(): Promise<ProjectedMonthItem[]>;
}
