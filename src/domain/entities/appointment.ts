import type { AppointmentStatus, LashServiceType } from "../enums";

export interface Appointment {
  id: string;
  clientId: string;
  clientName?: string;
  clientPhone?: string;
  procedureId: string;
  procedureName?: string;
  paymentId?: string;

  serviceType?: LashServiceType;
  status: AppointmentStatus;
  scheduledAt: Date;
  durationMinutes: number;
  endsAt: Date;
  priceCharged: number;
  notes?: string;

  requestedAt: Date;
  confirmedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  cancelledBy?: "professional" | "client";

  createdAt: Date;
  updatedAt: Date;
}

export type CreateAppointmentInput = {
  clientId: string;
  procedureId: string;
  scheduledAt: Date;
  serviceType?: LashServiceType;
  priceCharged?: number;
  notes?: string;
};
