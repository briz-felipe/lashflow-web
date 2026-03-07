export type AnamnesisHairLoss = "low" | "medium" | "high";
export type AnamnosisProcedureType = "extension" | "permanent" | "lash_lifting";

export interface LashMapping {
  size?: string;
  curve?: string;
  thickness?: string;
}

export interface Anamnesis {
  id: string;
  clientId: string;
  createdAt: Date;
  updatedAt: Date;

  // Preventive
  hasAllergy: boolean;
  allergyDetails?: string;
  hadEyeSurgeryLast3Months: boolean;
  hasEyeDisease: boolean;
  eyeDiseaseDetails?: string;
  usesEyeDrops: boolean;
  familyThyroidHistory: boolean;
  hasGlaucoma: boolean;
  hairLossGrade?: AnamnesisHairLoss;
  proneToBlepharitis: boolean;
  hasEpilepsy: boolean;

  // Service
  procedureType: AnamnosisProcedureType;
  mapping?: LashMapping;

  // Authorizations
  authorizedPhotoPublishing: boolean;
  signedAt?: Date;

  notes?: string;
}

export type CreateAnamnesisInput = Omit<Anamnesis, "id" | "createdAt" | "updatedAt">;
