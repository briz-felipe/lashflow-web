import type { Anamnesis, CreateAnamnesisInput } from "@/domain/entities";

export interface IAnamnesisService {
  listByClient(clientId: string): Promise<Anamnesis[]>;
  getById(id: string): Promise<Anamnesis | null>;
  create(input: CreateAnamnesisInput): Promise<Anamnesis>;
  update(id: string, input: Partial<CreateAnamnesisInput>): Promise<Anamnesis>;
}
