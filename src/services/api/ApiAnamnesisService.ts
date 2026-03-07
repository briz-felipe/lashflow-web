import type { Anamnesis, CreateAnamnesisInput } from "@/domain/entities";
import type { IAnamnesisService } from "../interfaces/IAnamnesisService";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export class ApiAnamnesisService implements IAnamnesisService {
  async listByClient(clientId: string): Promise<Anamnesis[]> {
    const res = await fetch(`${BASE_URL}/anamneses?clientId=${clientId}`);
    if (!res.ok) throw new Error("Erro ao listar anamneses");
    return res.json();
  }

  async getById(id: string): Promise<Anamnesis | null> {
    const res = await fetch(`${BASE_URL}/anamneses/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Erro ao buscar anamnese");
    return res.json();
  }

  async create(input: CreateAnamnesisInput): Promise<Anamnesis> {
    const res = await fetch(`${BASE_URL}/anamneses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Erro ao criar anamnese");
    return res.json();
  }

  async update(id: string, input: Partial<CreateAnamnesisInput>): Promise<Anamnesis> {
    const res = await fetch(`${BASE_URL}/anamneses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Erro ao atualizar anamnese");
    return res.json();
  }
}
