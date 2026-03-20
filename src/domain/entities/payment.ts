import type { PaymentMethod, PaymentStatus } from "../enums";

export interface PartialPaymentRecord {
  id: string;
  amountInCents: number;
  method: PaymentMethod;
  paidAt: Date;
}

export interface Payment {
  id: string;
  appointmentId: string;
  clientId: string;
  subtotalAmountInCents: number;
  discountAmountInCents: number;
  feeAmountInCents: number;
  totalAmountInCents: number;
  paidAmountInCents: number;
  status: PaymentStatus;
  method?: PaymentMethod;
  paidAt?: Date;
  partialPayments?: PartialPaymentRecord[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreatePaymentInput = {
  appointmentId: string;
  clientId: string;
  subtotalAmountInCents?: number;
  discountAmountInCents?: number;
  feeAmountInCents?: number;
  totalAmountInCents: number;
  method?: PaymentMethod;
  notes?: string;
};
