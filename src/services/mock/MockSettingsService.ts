import type { TimeSlot, BlockedDate } from "@/domain/entities";
import type { ISettingsService, UpsertTimeSlotInput, SegmentRules } from "../interfaces/ISettingsService";
import { DEFAULT_SEGMENT_RULES } from "../interfaces/ISettingsService";
import { mockTimeSlots, mockBlockedDates } from "@/data";

export class MockSettingsService implements ISettingsService {
  private slots: TimeSlot[] = [...mockTimeSlots];
  private blocked: BlockedDate[] = [...mockBlockedDates];
  private segmentRules: SegmentRules = { ...DEFAULT_SEGMENT_RULES };

  async getTimeSlots(): Promise<TimeSlot[]> {
    return this.slots;
  }

  async updateTimeSlots(slots: UpsertTimeSlotInput[]): Promise<TimeSlot[]> {
    this.slots = slots.map((s, i) => ({ ...s, id: `ts-${i}` }));
    return this.slots;
  }

  async getBlockedDates(): Promise<BlockedDate[]> {
    return this.blocked;
  }

  async addBlockedDate(date: string, reason?: string): Promise<BlockedDate> {
    const bd: BlockedDate = { id: `bd-${Date.now()}`, date, reason };
    this.blocked.push(bd);
    return bd;
  }

  async removeBlockedDate(id: string): Promise<void> {
    this.blocked = this.blocked.filter((b) => b.id !== id);
  }

  async getSegmentRules(): Promise<SegmentRules> {
    return { ...this.segmentRules };
  }

  async updateSegmentRules(rules: Partial<SegmentRules>): Promise<SegmentRules> {
    this.segmentRules = { ...this.segmentRules, ...rules };
    return { ...this.segmentRules };
  }
}
