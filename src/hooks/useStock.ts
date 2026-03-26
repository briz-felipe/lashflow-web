"use client";

import { useState, useEffect, useCallback } from "react";
import { stockService } from "@/services";
import type { Material, StockMovement, CreateMaterialInput, UpdateMaterialInput, CreateStockMovementInput } from "@/domain/entities";
import type { MaterialCategory } from "@/domain/enums";
import type { StockAlert, MonthlyStockCost } from "@/services/interfaces/IStockService";

export function useStock(filters?: { category?: MaterialCategory; search?: string; lowStock?: boolean }) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const filtersKey = JSON.stringify(filters);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await stockService.listMaterials(filters);
      setMaterials(result);
    } catch (err) {
      console.error("[useStock] load:", err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  useEffect(() => { load(); }, [load]);

  const createMaterial = useCallback(async (input: CreateMaterialInput) => {
    const mat = await stockService.createMaterial(input);
    await load();
    return mat;
  }, [load]);

  const updateMaterial = useCallback(async (id: string, input: UpdateMaterialInput) => {
    const mat = await stockService.updateMaterial(id, input);
    await load();
    return mat;
  }, [load]);

  const deleteMaterial = useCallback(async (id: string) => {
    await stockService.deleteMaterial(id);
    await load();
  }, [load]);

  const createMovement = useCallback(async (input: CreateStockMovementInput) => {
    const mov = await stockService.createMovement(input);
    await load();
    return mov;
  }, [load]);

  return { materials, loading, reload: load, createMaterial, updateMaterial, deleteMaterial, createMovement };
}

export function useStockMovements(filters?: { materialId?: string; from?: Date; to?: Date }) {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const filtersKey = JSON.stringify(filters);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const m = await stockService.listMovements(filters);
      setMovements(m);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  useEffect(() => { load(); }, [load]);

  const updateMovement = useCallback(async (id: string, input: Partial<Pick<StockMovement, "quantity" | "unitCostInCents" | "expenseId" | "notes">>) => {
    const mov = await stockService.updateMovement(id, input);
    await load();
    return mov;
  }, [load]);

  const deleteMovement = useCallback(async (id: string) => {
    await stockService.deleteMovement(id);
    await load();
  }, [load]);

  return { movements, loading, reload: load, updateMovement, deleteMovement };
}

export function useStockAlerts() {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const a = await stockService.getLowStockAlerts();
      setAlerts(a);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { alerts, loading, reload: load };
}

export function useStockAnalytics() {
  const [monthlyCosts, setMonthlyCosts] = useState<MonthlyStockCost[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [costs, value] = await Promise.all([
        stockService.getMonthlyStockCosts(6),
        stockService.getTotalStockValueInCents(),
      ]);
      setMonthlyCosts(costs);
      setTotalValue(value);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { monthlyCosts, totalValue, loading, reload: load };
}
