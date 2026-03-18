export interface ReminderTemplate {
  id: string;
  name: string;
  description: string;
  message: string;
}

export interface ReminderVariables {
  clientName: string;
  date: string;
  time: string;
  procedure: string;
  duration?: string;
  salonAddress?: string;
}

export const REMINDER_TEMPLATES: ReminderTemplate[] = [
  {
    id: "confirmacao",
    name: "Confirmação de Agendamento",
    description: "Envia logo após agendar para confirmar o horário",
    message:
      "Olá {{clientName}}! 😊\n\nPassando para confirmar seu agendamento:\n\n📅 *{{date}}* às *{{time}}*\n✨ {{procedure}}\n\nQualquer dúvida, estou à disposição! Até lá 💜",
  },
  {
    id: "lembrete_vespera",
    name: "Lembrete — Véspera",
    description: "Lembrete enviado no dia anterior ao atendimento",
    message:
      "Oi {{clientName}}! 💜\n\nLembrando que amanhã é dia de se cuidar! 🌟\n\n📅 *{{date}}* às *{{time}}*\n✨ {{procedure}}\n\nNos vemos em breve!",
  },
  {
    id: "lembrete_dia",
    name: "Lembrete — Dia do Atendimento",
    description: "Lembrete no próprio dia do atendimento",
    message:
      "Bom dia {{clientName}}! ☀️\n\nHoje é dia de arrasar! Lembrando do seu horário:\n\n🕐 *{{time}}*\n✨ {{procedure}}\n\nTe espero! 💜",
  },
  {
    id: "pos_atendimento",
    name: "Pós-Atendimento",
    description: "Mensagem de agradecimento após o procedimento",
    message:
      "Oi {{clientName}}! 😍\n\nFoi um prazer te atender hoje! Espero que você esteja amando o resultado ✨\n\nQualquer dúvida sobre os cuidados, pode me chamar aqui 💜\n\nAté a próxima!",
  },
];
