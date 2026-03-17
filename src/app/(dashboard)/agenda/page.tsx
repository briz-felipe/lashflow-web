"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppointments, usePendingApprovals } from "@/hooks/useAppointments";
import { useSettings } from "@/hooks/useSettings";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { formatTime, formatCurrency, formatRelativeDate } from "@/lib/formatters";
import {
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CalendarOff,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Appointment } from "@/domain/entities";
import type { BlockedDate, TimeSlot } from "@/domain/entities";
import type { LashServiceType } from "@/domain/enums";
import { LASH_SERVICE_TYPE_LABELS } from "@/domain/enums";
import { AppointmentStatusBadge } from "@/components/appointments/AppointmentStatusBadge";
import { toast } from "@/components/ui/toaster";
import {
  addDays, subDays, addWeeks, subWeeks, addMonths, subMonths,
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  startOfDay, endOfDay, eachDayOfInterval,
  isSameDay, isSameMonth, format, isToday, getHours, getDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";

type CalendarView = "day" | "week" | "month";

const SERVICE_DOT: Record<LashServiceType, string> = {
  application: "bg-brand-500",
  maintenance: "bg-emerald-500",
  removal: "bg-red-400",
  lash_lifting: "bg-amber-400",
  permanent: "bg-purple-400",
};

const SERVICE_LABEL_COLOR: Record<LashServiceType, string> = {
  application: "text-brand-600",
  maintenance: "text-emerald-600",
  removal: "text-red-500",
  lash_lifting: "text-amber-600",
  permanent: "text-purple-600",
};

const STATUS_COLORS: Record<string, string> = {
  pending_approval: "bg-amber-50 border-amber-200",
  confirmed: "bg-brand-50 border-brand-200",
  in_progress: "bg-blue-50 border-blue-200",
  completed: "bg-emerald-50 border-emerald-200",
  cancelled: "bg-neutral-50 border-neutral-200",
};

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 07h–20h

function getDateRange(view: CalendarView, date: Date) {
  if (view === "day") return { from: startOfDay(date), to: endOfDay(date) };
  if (view === "week") {
    const ws = startOfWeek(date, { weekStartsOn: 1 });
    return { from: ws, to: endOfWeek(ws, { weekStartsOn: 1 }) };
  }
  return { from: startOfMonth(date), to: endOfMonth(date) };
}

// ─── Helpers for blocked / closed days ────────────────────────────────────────
function getBlockedDate(date: Date, blockedDates: BlockedDate[]): BlockedDate | undefined {
  const str = format(date, "yyyy-MM-dd");
  return blockedDates.find((b) => b.date === str);
}

function isDayOfWeekClosed(date: Date, timeSlots: TimeSlot[]): boolean {
  // getDay() returns 0=Sun…6=Sat, matching our TimeSlot.dayOfWeek
  const dow = getDay(date) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const slot = timeSlots.find((s) => s.dayOfWeek === dow);
  // if no slot configured for this day treat as closed
  return slot ? !slot.isAvailable : true;
}

// ─── Appointment card ──────────────────────────────────────────────────────────
function AppointmentCard({ apt, compact = false }: { apt: Appointment; compact?: boolean }) {
  return (
    <Link
      href={`/agenda/${apt.id}`}
      onClick={(e) => e.stopPropagation()}
      className={`block rounded-lg border p-1.5 text-xs transition-all hover:shadow-sm ${STATUS_COLORS[apt.status] ?? "bg-gray-50 border-gray-200"}`}
    >
      <div className="flex items-center gap-1 mb-0.5">
        {apt.serviceType && (
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${SERVICE_DOT[apt.serviceType]}`} />
        )}
        <p className="font-semibold truncate">{apt.clientName?.split(" ")[0] ?? "—"}</p>
      </div>
      {!compact && <p className="text-muted-foreground">{formatTime(apt.scheduledAt)}</p>}
      {apt.serviceType ? (
        <p className={`font-medium truncate ${SERVICE_LABEL_COLOR[apt.serviceType]}`}>
          {LASH_SERVICE_TYPE_LABELS[apt.serviceType]}
        </p>
      ) : (
        <p className="text-muted-foreground truncate">{apt.procedureName}</p>
      )}
    </Link>
  );
}

// ─── Appointment list row ──────────────────────────────────────────────────────
function AppointmentListRow({ apt }: { apt: Appointment }) {
  return (
    <Link
      href={`/agenda/${apt.id}`}
      className="flex items-center gap-4 p-3 rounded-xl hover:bg-brand-50 transition-colors"
    >
      <div className="text-center w-12 flex-shrink-0">
        <p className="text-xs text-muted-foreground">{format(new Date(apt.scheduledAt), "EEE", { locale: ptBR })}</p>
        <p className="text-sm font-bold">{formatTime(apt.scheduledAt)}</p>
      </div>
      <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${apt.serviceType ? SERVICE_DOT[apt.serviceType] : "bg-gray-300"}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{apt.clientName ?? "—"}</p>
        <p className="text-xs text-muted-foreground truncate">
          {apt.procedureName ?? "—"}
          {apt.serviceType && (
            <span className={`ml-1.5 font-medium ${SERVICE_LABEL_COLOR[apt.serviceType]}`}>
              · {LASH_SERVICE_TYPE_LABELS[apt.serviceType]}
            </span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-xs text-muted-foreground hidden sm:block">{formatCurrency(apt.priceCharged)}</span>
        <AppointmentStatusBadge status={apt.status} />
      </div>
    </Link>
  );
}

// ─── Appointment list section below calendar ───────────────────────────────────
function AppointmentListSection({
  appointments,
  selectedDay,
  blockedDates,
  timeSlots,
  onClearDay,
  onBlockDay,
}: {
  appointments: Appointment[];
  selectedDay: Date | null;
  blockedDates: BlockedDate[];
  timeSlots: TimeSlot[];
  onClearDay: () => void;
  onBlockDay: (date: Date) => void;
}) {
  const filtered = selectedDay
    ? appointments.filter((a) => isSameDay(new Date(a.scheduledAt), selectedDay))
    : [...appointments].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const title = selectedDay
    ? format(selectedDay, "EEEE, d 'de' MMMM", { locale: ptBR })
    : "Todos os agendamentos";

  const blocked = selectedDay ? getBlockedDate(selectedDay, blockedDates) : undefined;
  const closed = selectedDay ? isDayOfWeekClosed(selectedDay, timeSlots) : false;

  return (
    <div className="bg-white rounded-2xl border border-brand-100 shadow-card">
      <div className="flex items-center justify-between px-5 py-4 border-b border-brand-50">
        <div className="flex items-center gap-2 min-w-0">
          <CalendarDays className="w-4 h-4 text-brand-500 flex-shrink-0" />
          <h3 className="font-semibold text-sm capitalize truncate">{title}</h3>
          <span className="text-xs text-muted-foreground bg-brand-50 px-1.5 py-0.5 rounded-full flex-shrink-0">
            {filtered.length}
          </span>
          {blocked && (
            <span className="flex-shrink-0 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
              Bloqueado{blocked.reason ? `: ${blocked.reason}` : ""}
            </span>
          )}
          {!blocked && closed && (
            <span className="flex-shrink-0 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
              Dia fechado
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {selectedDay && (
            <button
              onClick={() => onBlockDay(selectedDay)}
              className="text-xs text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-1"
              title={blocked ? "Gerenciar bloqueio" : "Bloquear este dia"}
            >
              <CalendarOff className="w-3.5 h-3.5" />
            </button>
          )}
          {selectedDay && (
            <button onClick={onClearDay} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Ver todos
            </button>
          )}
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">
          {blocked ? "Dia bloqueado — sem atendimentos." : closed ? "Dia fechado — sem atendimentos." : `Nenhum agendamento${selectedDay ? " para este dia" : " no período"}.`}
        </div>
      ) : (
        <div className="divide-y divide-brand-50">
          {filtered.map((apt) => <AppointmentListRow key={apt.id} apt={apt} />)}
        </div>
      )}
    </div>
  );
}

// ─── Day View ──────────────────────────────────────────────────────────────────
function DayView({
  date,
  appointments,
  blockedDates,
  timeSlots,
}: {
  date: Date;
  appointments: Appointment[];
  blockedDates: BlockedDate[];
  timeSlots: TimeSlot[];
}) {
  const dayApts = appointments.filter((a) => isSameDay(new Date(a.scheduledAt), date));
  const blocked = getBlockedDate(date, blockedDates);
  const closed = isDayOfWeekClosed(date, timeSlots);

  return (
    <div className="bg-white rounded-2xl border border-brand-100 shadow-card overflow-hidden">
      <div className={`px-6 py-4 border-b text-center ${blocked ? "bg-red-50 border-red-100" : closed ? "bg-gray-50 border-gray-100" : "border-brand-50"}`}>
        <p className="text-sm text-muted-foreground capitalize">
          {format(date, "EEEE", { locale: ptBR })}
        </p>
        <p className={`text-2xl font-bold mt-0.5 ${blocked ? "line-through text-red-400" : closed ? "text-gray-400" : isToday(date) ? "text-brand-600" : ""}`}>
          {format(date, "d 'de' MMMM yyyy", { locale: ptBR })}
        </p>
        {blocked && (
          <p className="text-xs text-red-500 mt-1 font-medium">
            🚫 Dia bloqueado{blocked.reason ? ` — ${blocked.reason}` : ""}
          </p>
        )}
        {!blocked && closed && (
          <p className="text-xs text-gray-400 mt-1">Dia fechado</p>
        )}
      </div>
      <div className="overflow-y-auto max-h-[600px]">
        {HOURS.map((hour) => {
          const hourApts = dayApts.filter((a) => getHours(new Date(a.scheduledAt)) === hour);
          return (
            <div
              key={hour}
              className={`flex border-b border-brand-50 last:border-0 min-h-[64px] ${blocked ? "bg-red-50/30" : closed ? "bg-gray-50/40" : ""}`}
            >
              <div className="w-16 flex-shrink-0 px-3 py-2 text-xs text-muted-foreground font-medium text-right border-r border-brand-50">
                {String(hour).padStart(2, "0")}:00
              </div>
              <div className="flex-1 p-2 space-y-1">
                {hourApts.map((apt) => <AppointmentCard key={apt.id} apt={apt} />)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Week View ─────────────────────────────────────────────────────────────────
function WeekView({
  date,
  appointments,
  selectedDay,
  blockedDates,
  timeSlots,
  onDaySelect,
}: {
  date: Date;
  appointments: Appointment[];
  selectedDay: Date | null;
  blockedDates: BlockedDate[];
  timeSlots: TimeSlot[];
  onDaySelect: (day: Date) => void;
}) {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart, { weekStartsOn: 1 }) });

  return (
    <div className="bg-white rounded-2xl border border-brand-100 shadow-card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-brand-50">
        {weekDays.map((day) => {
          const isSelected = selectedDay && isSameDay(day, selectedDay);
          const blocked = getBlockedDate(day, blockedDates);
          const closed = isDayOfWeekClosed(day, timeSlots);
          return (
            <button
              key={day.toString()}
              onClick={() => onDaySelect(day)}
              title={blocked ? `Bloqueado${blocked.reason ? `: ${blocked.reason}` : ""}` : closed ? "Dia fechado" : undefined}
              className={`p-3 text-center border-r last:border-r-0 border-brand-50 transition-colors ${
                isSelected
                  ? "bg-brand-500"
                  : blocked
                  ? "bg-red-50 hover:bg-red-100"
                  : closed
                  ? "bg-gray-50 hover:bg-gray-100"
                  : isToday(day)
                  ? "bg-brand-50 hover:bg-brand-100"
                  : "hover:bg-brand-50"
              }`}
            >
              <p className={`text-xs capitalize ${isSelected ? "text-white/80" : blocked || closed ? "text-muted-foreground/60" : "text-muted-foreground"}`}>
                {format(day, "EEE", { locale: ptBR })}
              </p>
              <p className={`text-lg font-bold mt-0.5 ${
                isSelected
                  ? "text-white"
                  : blocked
                  ? "line-through text-red-300"
                  : closed
                  ? "text-gray-300"
                  : isToday(day)
                  ? "text-white bg-brand-500 w-8 h-8 rounded-full flex items-center justify-center mx-auto"
                  : "text-foreground"
              }`}>
                {format(day, "d")}
              </p>
              {blocked && <span className="text-[9px] text-red-400 leading-none">bloqueado</span>}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-7 min-h-48">
        {weekDays.map((day) => {
          const dayApts = appointments.filter((a) => isSameDay(new Date(a.scheduledAt), day));
          const isSelected = selectedDay && isSameDay(day, selectedDay);
          const blocked = getBlockedDate(day, blockedDates);
          const closed = isDayOfWeekClosed(day, timeSlots);
          return (
            <button
              key={day.toString()}
              onClick={() => onDaySelect(day)}
              className={`p-2 border-r last:border-r-0 border-brand-50 space-y-1.5 min-h-48 text-left transition-colors relative ${
                isSelected
                  ? "bg-brand-50/60 ring-1 ring-inset ring-brand-200"
                  : blocked
                  ? "bg-[repeating-linear-gradient(135deg,#fef2f2_0px,#fef2f2_6px,#fee2e2_6px,#fee2e2_12px)]"
                  : closed
                  ? "bg-[repeating-linear-gradient(135deg,#f9fafb_0px,#f9fafb_6px,#f3f4f6_6px,#f3f4f6_12px)]"
                  : isToday(day)
                  ? "bg-brand-50/30 hover:bg-brand-50/50"
                  : "hover:bg-gray-50/50"
              }`}
            >
              {dayApts.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  {blocked
                    ? <CalendarOff className="w-4 h-4 text-red-300" />
                    : <p className="text-xs text-muted-foreground/50">–</p>}
                </div>
              ) : (
                dayApts
                  .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                  .map((apt) => <AppointmentCard key={apt.id} apt={apt} />)
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Month View ────────────────────────────────────────────────────────────────
function MonthView({
  date,
  appointments,
  selectedDay,
  blockedDates,
  timeSlots,
  onDaySelect,
}: {
  date: Date;
  appointments: Appointment[];
  selectedDay: Date | null;
  blockedDates: BlockedDate[];
  timeSlots: TimeSlot[];
  onDaySelect: (day: Date) => void;
}) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });
  const weekDayLabels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  return (
    <div className="bg-white rounded-2xl border border-brand-100 shadow-card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-brand-50">
        {weekDayLabels.map((d) => (
          <div key={d} className="p-2 text-center text-xs font-semibold text-muted-foreground border-r last:border-r-0 border-brand-50">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {calDays.map((day) => {
          const dayApts = appointments.filter((a) => isSameDay(new Date(a.scheduledAt), day));
          const isCurrentMonth = isSameMonth(day, date);
          const isSelected = selectedDay && isSameDay(day, selectedDay);
          const blocked = getBlockedDate(day, blockedDates);
          const closed = isCurrentMonth && isDayOfWeekClosed(day, timeSlots);

          return (
            <button
              key={day.toString()}
              onClick={() => onDaySelect(day)}
              title={blocked ? `Bloqueado${blocked.reason ? `: ${blocked.reason}` : ""}` : closed ? "Dia fechado" : undefined}
              className={`min-h-[90px] p-1.5 border-r border-b last-of-type:border-r-0 border-brand-50 text-left transition-colors w-full relative ${
                isSelected
                  ? "bg-brand-50 ring-2 ring-inset ring-brand-400"
                  : blocked && isCurrentMonth
                  ? "bg-[repeating-linear-gradient(135deg,#fef2f2_0px,#fef2f2_6px,#fee2e2_6px,#fee2e2_12px)] hover:brightness-95"
                  : closed
                  ? "bg-[repeating-linear-gradient(135deg,#f9fafb_0px,#f9fafb_6px,#f3f4f6_6px,#f3f4f6_12px)]"
                  : !isCurrentMonth
                  ? "bg-gray-50/50 hover:bg-gray-50"
                  : isToday(day)
                  ? "bg-brand-50/40 hover:bg-brand-50/70"
                  : "hover:bg-gray-50/60"
              }`}
            >
              <div className="flex items-start justify-between mb-1">
                <p className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                  isSelected
                    ? "bg-brand-500 text-white"
                    : isToday(day)
                    ? "bg-brand-500 text-white"
                    : blocked && isCurrentMonth
                    ? "line-through text-red-300"
                    : isCurrentMonth
                    ? "text-foreground"
                    : "text-muted-foreground/40"
                }`}>
                  {format(day, "d")}
                </p>
                {blocked && isCurrentMonth && (
                  <span title={blocked.reason || "Bloqueado"}>
                    <CalendarOff className="w-3 h-3 text-red-400 flex-shrink-0" />
                  </span>
                )}
              </div>
              {blocked && isCurrentMonth && blocked.reason && (
                <p className="text-[9px] text-red-400 leading-tight truncate mb-0.5 italic">{blocked.reason}</p>
              )}
              <div className="space-y-0.5">
                {dayApts.slice(0, 3).map((apt) => (
                  <AppointmentCard key={apt.id} apt={apt} compact />
                ))}
                {dayApts.length > 3 && (
                  <p className="text-xs text-muted-foreground pl-1">+{dayApts.length - 3} mais</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Quick Block Modal ─────────────────────────────────────────────────────────
function QuickBlockModal({
  open,
  initialDate,
  blockedDates,
  onClose,
  onBlock,
  onUnblock,
}: {
  open: boolean;
  initialDate: string;
  blockedDates: BlockedDate[];
  onClose: () => void;
  onBlock: (date: string, reason?: string) => Promise<void>;
  onUnblock: (id: string) => Promise<void>;
}) {
  const [date, setDate] = useState(initialDate);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const existing = blockedDates.find((b) => b.date === date);

  const handleBlock = async () => {
    setSaving(true);
    try {
      await onBlock(date, reason || undefined);
      toast({ title: "Dia bloqueado!", variant: "success" });
      onClose();
    } catch {
      toast({ title: "Erro ao bloquear data", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleUnblock = async () => {
    if (!existing) return;
    setSaving(true);
    try {
      await onUnblock(existing.id);
      toast({ title: "Bloqueio removido", variant: "success" });
      onClose();
    } catch {
      toast({ title: "Erro ao remover bloqueio", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarOff className="w-4 h-4 text-red-500" />
            {existing ? "Gerenciar Bloqueio" : "Bloquear Dia"}
          </DialogTitle>
        </DialogHeader>

        {existing ? (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-xl border border-red-100">
              <p className="text-sm font-semibold text-red-700">{existing.date}</p>
              {existing.reason && <p className="text-xs text-red-500 mt-1">{existing.reason}</p>}
            </div>
            <p className="text-sm text-muted-foreground">Este dia está bloqueado. Deseja remover o bloqueio?</p>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
              <Button type="button" variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50" onClick={handleUnblock} disabled={saving}>
                <Trash2 className="w-4 h-4" />
                {saving ? "Removendo..." : "Remover bloqueio"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="block-date">Data</Label>
              <Input
                id="block-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1.5 h-11"
              />
            </div>
            <div>
              <Label htmlFor="block-reason">Motivo (opcional)</Label>
              <Input
                id="block-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Feriado, férias..."
                className="mt-1.5"
              />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
              <Button type="button" className="flex-1 bg-red-500 hover:bg-red-600" onClick={handleBlock} disabled={saving || !date}>
                <CalendarOff className="w-4 h-4" />
                {saving ? "Bloqueando..." : "Bloquear"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AgendaPage() {
  const [view, setView] = useState<CalendarView>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockModalDate, setBlockModalDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const { from, to } = getDateRange(view, currentDate);

  const { appointments, loading, error: appointmentsError } = useAppointments({
    from,
    to,
    status: ["pending_approval", "confirmed", "in_progress", "completed"],
  });

  const { blockedDates, timeSlots, addBlockedDate, removeBlockedDate } = useSettings();
  const { appointments: pending, approve, reject } = usePendingApprovals();

  function navigate(dir: 1 | -1) {
    setSelectedDay(null);
    if (view === "day") setCurrentDate((d) => (dir === 1 ? addDays(d, 1) : subDays(d, 1)));
    else if (view === "week") setCurrentDate((d) => (dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1)));
    else setCurrentDate((d) => (dir === 1 ? addMonths(d, 1) : subMonths(d, 1)));
  }

  function changeView(v: CalendarView) {
    setView(v);
    setSelectedDay(null);
  }

  function toggleDay(day: Date) {
    setSelectedDay((prev) => (prev && isSameDay(prev, day) ? null : day));
  }

  function openBlockModal(date: Date) {
    setBlockModalDate(format(date, "yyyy-MM-dd"));
    setBlockModalOpen(true);
  }

  function navLabel() {
    if (view === "day") return format(currentDate, "d 'de' MMMM yyyy", { locale: ptBR });
    if (view === "week") {
      const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
      const we = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(ws, "d")} – ${format(we, "d 'de' MMMM yyyy", { locale: ptBR })}`;
    }
    return format(currentDate, "MMMM yyyy", { locale: ptBR });
  }

  if (loading) return <LoadingPage />;

  return (
    <div>
      <Topbar title="Agenda" subtitle="Calendário de atendimentos" />

      <div className="p-4 sm:p-6 animate-fade-in space-y-4 sm:space-y-6">
        <PageHeader
          title="Agenda"
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                title="Bloquear um dia"
                onClick={() => {
                  setBlockModalDate(format(selectedDay ?? currentDate, "yyyy-MM-dd"));
                  setBlockModalOpen(true);
                }}
              >
                <CalendarOff className="w-4 h-4 text-muted-foreground" />
              </Button>
              <Link href={`/agenda/novo?date=${format(selectedDay ?? currentDate, "yyyy-MM-dd")}`}>
                <Button>
                  <Plus className="w-4 h-4" />
                  Novo Agendamento
                </Button>
              </Link>
            </div>
          }
        />

        {/* Pending Approvals */}
        {pending.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-800">
                {pending.length} agendamento{pending.length > 1 ? "s" : ""} aguardando aprovação
              </span>
            </div>
            <div className="space-y-2">
              {pending.map((apt) => (
                <div key={apt.id} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-amber-100">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{apt.clientName ?? "—"}</p>
                      {apt.serviceType && (
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${SERVICE_LABEL_COLOR[apt.serviceType]}`}>
                          <span className={`w-2 h-2 rounded-full ${SERVICE_DOT[apt.serviceType]}`} />
                          {LASH_SERVICE_TYPE_LABELS[apt.serviceType]}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {apt.procedureName} • {formatRelativeDate(apt.scheduledAt)}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" variant="ghost" className="h-7 text-red-600 hover:bg-red-50"
                      onClick={async () => { await reject(apt.id, "Horário indisponível"); toast({ title: "Agendamento recusado", variant: "destructive" }); }}>
                      <XCircle className="w-4 h-4" /> Recusar
                    </Button>
                    <Button size="sm" className="h-7 bg-emerald-500 hover:bg-emerald-600"
                      onClick={async () => { await approve(apt.id); toast({ title: "Agendamento aprovado!", variant: "success" }); }}>
                      <CheckCircle2 className="w-4 h-4" /> Aprovar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Calendar Controls */}
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-3 rounded-xl border border-brand-100 overflow-hidden bg-white">
            {(["day", "week", "month"] as CalendarView[]).map((v) => (
              <button
                key={v}
                onClick={() => changeView(v)}
                className={`py-2 text-sm font-medium transition-colors border-r last:border-r-0 border-brand-100 ${
                  view === v ? "bg-brand-500 text-white" : "text-muted-foreground hover:bg-brand-50"
                }`}
              >
                {v === "day" ? "Dia" : v === "week" ? "Semana" : "Mês"}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <button
              onClick={() => { setCurrentDate(new Date()); setSelectedDay(null); }}
              className="text-sm font-semibold capitalize text-center hover:text-brand-600 transition-colors"
            >
              {navLabel()}
            </button>
            <Button variant="ghost" size="icon" onClick={() => navigate(1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Calendar View */}
        {view === "day" && (
          <DayView
            date={currentDate}
            appointments={appointments}
            blockedDates={blockedDates}
            timeSlots={timeSlots}
          />
        )}
        {view === "week" && (
          <div className="overflow-x-auto">
            <div className="min-w-[480px]">
              <WeekView
                date={currentDate}
                appointments={appointments}
                selectedDay={selectedDay}
                blockedDates={blockedDates}
                timeSlots={timeSlots}
                onDaySelect={toggleDay}
              />
            </div>
          </div>
        )}
        {view === "month" && (
          <div className="overflow-x-auto">
            <div className="min-w-[360px]">
              <MonthView
                date={currentDate}
                appointments={appointments}
                selectedDay={selectedDay}
                blockedDates={blockedDates}
                timeSlots={timeSlots}
                onDaySelect={toggleDay}
              />
            </div>
          </div>
        )}

        {/* Appointment list below calendar (month + week) */}
        {view !== "day" && (
          appointmentsError ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
              Erro ao carregar agendamentos: {appointmentsError}
            </div>
          ) : (
            <AppointmentListSection
              appointments={appointments}
              selectedDay={selectedDay}
              blockedDates={blockedDates}
              timeSlots={timeSlots}
              onClearDay={() => setSelectedDay(null)}
              onBlockDay={openBlockModal}
            />
          )
        )}
      </div>

      <QuickBlockModal
        open={blockModalOpen}
        initialDate={blockModalDate}
        blockedDates={blockedDates}
        onClose={() => setBlockModalOpen(false)}
        onBlock={addBlockedDate}
        onUnblock={removeBlockedDate}
      />
    </div>
  );
}
