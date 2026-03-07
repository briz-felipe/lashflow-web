import type { Procedure, CreateProcedureInput, UpdateProcedureInput } from "@/domain/entities";

export interface IProcedureService {
  listProcedures(activeOnly?: boolean): Promise<Procedure[]>;
  getProcedureById(id: string): Promise<Procedure | null>;
  createProcedure(input: CreateProcedureInput): Promise<Procedure>;
  updateProcedure(id: string, input: UpdateProcedureInput): Promise<Procedure>;
  deleteProcedure(id: string): Promise<void>;
  toggleActive(id: string): Promise<Procedure>;
}
