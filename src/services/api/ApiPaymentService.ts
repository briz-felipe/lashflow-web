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

  getPaymentMethodBreakdown(from: Date, to: Date): Promise<Record<PaymentMethod, number>> {
    return api.get(`/payments/method-breakdown?from=${from.toISOString()}&to=${to.toISOString()}`);
  }
}
