"use client";

import { useState, useEffect, useCallback } from "react";
import { settingsService } from "@/services";
import type { TimeSlot, BlockedDate } from "@/domain/entities";
import type { UpsertTimeSlotInput } from "@/services/interfaces/ISettingsService";

export function useSettings() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      settingsService.getTimeSlots(),
      settingsService.getBlockedDates(),
    ])
      .then(([slots, blocked]) => {
        setTimeSlots(slots);
        setBlockedDates(blocked);
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

  return {
    timeSlots,
    blockedDates,
    loading,
    updateTimeSlots,
    addBlockedDate,
    removeBlockedDate,
  };
}
