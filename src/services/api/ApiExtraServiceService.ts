import { api } from "@/lib/api";
import type { ExtraService, CreateExtraServiceInput, UpdateExtraServiceInput } from "@/domain/entities";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(raw: any): ExtraService {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    defaultAmountInCents: raw.default_amount_in_cents,
    type: raw.type,
    isActive: raw.is_active,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export const extraServiceApi = {
  list(includeInactive = false): Promise<ExtraService[]> {
    return api
      .get<unknown[]>(`/extra-services/?include_inactive=${includeInactive}`)
      .then((rows) => rows.map(normalize));
  },

  create(input: CreateExtraServiceInput): Promise<ExtraService> {
    return api
      .post<unknown>("/extra-services/", {
        name: input.name,
        description: input.description,
        default_amount_in_cents: input.defaultAmountInCents,
        type: input.type,
      })
      .then(normalize);
  },

  update(id: string, input: UpdateExtraServiceInput): Promise<ExtraService> {
    const body: Record<string, unknown> = {};
    if (input.name !== undefined) body.name = input.name;
    if (input.description !== undefined) body.description = input.description;
    if (input.defaultAmountInCents !== undefined) body.default_amount_in_cents = input.defaultAmountInCents;
    if (input.type !== undefined) body.type = input.type;
    if (input.isActive !== undefined) body.is_active = input.isActive;
    return api.put<unknown>(`/extra-services/${id}`, body).then(normalize);
  },

  delete(id: string): Promise<void> {
    return api.delete(`/extra-services/${id}`);
  },
};
