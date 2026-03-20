import { api } from "@/lib/api";
import type { ExtraService, CreateExtraServiceInput, UpdateExtraServiceInput } from "@/domain/entities";

export const extraServiceApi = {
  list(includeInactive = false): Promise<ExtraService[]> {
    return api.get(`/extra-services/?include_inactive=${includeInactive}`);
  },

  create(input: CreateExtraServiceInput): Promise<ExtraService> {
    return api.post("/extra-services/", input);
  },

  update(id: string, input: UpdateExtraServiceInput): Promise<ExtraService> {
    return api.put(`/extra-services/${id}`, input);
  },

  delete(id: string): Promise<void> {
    return api.delete(`/extra-services/${id}`);
  },
};
