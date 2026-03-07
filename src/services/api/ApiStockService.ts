import type { Material, CreateMaterialInput, UpdateMaterialInput, StockMovement, CreateStockMovementInput } from "@/domain/entities";
import type { IStockService, StockAlert, MonthlyStockCost } from "../interfaces/IStockService";
import type { MaterialCategory } from "@/domain/enums";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export class ApiStockService implements IStockService {
  async listMaterials(filters?: { category?: MaterialCategory; search?: string; lowStock?: boolean }): Promise<Material[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.set("category", filters.category);
    if (filters?.search) params.set("search", filters.search);
    if (filters?.lowStock) params.set("lowStock", "true");
    const res = await fetch(`${BASE_URL}/materials?${params}`);
    if (!res.ok) throw new Error("Erro ao listar materiais");
    return res.json();
  }

  async getMaterialById(id: string): Promise<Material | null> {
    const res = await fetch(`${BASE_URL}/materials/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Erro ao buscar material");
    return res.json();
  }

  async createMaterial(input: CreateMaterialInput): Promise<Material> {
    const res = await fetch(`${BASE_URL}/materials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Erro ao criar material");
    return res.json();
  }

  async updateMaterial(id: string, input: UpdateMaterialInput): Promise<Material> {
    const res = await fetch(`${BASE_URL}/materials/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Erro ao atualizar material");
    return res.json();
  }

  async deleteMaterial(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/materials/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Erro ao deletar material");
  }

  async listMovements(filters?: { materialId?: string; from?: Date; to?: Date }): Promise<StockMovement[]> {
    const params = new URLSearchParams();
    if (filters?.materialId) params.set("materialId", filters.materialId);
    if (filters?.from) params.set("from", filters.from.toISOString());
    if (filters?.to) params.set("to", filters.to.toISOString());
    const res = await fetch(`${BASE_URL}/stock-movements?${params}`);
    if (!res.ok) throw new Error("Erro ao listar movimentações");
    return res.json();
  }

  async createMovement(input: CreateStockMovementInput): Promise<StockMovement> {
    const res = await fetch(`${BASE_URL}/stock-movements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Erro ao registrar movimentação");
    return res.json();
  }

  async getLowStockAlerts(): Promise<StockAlert[]> {
    const res = await fetch(`${BASE_URL}/stock/alerts`);
    if (!res.ok) throw new Error("Erro ao buscar alertas");
    return res.json();
  }

  async getMonthlyStockCosts(months = 6): Promise<MonthlyStockCost[]> {
    const res = await fetch(`${BASE_URL}/stock/monthly-costs?months=${months}`);
    if (!res.ok) throw new Error("Erro ao buscar custos mensais");
    return res.json();
  }

  async getTotalStockValueInCents(): Promise<number> {
    const res = await fetch(`${BASE_URL}/stock/total-value`);
    if (!res.ok) throw new Error("Erro ao buscar valor total");
    const data = await res.json();
    return data.totalValueInCents;
  }
}
