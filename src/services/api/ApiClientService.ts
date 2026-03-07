import type { Client, CreateClientInput, UpdateClientInput } from "@/domain/entities";
import type {
  IClientService,
  ClientFilters,
  PaginationOptions,
  PaginatedResult,
} from "../interfaces/IClientService";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export class ApiClientService implements IClientService {
  async listClients(
    filters?: ClientFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Client>> {
    const params = new URLSearchParams();
    if (filters?.search) params.set("search", filters.search);
    if (filters?.segments) params.set("segments", filters.segments.join(","));
    if (pagination?.page) params.set("page", String(pagination.page));
    if (pagination?.perPage) params.set("perPage", String(pagination.perPage));

    const res = await fetch(`${BASE_URL}/clientes?${params}`);
    if (!res.ok) throw new Error("Erro ao listar clientes");
    return res.json();
  }

  async getClientById(id: string): Promise<Client | null> {
    const res = await fetch(`${BASE_URL}/clientes/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Erro ao buscar cliente");
    return res.json();
  }

  async createClient(input: CreateClientInput): Promise<Client> {
    const res = await fetch(`${BASE_URL}/clientes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Erro ao criar cliente");
    return res.json();
  }

  async updateClient(id: string, input: UpdateClientInput): Promise<Client> {
    const res = await fetch(`${BASE_URL}/clientes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Erro ao atualizar cliente");
    return res.json();
  }

  async deleteClient(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/clientes/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Erro ao deletar cliente");
  }

  async searchClients(query: string): Promise<Client[]> {
    const res = await fetch(`${BASE_URL}/clientes/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error("Erro ao buscar clientes");
    return res.json();
  }
}
