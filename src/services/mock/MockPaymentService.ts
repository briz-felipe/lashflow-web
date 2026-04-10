import type { Payment, CreatePaymentInput } from "@/domain/entities";
import type {
  IPaymentService,
  CashFlowEntry,
  RevenueStats,
  MonthlyRevenue,
} from "../interfaces/IPaymentService";
import type { PaymentMethod } from "@/domain/enums";
import { mockPayments } from "@/data";
import { mockClients } from "@/data";
import { mockProcedures } from "@/data";
import { mockAppointments } from "@/data";
import {
  isToday,
  isThisWeek,
  isThisMonth,
  subMonths,
  startOfMonth,
  endOfMonth,
  format,
  isSameMonth,
} from "date-fns";
import { ptBR } from "date-fns/locale";

export class MockPaymentService implements IPaymentService {
  private payments: Payment[] = mockPayments.map((p) => ({ ...p }));

  async createPayment(input: CreatePaymentInput): Promise<Payment> {
    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      appointmentId: input.appointmentId,
      clientId: input.clientId,
      subtotalAmountInCents: input.subtotalAmountInCents ?? input.totalAmountInCents,
      discountAmountInCents: input.discountAmountInCents ?? 0,
      feeAmountInCents: input.feeAmountInCents ?? 0,
      totalAmountInCents: input.totalAmountInCents,
      paidAmountInCents: 0,
      status: "pending",
      method: input.method,
      notes: input.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.payments.push(newPayment);
    return newPayment;
  }

  async updatePayment(id: string, input: Partial<Payment>): Promise<Payment> {
    const idx = this.payments.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Pagamento não encontrado");
    this.payments[idx] = { ...this.payments[idx], ...input, updatedAt: new Date() };
    return this.payments[idx];
  }

  async getPaymentByAppointmentId(appointmentId: string): Promise<Payment | null> {
    return this.payments.find((p) => p.appointmentId === appointmentId) ?? null;
  }

  async listPayments(): Promise<Payment[]> {
    return [...this.payments].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getCashFlow(from: Date, to: Date): Promise<CashFlowEntry[]> {
    return this.payments
      .filter(
        (p) =>
          p.status === "paid" &&
          p.paidAt &&
          p.paidAt >= from &&
          p.paidAt <= to
      )
      .map((p) => {
        const appointment = mockAppointments.find((a) => a.id === p.appointmentId);
        const client = mockClients.find((c) => c.id === p.clientId);
        const procedure = mockProcedures.find((pr) => pr.id === appointment?.procedureId);
        return {
          date: p.paidAt!,
          amountInCents: p.paidAmountInCents,
          method: p.method ?? "other",
          appointmentId: p.appointmentId,
          clientName: client?.name ?? "—",
          procedureName: procedure?.name ?? "—",
        } as CashFlowEntry;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getRevenueStats(): Promise<RevenueStats> {
    const paidPayments = this.payments.filter((p) => p.status === "paid" && p.paidAt);

    const todayInCents = paidPayments
      .filter((p) => isToday(p.paidAt!))
      .reduce((sum, p) => sum + p.paidAmountInCents, 0);

    const thisWeekInCents = paidPayments
      .filter((p) => isThisWeek(p.paidAt!, { weekStartsOn: 1 }))
      .reduce((sum, p) => sum + p.paidAmountInCents, 0);

    const thisMonthInCents = paidPayments
      .filter((p) => isThisMonth(p.paidAt!))
      .reduce((sum, p) => sum + p.paidAmountInCents, 0);

    const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
    const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));
    const lastMonthInCents = paidPayments
      .filter((p) => p.paidAt! >= lastMonthStart && p.paidAt! <= lastMonthEnd)
      .reduce((sum, p) => sum + p.paidAmountInCents, 0);

    const growthPercent =
      lastMonthInCents > 0
        ? ((thisMonthInCents - lastMonthInCents) / lastMonthInCents) * 100
        : 0;

    return {
      todayInCents,
      thisWeekInCents,
      thisMonthInCents,
      lastMonthInCents,
      growthPercent,
    };
  }

  async getMonthlyRevenue(months = 6): Promise<MonthlyRevenue[]> {
    const result: MonthlyRevenue[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);

      const amountInCents = this.payments
        .filter(
          (p) => p.status === "paid" && p.paidAt && p.paidAt >= start && p.paidAt <= end
        )
        .reduce((sum, p) => sum + p.paidAmountInCents, 0);

      result.push({
        month: format(monthDate, "MMM", { locale: ptBR }),
        amountInCents,
      });
    }

    return result;
  }

  async getPaymentMethodBreakdown(
    from: Date,
    to: Date
  ): Promise<Record<PaymentMethod, number>> {
    const breakdown: Record<PaymentMethod, number> = {
      cash: 0,
      credit_card: 0,
      debit_card: 0,
      pix: 0,
      bank_transfer: 0,
      other: 0,
    };

    this.payments
      .filter(
        (p) =>
          p.status === "paid" &&
          p.paidAt &&
          p.paidAt >= from &&
          p.paidAt <= to &&
          p.method
      )
      .forEach((p) => {
        breakdown[p.method!] += p.paidAmountInCents;
      });

    return breakdown;
  }

  async getProjectedRevenue(): Promise<import("../interfaces/IPaymentService").ProjectedMonthItem[]> {
    return [];
  }
}
