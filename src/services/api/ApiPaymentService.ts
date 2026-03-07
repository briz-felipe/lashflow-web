import type { Payment, CreatePaymentInput } from "@/domain/entities";
import type {
  IPaymentService,
  CashFlowEntry,
  RevenueStats,
  MonthlyRevenue,
} from "../interfaces/IPaymentService";
import type { PaymentMethod } from "@/domain/enums";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export class ApiPaymentService implements IPaymentService {
  async createPayment(input: CreatePaymentInput): Promise<Payment> {
    const res = await fetch(`${BASE_URL}/pagamentos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Erro ao criar pagamento");
    return res.json();
  }

  async updatePayment(id: string, input: Partial<Payment>): Promise<Payment> {
    const res = await fetch(`${BASE_URL}/pagamentos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Erro ao atualizar pagamento");
    return res.json();
  }

  async getPaymentByAppointmentId(appointmentId: string): Promise<Payment | null> {
    const res = await fetch(`${BASE_URL}/pagamentos?appointmentId=${appointmentId}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Erro ao buscar pagamento");
    const data = await res.json();
    return data[0] ?? null;
  }

  async listPayments(): Promise<Payment[]> {
    const res = await fetch(`${BASE_URL}/pagamentos`);
    if (!res.ok) throw new Error("Erro ao listar pagamentos");
    return res.json();
  }

  async getCashFlow(from: Date, to: Date): Promise<CashFlowEntry[]> {
    const params = `from=${from.toISOString()}&to=${to.toISOString()}`;
    const res = await fetch(`${BASE_URL}/pagamentos/cash-flow?${params}`);
    if (!res.ok) throw new Error("Erro ao buscar fluxo de caixa");
    return res.json();
  }

  async getRevenueStats(): Promise<RevenueStats> {
    const res = await fetch(`${BASE_URL}/pagamentos/stats`);
    if (!res.ok) throw new Error("Erro ao buscar stats");
    return res.json();
  }

  async getMonthlyRevenue(months = 6): Promise<MonthlyRevenue[]> {
    const res = await fetch(`${BASE_URL}/pagamentos/monthly?months=${months}`);
    if (!res.ok) throw new Error("Erro ao buscar receita mensal");
    return res.json();
  }

  async getPaymentMethodBreakdown(from: Date, to: Date): Promise<Record<PaymentMethod, number>> {
    const params = `from=${from.toISOString()}&to=${to.toISOString()}`;
    const res = await fetch(`${BASE_URL}/pagamentos/breakdown?${params}`);
    if (!res.ok) throw new Error("Erro ao buscar breakdown");
    return res.json();
  }
}
