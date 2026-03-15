import { api } from "@/lib/api";
import type { Client, CreateClientInput, UpdateClientInput } from "@/domain/entities";
import type {
  IClientService,
  ClientFilters,
  PaginationOptions,
  PaginatedResult,
} from "../interfaces/IClientService";

export class ApiClientService implements IClientService {
  async listClients(
    filters?: ClientFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Client>> {
    const params = new URLSearchParams();
    if (filters?.search) params.set("search", filters.search);
    if (filters?.segments) params.set("segments", filters.segments.join(","));
    if (pagination?.page) params.set("page", String(pagination.page));
    if (pagination?.perPage) params.set("per_page", String(pagination.perPage));
    return api.get(`/clients/?${params}`);
  }

  getClientById(id: string): Promise<Client | null> {
    return api.get(`/clients/${id}`);
  }

  createClient(input: CreateClientInput): Promise<Client> {
    return api.post("/clients/", input);
  }

  updateClient(id: string, input: UpdateClientInput): Promise<Client> {
    return api.put(`/clients/${id}`, input);
  }

  deleteClient(id: string): Promise<void> {
    return api.delete(`/clients/${id}`);
  }

  searchClients(query: string): Promise<Client[]> {
    return api.get(`/clients/search?q=${encodeURIComponent(query)}`);
  }
}
