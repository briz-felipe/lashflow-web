"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
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
  CalendarOff,
  Trash2,
  Clock,
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
  addMonths, subMonths,
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  eachDayOfInterval,
  isSameDay, isSameMonth, format, isToday, getDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";

const SERVICE_DOT: Record<LashServiceType, string> = {
  application: "bg-brand-500",
  maintenance: "bg-emerald-500",
  removal: "bg-red-400",
  lash_lifting: "bg-amber-400",
  permanent: "bg-purple-400",
};

const STATUS_LEFT: Record<string, string> = {
  pending_approval: "bg-amber-400",
  confirmed: "bg-brand-500",
  in_progress: "bg-blue-500",
  completed: "bg-emerald-500",
  cancelled: "bg-neutral-300",
};

function getBlockedDate(date: Date, blockedDates: BlockedDate[]): BlockedDate | undefined {
  return blockedDates.find((b) => b.date === format(date, "yyyy-MM-dd"));
}

function isDayOfWeekClosed(date: Date, timeSlots: TimeSlot[]): boolean {
  const dow = getDay(date) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const slot = timeSlots.find((s) => s.dayOfWeek === dow);
  return slot ? !slot.isAvailable : true;
}

// ─── Compact Month Calendar ────────────────────────────────────────────────────
function CompactCalendar({
  date,
  appointments,
  selectedDay,
  blockedDates,
  timeSlots,
  onDaySelect,
  onNavigate,
}: {
  date: Date;
  appointments: Appointment[];
  selectedDay: Date | null;
  blockedDates: BlockedDate[];
  timeSlots: TimeSlot[];
  onDaySelect: (day: Date) => void;
  onNavigate: (dir: 1 | -1 | 0) => void;
}) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });
  const weekLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="bg-white rounded-2xl border border-brand-100 shadow-card overflow-hidden">
      {/* Month navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-brand-50">
        <button
          onClick={() => onNavigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-brand-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <button
          onClick={() => onNavigate(0)}
          className="text-sm font-semibold capitalize hover:text-brand-600 transition-colors"
        >
          {format(date, "MMMM 'de' yyyy", { locale: ptBR })}
        </button>
        <button
          onClick={() => onNavigate(1)}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-brand-50 transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Week day labels */}
      <div className="grid grid-cols-7 border-b border-brand-50">
        {weekLabels.map((d) => (
          <div key={d} className="py-1.5 text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7">
        {calDays.map((day) => {
          const dayApts = appointments.filter((a) => isSameDay(new Date(a.scheduledAt), day));
          const isCurrentMonth = isSameMonth(day, date);
          const isSelected = selectedDay && isSameDay(day, selectedDay);
          const today = isToday(day);
          const blocked = isCurrentMonth && !!getBlockedDate(day, blockedDates);
          const closed = isCurrentMonth && isDayOfWeekClosed(day, timeSlots);

          return (
            <button
              key={day.toString()}
              onClick={() => onDaySelect(day)}
              className={`flex flex-col items-center py-1.5 gap-1 transition-colors border-r border-b last-of-type:border-r-0 border-brand-50 ${
                !isCurrentMonth ? "opacity-30" : blocked || closed ? "opacity-50" : ""
              } ${isSelected ? "bg-brand-50" : "hover:bg-gray-50"}`}
            >
              {/* Date number */}
              <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                isSelected
                  ? "bg-brand-500 text-white"
                  : today
                  ? "bg-brand-100 text-brand-700 font-bold"
                  : "text-foreground"
              }`}>
                {format(day, "d")}
              </span>

              {/* Appointment count dots */}
              <div className="flex items-center gap-0.5 h-3">
                {blocked ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                ) : dayApts.length > 0 ? (
                  <>
                    {dayApts.slice(0, 3).map((apt, i) => (
                      <span
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          apt.serviceType ? SERVICE_DOT[apt.serviceType] : "bg-brand-400"
                        }`}
                      />
                    ))}
                    {dayApts.length > 3 && (
                      <span className="text-[8px] text-muted-foreground font-bold leading-none ml-0.5">
                        +{dayApts.length - 3}
                      </span>
                    )}
                  </>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Appointment card (list) ───────────────────────────────────────────────────
function AppointmentCard({ apt }: { apt: Appointment }) {
  const timeEnd = apt.endsAt ? formatTime(apt.endsAt) : null;

  return (
    <Link href={`/agenda/${apt.id}`}>
      <div className="flex items-stretch gap-0 bg-white rounded-2xl border border-brand-100 shadow-card overflow-hidden active:scale-[0.99] transition-transform">
        {/* Color left bar */}
        <div className={`w-1 flex-shrink-0 ${STATUS_LEFT[apt.status] ?? "bg-gray-300"}`} />

        <div className="flex-1 min-w-0 px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{apt.clientName ?? "—"}</p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {apt.procedureName ?? "—"}
                {apt.serviceType && (
                  <span className="ml-1.5 font-medium">· {LASH_SERVICE_TYPE_LABELS[apt.serviceType]}</span>
                )}
              </p>
            </div>
            <AppointmentStatusBadge status={apt.status} />
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span>{formatTime(apt.scheduledAt)}{timeEnd ? ` – ${timeEnd}` : ""}</span>
            </div>
            <span className="text-sm font-semibold text-foreground">
              {formatCurrency(apt.priceCharged)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Day list section ──────────────────────────────────────────────────────────
function DayList({
  appointments,
  selectedDay,
  blockedDates,
  timeSlots,
  onBlockDay,
  onClearDay,
}: {
  appointments: Appointment[];
  selectedDay: Date | null;
  blockedDates: BlockedDate[];
  timeSlots: TimeSlot[];
  onBlockDay: (date: Date) => void;
  onClearDay: () => void;
}) {
  const filtered = selectedDay
    ? appointments.filter((a) => isSameDay(new Date(a.scheduledAt), selectedDay))
    : [...appointments].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const blocked = selectedDay ? getBlockedDate(selectedDay, blockedDates) : undefined;
  const closed = selectedDay ? isDayOfWeekClosed(selectedDay, timeSlots) : false;

  const title = selectedDay
    ? format(selectedDay, "EEEE, d 'de' MMMM", { locale: ptBR })
    : "Próximos agendamentos";

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-sm font-semibold capitalize truncate">{title}</h3>
          {filtered.length > 0 && (
            <span className="text-xs text-muted-foreground bg-brand-50 px-1.5 py-0.5 rounded-full">
              {filtered.length}
            </span>
          )}
          {blocked && (
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
              Bloqueado
            </span>
          )}
          {!blocked && closed && (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
              Fechado
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {selectedDay && (
            <button
              onClick={() => onBlockDay(selectedDay)}
              className="text-xs text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-1"
            >
              <CalendarOff className="w-3.5 h-3.5" />
            </button>
          )}
          {selectedDay && (
            <button onClick={onClearDay} className="text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors">
              Ver todos
            </button>
          )}
        </div>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-brand-100 shadow-card py-10 text-center">
          <p className="text-sm text-muted-foreground">
            {blocked
              ? "Dia bloqueado — sem atendimentos."
              : closed
              ? "Dia fechado — sem atendimentos."
              : selectedDay
              ? "Nenhum agendamento para este dia."
              : "Nenhum agendamento no período."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((apt) => <AppointmentCard key={apt.id} apt={apt} />)}
        </div>
      )}
    </div>
  );
}

// ─── Quick Block Modal ─────────────────────────────────────────────────────────
function QuickBlockModal({
  open, initialDate, blockedDates, onClose, onBlock, onUnblock,
}: {
  open: boolean;
  initialDate: string;
  blockedDates: BlockedDate[];
  onClose: () => void;
  onBlock: (date: string, reason?: string) => Promise<unknown>;
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
      <DialogContent className="max-w-sm w-[calc(100%-2rem)] mx-auto">
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
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
              <Button variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50" onClick={handleUnblock} disabled={saving}>
                <Trash2 className="w-4 h-4" />
                {saving ? "Removendo..." : "Remover"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1.5 h-11" />
            </div>
            <div>
              <Label>Motivo (opcional)</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex: Feriado, férias..." className="mt-1.5" />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
              <Button className="flex-1 bg-red-500 hover:bg-red-600" onClick={handleBlock} disabled={saving || !date}>
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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockModalDate, setBlockModalDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const from = startOfMonth(startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 }));
  const to = endOfMonth(endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 }));

  const { appointments, loading } = useAppointments({
    from,
    to,
    status: ["pending_approval", "confirmed", "in_progress", "completed"],
  });

  const { blockedDates, timeSlots, addBlockedDate, removeBlockedDate } = useSettings();
  const { appointments: pending, approve, reject } = usePendingApprovals();

  function navigate(dir: 1 | -1 | 0) {
    setSelectedDay(null);
    if (dir === 0) { setCurrentDate(new Date()); setSelectedDay(new Date()); return; }
    setCurrentDate((d) => dir === 1 ? addMonths(d, 1) : subMonths(d, 1));
  }

  function toggleDay(day: Date) {
    setSelectedDay((prev) => (prev && isSameDay(prev, day) ? null : day));
  }

  function openBlockModal(date: Date) {
    setBlockModalDate(format(date, "yyyy-MM-dd"));
    setBlockModalOpen(true);
  }

  const newAptDate = format(selectedDay ?? currentDate, "yyyy-MM-dd");

  if (loading) return <LoadingPage />;

  return (
    <div className="pb-24">
      <Topbar title="Agenda" subtitle="Calendário de atendimentos" />

      <div className="p-4 sm:p-5 animate-fade-in space-y-4">

        {/* Pending Approvals */}
        {pending.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span className="text-sm font-semibold text-amber-800">
                {pending.length} aguardando aprovação
              </span>
            </div>
            <div className="space-y-2">
              {pending.map((apt) => (
                <div key={apt.id} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-amber-100">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{apt.clientName ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {apt.procedureName} · {formatRelativeDate(apt.scheduledAt)}
                    </p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                      onClick={async () => { await reject(apt.id, "Horário indisponível"); toast({ title: "Recusado", variant: "destructive" }); }}>
                      <XCircle className="w-4 h-4" />
                    </Button>
                    <Button size="sm" className="h-8 w-8 p-0 bg-emerald-500 hover:bg-emerald-600"
                      onClick={async () => { await approve(apt.id); toast({ title: "Aprovado!", variant: "success" }); }}>
                      <CheckCircle2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compact Calendar */}
        <CompactCalendar
          date={currentDate}
          appointments={appointments}
          selectedDay={selectedDay}
          blockedDates={blockedDates}
          timeSlots={timeSlots}
          onDaySelect={toggleDay}
          onNavigate={navigate}
        />

        {/* Appointment List */}
        <DayList
          appointments={appointments}
          selectedDay={selectedDay}
          blockedDates={blockedDates}
          timeSlots={timeSlots}
          onBlockDay={openBlockModal}
          onClearDay={() => setSelectedDay(null)}
        />
      </div>

      {/* FAB — Novo Agendamento */}
      <Link href={`/agenda/novo?date=${newAptDate}`}>
        <button className="fixed bottom-28 right-4 sm:right-6 lg:bottom-6 z-40 flex items-center gap-2 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white rounded-full shadow-lg shadow-brand-500/30 transition-all px-5 h-14">
          <Plus className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-semibold">Novo Agendamento</span>
        </button>
      </Link>

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
