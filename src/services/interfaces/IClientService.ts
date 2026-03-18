import type { Client, CreateClientInput, UpdateClientInput } from "@/domain/entities";
import type { ClientSegment } from "@/domain/enums";
import type { Procedure } from "@/domain/entities";

export interface ClientFilters {
  search?: string;
  segments?: ClientSegment[];
  procedureId?: string;
  minSpent?: number;
  maxSpent?: number;
  sortBy?: "most_visited" | "least_visited" | "highest_spent" | "last_seen_asc" | "last_seen_desc";
}

export interface PaginationOptions {
  page: number;
  perPage: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
}

export interface ClientStats {
  totalSpent: number;
  appointmentsCount: number;
  lastAppointmentDate?: Date;
  favoriteProcedure?: Procedure;
  segments: ClientSegment[];
}

export interface IClientService {
  listClients(filters?: ClientFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Client>>;
  getClientById(id: string): Promise<Client | null>;
  createClient(input: CreateClientInput): Promise<Client>;
  updateClient(id: string, input: UpdateClientInput): Promise<Client>;
  deleteClient(id: string): Promise<void>;
  searchClients(query: string): Promise<Client[]>;
}
