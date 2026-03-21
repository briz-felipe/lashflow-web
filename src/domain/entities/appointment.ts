import type { AppointmentStatus, LashServiceType } from "../enums";

export interface AppointmentProcedure {
  id: string;
  procedureId: string;
  procedureName: string;
  customPriceInCents: number | null;
  originalPriceInCents: number;
  effectivePriceInCents: number;
  durationMinutes: number;
}

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

  procedures?: AppointmentProcedure[];
}

export type ProcedureInput = {
  procedureId: string;
  customPriceInCents?: number | null;
};

export type CreateAppointmentInput = {
  clientId: string;
  procedureId?: string;           // legacy single-procedure
  scheduledAt: Date;
  serviceType?: LashServiceType;
  priceCharged?: number;
  durationMinutes?: number;
  procedureName?: string;
  notes?: string;
  status?: AppointmentStatus;
  procedures?: ProcedureInput[];  // new multi-procedure
};

export type UpdateAppointmentInput = {
  procedureId?: string;
  scheduledAt?: Date;
  serviceType?: LashServiceType;
  priceCharged?: number;
  durationMinutes?: number;
  procedureName?: string; // empty string = clear override
  notes?: string;
  procedures?: ProcedureInput[];  // new multi-procedure
};
