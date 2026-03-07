"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppointments, usePendingApprovals } from "@/hooks/useAppointments";
import { AppointmentStatusBadge } from "@/components/appointments/AppointmentStatusBadge";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatTime, formatDate, formatCurrency, formatRelativeDate } from "@/lib/formatters";
import {
  Plus,
  CalendarDays,
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

const SERVICE_DOT: Record<LashServiceType, string> = {
  application: "bg-brand-500",
  maintenance:  "bg-emerald-500",
  removal:      "bg-red-400",
  lash_lifting: "bg-amber-400",
  permanent:    "bg-purple-400",
};

const SERVICE_LABEL_COLOR: Record<LashServiceType, string> = {
  application: "text-brand-600",
  maintenance:  "text-emerald-600",
  removal:      "text-red-500",
  lash_lifting: "text-amber-600",
  permanent:    "text-purple-600",
};
import { addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, format, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/components/ui/toaster";

export default function AgendaPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const { appointments, loading, updateStatus } = useAppointments({
    from: weekStart,
    to: weekEnd,
    status: ["pending_approval", "confirmed", "in_progress", "completed"],
  });

  const { appointments: pending, approve, reject } = usePendingApprovals();

  const prevWeek = () => setWeekStart((d) => subDays(d, 7));
  const nextWeek = () => setWeekStart((d) => addDays(d, 7));

  const getAppointmentsForDay = (day: Date) =>
    appointments.filter((a) => isSameDay(a.scheduledAt, day));

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

        {/* Pending Approvals Banner */}
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
                  <div
                    key={apt.id}
                    className="flex items-center gap-3 bg-white rounded-xl p-3 border border-amber-100"
                  >
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
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={async () => {
                          await reject(apt.id, "Horário indisponível");
                          toast({ title: "Agendamento recusado", variant: "destructive" });
                        }}
                      >
                        <XCircle className="w-4 h-4" />
                        Recusar
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 bg-emerald-500 hover:bg-emerald-600"
                        onClick={async () => {
                          await approve(apt.id);
                          toast({ title: "Agendamento aprovado!", variant: "success" });
                        }}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Aprovar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Weekly Calendar */}
        <div className="bg-white rounded-2xl border border-brand-100 shadow-card overflow-hidden">
          {/* Week nav */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-brand-50">
            <Button variant="ghost" size="icon" onClick={prevWeek}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h3 className="text-sm font-semibold">
              {format(weekStart, "d", { locale: ptBR })} –{" "}
              {format(weekEnd, "d 'de' MMMM yyyy", { locale: ptBR })}
            </h3>
            <Button variant="ghost" size="icon" onClick={nextWeek}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Week days grid */}
          <div className="grid grid-cols-7 border-b border-brand-50">
            {weekDays.map((day) => (
              <div
                key={day.toString()}
                className={`p-3 text-center border-r last:border-r-0 border-brand-50 ${
                  isToday(day) ? "bg-brand-50" : ""
                }`}
              >
                <p className="text-xs text-muted-foreground capitalize">
                  {format(day, "EEE", { locale: ptBR })}
                </p>
                <p
                  className={`text-lg font-bold mt-0.5 ${
                    isToday(day)
                      ? "text-brand-600 bg-brand-500 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto"
                      : "text-foreground"
                  }`}
                >
                  {format(day, "d")}
                </p>
              </div>
            ))}
          </div>

          {/* Appointments grid */}
          <div className="grid grid-cols-7 min-h-48">
            {weekDays.map((day) => {
              const dayAppointments = getAppointmentsForDay(day);
              return (
                <div
                  key={day.toString()}
                  className={`p-2 border-r last:border-r-0 border-brand-50 space-y-1.5 min-h-48 ${
                    isToday(day) ? "bg-brand-50/30" : ""
                  }`}
                >
                  {dayAppointments.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-xs text-muted-foreground/50">–</p>
                    </div>
                  ) : (
                    dayAppointments.map((apt) => {
                      const client = mockClients.find((c) => c.id === apt.clientId);
                      const procedure = mockProcedures.find((p) => p.id === apt.procedureId);
                      const statusColors: Record<string, string> = {
                        pending_approval: "bg-amber-50 border-amber-200",
                        confirmed: "bg-brand-50 border-brand-200",
                        in_progress: "bg-blue-50 border-blue-200",
                        completed: "bg-emerald-50 border-emerald-200",
                        cancelled: "bg-neutral-50 border-neutral-200",
                      };
                      return (
                        <Link
                          key={apt.id}
                          href={`/agenda/${apt.id}`}
                          className={`block rounded-lg border p-1.5 text-xs transition-all hover:shadow-sm ${
                            statusColors[apt.status] ?? "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <div className="flex items-center gap-1 mb-0.5">
                            {apt.serviceType && (
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${SERVICE_DOT[apt.serviceType]}`} />
                            )}
                            <p className="font-semibold truncate">{client?.name.split(" ")[0]}</p>
                          </div>
                          <p className="text-muted-foreground">{formatTime(apt.scheduledAt)}</p>
                          {apt.serviceType ? (
                            <p className={`font-medium truncate ${SERVICE_LABEL_COLOR[apt.serviceType]}`}>
                              {LASH_SERVICE_TYPE_LABELS[apt.serviceType]}
                            </p>
                          ) : (
                            <p className="text-muted-foreground truncate">{procedure?.name}</p>
                          )}
                        </Link>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
