"use client";

import { useParams } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/button";
import { useClient } from "@/hooks/useClients";
import { useAnamneses } from "@/hooks/useAnamnesis";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { formatDate } from "@/lib/formatters";
import {
  ArrowLeft,
  Plus,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Ruler,
  RotateCcw,
  Maximize2,
} from "lucide-react";
import Link from "next/link";

const PROCEDURE_LABELS: Record<string, string> = {
  extension: "Extensão de Cílios",
  permanent: "Permanente de Cílios",
  lash_lifting: "Lash Lifting",
};

export default function AnamnesesPage() {
  const { id } = useParams<{ id: string }>();
  const { client, loading: clientLoading } = useClient(id);
  const { anamneses, loading } = useAnamneses(id);

  if (clientLoading || loading) return <LoadingPage />;

  return (
    <div>
      <Topbar title="Anamneses" />
      <div className="p-4 sm:p-6 max-w-2xl animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <Link href={`/clientes/${id}`}>
            <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Fichas de Anamnese</h1>
            {client && <p className="text-sm text-muted-foreground">{client.name}</p>}
          </div>
          <Link href={`/clientes/${id}/anamnese/nova`}>
            <Button size="sm">
              <Plus className="w-4 h-4" />
              Nova Ficha
            </Button>
          </Link>
        </div>

        {anamneses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-10 text-center">
            <ClipboardList className="w-10 h-10 text-brand-200 mx-auto mb-3" />
            <p className="font-semibold text-foreground mb-1">Nenhuma anamnese registrada</p>
            <p className="text-sm text-muted-foreground mb-4">
              Registre a ficha de anamnese antes do primeiro atendimento.
            </p>
            <Link href={`/clientes/${id}/anamnese/nova`}>
              <Button><Plus className="w-4 h-4" /> Nova Ficha</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {anamneses.map((a) => {
              const alerts = [
                a.hasAllergy && `Alergia: ${a.allergyDetails || "sim"}`,
                a.usesEyeDrops && "Usa colírio",
                a.hasGlaucoma && "Glaucoma",
                a.proneToBlepharitis && "Propensa a blefarite",
                a.hadEyeSurgeryLast3Months && "Cirurgia ocular recente",
                a.hasEpilepsy && "Epilepsia",
                a.hasEyeDisease && `Doença ocular: ${a.eyeDiseaseDetails || "sim"}`,
              ].filter(Boolean) as string[];

              return (
                <Link key={a.id} href={`/clientes/${id}/anamnese/${a.id}`}>
                  <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-5 hover:shadow-card-hover transition-shadow">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-brand-700">
                            {PROCEDURE_LABELS[a.procedureType] ?? a.procedureType}
                          </span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">{formatDate(a.createdAt)}</span>
                        </div>

                        {/* Mapping */}
                        {a.mapping && (
                          <div className="flex flex-wrap gap-2 mt-2 mb-3">
                            {a.mapping.size && (
                              <span className="flex items-center gap-1 text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
                                <Ruler className="w-3 h-3" />{a.mapping.size}
                              </span>
                            )}
                            {a.mapping.curve && (
                              <span className="flex items-center gap-1 text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
                                <RotateCcw className="w-3 h-3" />Curv. {a.mapping.curve}
                              </span>
                            )}
                            {a.mapping.thickness && (
                              <span className="flex items-center gap-1 text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
                                <Maximize2 className="w-3 h-3" />{a.mapping.thickness}mm
                              </span>
                            )}
                          </div>
                        )}

                        {/* Alerts */}
                        {alerts.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {alerts.map((alert) => (
                              <span key={alert} className="flex items-center gap-1 text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full">
                                <AlertTriangle className="w-3 h-3" />{alert}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />Sem contraindicações
                          </span>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-brand-300 flex-shrink-0 mt-1" />
                    </div>

                    {a.notes && (
                      <p className="mt-3 text-xs text-muted-foreground bg-brand-50 rounded-xl px-3 py-2 italic">
                        {a.notes}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
