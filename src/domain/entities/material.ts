import type { MaterialCategory, MaterialUnit } from "../enums";

export interface Material {
  id: string;
  name: string;
  category: MaterialCategory;
  unit: MaterialUnit;
  unitCostInCents: number;
  currentStock: number;
  minimumStock: number;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateMaterialInput = Pick<
  Material,
  "name" | "category" | "unit" | "unitCostInCents" | "minimumStock" | "notes"
> & { initialStock?: number };

export type UpdateMaterialInput = Partial<CreateMaterialInput>;
