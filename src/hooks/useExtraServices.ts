import { useState, useEffect, useCallback } from "react";
import type { ExtraService, CreateExtraServiceInput, UpdateExtraServiceInput } from "@/domain/entities";
import { extraServiceApi } from "@/services/api/ApiExtraServiceService";

export function useExtraServices(includeInactive = false) {
  const [services, setServices] = useState<ExtraService[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await extraServiceApi.list(includeInactive);
      setServices(data);
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => { load(); }, [load]);

  const create = async (input: CreateExtraServiceInput) => {
    const created = await extraServiceApi.create(input);
    setServices((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    return created;
  };

  const update = async (id: string, input: UpdateExtraServiceInput) => {
    const updated = await extraServiceApi.update(id, input);
    setServices((prev) => prev.map((s) => (s.id === id ? updated : s)));
    return updated;
  };

  const remove = async (id: string) => {
    await extraServiceApi.delete(id);
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  return { services, loading, reload: load, create, update, remove };
}
