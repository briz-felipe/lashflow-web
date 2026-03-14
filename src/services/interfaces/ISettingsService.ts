import type { TimeSlot, BlockedDate } from "@/domain/entities";

export type UpsertTimeSlotInput = Omit<TimeSlot, "id">;

export interface ISettingsService {
  getTimeSlots(): Promise<TimeSlot[]>;
  updateTimeSlots(slots: UpsertTimeSlotInput[]): Promise<TimeSlot[]>;

  getBlockedDates(): Promise<BlockedDate[]>;
  addBlockedDate(date: string, reason?: string): Promise<BlockedDate>;
  removeBlockedDate(id: string): Promise<void>;
}
