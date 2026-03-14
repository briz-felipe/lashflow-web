import type { IClientService } from "./interfaces/IClientService";
import type { IAppointmentService } from "./interfaces/IAppointmentService";
import type { IProcedureService } from "./interfaces/IProcedureService";
import type { IPaymentService } from "./interfaces/IPaymentService";
import type { IAnamnesisService } from "./interfaces/IAnamnesisService";
import type { IStockService } from "./interfaces/IStockService";
import type { IExpenseService } from "./interfaces/IExpenseService";
import type { ISettingsService } from "./interfaces/ISettingsService";

import { MockClientService } from "./mock/MockClientService";
import { MockAppointmentService } from "./mock/MockAppointmentService";
import { MockProcedureService } from "./mock/MockProcedureService";
import { MockPaymentService } from "./mock/MockPaymentService";
import { MockAnamnesisService } from "./mock/MockAnamnesisService";
import { MockStockService } from "./mock/MockStockService";
import { MockExpenseService } from "./mock/MockExpenseService";
import { MockSettingsService } from "./mock/MockSettingsService";

import { ApiClientService } from "./api/ApiClientService";
import { ApiAppointmentService } from "./api/ApiAppointmentService";
import { ApiProcedureService } from "./api/ApiProcedureService";
import { ApiPaymentService } from "./api/ApiPaymentService";
import { ApiAnamnesisService } from "./api/ApiAnamnesisService";
import { ApiStockService } from "./api/ApiStockService";
import { ApiExpenseService } from "./api/ApiExpenseService";
import { ApiSettingsService } from "./api/ApiSettingsService";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";

export const clientService: IClientService = USE_MOCK
  ? new MockClientService()
  : new ApiClientService();

export const appointmentService: IAppointmentService = USE_MOCK
  ? new MockAppointmentService()
  : new ApiAppointmentService();

export const procedureService: IProcedureService = USE_MOCK
  ? new MockProcedureService()
  : new ApiProcedureService();

export const paymentService: IPaymentService = USE_MOCK
  ? new MockPaymentService()
  : new ApiPaymentService();

export const anamnesisService: IAnamnesisService = USE_MOCK
  ? new MockAnamnesisService()
  : new ApiAnamnesisService();

export const stockService: IStockService = USE_MOCK
  ? new MockStockService()
  : new ApiStockService();

export const expenseService: IExpenseService = USE_MOCK
  ? new MockExpenseService()
  : new ApiExpenseService();

export const settingsService: ISettingsService = USE_MOCK
  ? new MockSettingsService()
  : new ApiSettingsService();
