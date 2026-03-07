"use client";

import { useState, useEffect, useCallback } from "react";
import { anamnesisService } from "@/services";
import type { Anamnesis, CreateAnamnesisInput } from "@/domain/entities";

export function useAnamneses(clientId: string) {
  const [anamneses, setAnamneses] = useState<Anamnesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    try {
      const result = await anamnesisService.listByClient(clientId);
      if (isMounted) setAnamneses(result);
    } catch {
      if (isMounted) setError("Erro ao carregar anamneses");
    } finally {
      if (isMounted) setLoading(false);
    }
    return () => { isMounted = false; };
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  const createAnamnesis = useCallback(
    async (input: CreateAnamnesisInput): Promise<Anamnesis> => {
      const a = await anamnesisService.create(input);
      await load();
      return a;
    },
    [load]
  );

  return { anamneses, loading, error, reload: load, createAnamnesis };
}

export function useAnamnesis(id: string) {
  const [anamnesis, setAnamnesis] = useState<Anamnesis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    anamnesisService
      .getById(id)
      .then((a) => { if (isMounted) setAnamnesis(a); })
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, [id]);

  return { anamnesis, loading };
}
