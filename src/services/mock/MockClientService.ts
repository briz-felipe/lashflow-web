import type { Client, CreateClientInput, UpdateClientInput } from "@/domain/entities";
import type {
  IClientService,
  ClientFilters,
  PaginationOptions,
  PaginatedResult,
} from "../interfaces/IClientService";
import { mockClients } from "@/data";

export class MockClientService implements IClientService {
  private clients: Client[] = mockClients.map((c) => ({ ...c }));

  async listClients(
    filters?: ClientFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Client>> {
    let result = [...this.clients];

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.instagram?.toLowerCase().includes(q)
      );
    }

    if (filters?.segments?.length) {
      result = result.filter((c) =>
        c.segments.some((s) => filters.segments!.includes(s))
      );
    }

    result.sort((a, b) => a.name.localeCompare(b.name));

    const total = result.length;
    if (pagination) {
      const start = (pagination.page - 1) * pagination.perPage;
      result = result.slice(start, start + pagination.perPage);
    }

    return {
      data: result,
      total,
      page: pagination?.page ?? 1,
      perPage: pagination?.perPage ?? total,
    };
  }

  async getClientById(id: string): Promise<Client | null> {
    return this.clients.find((c) => c.id === id) ?? null;
  }

  async createClient(input: CreateClientInput): Promise<Client> {
    const newClient: Client = {
      ...input,
      phone: input.phone ?? "",
      id: `cli-${Date.now()}`,
      segments: [],
      totalSpent: 0,
      appointmentsCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.clients.push(newClient);
    return newClient;
  }

  async updateClient(id: string, input: UpdateClientInput): Promise<Client> {
    const idx = this.clients.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error("Cliente não encontrado");
    this.clients[idx] = { ...this.clients[idx], ...input, updatedAt: new Date() };
    return this.clients[idx];
  }

  async deleteClient(id: string): Promise<void> {
    this.clients = this.clients.filter((c) => c.id !== id);
  }

  async searchClients(query: string): Promise<Client[]> {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return this.clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.email?.toLowerCase().includes(q)
    );
  }
}
