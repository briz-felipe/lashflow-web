"use client";

import { useParams } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/button";
import { useAnamnesis } from "@/hooks/useAnamnesis";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { formatDate } from "@/lib/formatters";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Camera,
  CameraOff,
  Ruler,
  RotateCcw,
  Maximize2,
  FileText,
} from "lucide-react";
import Link from "next/link";

const PROCEDURE_LABELS: Record<string, string> = {
  extension: "Extensão de Cílios",
  permanent: "Permanente de Cílios",
  lash_lifting: "Lash Lifting",
};

const HAIR_LOSS_LABELS: Record<string, string> = {
  low: "Pouco",
  medium: "Médio",
  high: "Muito",
};

function Field({ label, value }: { label: string; value: boolean | string | undefined | null }) {
  if (typeof value === "boolean") {
    return (
      <div className="flex items-center justify-between py-2 border-b border-brand-50 last:border-0">
        <span className="text-sm text-muted-foreground">{label}</span>
        {value ? (
          <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3" /> Sim
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" /> Não
          </span>
        )}
      </div>
    );
  }
  if (!value) return null;
  return (
    <div className="flex items-start justify-between py-2 border-b border-brand-50 last:border-0 gap-4">
      <span className="text-sm text-muted-foreground flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{String(value)}</span>
    </div>
  );
}

export default function AnamnesisDetailPage() {
  const { id, anamnesisId } = useParams<{ id: string; anamnesisId: string }>();
  const { anamnesis, loading } = useAnamnesis(anamnesisId);

  if (loading) return <LoadingPage />;
  if (!anamnesis) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Anamnese não encontrada.</p>
        <Link href={`/clientes/${id}/anamnese`}>
          <Button variant="ghost" className="mt-4"><ArrowLeft className="w-4 h-4" /> Voltar</Button>
        </Link>
      </div>
    );
  }

  const hasAlerts =
    anamnesis.hasAllergy ||
    anamnesis.hadEyeSurgeryLast3Months ||
    anamnesis.hasEyeDisease ||
    anamnesis.usesEyeDrops ||
    anamnesis.hasGlaucoma ||
    anamnesis.proneToBlepharitis ||
    anamnesis.hasEpilepsy;

  return (
    <div>
      <Topbar title="Ficha de Anamnese" />
      <div className="p-4 sm:p-6 max-w-2xl animate-fade-in space-y-5">
        <div className="flex items-center gap-3">
          <Link href={`/clientes/${id}/anamnese`}>
            <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">{PROCEDURE_LABELS[anamnesis.procedureType] ?? anamnesis.procedureType}</h1>
            <p className="text-sm text-muted-foreground">Registrada em {formatDate(anamnesis.createdAt)}</p>
          </div>
        </div>

        {/* Alert banner */}
        {hasAlerts && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700 mb-1">Atenção: contraindicações presentes</p>
              <p className="text-xs text-red-600">Verifique os itens marcados como SIM antes de iniciar o procedimento.</p>
            </div>
          </div>
        )}

        {/* Preventive info */}
        <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-5">
          <h2 className="font-semibold text-sm text-brand-700 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Informações Preventivas
          </h2>
          <Field label="Alergia" value={anamnesis.hasAllergy} />
          {anamnesis.allergyDetails && <Field label="Qual alergia" value={anamnesis.allergyDetails} />}
          <Field label="Cirurgia ocular (últimos 3 meses)" value={anamnesis.hadEyeSurgeryLast3Months} />
          <Field label="Doença ocular" value={anamnesis.hasEyeDisease} />
          {anamnesis.eyeDiseaseDetails && <Field label="Qual doença" value={anamnesis.eyeDiseaseDetails} />}
          <Field label="Uso de colírio" value={anamnesis.usesEyeDrops} />
          <Field label="Histórico de tireóide na família" value={anamnesis.familyThyroidHistory} />
          <Field label="Glaucoma" value={anamnesis.hasGlaucoma} />
          {anamnesis.hairLossGrade && (
            <Field label="Queda de cabelo" value={HAIR_LOSS_LABELS[anamnesis.hairLossGrade]} />
          )}
          <Field label="Blefarite" value={anamnesis.proneToBlepharitis} />
          <Field label="Epilepsia" value={anamnesis.hasEpilepsy} />
        </div>

        {/* Mapping */}
        {anamnesis.mapping && (
          <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-5">
            <h2 className="font-semibold text-sm text-brand-700 mb-4">Mapping Estilo</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              {anamnesis.mapping.size && (
                <div className="p-3 bg-brand-50 rounded-xl">
                  <Ruler className="w-4 h-4 text-brand-500 mx-auto mb-1" />
                  <p className="text-sm font-bold">{anamnesis.mapping.size}</p>
                  <p className="text-xs text-muted-foreground">Tamanho</p>
                </div>
              )}
              {anamnesis.mapping.curve && (
                <div className="p-3 bg-brand-50 rounded-xl">
                  <RotateCcw className="w-4 h-4 text-brand-500 mx-auto mb-1" />
                  <p className="text-sm font-bold">{anamnesis.mapping.curve}</p>
                  <p className="text-xs text-muted-foreground">Curvatura</p>
                </div>
              )}
              {anamnesis.mapping.thickness && (
                <div className="p-3 bg-brand-50 rounded-xl">
                  <Maximize2 className="w-4 h-4 text-brand-500 mx-auto mb-1" />
                  <p className="text-sm font-bold">{anamnesis.mapping.thickness}</p>
                  <p className="text-xs text-muted-foreground">Espessura</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Authorization */}
        <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-5">
          <h2 className="font-semibold text-sm text-brand-700 mb-3">Autorização</h2>
          <div className="flex items-center gap-3">
            {anamnesis.authorizedPhotoPublishing ? (
              <>
                <Camera className="w-5 h-5 text-emerald-500" />
                <span className="text-sm text-emerald-700 font-medium">Autoriza publicação de fotos antes/depois</span>
              </>
            ) : (
              <>
                <CameraOff className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Não autoriza publicação de fotos</span>
              </>
            )}
          </div>
          {anamnesis.signedAt && (
            <p className="text-xs text-muted-foreground mt-2">Assinado em {formatDate(anamnesis.signedAt)}</p>
          )}
        </div>

        {/* Notes */}
        {anamnesis.notes && (
          <div className="bg-brand-50 rounded-2xl border border-brand-100 p-4">
            <p className="text-xs font-medium text-brand-700 mb-1">Observações</p>
            <p className="text-sm text-muted-foreground">{anamnesis.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
