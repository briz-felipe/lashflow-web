"use client";

import { useState, useEffect, useCallback } from "react";
import { procedureService } from "@/services";
import type { Procedure, CreateProcedureInput, UpdateProcedureInput } from "@/domain/entities";

export function useProcedures(activeOnly = false) {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await procedureService.listProcedures(activeOnly);
      setProcedures(result);
    } catch (err) {
      console.error("[useProcedures] load:", err);
      setError("Erro ao carregar procedimentos");
    } finally {
      setLoading(false);
    }
  }, [activeOnly]);

  useEffect(() => {
    load();
  }, [load]);

  const createProcedure = useCallback(
    async (input: CreateProcedureInput): Promise<Procedure> => {
      const proc = await procedureService.createProcedure(input);
      await load();
      return proc;
    },
    [load]
  );

  const updateProcedure = useCallback(
    async (id: string, input: UpdateProcedureInput): Promise<Procedure> => {
      const proc = await procedureService.updateProcedure(id, input);
      await load();
      return proc;
    },
    [load]
  );

  const deleteProcedure = useCallback(
    async (id: string): Promise<void> => {
      await procedureService.deleteProcedure(id);
      await load();
    },
    [load]
  );

  const toggleActive = useCallback(
    async (id: string): Promise<Procedure> => {
      const proc = await procedureService.toggleActive(id);
      await load();
      return proc;
    },
    [load]
  );

  return { procedures, loading, error, reload: load, createProcedure, updateProcedure, deleteProcedure, toggleActive };
}
