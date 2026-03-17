"use client";

import { useParams } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/button";
import { useClient } from "@/hooks/useClients";
import { useAppointments } from "@/hooks/useAppointments";
import { ClientSegmentBadge } from "@/components/clients/ClientSegmentBadge";
import { AppointmentStatusBadge } from "@/components/appointments/AppointmentStatusBadge";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import {
  formatPhone,
  formatCurrency,
  formatDate,
  formatDateTime,
} from "@/lib/formatters";
import {
  Phone,
  Mail,
  Instagram,
  MapPin,
  Calendar,
  Cake,
  Edit,
  ArrowLeft,
  Star,
  TrendingUp,
  Clock,
  BarChart2,
  Sun,
  Sunset,
  Moon,
  Users,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";
import { LashFlowStatus } from "@/components/clients/LashFlowStatus";
import { useAnamneses } from "@/hooks/useAnamnesis";

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const SEGMENT_DESCRIPTIONS: Record<string, { description: string; action: string }> = {
  vip: {
    description: "Investiu mais de R$500 no total",
    action: "Ofereça experiências exclusivas e brindes especiais",
  },
  recorrente: {
    description: "Agenda com frequência mensal",
    action: "Fidelize com programa de pontos ou desconto na manutenção",
  },
  inativa: {
    description: "Sem visita há mais de 60 dias",
    action: "Reative com promoção especial de retorno",
  },
  volume: {
    description: "Prefere técnicas de volume",
    action: "Divulgue novidades de volume e mega volume",
  },
  classic: {
    description: "Prefere o estilo clássico natural",
    action: "Comunique promoções de manutenção clássico",
  },
  hybrid: {
    description: "Prefere técnica híbrida",
    action: "Destaque combinações de volume + clássico",
  },
};

export default function ClienteProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { client, loading } = useClient(id);
  const { appointments } = useAppointments({ clientId: id });
  const { anamneses } = useAnamneses(id);

  if (loading) return <LoadingPage />;
  if (!client) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Cliente não encontrada.</p>
        <Link href="/clientes">
          <Button variant="ghost" className="mt-4">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
        </Link>
      </div>
    );
  }

  const completedAppointments = appointments.filter((a) => a.status === "completed");
  const upcomingAppointments = appointments.filter(
    (a) => a.status === "confirmed" || a.status === "pending_approval"
  );

  // Techniques used (from completed appointments)
  const techCounts: Record<string, { name: string; count: number }> = {};
  for (const apt of completedAppointments) {
    const name = apt.procedureName;
    if (!name) continue;
    if (!techCounts[name]) techCounts[name] = { name, count: 0 };
    techCounts[name].count++;
  }
  const techList = Object.values(techCounts).sort((a, b) => b.count - a.count);
  const maxTechCount = techList[0]?.count ?? 1;

  // Favorite day of week & average time
  const dayCount: Record<number, number> = {};
  let hourSum = 0;
  for (const apt of completedAppointments) {
    const d = new Date(apt.scheduledAt);
    const day = d.getDay();
    dayCount[day] = (dayCount[day] ?? 0) + 1;
    hourSum += d.getHours();
  }
  const favoriteDayEntry = Object.entries(dayCount).sort((a, b) => Number(b[1]) - Number(a[1]))[0];
  const favoriteDayName = favoriteDayEntry ? DAY_NAMES[parseInt(favoriteDayEntry[0])] : null;
  const avgHour = completedAppointments.length > 0 ? Math.round(hourSum / completedAppointments.length) : null;
  const timeOfDay = avgHour === null ? null : avgHour < 12 ? "Manhã" : avgHour < 18 ? "Tarde" : "Noite";

  const hasAnalytics = completedAppointments.length > 0;

  return (
    <div>
      <Topbar title="Perfil da Cliente" />

      <div className="p-4 sm:p-6 animate-fade-in space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/clientes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1" />
          <Link href={`/clientes/${id}/anamnese`}>
            <Button variant="outline" size="sm">
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">Anamnese</span>
              {anamneses.length === 0 && (
                <span className="ml-1 w-2 h-2 bg-amber-400 rounded-full" />
              )}
            </Button>
          </Link>
          <Link href={`/clientes/${id}/editar`}>
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4" />
              <span className="hidden sm:inline">Editar</span>
            </Button>
          </Link>
          <Link href={`/agenda/novo?clientId=${id}`}>
            <Button size="sm">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Novo Agendamento</span>
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left column: Profile + Segmentation */}
          <div className="space-y-4">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-4 sm:p-6">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-brand flex items-center justify-center text-white text-3xl font-bold mb-3">
                  {client.name.charAt(0)}
                </div>
                <h2 className="text-xl font-bold">{client.name}</h2>
                {client.birthday && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDate(client.birthday)}
                  </p>
                )}
                {client.segments.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
                    {client.segments.map((seg) => (
                      <ClientSegmentBadge key={seg} segment={seg} />
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Phone className="w-4 h-4 flex-shrink-0 text-brand-400" />
                  <span>{formatPhone(client.phone)}</span>
                </div>
                {client.email && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Mail className="w-4 h-4 flex-shrink-0 text-brand-400" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.instagram && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Instagram className="w-4 h-4 flex-shrink-0 text-brand-400" />
                    <span>@{client.instagram}</span>
                  </div>
                )}
                {client.address?.city && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <MapPin className="w-4 h-4 flex-shrink-0 text-brand-400" />
                    <span>{[client.address.city, client.address.state].filter(Boolean).join(", ")}</span>
                  </div>
                )}
                {client.birthday && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Cake className="w-4 h-4 flex-shrink-0 text-brand-400" />
                    <span>Aniversário: {formatDate(client.birthday)}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Calendar className="w-4 h-4 flex-shrink-0 text-brand-400" />
                  <span>Cadastrada em {formatDate(client.createdAt)}</span>
                </div>
              </div>

              {client.notes && (
                <div className="mt-4 p-3 bg-brand-50 rounded-xl">
                  <p className="text-xs font-medium text-brand-700 mb-1">Observações</p>
                  <p className="text-sm text-muted-foreground">{client.notes}</p>
                </div>
              )}
            </div>

            {/* Segmentation & Marketing Card */}
            {client.segments.length > 0 && (
              <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-5">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 text-brand-700">
                  <Users className="w-4 h-4" />
                  Segmentação & Marketing
                </h3>
                <div className="space-y-3">
                  {client.segments.map((seg) => {
                    const info = SEGMENT_DESCRIPTIONS[seg];
                    if (!info) return null;
                    return (
                      <div key={seg} className="p-3 rounded-xl bg-brand-50 border border-brand-100">
                        <div className="mb-1.5">
                          <ClientSegmentBadge segment={seg} />
                        </div>
                        <p className="text-xs text-muted-foreground mb-1.5">{info.description}</p>
                        <p className="text-xs font-medium text-brand-700 flex items-start gap-1">
                          <span className="flex-shrink-0">💡</span>
                          {info.action}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right columns: Stats + Analytics + History */}
          <div className="xl:col-span-2 space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-4 text-center">
                <TrendingUp className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(client.totalSpent)}
                </p>
                <p className="text-xs text-muted-foreground">Total Gasto</p>
              </div>
              <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-4 text-center">
                <Calendar className="w-5 h-5 text-brand-500 mx-auto mb-2" />
                <p className="text-lg font-bold text-foreground">
                  {client.appointmentsCount}
                </p>
                <p className="text-xs text-muted-foreground">Visitas</p>
              </div>
              <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-4 text-center">
                <Star className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-foreground truncate">
                  {techList[0]?.name ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground">Técnica favorita</p>
              </div>
            </div>

            {/* Lash Flow Status */}
            <LashFlowStatus appointments={appointments} />

            {/* Anamnesis summary */}
            {anamneses.length > 0 ? (
              <Link href={`/clientes/${id}/anamnese`}>
                <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-4 hover:shadow-card-hover transition-shadow flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="w-5 h-5 text-brand-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{anamneses.length} Ficha{anamneses.length > 1 ? "s" : ""} de Anamnese</p>
                    <p className="text-xs text-muted-foreground truncate">
                      Última: {formatDate(anamneses[0].createdAt)}
                      {anamneses[0].mapping?.size && ` · ${anamneses[0].mapping.size}`}
                      {anamneses[0].mapping?.curve && ` · curv. ${anamneses[0].mapping.curve}`}
                    </p>
                  </div>
                  <span className="text-xs text-brand-400 flex-shrink-0">Ver →</span>
                </div>
              </Link>
            ) : (
              <Link href={`/clientes/${id}/anamnese/nova`}>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 hover:bg-amber-100 transition-colors">
                  <ClipboardList className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-800">Sem anamnese registrada</p>
                    <p className="text-xs text-amber-700">Registre a ficha antes do primeiro atendimento →</p>
                  </div>
                </div>
              </Link>
            )}

            {/* Analytics: Techniques + Payments + Behavior */}
            {hasAnalytics && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Techniques used */}
                <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-5">
                  <h3 className="font-semibold text-sm mb-4 flex items-center gap-2 text-brand-700">
                    <BarChart2 className="w-4 h-4" />
                    Técnicas Realizadas
                  </h3>
                  <div className="space-y-3">
                    {techList.map((t) => (
                      <div key={t.name}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                            {t.name}
                          </span>
                          <span className="text-xs font-semibold text-muted-foreground">
                            {t.count}x
                          </span>
                        </div>
                        <div className="h-1.5 bg-brand-50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-400 rounded-full"
                            style={{ width: `${(t.count / maxTechCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Behavior */}
                <div className="space-y-4">
                  {/* (payment methods analytics removed — not available from API yet) */}

                  {/* Scheduling behavior */}
                  {(favoriteDayName || timeOfDay) && (
                    <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-5">
                      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 text-brand-700">
                        <Clock className="w-4 h-4" />
                        Comportamento
                      </h3>
                      <div className="space-y-2.5">
                        {favoriteDayName && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Dia favorito</span>
                            <span className="font-semibold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-lg text-xs">
                              {favoriteDayName}
                            </span>
                          </div>
                        )}
                        {timeOfDay && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Período preferido</span>
                            <div className="flex items-center gap-1 font-semibold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-lg text-xs">
                              {timeOfDay === "Manhã" && <Sun className="w-3 h-3 text-amber-500" />}
                              {timeOfDay === "Tarde" && <Sunset className="w-3 h-3 text-orange-500" />}
                              {timeOfDay === "Noite" && <Moon className="w-3 h-3 text-indigo-500" />}
                              {timeOfDay}
                            </div>
                          </div>
                        )}
                        {avgHour !== null && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Horário médio</span>
                            <span className="font-semibold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-lg text-xs">
                              ~{String(avgHour).padStart(2, "0")}h
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Upcoming Appointments */}
            {upcomingAppointments.length > 0 && (
              <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-4 sm:p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-500" />
                  Próximos Agendamentos
                </h3>
                <div className="space-y-2">
                  {upcomingAppointments.map((apt) => (
                      <Link
                        key={apt.id}
                        href={`/agenda/${apt.id}`}
                        className="flex items-center justify-between p-3 rounded-xl border border-brand-50 hover:bg-brand-50 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium">{apt.procedureName ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(apt.scheduledAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-emerald-600">
                            {formatCurrency(apt.priceCharged)}
                          </p>
                          <AppointmentStatusBadge status={apt.status} />
                        </div>
                      </Link>
                  ))}
                </div>
              </div>
            )}

            {/* History */}
            <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-4 sm:p-6">
              <h3 className="font-semibold mb-4">Histórico de Atendimentos</h3>
              {completedAppointments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhum atendimento concluído ainda
                </p>
              ) : (
                <div className="space-y-2">
                  {completedAppointments.slice(0, 10).map((apt) => (
                      <Link
                        key={apt.id}
                        href={`/agenda/${apt.id}`}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-brand-50 transition-colors group"
                      >
                        <div>
                          <p className="text-sm font-medium">{apt.procedureName ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(apt.scheduledAt)}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          {formatCurrency(apt.priceCharged)}
                        </p>
                      </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
