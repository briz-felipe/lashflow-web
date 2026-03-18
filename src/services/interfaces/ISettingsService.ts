import type { TimeSlot, BlockedDate } from "@/domain/entities";

export type UpsertTimeSlotInput = Omit<TimeSlot, "id">;

export interface SegmentRules {
  vipMinAppointments: number;
  vipMinSpentCents: number;
  recorrenteMaxDays: number;
  recorrenteMinAppointments: number;
  inativaMinDays: number;
}

export const DEFAULT_SEGMENT_RULES: SegmentRules = {
  vipMinAppointments: 5,
  vipMinSpentCents: 100_000,
  recorrenteMaxDays: 45,
  recorrenteMinAppointments: 2,
  inativaMinDays: 60,
};

export interface ISettingsService {
  getTimeSlots(): Promise<TimeSlot[]>;
  updateTimeSlots(slots: UpsertTimeSlotInput[]): Promise<TimeSlot[]>;

  getBlockedDates(): Promise<BlockedDate[]>;
  addBlockedDate(date: string, reason?: string): Promise<BlockedDate>;
  removeBlockedDate(id: string): Promise<void>;

  getSegmentRules(): Promise<SegmentRules>;
  updateSegmentRules(rules: Partial<SegmentRules>): Promise<SegmentRules>;
}
