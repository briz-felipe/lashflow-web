import { api } from "@/lib/api";
import type { Appointment, CreateAppointmentInput } from "@/domain/entities";
import type { IAppointmentService, AppointmentFilters } from "../interfaces/IAppointmentService";
import type { AppointmentStatus } from "@/domain/enums";

export class ApiAppointmentService implements IAppointmentService {
  async listAppointments(filters?: AppointmentFilters): Promise<Appointment[]> {
    const params = new URLSearchParams();
    if (filters?.clientId) params.set("client_id", filters.clientId);
    if (filters?.status) filters.status.forEach((s) => params.append("status", s));
    if (filters?.from) params.set("from", (filters.from as Date).toISOString());
    if (filters?.to) params.set("to", (filters.to as Date).toISOString());
    const qs = params.toString();
    return api.get(`/appointments/${qs ? `?${qs}` : ""}`);
  }

  getAppointmentById(id: string): Promise<Appointment | null> {
    return api.get(`/appointments/${id}`);
  }

  createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
    return api.post("/appointments/", input);
  }

  updateAppointmentStatus(
    id: string,
    status: AppointmentStatus,
    reason?: string
  ): Promise<Appointment> {
    return api.patch(`/appointments/${id}/status`, { status, reason });
  }

  cancelAppointment(
    id: string,
    reason?: string,
    cancelledBy?: "professional" | "client"
  ): Promise<Appointment> {
    return api.patch(`/appointments/${id}/cancel`, { reason, cancelled_by: cancelledBy });
  }

  async getAvailableSlots(date: Date, procedureId: string): Promise<Date[]> {
    const dateStr = date.toISOString().split("T")[0];
    const data = await api.get<{ slots: string[] }>(
      `/appointments/available-slots?date=${dateStr}&procedure_id=${procedureId}`
    );
    return data.slots.map((d) => new Date(d));
  }

  getPendingApprovals(): Promise<Appointment[]> {
    return api.get("/appointments/pending-approvals");
  }

  getTodayAppointments(): Promise<Appointment[]> {
    return api.get("/appointments/today");
  }
}
