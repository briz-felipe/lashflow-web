"use client";

import { Topbar } from "@/components/layout/Topbar";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { useDashboard } from "@/hooks/useDashboard";
import { formatCurrency, formatTime, formatRelativeDate } from "@/lib/formatters";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { AppointmentStatusBadge } from "@/components/appointments/AppointmentStatusBadge";
import {
  Users,
  CalendarCheck,
  CalendarDays,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { mockClients, mockProcedures } from "@/data";

export default function DashboardPage() {
  const stats = useDashboard();

  if (stats.loading) return <LoadingPage />;

  return (
    <div>
      <Topbar title="Dashboard" subtitle="Visão geral do seu estúdio" />

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 animate-fade-in">
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatsCard
              title="Total de Clientes"
              value={stats.totalClients}
              subtitle="clientes cadastradas"
              icon={<Users className="w-5 h-5" />}
              color="purple"
            />
            <StatsCard
              title="Com Agendamentos"
              value={stats.clientsWithUpcomingAppointments}
              subtitle="aguardando atendimento"
              icon={<CalendarCheck className="w-5 h-5" />}
              color="blue"
            />
            <StatsCard
              title="Agendamentos Hoje"
              value={stats.todayAppointmentsCount}
              subtitle="atendimentos do dia"
              icon={<CalendarDays className="w-5 h-5" />}
              color="amber"
            />
            <StatsCard
              title="Receita do Mês"
              value={formatCurrency(stats.revenueStats?.thisMonthInCents ?? 0)}
              subtitle="mês atual"
              icon={<TrendingUp className="w-5 h-5" />}
              trend={stats.revenueStats?.growthPercent}
              trendLabel="vs. mês anterior"
              color="green"
            />
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          <div className="xl:col-span-2 bg-white rounded-2xl border border-brand-100 shadow-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <h3 className="font-semibold text-foreground">Receita Mensal</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Últimos 6 meses</p>
              </div>
              <Link href="/financeiro">
                <Button variant="ghost" size="sm" className="text-brand-600 hover:text-brand-700">
                  Ver detalhes <ChevronRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
            <RevenueChart data={stats.monthlyRevenue} />
          </div>

          <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <h3 className="font-semibold text-foreground">Aprovações Pendentes</h3>
              </div>
              {stats.pendingApprovals.length > 0 && (
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                  {stats.pendingApprovals.length}
                </span>
              )}
            </div>

            {stats.pendingApprovals.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma aprovação pendente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.pendingApprovals.slice(0, 4).map((apt) => {
                  const client = mockClients.find((c) => c.id === apt.clientId);
                  const procedure = mockProcedures.find((p) => p.id === apt.procedureId);
                  return (
                    <Link key={apt.id} href={`/agenda/${apt.id}`}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-brand-50 transition-colors group"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xs font-bold">
                        {client?.name.charAt(0) ?? apt.clientName?.charAt(0) ?? "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{client?.name ?? apt.clientName ?? "—"}</p>
                        <p className="text-xs text-muted-foreground truncate">{procedure?.name ?? apt.procedureName}</p>
                        <p className="text-xs text-brand-600 mt-0.5">{formatRelativeDate(apt.scheduledAt)}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                    </Link>
                  );
                })}
                {stats.pendingApprovals.length > 4 && (
                  <Link href="/agenda">
                    <Button variant="ghost" size="sm" className="w-full text-brand-600">
                      Ver todas ({stats.pendingApprovals.length})
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-500" />
              <h3 className="font-semibold text-foreground">Agenda de Hoje</h3>
            </div>
            <Link href="/agenda">
              <Button variant="ghost" size="sm" className="text-brand-600">
                Ver agenda completa <ChevronRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>

          {stats.todayAppointments.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <CalendarDays className="w-8 h-8 text-brand-300 mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum agendamento para hoje</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.todayAppointments.map((apt) => {
                const client = mockClients.find((c) => c.id === apt.clientId);
                const procedure = mockProcedures.find((p) => p.id === apt.procedureId);
                return (
                  <Link key={apt.id} href={`/agenda/${apt.id}`}
                    className="flex items-center gap-4 p-4 rounded-xl border border-brand-50 hover:border-brand-200 hover:bg-brand-50 transition-all group"
                  >
                    <div className="flex-shrink-0 text-center">
                      <p className="text-sm font-bold text-brand-700">{formatTime(apt.scheduledAt)}</p>
                      <p className="text-xs text-muted-foreground">{formatTime(apt.endsAt)}</p>
                    </div>
                    <div className="w-px h-10 bg-brand-100" />
                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center text-white text-sm font-bold">
                      {client?.name.charAt(0) ?? apt.clientName?.charAt(0) ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{client?.name ?? apt.clientName ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{procedure?.name ?? apt.procedureName}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold text-emerald-600 hidden sm:block">
                        {formatCurrency(apt.priceCharged)}
                      </p>
                      <AppointmentStatusBadge status={apt.status} />
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
