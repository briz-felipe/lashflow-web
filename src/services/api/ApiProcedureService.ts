import { api } from "@/lib/api";
import type { Procedure, CreateProcedureInput, UpdateProcedureInput } from "@/domain/entities";
import type { IProcedureService } from "../interfaces/IProcedureService";

export class ApiProcedureService implements IProcedureService {
  listProcedures(activeOnly = false): Promise<Procedure[]> {
    return api.get(`/procedures/${activeOnly ? "?activeOnly=true" : ""}`);
  }

  getProcedureById(id: string): Promise<Procedure | null> {
    return api.get(`/procedures/${id}`);
  }

  createProcedure(input: CreateProcedureInput): Promise<Procedure> {
    return api.post("/procedures/", input);
  }

  updateProcedure(id: string, input: UpdateProcedureInput): Promise<Procedure> {
    return api.put(`/procedures/${id}`, input);
  }

  deleteProcedure(id: string): Promise<void> {
    return api.delete(`/procedures/${id}`);
  }

  toggleActive(id: string): Promise<Procedure> {
    return api.patch(`/procedures/${id}/toggle`);
  }
}
