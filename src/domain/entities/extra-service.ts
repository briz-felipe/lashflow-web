export type ExtraServiceType = "add" | "deduct";

export interface ExtraService {
  id: string;
  name: string;
  description?: string;
  defaultAmountInCents: number;
  type: ExtraServiceType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateExtraServiceInput = {
  name: string;
  description?: string;
  defaultAmountInCents: number;
  type: ExtraServiceType;
};

export type UpdateExtraServiceInput = Partial<CreateExtraServiceInput> & {
  isActive?: boolean;
};
