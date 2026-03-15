"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { useAppointments, usePendingApprovals } from "@/hooks/useAppointments";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { formatTime, formatRelativeDate } from "@/lib/formatters";
import {
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { mockClients, mockProcedures } from "@/data";
import type { LashServiceType } from "@/domain/enums";
import { LASH_SERVICE_TYPE_LABELS } from "@/domain/enums";
import {
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  format,
  isToday,
  getHours,
  getMinutes,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/components/ui/toaster";
import type { Appointment } from "@/domain/entities";

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

function AppointmentCard({ apt, compact = false }: { apt: Appointment; compact?: boolean }) {
  const client = mockClients.find((c) => c.id === apt.clientId);
  const procedure = mockProcedures.find((p) => p.id === apt.procedureId);
  return (
    <Link
      href={`/agenda/${apt.id}`}
      className={`block rounded-lg border p-1.5 text-xs transition-all hover:shadow-sm ${STATUS_COLORS[apt.status] ?? "bg-gray-50 border-gray-200"}`}
    >
      <div className="flex items-center gap-1 mb-0.5">
        {apt.serviceType && (
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${SERVICE_DOT[apt.serviceType]}`} />
        )}
        <p className="font-semibold truncate">{client?.name.split(" ")[0]}</p>
      </div>
      {!compact && <p className="text-muted-foreground">{formatTime(apt.scheduledAt)}</p>}
      {apt.serviceType ? (
        <p className={`font-medium truncate ${SERVICE_LABEL_COLOR[apt.serviceType]}`}>
          {LASH_SERVICE_TYPE_LABELS[apt.serviceType]}
        </p>
      ) : (
        <p className="text-muted-foreground truncate">{procedure?.name}</p>
      )}
    </Link>
  );
}

// ─── Day View ──────────────────────────────────────────────────────────────────
function DayView({ date, appointments }: { date: Date; appointments: Appointment[] }) {
  return (
    <div className="bg-white rounded-2xl border border-brand-100 shadow-card overflow-hidden">
      <div className="px-6 py-4 border-b border-brand-50 text-center">
        <p className="text-sm text-muted-foreground capitalize">
          {format(date, "EEEE", { locale: ptBR })}
        </p>
        <p className={`text-2xl font-bold mt-0.5 ${isToday(date) ? "text-brand-600" : ""}`}>
          {format(date, "d 'de' MMMM yyyy", { locale: ptBR })}
        </p>
      </div>
      <div className="overflow-y-auto max-h-[600px]">
        {HOURS.map((hour) => {
          const hourApts = appointments.filter((a) => getHours(a.scheduledAt) === hour);
          return (
            <div key={hour} className="flex border-b border-brand-50 last:border-0 min-h-[64px]">
              <div className="w-16 flex-shrink-0 px-3 py-2 text-xs text-muted-foreground font-medium text-right border-r border-brand-50">
                {String(hour).padStart(2, "0")}:00
              </div>
              <div className="flex-1 p-2 space-y-1">
                {hourApts.map((apt) => (
                  <AppointmentCard key={apt.id} apt={apt} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Week View ─────────────────────────────────────────────────────────────────
function WeekView({ date, appointments }: { date: Date; appointments: Appointment[] }) {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart, { weekStartsOn: 1 }) });

  return (
    <div className="bg-white rounded-2xl border border-brand-100 shadow-card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-brand-50">
        {weekDays.map((day) => (
          <div
            key={day.toString()}
            className={`p-3 text-center border-r last:border-r-0 border-brand-50 ${isToday(day) ? "bg-brand-50" : ""}`}
          >
            <p className="text-xs text-muted-foreground capitalize">
              {format(day, "EEE", { locale: ptBR })}
            </p>
            <p className={`text-lg font-bold mt-0.5 ${
              isToday(day)
                ? "text-white bg-brand-500 w-8 h-8 rounded-full flex items-center justify-center mx-auto"
                : "text-foreground"
            }`}>
              {format(day, "d")}
            </p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 min-h-48">
        {weekDays.map((day) => {
          const dayApts = appointments.filter((a) => isSameDay(a.scheduledAt, day));
          return (
            <div
              key={day.toString()}
              className={`p-2 border-r last:border-r-0 border-brand-50 space-y-1.5 min-h-48 ${isToday(day) ? "bg-brand-50/30" : ""}`}
            >
              {dayApts.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-xs text-muted-foreground/50">–</p>
                </div>
              ) : (
                dayApts
                  .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                  .map((apt) => <AppointmentCard key={apt.id} apt={apt} />)
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Month View ────────────────────────────────────────────────────────────────
function MonthView({ date, appointments }: { date: Date; appointments: Appointment[] }) {
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
          const dayApts = appointments.filter((a) => isSameDay(a.scheduledAt, day));
          const isCurrentMonth = isSameMonth(day, date);
          return (
            <div
              key={day.toString()}
              className={`min-h-[90px] p-1.5 border-r border-b last-of-type:border-r-0 border-brand-50 ${
                !isCurrentMonth ? "bg-gray-50/50" : isToday(day) ? "bg-brand-50/40" : ""
              }`}
            >
              <p className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                isToday(day)
                  ? "bg-brand-500 text-white"
                  : isCurrentMonth ? "text-foreground" : "text-muted-foreground/40"
              }`}>
                {format(day, "d")}
              </p>
              <div className="space-y-0.5">
                {dayApts.slice(0, 3).map((apt) => <AppointmentCard key={apt.id} apt={apt} compact />)}
                {dayApts.length > 3 && (
                  <p className="text-xs text-muted-foreground pl-1">+{dayApts.length - 3} mais</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AgendaPage() {
  const [view, setView] = useState<CalendarView>("week");
  const [currentDate, setCurrentDate] = useState(new Date());

  const { from, to } = getDateRange(view, currentDate);

  const { appointments, loading } = useAppointments({
    from,
    to,
    status: ["pending_approval", "confirmed", "in_progress", "completed"],
  });

  const { appointments: pending, approve, reject } = usePendingApprovals();

  function navigate(dir: 1 | -1) {
    if (view === "day") setCurrentDate((d) => (dir === 1 ? addDays(d, 1) : subDays(d, 1)));
    else if (view === "week") setCurrentDate((d) => (dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1)));
    else setCurrentDate((d) => (dir === 1 ? addMonths(d, 1) : subMonths(d, 1)));
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

      <div className="p-6 animate-fade-in space-y-6">
        <PageHeader
          title="Agenda"
          action={
            <Link href="/agenda/novo">
              <Button>
                <Plus className="w-4 h-4" />
                Novo Agendamento
              </Button>
            </Link>
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
              {pending.map((apt) => {
                const client = mockClients.find((c) => c.id === apt.clientId);
                const procedure = mockProcedures.find((p) => p.id === apt.procedureId);
                return (
                  <div key={apt.id} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-amber-100">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate">{client?.name ?? "—"}</p>
                        {apt.serviceType && (
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${SERVICE_LABEL_COLOR[apt.serviceType]}`}>
                            <span className={`w-2 h-2 rounded-full ${SERVICE_DOT[apt.serviceType]}`} />
                            {LASH_SERVICE_TYPE_LABELS[apt.serviceType]}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {procedure?.name} • {formatRelativeDate(apt.scheduledAt)}
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
                );
              })}
            </div>
          </div>
        )}

        {/* Calendar Controls */}
        <div className="flex items-center justify-between">
          {/* View toggle */}
          <div className="flex rounded-xl border border-brand-100 overflow-hidden bg-white">
            {(["day", "week", "month"] as CalendarView[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-r last:border-r-0 border-brand-100 ${
                  view === v ? "bg-brand-500 text-white" : "text-muted-foreground hover:bg-brand-50"
                }`}
              >
                {v === "day" ? "Dia" : v === "week" ? "Semana" : "Mês"}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="text-sm font-semibold capitalize min-w-[180px] text-center hover:text-brand-600 transition-colors"
            >
              {navLabel()}
            </button>
            <Button variant="ghost" size="icon" onClick={() => navigate(1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Spacer to center nav */}
          <div className="w-[152px]" />
        </div>

        {/* Calendar View */}
        {view === "day" && <DayView date={currentDate} appointments={appointments} />}
        {view === "week" && <WeekView date={currentDate} appointments={appointments} />}
        {view === "month" && <MonthView date={currentDate} appointments={appointments} />}
      </div>
    </div>
  );
}
