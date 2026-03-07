import type { StockMovementType } from "../enums";

export interface StockMovement {
  id: string;
  materialId: string;
  type: StockMovementType;
  quantity: number;
  unitCostInCents: number;
  totalCostInCents: number;
  date: Date;
  notes?: string;
  createdAt: Date;
}

export type CreateStockMovementInput = Pick<
  StockMovement,
  "materialId" | "type" | "quantity" | "unitCostInCents" | "notes"
>;
