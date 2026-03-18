"use client";

import { useState, useEffect, useCallback } from "react";
import { settingsService } from "@/services";
import type { TimeSlot, BlockedDate } from "@/domain/entities";
import type { UpsertTimeSlotInput, SegmentRules } from "@/services/interfaces/ISettingsService";
import { DEFAULT_SEGMENT_RULES } from "@/services/interfaces/ISettingsService";

export function useSettings() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [segmentRules, setSegmentRules] = useState<SegmentRules>(DEFAULT_SEGMENT_RULES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      settingsService.getTimeSlots(),
      settingsService.getBlockedDates(),
      settingsService.getSegmentRules(),
    ])
      .then(([slots, blocked, rules]) => {
        setTimeSlots(slots);
        setBlockedDates(blocked);
        setSegmentRules(rules);
      })
      .finally(() => setLoading(false));
  }, []);

  const updateTimeSlots = useCallback(async (slots: UpsertTimeSlotInput[]) => {
    const updated = await settingsService.updateTimeSlots(slots);
    setTimeSlots(updated);
    return updated;
  }, []);

  const addBlockedDate = useCallback(async (date: string, reason?: string) => {
    const bd = await settingsService.addBlockedDate(date, reason);
    setBlockedDates((prev) => [...prev, bd]);
    return bd;
  }, []);

  const removeBlockedDate = useCallback(async (id: string) => {
    await settingsService.removeBlockedDate(id);
    setBlockedDates((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const updateSegmentRules = useCallback(async (rules: Partial<SegmentRules>) => {
    const updated = await settingsService.updateSegmentRules(rules);
    setSegmentRules(updated);
    return updated;
  }, []);

  return {
    timeSlots,
    blockedDates,
    segmentRules,
    loading,
    updateTimeSlots,
    addBlockedDate,
    removeBlockedDate,
    updateSegmentRules,
  };
}
