import { api } from "@/lib/api";
import type { Payment, CreatePaymentInput } from "@/domain/entities";
import type {
  IPaymentService,
  CashFlowEntry,
  RevenueStats,
  MonthlyRevenue,
  ProjectedMonthItem,
} from "../interfaces/IPaymentService";
import type { PaymentMethod } from "@/domain/enums";

export class ApiPaymentService implements IPaymentService {
  createPayment(input: CreatePaymentInput): Promise<Payment> {
    return api.post("/payments/", input);
  }

  updatePayment(id: string, input: Partial<Payment>): Promise<Payment> {
    return api.patch(`/payments/${id}`, input);
  }

  getPaymentByAppointmentId(appointmentId: string): Promise<Payment | null> {
    return api.get(`/payments/by-appointment/${appointmentId}`);
  }

  async listPayments(): Promise<Payment[]> {
    const data = await api.get<{ data: Payment[] } | Payment[]>("/payments");
    return Array.isArray(data) ? data : data.data;
  }

  async getCashFlow(from: Date, to: Date): Promise<CashFlowEntry[]> {
    const data = await api.get<Array<{
      paidAmountInCents: number;
      totalAmountInCents: number;
      method: PaymentMethod;
      appointmentId: string;
      clientName: string;
      procedureName: string;
      createdAt: string;
    }>>(`/payments/cash-flow?from=${from.toISOString()}&to=${to.toISOString()}`);
    return data.map((r) => ({
      date: new Date(r.createdAt),
      amountInCents: r.paidAmountInCents,
      method: r.method,
      appointmentId: r.appointmentId,
      clientName: r.clientName,
      procedureName: r.procedureName,
    }));
  }

  getRevenueStats(): Promise<RevenueStats> {
    return api.get("/payments/stats");
  }

  getMonthlyRevenue(months = 6): Promise<MonthlyRevenue[]> {
    return api.get(`/payments/monthly-revenue?months=${months}`);
  }

  async getProjectedRevenue(): Promise<ProjectedMonthItem[]> {
    const data = await api.get<Array<{ month: string; projected_in_cents?: number; projectedInCents?: number }>>("/payments/projected");
    return data.map((d) => ({ month: d.month, projectedInCents: d.projected_in_cents ?? d.projectedInCents ?? 0 }));
  }

  async getPaymentMethodBreakdown(from: Date, to: Date): Promise<Record<PaymentMethod, number>> {
    const raw = await api.get<Record<string, number>>(`/payments/method-breakdown?from=${from.toISOString()}&to=${to.toISOString()}`);
    // Normalize camelCase keys from backend to snake_case PaymentMethod enum
    const CAMEL_TO_SNAKE: Record<string, PaymentMethod> = {
      cash: "cash", creditCard: "credit_card", debitCard: "debit_card",
      pix: "pix", bankTransfer: "bank_transfer", other: "other",
      // Also accept snake_case directly (in case backend changes)
      credit_card: "credit_card", debit_card: "debit_card", bank_transfer: "bank_transfer",
    };
    const normalized: Record<string, number> = {};
    for (const [key, value] of Object.entries(raw)) {
      const snakeKey = CAMEL_TO_SNAKE[key] ?? key;
      normalized[snakeKey] = value;
    }
    return normalized as Record<PaymentMethod, number>;
  }
}
