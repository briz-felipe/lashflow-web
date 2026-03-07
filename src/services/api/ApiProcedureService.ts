import type { Procedure, CreateProcedureInput, UpdateProcedureInput } from "@/domain/entities";
import type { IProcedureService } from "../interfaces/IProcedureService";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export class ApiProcedureService implements IProcedureService {
  async listProcedures(activeOnly = false): Promise<Procedure[]> {
    const params = activeOnly ? "?active=true" : "";
    const res = await fetch(`${BASE_URL}/procedimentos${params}`);
    if (!res.ok) throw new Error("Erro ao listar procedimentos");
    return res.json();
  }

  async getProcedureById(id: string): Promise<Procedure | null> {
    const res = await fetch(`${BASE_URL}/procedimentos/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Erro ao buscar procedimento");
    return res.json();
  }

  async createProcedure(input: CreateProcedureInput): Promise<Procedure> {
    const res = await fetch(`${BASE_URL}/procedimentos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Erro ao criar procedimento");
    return res.json();
  }

  async updateProcedure(id: string, input: UpdateProcedureInput): Promise<Procedure> {
    const res = await fetch(`${BASE_URL}/procedimentos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Erro ao atualizar procedimento");
    return res.json();
  }

  async deleteProcedure(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/procedimentos/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Erro ao deletar procedimento");
  }

  async toggleActive(id: string): Promise<Procedure> {
    const res = await fetch(`${BASE_URL}/procedimentos/${id}/toggle`, { method: "PATCH" });
    if (!res.ok) throw new Error("Erro ao alterar status");
    return res.json();
  }
}
