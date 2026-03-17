"use client";

import { useState, useEffect, useCallback } from "react";
import { whatsAppTemplateService } from "@/services/api/ApiWhatsAppTemplateService";
import type { WhatsAppTemplate, CreateWhatsAppTemplateInput, UpdateWhatsAppTemplateInput } from "@/domain/entities";

export function useWhatsAppTemplates() {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await whatsAppTemplateService.list();
      setTemplates(data);
    } catch {
      // silently fail — no templates is valid state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createTemplate = async (input: CreateWhatsAppTemplateInput): Promise<WhatsAppTemplate> => {
    const created = await whatsAppTemplateService.create(input);
    setTemplates((prev) => [...prev, created]);
    return created;
  };

  const updateTemplate = async (id: string, input: UpdateWhatsAppTemplateInput): Promise<WhatsAppTemplate> => {
    const updated = await whatsAppTemplateService.update(id, input);
    setTemplates((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return updated;
  };

  const deleteTemplate = async (id: string): Promise<void> => {
    await whatsAppTemplateService.delete(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  return { templates, loading, reload: load, createTemplate, updateTemplate, deleteTemplate };
}
