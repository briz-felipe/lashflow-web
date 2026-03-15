import { api } from "@/lib/api";
import type { Anamnesis, CreateAnamnesisInput } from "@/domain/entities";
import type { IAnamnesisService } from "../interfaces/IAnamnesisService";

export class ApiAnamnesisService implements IAnamnesisService {
  listByClient(clientId: string): Promise<Anamnesis[]> {
    return api.get(`/anamneses/?client_id=${clientId}`);
  }

  getById(id: string): Promise<Anamnesis | null> {
    return api.get(`/anamneses/${id}`);
  }

  create(input: CreateAnamnesisInput): Promise<Anamnesis> {
    return api.post("/anamneses/", input);
  }

  update(id: string, input: Partial<CreateAnamnesisInput>): Promise<Anamnesis> {
    return api.put(`/anamneses/${id}`, input);
  }
}
