import type { Appointment, CreateAppointmentInput, UpdateAppointmentInput } from "@/domain/entities";
import type { AppointmentStatus } from "@/domain/enums";

export interface AppointmentFilters {
  clientId?: string;
  status?: AppointmentStatus[];
  from?: Date;
  to?: Date;
}

export interface IAppointmentService {
  listAppointments(filters?: AppointmentFilters): Promise<Appointment[]>;
  getAppointmentById(id: string): Promise<Appointment | null>;
  createAppointment(input: CreateAppointmentInput): Promise<Appointment>;
  updateAppointment(id: string, input: UpdateAppointmentInput): Promise<Appointment>;
  updateAppointmentStatus(id: string, status: AppointmentStatus, reason?: string): Promise<Appointment>;
  cancelAppointment(id: string, reason?: string, cancelledBy?: "professional" | "client"): Promise<Appointment>;
  getAvailableSlots(date: Date, procedureId: string, durationMinutes?: number): Promise<Date[]>;
  getPendingApprovals(): Promise<Appointment[]>;
  getTodayAppointments(): Promise<Appointment[]>;
}
