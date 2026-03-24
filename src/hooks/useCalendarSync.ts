"use client";

import { useState, useCallback } from "react";
import { appointmentService } from "@/services";
import { integrationsService } from "@/services/api/ApiIntegrationsService";

interface SyncProgress {
  total: number;
  done: number;
  failed: number;
  currentName: string | null;
}

export function useCalendarSync() {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState<SyncProgress>({ total: 0, done: 0, failed: 0, currentName: null });

  const syncAll = useCallback(async () => {
    setSyncing(true);
    setProgress({ total: 0, done: 0, failed: 0, currentName: null });

    try {
      // Fetch all active appointments
      const appointments = await appointmentService.listAppointments({
        status: ["confirmed", "in_progress"],
      });

      // Filter only those not yet synced
      const toSync = appointments.filter((a) => !a.appleEventUid);

      if (toSync.length === 0) {
        setProgress({ total: 0, done: 0, failed: 0, currentName: null });
        return { synced: 0, failed: 0, total: 0 };
      }

      setProgress({ total: toSync.length, done: 0, failed: 0, currentName: null });

      let synced = 0;
      let failed = 0;

      for (const apt of toSync) {
        const name = apt.clientName ?? apt.procedureName ?? "Agendamento";
        setProgress((p) => ({ ...p, currentName: name }));

        try {
          await integrationsService.syncAppointmentToApple(apt.id);
          synced++;
        } catch {
          failed++;
        }

        setProgress((p) => ({ ...p, done: synced + failed, failed }));
      }

      return { synced, failed, total: toSync.length };
    } finally {
      setProgress((p) => ({ ...p, currentName: null }));
      setSyncing(false);
    }
  }, []);

  const percent = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return { syncAll, syncing, progress, percent };
}
