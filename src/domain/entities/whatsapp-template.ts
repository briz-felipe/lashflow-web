export interface WhatsAppTemplate {
  id: string;
  slug: string;
  name: string;
  description: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateWhatsAppTemplateInput = Pick<WhatsAppTemplate, "name" | "description" | "message">;
export type UpdateWhatsAppTemplateInput = Partial<CreateWhatsAppTemplateInput>;

/** Variables available for interpolation inside a message template */
export interface TemplateVariables {
  clientName: string;
  date: string;
  time: string;
  procedure: string;
  duration?: string;
}

/** Available placeholders the user can insert in a template message */
export const TEMPLATE_VARIABLE_LABELS: Record<keyof TemplateVariables, string> = {
  clientName: "{{clientName}} — Nome da cliente",
  date:       "{{date}} — Data",
  time:       "{{time}} — Horário",
  procedure:  "{{procedure}} — Procedimento",
  duration:   "{{duration}} — Duração",
};
