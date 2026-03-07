import type { LashTechnique } from "../enums";

export interface Procedure {
  id: string;
  name: string;
  technique: LashTechnique;
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
