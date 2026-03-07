import type { Procedure, CreateProcedureInput, UpdateProcedureInput } from "@/domain/entities";
import type { IProcedureService } from "../interfaces/IProcedureService";
import { mockProcedures } from "@/data";

export class MockProcedureService implements IProcedureService {
  private procedures: Procedure[] = mockProcedures.map((p) => ({ ...p }));

  async listProcedures(activeOnly = false): Promise<Procedure[]> {
    return activeOnly ? this.procedures.filter((p) => p.isActive) : [...this.procedures];
  }

  async getProcedureById(id: string): Promise<Procedure | null> {
    return this.procedures.find((p) => p.id === id) ?? null;
  }

  async createProcedure(input: CreateProcedureInput): Promise<Procedure> {
    const newProcedure: Procedure = {
      ...input,
      id: `proc-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.procedures.push(newProcedure);
    return newProcedure;
  }

  async updateProcedure(id: string, input: UpdateProcedureInput): Promise<Procedure> {
    const idx = this.procedures.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Procedimento não encontrado");
    this.procedures[idx] = { ...this.procedures[idx], ...input, updatedAt: new Date() };
    return this.procedures[idx];
  }

  async deleteProcedure(id: string): Promise<void> {
    this.procedures = this.procedures.filter((p) => p.id !== id);
  }

  async toggleActive(id: string): Promise<Procedure> {
    const idx = this.procedures.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Procedimento não encontrado");
    this.procedures[idx].isActive = !this.procedures[idx].isActive;
    this.procedures[idx].updatedAt = new Date();
    return this.procedures[idx];
  }
}
