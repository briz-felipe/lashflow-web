import { api } from "@/lib/api";
import type { Material, CreateMaterialInput, UpdateMaterialInput, StockMovement, CreateStockMovementInput } from "@/domain/entities";
import type { IStockService, StockAlert, MonthlyStockCost } from "../interfaces/IStockService";
import type { MaterialCategory } from "@/domain/enums";

export class ApiStockService implements IStockService {
  async listMaterials(filters?: { category?: MaterialCategory; search?: string; lowStock?: boolean }): Promise<Material[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.set("category", filters.category);
    if (filters?.search) params.set("search", filters.search);
    if (filters?.lowStock) params.set("low_stock", "true");
    const qs = params.toString();
    return api.get(`/stock/materials${qs ? `?${qs}` : ""}`);
  }

  getMaterialById(id: string): Promise<Material | null> {
    return api.get(`/stock/materials/${id}`);
  }

  createMaterial(input: CreateMaterialInput): Promise<Material> {
    return api.post("/stock/materials", input);
  }

  updateMaterial(id: string, input: UpdateMaterialInput): Promise<Material> {
    return api.patch(`/stock/materials/${id}`, input);
  }

  deleteMaterial(id: string): Promise<void> {
    return api.delete(`/stock/materials/${id}`);
  }

  async listMovements(filters?: { materialId?: string; from?: Date; to?: Date }): Promise<StockMovement[]> {
    const params = new URLSearchParams();
    if (filters?.materialId) params.set("material_id", filters.materialId);
    if (filters?.from) params.set("from", filters.from.toISOString());
    if (filters?.to) params.set("to", filters.to.toISOString());
    const qs = params.toString();
    return api.get(`/stock/movements${qs ? `?${qs}` : ""}`);
  }

  createMovement(input: CreateStockMovementInput): Promise<StockMovement> {
    return api.post("/stock/movements", input);
  }

  getLowStockAlerts(): Promise<StockAlert[]> {
    return api.get("/stock/materials/alerts");
  }

  getMonthlyStockCosts(months = 6): Promise<MonthlyStockCost[]> {
    return api.get(`/stock/monthly-costs?months=${months}`);
  }

  async getTotalStockValueInCents(): Promise<number> {
    const data = await api.get<{ total_value_in_cents?: number; totalValueInCents?: number }>("/stock/value");
    return data.total_value_in_cents ?? data.totalValueInCents ?? 0;
  }
}
