"use client";

import { useState, useEffect, useCallback } from "react";
import { stockService } from "@/services";
import type { Material, StockMovement, CreateMaterialInput, CreateStockMovementInput } from "@/domain/entities";
import type { MaterialCategory } from "@/domain/enums";
import type { StockAlert, MonthlyStockCost } from "@/services/interfaces/IStockService";

export function useStock(filters?: { category?: MaterialCategory; search?: string; lowStock?: boolean }) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const filtersKey = JSON.stringify(filters);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await stockService.listMaterials(filters);
    setMaterials(result);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  useEffect(() => { load(); }, [load]);

  const createMaterial = useCallback(async (input: CreateMaterialInput) => {
    const mat = await stockService.createMaterial(input);
    await load();
    return mat;
  }, [load]);

  const createMovement = useCallback(async (input: CreateStockMovementInput) => {
    const mov = await stockService.createMovement(input);
    await load();
    return mov;
  }, [load]);

  return { materials, loading, reload: load, createMaterial, createMovement };
}

export function useStockMovements(filters?: { materialId?: string; from?: Date; to?: Date }) {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    stockService.listMovements(filters).then((m) => {
      if (mounted) { setMovements(m); setLoading(false); }
    });
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  return { movements, loading };
}

export function useStockAlerts() {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    stockService.getLowStockAlerts().then((a) => {
      if (mounted) { setAlerts(a); setLoading(false); }
    });
    return () => { mounted = false; };
  }, []);

  return { alerts, loading };
}

export function useStockAnalytics() {
  const [monthlyCosts, setMonthlyCosts] = useState<MonthlyStockCost[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      stockService.getMonthlyStockCosts(6),
      stockService.getTotalStockValueInCents(),
    ]).then(([costs, value]) => {
      if (mounted) {
        setMonthlyCosts(costs);
        setTotalValue(value);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  return { monthlyCosts, totalValue, loading };
}
