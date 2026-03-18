import type { ReminderTemplate, ReminderVariables } from "@/domain/entities/reminder";
import { format, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";

export class WhatsAppReminderService {
  static formatPhone(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("55")) return digits;
    return `55${digits}`;
  }

  static interpolate(template: string, vars: ReminderVariables): string {
    return template
      .replace(/\{\{clientName\}\}/g, vars.clientName)
      .replace(/\{\{date\}\}/g, vars.date)
      .replace(/\{\{time\}\}/g, vars.time)
      .replace(/\{\{procedure\}\}/g, vars.procedure)
      .replace(/\{\{duration\}\}/g, vars.duration ?? "")
      .replace(/\{\{salonAddress\}\}/g, vars.salonAddress ?? "");
  }

  static buildUrl(phone: string, message: string): string {
    const formattedPhone = this.formatPhone(phone);
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  }

  static getLink(phone: string, template: ReminderTemplate, vars: ReminderVariables): string {
    const message = this.interpolate(template.message, vars);
    return this.buildUrl(phone, message);
  }

  static buildVariables(params: {
    clientName: string;
    scheduledAt: string | Date;
    procedure: string;
    durationMinutes?: number;
    salonAddress?: string | null;
  }): ReminderVariables {
    const date = new Date(params.scheduledAt);
    let dateLabel: string;

    if (isToday(date)) {
      dateLabel = "hoje";
    } else if (isTomorrow(date)) {
      dateLabel = "amanhã";
    } else {
      dateLabel = format(date, "dd/MM/yyyy", { locale: ptBR });
    }

    return {
      clientName: params.clientName.split(" ")[0],
      date: dateLabel,
      time: format(date, "HH:mm"),
      procedure: params.procedure,
      duration: params.durationMinutes ? `${params.durationMinutes} min` : undefined,
      salonAddress: params.salonAddress ?? undefined,
    };
  }

  static suggestTemplate(scheduledAt: string | Date): string {
    const date = new Date(scheduledAt);
    if (isToday(date)) return "lembrete_dia";
    if (isTomorrow(date)) return "lembrete_vespera";
    return "confirmacao";
  }
}
