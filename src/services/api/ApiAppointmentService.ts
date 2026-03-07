import type { Appointment, CreateAppointmentInput } from "@/domain/entities";
import type { IAppointmentService, AppointmentFilters } from "../interfaces/IAppointmentService";
import type { AppointmentStatus } from "@/domain/enums";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export class ApiAppointmentService implements IAppointmentService {
  async listAppointments(filters?: AppointmentFilters): Promise<Appointment[]> {
    const params = new URLSearchParams();
    if (filters?.clientId) params.set("clientId", filters.clientId);
    if (filters?.status) params.set("status", filters.status.join(","));
    const res = await fetch(`${BASE_URL}/agendamentos?${params}`);
    if (!res.ok) throw new Error("Erro ao listar agendamentos");
    return res.json();
  }

  async getAppointmentById(id: string): Promise<Appointment | null> {
    const res = await fetch(`${BASE_URL}/agendamentos/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Erro ao buscar agendamento");
    return res.json();
  }

  async createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
    const res = await fetch(`${BASE_URL}/agendamentos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Erro ao criar agendamento");
    return res.json();
  }

  async updateAppointmentStatus(id: string, status: AppointmentStatus, reason?: string): Promise<Appointment> {
    const res = await fetch(`${BASE_URL}/agendamentos/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reason }),
    });
    if (!res.ok) throw new Error("Erro ao atualizar status");
    return res.json();
  }

  async cancelAppointment(id: string, reason?: string, cancelledBy?: "professional" | "client"): Promise<Appointment> {
    const res = await fetch(`${BASE_URL}/agendamentos/${id}/cancel`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason, cancelledBy }),
    });
    if (!res.ok) throw new Error("Erro ao cancelar agendamento");
    return res.json();
  }

  async getAvailableSlots(date: Date, procedureId: string): Promise<Date[]> {
    const res = await fetch(
      `${BASE_URL}/agendamentos/slots?date=${date.toISOString()}&procedureId=${procedureId}`
    );
    if (!res.ok) throw new Error("Erro ao buscar slots");
    const data = await res.json();
    return data.map((d: string) => new Date(d));
  }

  async getPendingApprovals(): Promise<Appointment[]> {
    const res = await fetch(`${BASE_URL}/agendamentos?status=pending_approval`);
    if (!res.ok) throw new Error("Erro ao buscar aprovações");
    return res.json();
  }

  async getTodayAppointments(): Promise<Appointment[]> {
    const res = await fetch(`${BASE_URL}/agendamentos/today`);
    if (!res.ok) throw new Error("Erro ao buscar agendamentos de hoje");
    return res.json();
  }
}
