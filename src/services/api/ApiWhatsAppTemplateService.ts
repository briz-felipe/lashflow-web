import { api } from "@/lib/api";
import type { WhatsAppTemplate, CreateWhatsAppTemplateInput, UpdateWhatsAppTemplateInput } from "@/domain/entities";

export class ApiWhatsAppTemplateService {
  list(): Promise<WhatsAppTemplate[]> {
    return api.get("/settings/whatsapp-templates");
  }

  create(input: CreateWhatsAppTemplateInput): Promise<WhatsAppTemplate> {
    return api.post("/settings/whatsapp-templates", input);
  }

  update(id: string, input: UpdateWhatsAppTemplateInput): Promise<WhatsAppTemplate> {
    return api.put(`/settings/whatsapp-templates/${id}`, input);
  }

  delete(id: string): Promise<void> {
    return api.delete(`/settings/whatsapp-templates/${id}`);
  }
}

export const whatsAppTemplateService = new ApiWhatsAppTemplateService();
