import type { Anamnesis, CreateAnamnesisInput } from "@/domain/entities";
import type { IAnamnesisService } from "../interfaces/IAnamnesisService";
import { mockAnamneses } from "@/data";

export class MockAnamnesisService implements IAnamnesisService {
  private anamneses: Anamnesis[] = [...mockAnamneses];

  async listByClient(clientId: string): Promise<Anamnesis[]> {
    return this.anamneses
      .filter((a) => a.clientId === clientId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getById(id: string): Promise<Anamnesis | null> {
    return this.anamneses.find((a) => a.id === id) ?? null;
  }

  async create(input: CreateAnamnesisInput): Promise<Anamnesis> {
    const now = new Date();
    const anamnesis: Anamnesis = {
      ...input,
      id: `ana-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    this.anamneses.push(anamnesis);
    return anamnesis;
  }

  async update(id: string, input: Partial<CreateAnamnesisInput>): Promise<Anamnesis> {
    const idx = this.anamneses.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error("Anamnese não encontrada");
    this.anamneses[idx] = { ...this.anamneses[idx], ...input, updatedAt: new Date() };
    return this.anamneses[idx];
  }
}
