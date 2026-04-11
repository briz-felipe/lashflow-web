import { api } from "@/lib/api";
import type { Appointment, CreateAppointmentInput, UpdateAppointmentInput } from "@/domain/entities";
import type { IAppointmentService, AppointmentFilters } from "../interfaces/IAppointmentService";
import type { AppointmentStatus } from "@/domain/enums";

// The backend returns scheduledAt as a naive datetime string (no timezone).
// Parsing it explicitly ensures it's a real Date object for callers
// that call .getTime(), isSameDay(), etc.
function parseAppointment(raw: Appointment): Appointment {
  return {
    ...raw,
    scheduledAt: typeof raw.scheduledAt === "string" ? new Date(raw.scheduledAt as unknown as string) : raw.scheduledAt,
  };
}

export class ApiAppointmentService implements IAppointmentService {
  async listAppointments(filters?: AppointmentFilters): Promise<Appointment[]> {
    const params = new URLSearchParams();
    if (filters?.clientId) params.set("client_id", filters.clientId);
    if (filters?.status) filters.status.forEach((s) => params.append("status", s));
    if (filters?.from) params.set("from", (filters.from as Date).toISOString());
    if (filters?.to) params.set("to", (filters.to as Date).toISOString());
    const qs = params.toString();
    const data = await api.get<Appointment[]>(`/appointments/${qs ? `?${qs}` : ""}`);
    return data.map(parseAppointment);
  }

  async getAppointmentById(id: string): Promise<Appointment | null> {
    const data = await api.get<Appointment>(`/appointments/${id}`);
    return data ? parseAppointment(data) : null;
  }

  async createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
    const data = await api.post<Appointment>("/appointments/", input);
    return parseAppointment(data);
  }

  async updateAppointment(id: string, input: UpdateAppointmentInput): Promise<Appointment> {
    const body: Record<string, unknown> = {};
    if (input.procedureId !== undefined) body.procedureId = input.procedureId;
    if (input.scheduledAt !== undefined) body.scheduledAt = input.scheduledAt.toISOString();
    if (input.serviceType !== undefined) body.serviceType = input.serviceType;
    if (input.priceCharged !== undefined) body.priceCharged = input.priceCharged;
    if (input.durationMinutes !== undefined) body.durationMinutes = input.durationMinutes;
    if (input.procedureName !== undefined) body.procedureName = input.procedureName;
    if (input.notes !== undefined) body.notes = input.notes;
    if (input.procedures !== undefined) body.procedures = input.procedures;
    if (input.applicationSheet !== undefined) body.applicationSheet = input.applicationSheet;
    const data = await api.patch<Appointment>(`/appointments/${id}`, body);
    return parseAppointment(data);
  }

  async updateAppointmentStatus(
    id: string,
    status: AppointmentStatus,
    reason?: string
  ): Promise<Appointment> {
    const data = await api.patch<Appointment>(`/appointments/${id}/status`, { status, reason });
    return parseAppointment(data);
  }

  async cancelAppointment(
    id: string,
    reason?: string,
    cancelledBy?: "professional" | "client"
  ): Promise<Appointment> {
    const data = await api.patch<Appointment>(`/appointments/${id}/cancel`, { reason, cancelled_by: cancelledBy });
    return parseAppointment(data);
  }

  async getAvailableSlots(date: Date, procedureId: string, durationMinutes?: number): Promise<Date[]> {
    const dateStr = date.toISOString().split("T")[0];
    let url = `/appointments/available-slots?date=${dateStr}&procedure_id=${procedureId}`;
    if (durationMinutes) url += `&duration_minutes=${durationMinutes}`;
    const data = await api.get<{ slots: string[] }>(url);
    return data.slots.map((d) => new Date(d));
  }

  async getPendingApprovals(): Promise<Appointment[]> {
    const data = await api.get<Appointment[]>("/appointments/pending-approvals");
    return data.map(parseAppointment);
  }

  async getTodayAppointments(): Promise<Appointment[]> {
    const data = await api.get<Appointment[]>("/appointments/today");
    return data.map(parseAppointment);
  }
}
