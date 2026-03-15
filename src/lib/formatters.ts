import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

function safeDate(date: Date | string | null | undefined): Date {
  if (!date) return new Date("invalid");
  const d = typeof date === "string" ? new Date(date) : date;
  return d;
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export function formatDate(date: Date | string | null | undefined): string {
  const d = safeDate(date);
  if (!isValid(d)) return "—";
  return format(d, "dd/MM/yyyy", { locale: ptBR });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  const d = safeDate(date);
  if (!isValid(d)) return "—";
  return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

export function formatTime(date: Date | string | null | undefined): string {
  const d = safeDate(date);
  if (!isValid(d)) return "—";
  return format(d, "HH:mm", { locale: ptBR });
}

export function formatRelativeDate(date: Date | string | null | undefined): string {
  const d = safeDate(date);
  if (!isValid(d)) return "—";
  if (isToday(d)) return `Hoje, ${format(d, "HH:mm")}`;
  if (isTomorrow(d)) return `Amanhã, ${format(d, "HH:mm")}`;
  if (isYesterday(d)) return `Ontem, ${format(d, "HH:mm")}`;
  return format(d, "dd/MM 'às' HH:mm", { locale: ptBR });
}

export function formatRelativeTime(date: Date | string | null | undefined): string {
  const d = safeDate(date);
  if (!isValid(d)) return "—";
  return formatDistanceToNow(d, { locale: ptBR, addSuffix: true });
}

export function formatMonthYear(date: Date | string | null | undefined): string {
  const d = safeDate(date);
  if (!isValid(d)) return "—";
  return format(d, "MMMM yyyy", { locale: ptBR });
}

export function formatShortMonth(date: Date | string | null | undefined): string {
  const d = safeDate(date);
  if (!isValid(d)) return "—";
  return format(d, "MMM/yy", { locale: ptBR });
}
