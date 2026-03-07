"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { clientService } from "@/services";
import type { Client, CreateClientInput, UpdateClientInput } from "@/domain/entities";
import type { ClientFilters, PaginatedResult } from "@/services/interfaces/IClientService";

export function useClients(filters?: ClientFilters, perPage = 20) {
  const [data, setData] = useState<PaginatedResult<Client>>({
    data: [],
    total: 0,
    page: 1,
    perPage,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const filtersKey = JSON.stringify(filters);

  const load = useCallback(async () => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    try {
      const result = await clientService.listClients(filters, { page, perPage });
      if (isMounted) setData(result);
    } catch {
      if (isMounted) setError("Erro ao carregar clientes");
    } finally {
      if (isMounted) setLoading(false);
    }
    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, page, perPage]);

  useEffect(() => {
    load();
  }, [load]);

  const createClient = useCallback(
    async (input: CreateClientInput): Promise<Client> => {
      const client = await clientService.createClient(input);
      await load();
      return client;
    },
    [load]
  );

  const updateClient = useCallback(
    async (id: string, input: UpdateClientInput): Promise<Client> => {
      const client = await clientService.updateClient(id, input);
      await load();
      return client;
    },
    [load]
  );

  const deleteClient = useCallback(
    async (id: string): Promise<void> => {
      await clientService.deleteClient(id);
      await load();
    },
    [load]
  );

  return { ...data, loading, error, page, setPage, reload: load, createClient, updateClient, deleteClient };
}

export function useClient(id: string) {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setLoading(true);
    clientService
      .getClientById(id)
      .then((c) => { if (isMounted) setClient(c); })
      .catch(() => { if (isMounted) setError("Cliente não encontrado"); })
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, [id]);

  return { client, loading, error };
}
