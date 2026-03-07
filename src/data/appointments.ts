import type { Appointment } from "@/domain/entities";
import type { LashServiceType } from "@/domain/enums";
import { addMinutes, subDays, addDays, setHours, setMinutes } from "date-fns";

function makeDate(base: Date, daysOffset: number, hour: number, minute = 0): Date {
  const d = daysOffset >= 0 ? addDays(base, daysOffset) : subDays(base, Math.abs(daysOffset));
  return setMinutes(setHours(d, hour), minute);
}

function makeAppointment(
  base: Date,
  id: string,
  clientId: string,
  procedureId: string,
  daysOffset: number,
  hour: number,
  durationMinutes: number,
  priceCharged: number,
  status: Appointment["status"],
  paymentId?: string
): Appointment {
  const scheduledAt = makeDate(base, daysOffset, hour);
  const endsAt = addMinutes(scheduledAt, durationMinutes);
  const daysAgo = Math.abs(Math.min(daysOffset, 0));
  const requestedAt = subDays(scheduledAt, daysAgo > 3 ? 3 : 1);
  return {
    id,
    clientId,
    procedureId,
    paymentId,
    status,
    scheduledAt,
    durationMinutes,
    endsAt,
    priceCharged,
    requestedAt,
    confirmedAt: status !== "pending_approval" ? subDays(scheduledAt, 1) : undefined,
    cancelledAt:
      status === "cancelled" || status === "no_show" ? scheduledAt : undefined,
    cancelledBy: status === "cancelled" ? "professional" : undefined,
    cancellationReason: status === "cancelled" ? "Horário indisponível" : undefined,
    createdAt: requestedAt,
    updatedAt: requestedAt,
  };
}

// base is captured once so all dates share the same reference point.
// Using a getter ensures `new Date()` is called at first access (client-side),
// avoiding SSR/client hydration mismatches.
let _mockAppointments: Appointment[] | null = null;

