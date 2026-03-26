import type { Material, CreateMaterialInput, UpdateMaterialInput, StockMovement, CreateStockMovementInput } from "@/domain/entities";
import type { MaterialCategory } from "@/domain/enums";

export interface StockAlert {
  materialId: string;
  materialName: string;
  currentStock: number;
  minimumStock: number;
}

export interface MonthlyStockCost {
  month: string;
  totalCostInCents: number;
  purchaseCount: number;
}

export interface IStockService {
  // Materials CRUD
  listMaterials(filters?: { category?: MaterialCategory; search?: string; lowStock?: boolean }): Promise<Material[]>;
  getMaterialById(id: string): Promise<Material | null>;
  createMaterial(input: CreateMaterialInput): Promise<Material>;
  updateMaterial(id: string, input: UpdateMaterialInput): Promise<Material>;
  deleteMaterial(id: string): Promise<void>;

  // Stock movements
  listMovements(filters?: { materialId?: string; from?: Date; to?: Date }): Promise<StockMovement[]>;
  createMovement(input: CreateStockMovementInput): Promise<StockMovement>;
  updateMovement(id: string, input: Partial<Pick<StockMovement, "quantity" | "unitCostInCents" | "expenseId" | "notes">>): Promise<StockMovement>;
  deleteMovement(id: string): Promise<void>;

  // Analytics
  getLowStockAlerts(): Promise<StockAlert[]>;
  getMonthlyStockCosts(months?: number): Promise<MonthlyStockCost[]>;
  getTotalStockValueInCents(): Promise<number>;
}
