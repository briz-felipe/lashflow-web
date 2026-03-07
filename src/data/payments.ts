import type { Payment } from "@/domain/entities";
import { subDays } from "date-fns";

function makePayment(
  id: string,
  appointmentId: string,
  clientId: string,
  totalAmountInCents: number,
  method: Payment["method"],
  daysAgo: number
): Payment {
  const paidAt = subDays(new Date(), daysAgo);
  return {
    id,
    appointmentId,
    clientId,
    totalAmountInCents,
    paidAmountInCents: totalAmountInCents,
    status: "paid",
    method,
    paidAt,
    createdAt: paidAt,
    updatedAt: paidAt,
  };
}

export const mockPayments: Payment[] = [
  // Today
  makePayment("pay-001", "apt-001", "cli-001", 25000, "pix", 0),
  makePayment("pay-002", "apt-002", "cli-009", 18000, "credit_card", 0),
  makePayment("pay-003", "apt-003", "cli-003", 22000, "pix", 0),

  // Last 7 days
  makePayment("pay-005", "apt-005", "cli-006", 32000, "pix", 1),
  makePayment("pay-015", "apt-015", "cli-001", 25000, "credit_card", 7),
  makePayment("pay-034", "apt-034", "cli-004", 18000, "cash", 10),
  makePayment("pay-036", "apt-036", "cli-010", 27000, "pix", 5),
  makePayment("pay-049", "apt-049", "cli-019", 25000, "debit_card", 3),
  makePayment("pay-035", "apt-035", "cli-017", 27000, "credit_card", 15),

  // Week 2-4
  makePayment("pay-016", "apt-016", "cli-003", 22000, "pix", 14),
  makePayment("pay-017", "apt-017", "cli-009", 18000, "cash", 14),
  makePayment("pay-018", "apt-018", "cli-006", 32000, "credit_card", 21),
  makePayment("pay-019", "apt-019", "cli-002", 18000, "pix", 21),
  makePayment("pay-037", "apt-037", "cli-008", 25000, "pix", 30),

  // Month 2
  makePayment("pay-020", "apt-020", "cli-013", 22000, "pix", 28),
  makePayment("pay-021", "apt-021", "cli-011", 25000, "credit_card", 28),
  makePayment("pay-022", "apt-022", "cli-015", 32000, "pix", 35),
  makePayment("pay-023", "apt-023", "cli-003", 25000, "cash", 35),
  makePayment("pay-024", "apt-024", "cli-007", 22000, "pix", 42),
  makePayment("pay-025", "apt-025", "cli-009", 18000, "debit_card", 42),
  makePayment("pay-046", "apt-046", "cli-015", 32000, "credit_card", 35),
  makePayment("pay-047", "apt-047", "cli-001", 25000, "pix", 42),
  makePayment("pay-048", "apt-048", "cli-013", 22000, "pix", 49),

  // Month 3
  makePayment("pay-026", "apt-026", "cli-001", 25000, "credit_card", 49),
  makePayment("pay-027", "apt-027", "cli-002", 18000, "pix", 49),
  makePayment("pay-028", "apt-028", "cli-006", 32000, "pix", 56),
  makePayment("pay-029", "apt-029", "cli-013", 27000, "cash", 56),
  makePayment("pay-030", "apt-030", "cli-015", 22000, "credit_card", 63),
  makePayment("pay-041", "apt-041", "cli-011", 25000, "pix", 56),
  makePayment("pay-042", "apt-042", "cli-020", 22000, "credit_card", 63),
  makePayment("pay-043", "apt-043", "cli-009", 18000, "pix", 70),
  makePayment("pay-044", "apt-044", "cli-002", 18000, "debit_card", 77),
  makePayment("pay-050", "apt-050", "cli-008", 25000, "pix", 60),

  // Month 4-6 (older)
  makePayment("pay-038", "apt-038", "cli-003", 32000, "credit_card", 70),
  makePayment("pay-039", "apt-039", "cli-001", 25000, "pix", 84),
  makePayment("pay-040", "apt-040", "cli-006", 32000, "credit_card", 91),
  makePayment("pay-045", "apt-045", "cli-006", 32000, "pix", 84),
  makePayment("pay-033", "apt-033", "cli-018", 18000, "pix", 63),
];
