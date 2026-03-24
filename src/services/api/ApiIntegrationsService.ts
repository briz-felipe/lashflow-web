import { api } from "@/lib/api";

export interface AppleCalendarStatus {
  connected: boolean;
  appleId: string | null;
  calendarName: string | null;
}

export interface AppleCalendarItem {
  name: string;
  writable: boolean;
}

export const integrationsService = {
  getAppleStatus(): Promise<AppleCalendarStatus> {
    return api.get("/integrations/apple-calendar/status");
  },

  connectApple(appleId: string, appPassword: string): Promise<AppleCalendarStatus> {
    return api.post("/integrations/apple-calendar/connect", { appleId, appPassword });
  },

  disconnectApple(): Promise<void> {
    return api.delete("/integrations/apple-calendar/disconnect");
  },

  listAppleCalendars(): Promise<AppleCalendarItem[]> {
    return api.get("/integrations/apple-calendar/calendars");
  },

  createAppleCalendar(name: string): Promise<AppleCalendarStatus> {
    return api.post("/integrations/apple-calendar/calendar", { name });
  },

  selectAppleCalendar(calendarName: string): Promise<AppleCalendarStatus> {
    return api.put("/integrations/apple-calendar/calendar", { calendarName });
  },

  updateProfile(data: { salonName?: string; salonSlug?: string; salonAddress?: string; maintenanceCycleDays?: number }) {
    return api.put("/auth/profile", data);
  },

  syncAllToApple(): Promise<{ synced: number; failed: number }> {
    return api.post("/integrations/apple-calendar/sync-all", {});
  },

  syncAppointmentToApple(appointmentId: string): Promise<{ synced: boolean; appleEventUid: string | null }> {
    return api.post(`/integrations/apple-calendar/sync/${appointmentId}`, {});
  },

  async unsyncAppointmentFromApple(appointmentId: string): Promise<void> {
    await api.delete(`/integrations/apple-calendar/sync/${appointmentId}`);
  },
};
