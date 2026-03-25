import type { ClientSegment } from "../enums";

export interface ClientAddress {
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;

  email?: string;
  instagram?: string;
  address?: ClientAddress;
  birthday?: string;
  notes?: string;

  segments: ClientSegment[];
  favoriteProcedureId?: string;
  totalSpent: number;
  appointmentsCount: number;
  lastAppointmentDate?: Date;
}

export type CreateClientInput = Pick<Client, "name"> &
  Partial<Pick<Client, "phone" | "email" | "instagram" | "address" | "birthday" | "notes">>;

export type UpdateClientInput = Partial<CreateClientInput> & {
  segments?: ClientSegment[];
};
