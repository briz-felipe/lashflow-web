import type { TimeSlot, BlockedDate } from "@/domain/entities";
import { addDays, format } from "date-fns";

export const mockTimeSlots: TimeSlot[] = [
  { id: "ts-mon", dayOfWeek: 1, startTime: "09:00", endTime: "18:00", isAvailable: true },
  { id: "ts-tue", dayOfWeek: 2, startTime: "09:00", endTime: "18:00", isAvailable: true },
  { id: "ts-wed", dayOfWeek: 3, startTime: "09:00", endTime: "18:00", isAvailable: true },
  { id: "ts-thu", dayOfWeek: 4, startTime: "09:00", endTime: "18:00", isAvailable: true },
  { id: "ts-fri", dayOfWeek: 5, startTime: "09:00", endTime: "17:00", isAvailable: true },
  { id: "ts-sat", dayOfWeek: 6, startTime: "09:00", endTime: "14:00", isAvailable: true },
];

export const mockBlockedDates: BlockedDate[] = [
  {
    id: "bd-001",
    date: format(addDays(new Date(), 10), "yyyy-MM-dd"),
    reason: "Feriado",
  },
  {
    id: "bd-002",
    date: format(addDays(new Date(), 15), "yyyy-MM-dd"),
    reason: "Curso de capacitação",
  },
];
