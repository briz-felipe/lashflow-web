import { api } from "@/lib/api";
import type { Payment, CreatePaymentInput } from "@/domain/entities";
import type {
  IPaymentService,
  CashFlowEntry,
  RevenueStats,
  MonthlyRevenue,
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
    const data = await api.get<{ data: Payment[] } | Payment[]>("/payments/");
    return Array.isArray(data) ? data : data.data;
  }

  getCashFlow(from: Date, to: Date): Promise<CashFlowEntry[]> {
    return api.get(`/payments/cash-flow?from=${from.toISOString()}&to=${to.toISOString()}`);
  }

  getRevenueStats(): Promise<RevenueStats> {
    return api.get("/payments/stats");
  }

  getMonthlyRevenue(months = 6): Promise<MonthlyRevenue[]> {
    return api.get(`/payments/monthly-revenue?months=${months}`);
  }

  getPaymentMethodBreakdown(from: Date, to: Date): Promise<Record<PaymentMethod, number>> {
    return api.get(`/payments/method-breakdown?from=${from.toISOString()}&to=${to.toISOString()}`);
  }
}
