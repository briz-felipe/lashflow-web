import type { Expense } from "@/domain/entities";
import type { ExpenseCategory, ExpenseRecurrence } from "@/domain/enums";
import { format, subMonths, addMonths } from "date-fns";

function exp(
  id: string,
  name: string,
  category: ExpenseCategory,
  amountInCents: number,
  recurrence: ExpenseRecurrence,
  referenceMonth: string,
  isPaid: boolean,
  dueDay?: number,
  notes?: string,
  installment?: { total: number; current: number; groupId: string },
): Expense {
  const now = new Date();
  const paidAt = isPaid ? new Date(now.getTime() - Math.random() * 15 * 86400000) : undefined;
  return {
    id,
    name,
    category,
    amountInCents,
    recurrence,
    dueDay,
    isPaid,
    paidAt,
    referenceMonth,
    notes,
    installmentTotal: installment?.total,
    installmentCurrent: installment?.current,
    installmentGroupId: installment?.groupId,
    createdAt: new Date(now.getTime() - 90 * 86400000),
    updatedAt: now,
  };
}

const currentMonth = format(new Date(), "yyyy-MM");
const lastMonth = format(subMonths(new Date(), 1), "yyyy-MM");
const twoMonthsAgo = format(subMonths(new Date(), 2), "yyyy-MM");

export const mockExpenses: Expense[] = [
  // ── Current month — recurring ──
  exp("exp-001", "Aluguel do Espaço", "aluguel", 150000, "monthly", currentMonth, true, 5, "Sala comercial"),
  exp("exp-002", "Conta de Energia", "energia", 18500, "monthly", currentMonth, true, 10),
  exp("exp-003", "Conta de Água", "agua", 8500, "monthly", currentMonth, false, 15),
  exp("exp-004", "Internet Fibra", "internet", 9990, "monthly", currentMonth, true, 7),
  exp("exp-005", "Celular (linha comercial)", "telefone", 5990, "monthly", currentMonth, true, 12),
  exp("exp-006", "Software Agendamento", "software", 4990, "monthly", currentMonth, true, 1),
  exp("exp-007", "Instagram Ads", "marketing", 30000, "monthly", currentMonth, false, 20, "Campanha mensal de ads"),
  exp("exp-008", "MEI / Imposto", "impostos", 7110, "monthly", currentMonth, false, 20),

  // Current month — one-time
  exp("exp-009", "Manutenção Ar-Condicionado", "manutencao", 25000, "one_time", currentMonth, true, undefined, "Limpeza e recarga de gás"),
  exp("exp-010", "Uber para compra de material", "transporte", 3500, "one_time", currentMonth, true),

  // ── Last month — recurring (all paid) ──
  exp("exp-011", "Aluguel do Espaço", "aluguel", 150000, "monthly", lastMonth, true, 5),
  exp("exp-012", "Conta de Energia", "energia", 21000, "monthly", lastMonth, true, 10),
  exp("exp-013", "Conta de Água", "agua", 7800, "monthly", lastMonth, true, 15),
  exp("exp-014", "Internet Fibra", "internet", 9990, "monthly", lastMonth, true, 7),
  exp("exp-015", "Celular (linha comercial)", "telefone", 5990, "monthly", lastMonth, true, 12),
  exp("exp-016", "Software Agendamento", "software", 4990, "monthly", lastMonth, true, 1),
  exp("exp-017", "Instagram Ads", "marketing", 30000, "monthly", lastMonth, true, 20),
  exp("exp-018", "MEI / Imposto", "impostos", 7110, "monthly", lastMonth, true, 20),

  // Last month — one-time
  exp("exp-019", "Cartão de Visita (500un)", "marketing", 12000, "one_time", lastMonth, true, undefined, "Gráfica rápida"),
  exp("exp-020", "Alimentação (lanches semana)", "alimentacao", 8000, "one_time", lastMonth, true),

  // ── 2 months ago ──
  exp("exp-021", "Aluguel do Espaço", "aluguel", 150000, "monthly", twoMonthsAgo, true, 5),
  exp("exp-022", "Conta de Energia", "energia", 19500, "monthly", twoMonthsAgo, true, 10),
  exp("exp-023", "Conta de Água", "agua", 8200, "monthly", twoMonthsAgo, true, 15),
  exp("exp-024", "Internet Fibra", "internet", 9990, "monthly", twoMonthsAgo, true, 7),
  exp("exp-025", "Celular (linha comercial)", "telefone", 5990, "monthly", twoMonthsAgo, true, 12),
  exp("exp-026", "Software Agendamento", "software", 4990, "monthly", twoMonthsAgo, true, 1),
  exp("exp-027", "Instagram Ads", "marketing", 25000, "monthly", twoMonthsAgo, true, 20),
  exp("exp-028", "MEI / Imposto", "impostos", 7110, "monthly", twoMonthsAgo, true, 20),

  // ── Installment expenses (parceladas) ──
  // Cadeira reclinável — 6x de R$250
  exp("exp-029", "Cadeira Reclinável", "manutencao", 25000, "monthly", twoMonthsAgo, true, 25, "Parcela cadeira nova", { total: 6, current: 1, groupId: "grp-cadeira" }),
  exp("exp-030", "Cadeira Reclinável", "manutencao", 25000, "monthly", lastMonth, true, 25, "Parcela cadeira nova", { total: 6, current: 2, groupId: "grp-cadeira" }),
  exp("exp-031", "Cadeira Reclinável", "manutencao", 25000, "monthly", currentMonth, false, 25, "Parcela cadeira nova", { total: 6, current: 3, groupId: "grp-cadeira" }),
  ...Array.from({ length: 3 }, (_, i) => {
    const m = format(addMonths(new Date(), i + 1), "yyyy-MM");
    return exp(`exp-${32 + i}`, "Cadeira Reclinável", "manutencao", 25000, "monthly", m, false, 25, "Parcela cadeira nova", { total: 6, current: 4 + i, groupId: "grp-cadeira" });
  }),

  // Curso de técnicas — 3x de R$400
  exp("exp-035", "Curso Mega Volume", "outros", 40000, "monthly", currentMonth, false, 15, "Curso online de especialização", { total: 3, current: 1, groupId: "grp-curso" }),
  ...Array.from({ length: 2 }, (_, i) => {
    const m = format(addMonths(new Date(), i + 1), "yyyy-MM");
    return exp(`exp-${36 + i}`, "Curso Mega Volume", "outros", 40000, "monthly", m, false, 15, "Curso online de especialização", { total: 3, current: 2 + i, groupId: "grp-curso" });
  }),
];
