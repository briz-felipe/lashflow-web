import type { Material, CreateMaterialInput, UpdateMaterialInput, StockMovement, CreateStockMovementInput } from "@/domain/entities";
import type { IStockService, StockAlert, MonthlyStockCost } from "../interfaces/IStockService";
import type { MaterialCategory } from "@/domain/enums";
import { mockMaterials, mockStockMovements } from "@/data";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

export class MockStockService implements IStockService {
  private materials = [...mockMaterials];
  private movements = [...mockStockMovements];

  async listMaterials(filters?: { category?: MaterialCategory; search?: string; lowStock?: boolean }): Promise<Material[]> {
    let result = this.materials.filter((m) => m.isActive);
    if (filters?.category) result = result.filter((m) => m.category === filters.category);
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      result = result.filter((m) => m.name.toLowerCase().includes(s));
    }
    if (filters?.lowStock) result = result.filter((m) => m.currentStock <= m.minimumStock);
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }

  async getMaterialById(id: string): Promise<Material | null> {
    return this.materials.find((m) => m.id === id) ?? null;
  }

  async createMaterial(input: CreateMaterialInput): Promise<Material> {
    const now = new Date();
    const mat: Material = {
      id: `mat-${String(this.materials.length + 1).padStart(3, "0")}`,
      name: input.name,
      category: input.category,
      unit: input.unit,
      unitCostInCents: input.unitCostInCents,
      currentStock: input.initialStock ?? 0,
      minimumStock: input.minimumStock,
      isActive: true,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };
    this.materials.push(mat);
    return mat;
  }

  async updateMaterial(id: string, input: UpdateMaterialInput): Promise<Material> {
    const mat = this.materials.find((m) => m.id === id);
    if (!mat) throw new Error("Material não encontrado");
    Object.assign(mat, input, { updatedAt: new Date() });
    return mat;
  }

  async deleteMaterial(id: string): Promise<void> {
    const mat = this.materials.find((m) => m.id === id);
    if (mat) mat.isActive = false;
  }

  async listMovements(filters?: { materialId?: string; from?: Date; to?: Date }): Promise<StockMovement[]> {
    let result = [...this.movements];
    if (filters?.materialId) result = result.filter((m) => m.materialId === filters.materialId);
    if (filters?.from) result = result.filter((m) => m.date >= filters.from!);
    if (filters?.to) result = result.filter((m) => m.date <= filters.to!);
    return result.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async createMovement(input: CreateStockMovementInput): Promise<StockMovement> {
    const mat = this.materials.find((m) => m.id === input.materialId);
    if (!mat) throw new Error("Material não encontrado");

    const movement: StockMovement = {
      id: `mov-${String(this.movements.length + 1).padStart(3, "0")}`,
      materialId: input.materialId,
      type: input.type,
      quantity: input.quantity,
      unitCostInCents: input.unitCostInCents,
      totalCostInCents: input.quantity * input.unitCostInCents,
      date: new Date(),
      notes: input.notes,
      createdAt: new Date(),
    };
    this.movements.push(movement);

    if (input.type === "purchase") {
      mat.currentStock += input.quantity;
      mat.unitCostInCents = input.unitCostInCents;
    } else if (input.type === "usage") {
      mat.currentStock = Math.max(0, mat.currentStock - input.quantity);
    } else {
      mat.currentStock = Math.max(0, mat.currentStock + input.quantity);
    }
    mat.updatedAt = new Date();

    return movement;
  }

  async updateMovement(id: string, input: Partial<Pick<StockMovement, "quantity" | "unitCostInCents" | "expenseId" | "notes">>): Promise<StockMovement> {
    const mov = this.movements.find((m) => m.id === id);
    if (!mov) throw new Error("Movement não encontrado");
    Object.assign(mov, input);
    if (input.quantity || input.unitCostInCents) {
      mov.totalCostInCents = (input.quantity ?? mov.quantity) * (input.unitCostInCents ?? mov.unitCostInCents);
    }
    return mov;
  }

  async deleteMovement(id: string): Promise<void> {
    const idx = this.movements.findIndex((m) => m.id === id);
    if (idx >= 0) this.movements.splice(idx, 1);
  }

  async getLowStockAlerts(): Promise<StockAlert[]> {
    return this.materials
      .filter((m) => m.isActive && m.currentStock <= m.minimumStock)
      .map((m) => ({
        materialId: m.id,
        materialName: m.name,
        currentStock: m.currentStock,
        minimumStock: m.minimumStock,
      }));
  }

  async getMonthlyStockCosts(months = 6): Promise<MonthlyStockCost[]> {
    const result: MonthlyStockCost[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const month = format(d, "yyyy-MM");
      const from = startOfMonth(d);
      const to = endOfMonth(d);
      const purchases = this.movements.filter(
        (m) => m.type === "purchase" && m.date >= from && m.date <= to,
      );
      result.push({
        month,
        totalCostInCents: purchases.reduce((sum, m) => sum + m.totalCostInCents, 0),
        purchaseCount: purchases.length,
      });
    }
    return result;
  }

  async getTotalStockValueInCents(): Promise<number> {
    return this.materials
      .filter((m) => m.isActive)
      .reduce((sum, m) => sum + m.currentStock * m.unitCostInCents, 0);
  }
}
