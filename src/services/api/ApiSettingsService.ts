import { api } from "@/lib/api";
import type { TimeSlot, BlockedDate } from "@/domain/entities";
import type { ISettingsService, UpsertTimeSlotInput, SegmentRules } from "../interfaces/ISettingsService";

export class ApiSettingsService implements ISettingsService {
  getTimeSlots(): Promise<TimeSlot[]> {
    return api.get("/settings/time-slots");
  }

  updateTimeSlots(slots: UpsertTimeSlotInput[]): Promise<TimeSlot[]> {
    return api.put("/settings/time-slots", { slots });
  }

  getBlockedDates(): Promise<BlockedDate[]> {
    return api.get("/settings/blocked-dates");
  }

  addBlockedDate(date: string, reason?: string): Promise<BlockedDate> {
    return api.post("/settings/blocked-dates", { date, reason });
  }

  removeBlockedDate(id: string): Promise<void> {
    return api.delete(`/settings/blocked-dates/${id}`);
  }

  getSegmentRules(): Promise<SegmentRules> {
    return api.get("/settings/segment-rules");
  }

  updateSegmentRules(rules: Partial<SegmentRules>): Promise<SegmentRules> {
    return api.put("/settings/segment-rules", rules);
  }
}
