"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClients } from "@/hooks/useClients";
import { ClientSegmentBadge } from "@/components/clients/ClientSegmentBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { formatPhone, formatCurrency, formatDate } from "@/lib/formatters";
import { Plus, Search, Users, Instagram, Mail, Phone, Lightbulb, X, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { mockProcedures } from "@/data";
import type { ClientSegment } from "@/domain/enums";
import { CLIENT_SEGMENT_LABELS } from "@/domain/enums";

type SortOption = "most_visited" | "least_visited" | "highest_spent" | "last_seen_asc" | "last_seen_desc";
const SORT_LABELS: Record<SortOption, string> = {
  most_visited: "Mais visitas",
  least_visited: "Menos visitas",
  highest_spent: "Maior gasto",
  last_seen_desc: "Visto recentemente",
  last_seen_asc: "Sem visita há mais tempo",
};
const SORT_OPTIONS = Object.keys(SORT_LABELS) as SortOption[];

const SEGMENT_MARKETING: Record<ClientSegment, { tip: string; color: string }> = {
  vip: {
    tip: "Clientes VIP merecem atenção especial. Considere oferecer um brinde surpresa, acesso antecipado a novas técnicas ou um desconto exclusivo na próxima visita.",
    color: "bg-amber-50 border-amber-200 text-amber-800",
  },
  recorrente: {
    tip: "Clientes recorrentes são sua base! Reforce o vínculo com um programa de fidelidade, desconto progressivo ou bônus a cada 5 visitas.",
    color: "bg-emerald-50 border-emerald-200 text-emerald-800",
  },
  inativa: {
    tip: "Clientes inativas estão sumidas há mais de 60 dias. Uma mensagem personalizada com promoção de retorno pode reativá-las rapidamente.",
    color: "bg-red-50 border-red-200 text-red-800",
  },
  volume: {
    tip: "Apaixonadas por volume! Compartilhe lançamentos de técnicas como Mega Volume ou Wispy com fotos de antes/depois para engajar.",
    color: "bg-purple-50 border-purple-200 text-purple-800",
  },
  classic: {
    tip: "Clientes clássicas valorizam naturalidade. Comunique promoções de manutenção e reforço para manter o fio perfeito.",
    color: "bg-blue-50 border-blue-200 text-blue-800",
  },
  hybrid: {
    tip: "Amantes do híbrido! Mostre combinações criativas e convide para conhecer as novidades entre volume e clássico.",
    color: "bg-brand-50 border-brand-200 text-brand-800",
  },
};

const ALL_SEGMENTS: ClientSegment[] = ["vip", "recorrente", "inativa", "volume", "classic", "hybrid"];

export default function ClientesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeSegments, setActiveSegments] = useState<ClientSegment[]>([]);
  const [sortBy, setSortBy] = useState<SortOption | undefined>(undefined);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: clients, total, loading } = useClients(
    {
      search: debouncedSearch.length >= 2 ? debouncedSearch : undefined,
      segments: activeSegments.length > 0 ? activeSegments : undefined,
      sortBy,
    },
    100
  );

  const toggleSegment = (segment: ClientSegment) => {
    setActiveSegments((prev) =>
      prev.includes(segment) ? prev.filter((s) => s !== segment) : [...prev, segment]
    );
  };

  return (
    <div>
      <Topbar title="Clientes" subtitle={`${total} cliente${total !== 1 ? "s" : ""} cadastrada${total !== 1 ? "s" : ""}`} />

      <div className="p-4 sm:p-6 animate-fade-in">
        <PageHeader
          title="Clientes"
          description="Gerencie sua base de clientes e CRM"
          action={
            <Link href="/clientes/novo">
              <Button>
                <Plus className="w-4 h-4" />
                Nova Cliente
              </Button>
            </Link>
          }
        />

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, telefone, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <select
                value={sortBy ?? ""}
                onChange={(e) => setSortBy((e.target.value as SortOption) || undefined)}
                className="h-10 pl-8 pr-8 rounded-xl border border-input bg-white text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-brand-300"
              >
                <option value="">Ordenar por...</option>
                {SORT_OPTIONS.map((o) => (
                  <option key={o} value={o}>{SORT_LABELS[o]}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Segment filters */}
          <div className="flex flex-wrap gap-2 mt-3">
            {ALL_SEGMENTS.map((segment) => (
              <button
                key={segment}
                onClick={() => toggleSegment(segment)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  activeSegments.includes(segment)
                    ? "bg-brand-500 text-white"
                    : "bg-brand-50 text-brand-600 hover:bg-brand-100"
                }`}
              >
                {CLIENT_SEGMENT_LABELS[segment]}
              </button>
            ))}
          </div>
        </div>

        {/* Marketing tip for active segment */}
        {activeSegments.length === 1 && (() => {
          const seg = activeSegments[0];
          const info = SEGMENT_MARKETING[seg];
          return (
            <div className={`flex items-start gap-3 p-4 rounded-2xl border mb-4 ${info.color}`}>
              <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <span className="font-semibold">{CLIENT_SEGMENT_LABELS[seg]}: </span>
                {info.tip}
              </div>
              <button onClick={() => setActiveSegments([])} className="flex-shrink-0 opacity-60 hover:opacity-100">
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })()}

        {/* Clients Table */}
        <div className="bg-white rounded-2xl border border-brand-100 shadow-card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <LoadingSpinner />
            </div>
          ) : clients.length === 0 ? (
            <EmptyState
              icon={<Users className="w-6 h-6" />}
              title="Nenhuma cliente encontrada"
              description={
                search || activeSegments.length > 0
                  ? "Tente ajustar os filtros de busca"
                  : "Cadastre sua primeira cliente para começar"
              }
              action={
                !search && activeSegments.length === 0 ? (
                  <Link href="/clientes/novo">
                    <Button>
                      <Plus className="w-4 h-4" />
                      Nova Cliente
                    </Button>
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-brand-50">
                    <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-3">Cliente</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 hidden md:table-cell">Contato</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 hidden lg:table-cell">Segmentos</th>
                    <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3 hidden sm:table-cell">Total Gasto</th>
                    <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3 hidden xl:table-cell">Último Agend.</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-50">
                  {clients.map((client) => {
                    const favProc = mockProcedures.find((p) => p.id === client.favoriteProcedureId);
                    return (
                      <tr
                        key={client.id}
                        className="hover:bg-brand-50/50 transition-colors group cursor-pointer"
                        onClick={() => router.push(`/clientes/${client.id}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-brand flex-shrink-0 flex items-center justify-center text-white text-sm font-bold">
                              {client.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{client.name}</p>
                              {favProc && (
                                <p className="text-xs text-muted-foreground">{favProc.name}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 hidden md:table-cell">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Phone className="w-3 h-3 flex-shrink-0" />
                              <span>{formatPhone(client.phone)}</span>
                            </div>
                            {client.email && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Mail className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate max-w-[160px]">{client.email}</span>
                              </div>
                            )}
                            {client.instagram && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Instagram className="w-3 h-3 flex-shrink-0" />
                                <span>@{client.instagram}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {client.segments.slice(0, 2).map((seg) => (
                              <ClientSegmentBadge key={seg} segment={seg} />
                            ))}
                            {client.segments.length > 2 && (
                              <span className="text-xs text-muted-foreground">+{client.segments.length - 2}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 hidden sm:table-cell text-right">
                          <p className="text-sm font-semibold text-foreground">
                            {formatCurrency(client.totalSpent)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {client.appointmentsCount} visita{client.appointmentsCount !== 1 ? "s" : ""}
                          </p>
                        </td>
                        <td className="px-4 py-4 hidden xl:table-cell text-right">
                          <p className="text-sm text-muted-foreground">
                            {client.lastAppointmentDate
                              ? formatDate(client.lastAppointmentDate)
                              : "—"}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-xs text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            Ver perfil →
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
