export type ClientSegment =
  | "volume"
  | "classic"
  | "hybrid"
  | "vip"
  | "recorrente"
  | "inativa";

export type AppointmentStatus =
  | "pending_approval"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export type PaymentMethod =
  | "cash"
  | "credit_card"
  | "debit_card"
  | "pix"
  | "bank_transfer"
  | "other";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "partial"
  | "refunded"
  | "failed";

export type LashTechnique =
  | "classic"
  | "volume"
  | "hybrid"
  | "mega_volume"
  | "wispy"
  | "wet_look"
  | "other";

export const CLIENT_SEGMENT_LABELS: Record<ClientSegment, string> = {
  volume: "Volume",
  classic: "Clássico",
  hybrid: "Híbrido",
  vip: "VIP",
  recorrente: "Recorrente",
  inativa: "Inativa",
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending_approval: "Aguardando Aprovação",
  confirmed: "Confirmado",
  in_progress: "Em Atendimento",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não Compareceu",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Dinheiro",
  credit_card: "Cartão de Crédito",
  debit_card: "Cartão de Débito",
  pix: "Pix",
  bank_transfer: "Transferência",
  other: "Outro",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pendente",
  paid: "Pago",
  partial: "Parcial",
  refunded: "Reembolsado",
  failed: "Falhou",
};

export const LASH_TECHNIQUE_LABELS: Record<LashTechnique, string> = {
  classic: "Clássico",
  volume: "Volume",
  hybrid: "Híbrido",
  mega_volume: "Mega Volume",
  wispy: "Wispy",
  wet_look: "Wet Look",
  other: "Outro",
};

export type LashServiceType =
  | "application"
  | "maintenance"
  | "removal"
  | "lash_lifting"
  | "permanent";

export const LASH_SERVICE_TYPE_LABELS: Record<LashServiceType, string> = {
  application: "Aplicação",
  maintenance: "Manutenção",
  removal: "Remoção",
  lash_lifting: "Lash Lifting",
  permanent: "Permanente de Cílios",
};

// ── Stock / Materials ──

export type MaterialCategory =
  | "cilios"
  | "cola"
  | "descartaveis"
  | "outros";

export const MATERIAL_CATEGORY_LABELS: Record<MaterialCategory, string> = {
  cilios: "Cílios",
  cola: "Cola",
  descartaveis: "Descartáveis",
  outros: "Outros",
};

export type MaterialUnit =
  | "un"
  | "pacote"
  | "caixa"
  | "ml"
  | "g"
  | "par"
  | "rolo"
  | "kit";

export const MATERIAL_UNIT_LABELS: Record<MaterialUnit, string> = {
  un: "Unidade",
  pacote: "Pacote",
  caixa: "Caixa",
  ml: "ml",
  g: "g",
  par: "Par",
  rolo: "Rolo",
  kit: "Kit",
};

export type StockMovementType = "purchase" | "usage" | "adjustment";

export const STOCK_MOVEMENT_TYPE_LABELS: Record<StockMovementType, string> = {
  purchase: "Compra",
  usage: "Uso",
  adjustment: "Ajuste",
};

// ── Expenses ──

export type ExpenseCategory =
  | "aluguel"
  | "energia"
  | "agua"
  | "internet"
  | "telefone"
  | "material"
  | "marketing"
  | "software"
  | "manutencao"
  | "transporte"
  | "alimentacao"
  | "impostos"
  | "outros";

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  aluguel: "Aluguel",
  energia: "Energia",
  agua: "Água",
  internet: "Internet",
  telefone: "Telefone",
  material: "Material",
  marketing: "Marketing",
  software: "Software",
  manutencao: "Manutenção",
  transporte: "Transporte",
  alimentacao: "Alimentação",
  impostos: "Impostos",
  outros: "Outros",
};

export type ExpenseRecurrence = "one_time" | "monthly" | "weekly" | "yearly";

export const EXPENSE_RECURRENCE_LABELS: Record<ExpenseRecurrence, string> = {
  one_time: "Pontual",
  monthly: "Mensal",
  weekly: "Semanal",
  yearly: "Anual",
};
