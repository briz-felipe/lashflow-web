export interface Procedure {
  id: string;
  name: string;
  description?: string;
  priceInCents: number;
  durationMinutes: number;
  isActive: boolean;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateProcedureInput = Omit<Procedure, "id" | "createdAt" | "updatedAt">;
export type UpdateProcedureInput = Partial<CreateProcedureInput>;