export function getMockAppointments(): Appointment[] {
  if (_mockAppointments) return _mockAppointments;
  const base = new Date();
  const a = (
    id: string, cId: string, pId: string, days: number, hour: number,
    dur: number, price: number, status: Appointment["status"], payId?: string
  ) => makeAppointment(base, id, cId, pId, days, hour, dur, price, status, payId);

  _mockAppointments = [
    // Today's appointments
    a("apt-001", "cli-001", "proc-002", 0, 9,  120, 25000, "confirmed",        "pay-001"),
    a("apt-002", "cli-009", "proc-001", 0, 11,  90, 18000, "in_progress",      "pay-002"),
    a("apt-003", "cli-003", "proc-003", 0, 14, 110, 22000, "confirmed",        "pay-003"),
    a("apt-004", "cli-013", "proc-003", 0, 16, 110, 22000, "confirmed"),

    // Upcoming (next 7 days)
    a("apt-005", "cli-006", "proc-004",  1, 10, 150, 32000, "confirmed",       "pay-005"),
    a("apt-006", "cli-015", "proc-004",  1, 14, 150, 32000, "confirmed"),
    a("apt-007", "cli-019", "proc-002",  2,  9, 120, 25000, "confirmed"),
    a("apt-008", "cli-002", "proc-001",  2, 11,  90, 18000, "confirmed"),
    a("apt-009", "cli-017", "proc-005",  3, 10, 120, 27000, "pending_approval"),
    a("apt-010", "cli-016", "proc-001",  3, 14,  90, 18000, "pending_approval"),
    a("apt-011", "cli-020", "proc-003",  4,  9, 110, 22000, "confirmed"),
    a("apt-012", "cli-011", "proc-002",  5, 10, 120, 25000, "confirmed"),
    a("apt-013", "cli-007", "proc-003",  6, 14, 110, 22000, "confirmed"),
    a("apt-014", "cli-014", "proc-001",  7,  9,  90, 18000, "pending_approval"),

    // Past (completed)
    a("apt-015", "cli-001", "proc-002",  -7, 10, 120, 25000, "completed",      "pay-015"),
    a("apt-016", "cli-003", "proc-003", -14,  9, 110, 22000, "completed",      "pay-016"),
    a("apt-017", "cli-009", "proc-001", -14, 11,  90, 18000, "completed",      "pay-017"),
    a("apt-018", "cli-006", "proc-004", -21, 10, 150, 32000, "completed",      "pay-018"),
    a("apt-019", "cli-002", "proc-001", -21, 14,  90, 18000, "completed",      "pay-019"),
    a("apt-020", "cli-013", "proc-003", -28,  9, 110, 22000, "completed",      "pay-020"),
    a("apt-021", "cli-011", "proc-002", -28, 11, 120, 25000, "completed",      "pay-021"),
    a("apt-022", "cli-015", "proc-004", -35, 10, 150, 32000, "completed",      "pay-022"),
    a("apt-023", "cli-003", "proc-002", -35, 14, 120, 25000, "completed",      "pay-023"),
    a("apt-024", "cli-007", "proc-003", -42,  9, 110, 22000, "completed",      "pay-024"),
    a("apt-025", "cli-009", "proc-001", -42, 11,  90, 18000, "completed",      "pay-025"),
    a("apt-026", "cli-001", "proc-002", -49, 10, 120, 25000, "completed",      "pay-026"),
    a("apt-027", "cli-002", "proc-001", -49, 14,  90, 18000, "completed",      "pay-027"),
    a("apt-028", "cli-006", "proc-004", -56,  9, 150, 32000, "completed",      "pay-028"),
    a("apt-029", "cli-013", "proc-005", -56, 11, 120, 27000, "completed",      "pay-029"),
    a("apt-030", "cli-015", "proc-003", -63, 10, 110, 22000, "completed",      "pay-030"),

    // Cancelled / No-show
    a("apt-031", "cli-012", "proc-001", -20, 10,  90, 18000, "cancelled"),
    a("apt-032", "cli-005", "proc-001", -45,  9,  90, 18000, "no_show"),
    a("apt-033", "cli-018", "proc-001", -25, 14,  90, 18000, "cancelled"),
    a("apt-034", "cli-004", "proc-001", -10, 11,  90, 18000, "completed",      "pay-034"),
    a("apt-035", "cli-017", "proc-005", -15, 10, 120, 27000, "completed",      "pay-035"),
    a("apt-036", "cli-010", "proc-005",  -5,  9, 120, 27000, "completed",      "pay-036"),
    a("apt-037", "cli-008", "proc-002", -30, 11, 120, 25000, "completed",      "pay-037"),
    a("apt-038", "cli-003", "proc-004", -70, 10, 150, 32000, "completed",      "pay-038"),
    a("apt-039", "cli-001", "proc-002", -84, 14, 120, 25000, "completed",      "pay-039"),
    a("apt-040", "cli-006", "proc-004", -91,  9, 150, 32000, "completed",      "pay-040"),

    // More recent history
    a("apt-041", "cli-011", "proc-002", -56, 14, 120, 25000, "completed",      "pay-041"),
    a("apt-042", "cli-020", "proc-003", -63, 10, 110, 22000, "completed",      "pay-042"),
    a("apt-043", "cli-009", "proc-001", -70,  9,  90, 18000, "completed",      "pay-043"),
    a("apt-044", "cli-002", "proc-001", -77, 11,  90, 18000, "completed",      "pay-044"),
    a("apt-045", "cli-006", "proc-004", -84, 14, 150, 32000, "completed",      "pay-045"),
    a("apt-046", "cli-015", "proc-004", -35, 10, 150, 32000, "completed",      "pay-046"),
    a("apt-047", "cli-001", "proc-002", -42,  9, 120, 25000, "completed",      "pay-047"),
    a("apt-048", "cli-013", "proc-003", -49, 11, 110, 22000, "completed",      "pay-048"),
    a("apt-049", "cli-019", "proc-002",  -3, 10, 120, 25000, "completed",      "pay-049"),
    a("apt-050", "cli-008", "proc-002", -60, 14, 120, 25000, "completed",      "pay-050"),
  ];

  // Assign service types to represent realistic treatment cycles across all clients
  //
  // cli-001: app(-84) → maint(-49) → app(-42, new cycle) → maint(-7) → maint(today) [cycle complete, 2 maints done]
  // cli-002: app(-77) → removal(-49, 28d gap→overdue) → app(-21, new cycle) → maint(+2, upcoming)
  // cli-003: app(-70) → maint(-35) → maint(-14) → maint(today) [cycle complete, 2 maints done]
  // cli-004: app(-10) only → awaiting M1
  // cli-006: app(-91) → maint(-84, 7d✓) → app(-56, new cycle) → maint(-21) → maint(+1, upcoming)
  // cli-007: app(-42) only → gap to +6 = 48d → overdue, needs removal
  // cli-008: app(-60) → maint(-30, 30d gap → overdue at M1 step)
  // cli-009: app(-70) → maint(-42) → maint(-14) → maint(today) [cycle complete]
  // cli-010: app(-5) only → awaiting M1 in ~10d
  // cli-011: app(-56) → removal(-28, overdue) → app(+5, upcoming new cycle)
  // cli-013: app(-56) → maint(-49, 7d✓) → maint(-28) → app(today, new cycle)
  // cli-015: app(-63) → removal(-35, overdue) → app(-35, new cycle same day) → maint(+1, upcoming)
  // cli-017: app(-15) → maint(+3, upcoming, 18d gap → slightly overdue M1)
  // cli-019: app(-3) → maint(+2, upcoming, 5d ✓)
  // cli-020: app(-63, overdue 63d) → removal(+4, upcoming scheduled)
  const serviceTypes: Record<string, LashServiceType> = {
    // cli-001
    "apt-039": "application",  // -84 days
    "apt-026": "maintenance",  // -49 days (35d gap → overdue but tagged)
    "apt-047": "application",  // -42 days (new cycle)
    "apt-015": "maintenance",  // -7 days (M1)
    "apt-001": "maintenance",  // today (M2, cycle complete)

    // cli-002
    "apt-044": "application",  // -77 days
    "apt-027": "removal",      // -49 days (28d gap → overdue, removal done)
    "apt-019": "application",  // -21 days (new cycle after removal)
    "apt-008": "maintenance",  // +2 days (M1 upcoming)

    // cli-003
    "apt-038": "application",  // -70 days
    "apt-023": "maintenance",  // -35 days (M1)
    "apt-016": "maintenance",  // -14 days (M2)
    "apt-003": "maintenance",  // today (extra maint, cycle complete)

    // cli-004
    "apt-034": "application",  // -10 days (awaiting M1 in ~5d)

    // cli-006
    "apt-040": "application",  // -91 days
    "apt-045": "maintenance",  // -84 days (7d gap ✓, M1)
    "apt-028": "application",  // -56 days (new cycle)
    "apt-018": "maintenance",  // -21 days (35d gap → overdue M1)
    "apt-005": "maintenance",  // +1 day (M2 upcoming)

    // cli-007
    "apt-024": "application",  // -42 days (gap to today = 48d → overdue, needs removal)

    // cli-008
    "apt-050": "application",  // -60 days
    "apt-037": "maintenance",  // -30 days (30d gap → overdue at M1)

    // cli-009
    "apt-043": "application",  // -70 days
    "apt-025": "maintenance",  // -42 days (M1)
    "apt-017": "maintenance",  // -14 days (M2)
    "apt-002": "maintenance",  // today (cycle complete)

    // cli-010
    "apt-036": "application",  // -5 days (awaiting M1 in ~10d)

    // cli-011
    "apt-041": "application",  // -56 days
    "apt-021": "removal",      // -28 days (28d gap → overdue, removal done)
    "apt-012": "application",  // +5 days (new cycle upcoming)

    // cli-013
    "apt-029": "application",  // -56 days
    "apt-048": "maintenance",  // -49 days (7d gap ✓, M1)
    "apt-020": "maintenance",  // -28 days (21d gap → overdue M2 step)
    "apt-004": "application",  // today (new cycle started)

    // cli-015
    "apt-030": "application",  // -63 days
    "apt-022": "removal",      // -35 days (28d gap → overdue, removal done)
    "apt-046": "application",  // -35 days (new cycle same day after removal)
    "apt-006": "maintenance",  // +1 day (M1 upcoming)

    // cli-017
    "apt-035": "application",  // -15 days
    "apt-009": "maintenance",  // +3 days (M1 upcoming, 18d gap)

    // cli-019
    "apt-049": "application",  // -3 days
    "apt-007": "maintenance",  // +2 days (M1 upcoming, 5d gap ✓)

    // cli-020
    "apt-042": "application",  // -63 days (overdue, needs removal)
    "apt-011": "removal",      // +4 days (removal scheduled upcoming)
  };

  for (const apt of _mockAppointments) {
    if (serviceTypes[apt.id]) apt.serviceType = serviceTypes[apt.id];
  }

  return _mockAppointments;
}

// Re-export as array for backward compatibility with existing imports.
// The getter ensures dates are computed at first client-side access.
export const mockAppointments: Appointment[] = new Proxy([] as Appointment[], {
  get(_t, prop, receiver) {
    const arr = getMockAppointments();
    const val = (arr as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === "function" ? (val as Function).bind(arr) : val;
  },
  set(_t, prop, value) {
    (getMockAppointments() as unknown as Record<string | symbol, unknown>)[prop] = value;
    return true;
  },
  has(_t, prop) { return prop in getMockAppointments(); },
  ownKeys(_t) { return Reflect.ownKeys(getMockAppointments()); },
  getOwnPropertyDescriptor(_t, prop) {
    return Object.getOwnPropertyDescriptor(getMockAppointments(), prop);
  },
});
