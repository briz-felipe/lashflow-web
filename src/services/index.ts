import type { IClientService } from "./interfaces/IClientService";
import type { IAppointmentService } from "./interfaces/IAppointmentService";
import type { IProcedureService } from "./interfaces/IProcedureService";
import type { IPaymentService } from "./interfaces/IPaymentService";
import type { IAnamnesisService } from "./interfaces/IAnamnesisService";
import type { IStockService } from "./interfaces/IStockService";
import type { IExpenseService } from "./interfaces/IExpenseService";
import type { ISettingsService } from "./interfaces/ISettingsService";

import { ApiClientService } from "./api/ApiClientService";
import { ApiAppointmentService } from "./api/ApiAppointmentService";
import { ApiProcedureService } from "./api/ApiProcedureService";
import { ApiPaymentService } from "./api/ApiPaymentService";
import { ApiAnamnesisService } from "./api/ApiAnamnesisService";
import { ApiStockService } from "./api/ApiStockService";
import { ApiExpenseService } from "./api/ApiExpenseService";
import { ApiSettingsService } from "./api/ApiSettingsService";

export const clientService: IClientService = new ApiClientService();
export const appointmentService: IAppointmentService = new ApiAppointmentService();
export const procedureService: IProcedureService = new ApiProcedureService();
export const paymentService: IPaymentService = new ApiPaymentService();
export const anamnesisService: IAnamnesisService = new ApiAnamnesisService();
export const stockService: IStockService = new ApiStockService();
export const expenseService: IExpenseService = new ApiExpenseService();
export const settingsService: ISettingsService = new ApiSettingsService();
