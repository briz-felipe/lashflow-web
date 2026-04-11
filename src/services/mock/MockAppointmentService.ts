import type { Appointment, CreateAppointmentInput, UpdateAppointmentInput } from "@/domain/entities";
import type { IAppointmentService, AppointmentFilters } from "../interfaces/IAppointmentService";
import type { AppointmentStatus } from "@/domain/enums";
import { mockAppointments } from "@/data";
import { mockProcedures } from "@/data";
import { isToday, addMinutes, isSameDay, addHours, format, setMinutes, setHours } from "date-fns";

export class MockAppointmentService implements IAppointmentService {
  private appointments: Appointment[] = mockAppointments.map((a) => ({ ...a }));

  async listAppointments(filters?: AppointmentFilters): Promise<Appointment[]> {
    let result = [...this.appointments];

    if (filters?.clientId) {
      result = result.filter((a) => a.clientId === filters.clientId);
    }

    if (filters?.status?.length) {
      result = result.filter((a) => filters.status!.includes(a.status));
    }

    if (filters?.from) {
      result = result.filter((a) => a.scheduledAt >= filters.from!);
    }

    if (filters?.to) {
      result = result.filter((a) => a.scheduledAt <= filters.to!);
    }

    return result.sort(
      (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
    );
  }

  async getAppointmentById(id: string): Promise<Appointment | null> {
    return this.appointments.find((a) => a.id === id) ?? null;
  }

  async createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
    const primaryProcId = input.procedures?.[0]?.procedureId ?? input.procedureId ?? "";
    const procedure = mockProcedures.find((p) => p.id === primaryProcId);
    const durationMinutes = input.durationMinutes ?? procedure?.durationMinutes ?? 90;
    const scheduledAt = input.scheduledAt;
    const endsAt = addMinutes(scheduledAt, durationMinutes);

    const newAppointment: Appointment = {
      id: `apt-${Date.now()}`,
      clientId: input.clientId,
      procedureId: primaryProcId,
      serviceType: input.serviceType,
      status: "pending_approval",
      scheduledAt,
      durationMinutes,
      endsAt,
      priceCharged: input.priceCharged ?? procedure?.priceInCents ?? 0,
      notes: input.notes,
      applicationSheet: input.applicationSheet,
      requestedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.appointments.push(newAppointment);
    return newAppointment;
  }

  async updateAppointment(id: string, input: UpdateAppointmentInput): Promise<Appointment> {
    const idx = this.appointments.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error("Agendamento não encontrado");
    const { procedures: _procs, applicationSheet, ...rest } = input;
    this.appointments[idx] = {
      ...this.appointments[idx],
      ...rest,
      applicationSheet: applicationSheet === null ? undefined : (applicationSheet ?? this.appointments[idx].applicationSheet),
      updatedAt: new Date(),
    };
    return this.appointments[idx];
  }

  async updateAppointmentStatus(
    id: string,
    status: AppointmentStatus,
    reason?: string
  ): Promise<Appointment> {
    const idx = this.appointments.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error("Agendamento não encontrado");

    const apt = this.appointments[idx];
    this.appointments[idx] = {
      ...apt,
      status,
      confirmedAt: status === "confirmed" ? new Date() : apt.confirmedAt,
      updatedAt: new Date(),
    };

    return this.appointments[idx];
  }

  async cancelAppointment(
    id: string,
    reason?: string,
    cancelledBy: "professional" | "client" = "professional"
  ): Promise<Appointment> {
    const idx = this.appointments.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error("Agendamento não encontrado");

    this.appointments[idx] = {
      ...this.appointments[idx],
      status: "cancelled",
      cancelledAt: new Date(),
      cancellationReason: reason,
      cancelledBy,
      updatedAt: new Date(),
    };

    return this.appointments[idx];
  }

  async getAvailableSlots(date: Date, procedureId: string): Promise<Date[]> {
    const procedure = mockProcedures.find((p) => p.id === procedureId);
    const duration = procedure?.durationMinutes ?? 90;
    const dayOfWeek = date.getDay();

    if (dayOfWeek === 0) return [];

    const startHour = 9;
    const endHour = dayOfWeek === 6 ? 14 : 18;

    const dayAppointments = this.appointments.filter(
      (a) =>
        isSameDay(a.scheduledAt, date) &&
        a.status !== "cancelled" &&
        a.status !== "no_show"
    );

    const slots: Date[] = [];
    let currentTime = setMinutes(setHours(date, startHour), 0);
    const endTime = setMinutes(setHours(date, endHour), 0);

    while (addMinutes(currentTime, duration) <= endTime) {
      const slotEnd = addMinutes(currentTime, duration);
      const isOccupied = dayAppointments.some(
        (a) => currentTime < a.endsAt && slotEnd > a.scheduledAt
      );

      if (!isOccupied) {
        slots.push(new Date(currentTime));
      }

      currentTime = addMinutes(currentTime, 30);
    }

    return slots;
  }

  async getPendingApprovals(): Promise<Appointment[]> {
    return this.appointments
      .filter((a) => a.status === "pending_approval")
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }

  async getTodayAppointments(): Promise<Appointment[]> {
    return this.appointments
      .filter(
        (a) =>
          isToday(a.scheduledAt) &&
          a.status !== "cancelled" &&
          a.status !== "no_show"
      )
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }
}
