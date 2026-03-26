"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useClient } from "@/hooks/useClients";
import { useAnamneses } from "@/hooks/useAnamnesis";
import { toast } from "@/components/ui/toaster";
import { ArrowLeft, Save, AlertTriangle, CheckCircle2, Check, Calendar } from "lucide-react";
import Link from "next/link";
import type { AnamnosisProcedureType, AnamnesisHairLoss, Appointment } from "@/domain/entities";
import type { Procedure } from "@/domain/entities";
import { procedureService } from "@/services";
import { useAppointments } from "@/hooks/useAppointments";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type YesNo = "yes" | "no" | "";

function YesNoField({
  label,
  value,
  onChange,
  detail,
  detailValue,
  onDetailChange,
  detailPlaceholder,
}: {
  label: string;
  value: YesNo;
  onChange: (v: YesNo) => void;
  detail?: boolean;
  detailValue?: string;
  onDetailChange?: (v: string) => void;
  detailPlaceholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex gap-3">
        {(["yes", "no"] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${
              value === opt
                ? opt === "yes"
                  ? "bg-red-50 border-red-300 text-red-700"
                  : "bg-emerald-50 border-emerald-300 text-emerald-700"
                : "bg-white border-brand-100 text-muted-foreground hover:border-brand-300"
            }`}
          >
            {opt === "yes" ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            {opt === "yes" ? "Sim" : "Não"}
          </button>
        ))}
      </div>
      {detail && value === "yes" && (
        <Input
          value={detailValue}
          onChange={(e) => onDetailChange?.(e.target.value)}
          placeholder={detailPlaceholder ?? "Especifique..."}
          className="mt-1.5 text-sm"
        />
      )}
    </div>
  );
}

export default function NovaAnamnesePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { client } = useClient(id);
  const { anamneses, createAnamnesis } = useAnamneses(id);
  const { appointments } = useAppointments({ clientId: id });
  const [saving, setSaving] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>("");

  // Recent appointments (confirmed/completed, most recent first)
  const recentAppointments = appointments
    .filter((a) => a.status === "confirmed" || a.status === "completed" || a.status === "in_progress")
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
    .slice(0, 10);

  // Preventive
  const [hasAllergy, setHasAllergy] = useState<YesNo>("");
  const [allergyDetails, setAllergyDetails] = useState("");
  const [hadEyeSurgery, setHadEyeSurgery] = useState<YesNo>("");
  const [hasEyeDisease, setHasEyeDisease] = useState<YesNo>("");
  const [eyeDiseaseDetails, setEyeDiseaseDetails] = useState("");
  const [usesEyeDrops, setUsesEyeDrops] = useState<YesNo>("");
  const [familyThyroid, setFamilyThyroid] = useState<YesNo>("");
  const [hasGlaucoma, setHasGlaucoma] = useState<YesNo>("");
  const [hairLoss, setHairLoss] = useState<AnamnesisHairLoss | "">("");
  const [blepharitis, setBlepharitis] = useState<YesNo>("");
  const [hasEpilepsy, setHasEpilepsy] = useState<YesNo>("");

  // Service — procedures from API (multi-select)
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [selectedProcedureIds, setSelectedProcedureIds] = useState<string[]>([]);
  const [mappingSize, setMappingSize] = useState("");
  const [mappingCurve, setMappingCurve] = useState("");
  const [mappingThickness, setMappingThickness] = useState("");

  // Authorization + notes (declared before auto-fill effect)
  const [authorizedPhoto, setAuthorizedPhoto] = useState<YesNo>("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    procedureService.listProcedures().then(setProcedures).catch(() => {});
  }, []);

  // Auto-fill from last anamnesis
  useEffect(() => {
    if (prefilled || anamneses.length === 0) return;
    const last = [...anamneses].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
    setPrefilled(true);

    setHasAllergy(last.hasAllergy ? "yes" : "no");
    setAllergyDetails(last.allergyDetails ?? "");
    setHadEyeSurgery(last.hadEyeSurgeryLast3Months ? "yes" : "no");
    setHasEyeDisease(last.hasEyeDisease ? "yes" : "no");
    setEyeDiseaseDetails(last.eyeDiseaseDetails ?? "");
    setUsesEyeDrops(last.usesEyeDrops ? "yes" : "no");
    setFamilyThyroid(last.familyThyroidHistory ? "yes" : "no");
    setHasGlaucoma(last.hasGlaucoma ? "yes" : "no");
    setHairLoss(last.hairLossGrade ?? "");
    setBlepharitis(last.proneToBlepharitis ? "yes" : "no");
    setHasEpilepsy(last.hasEpilepsy ? "yes" : "no");
    if (last.mapping) {
      setMappingSize(last.mapping.size ?? "");
      setMappingCurve(last.mapping.curve ?? "");
      setMappingThickness(last.mapping.thickness ?? "");
    }
    setNotes(last.notes ?? "");
  }, [anamneses, prefilled]);

  const toggleProcedure = (procId: string) => {
    setSelectedProcedureIds((prev) =>
      prev.includes(procId) ? prev.filter((id) => id !== procId) : [...prev, procId]
    );
  };

  // Map selected procedures to procedureType for backend compatibility
  const inferProcedureType = (): AnamnosisProcedureType => {
    const names = selectedProcedureIds
      .map((id) => procedures.find((p) => p.id === id)?.name?.toLowerCase() ?? "")
      .join(" ");
    if (names.includes("lifting") || names.includes("lash lift")) return "lash_lifting";
    if (names.includes("permanente")) return "permanent";
    return "extension";
  };

  // Check if any selected procedure looks like extension (for mapping fields)
  const hasExtensionSelected = selectedProcedureIds.some((id) => {
    const name = procedures.find((p) => p.id === id)?.name?.toLowerCase() ?? "";
    return !name.includes("lifting") && !name.includes("permanente") && !name.includes("remoção");
  });

  const isComplete =
    hasAllergy !== "" &&
    hadEyeSurgery !== "" &&
    hasEyeDisease !== "" &&
    usesEyeDrops !== "" &&
    familyThyroid !== "" &&
    hasGlaucoma !== "" &&
    blepharitis !== "" &&
    hasEpilepsy !== "" &&
    authorizedPhoto !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete) {
      toast({ title: "Preencha todas as perguntas da anamnese", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await createAnamnesis({
        clientId: id,
        appointmentId: selectedAppointmentId || undefined,
        hasAllergy: hasAllergy === "yes",
        allergyDetails: allergyDetails || undefined,
        hadEyeSurgeryLast3Months: hadEyeSurgery === "yes",
        hasEyeDisease: hasEyeDisease === "yes",
        eyeDiseaseDetails: eyeDiseaseDetails || undefined,
        usesEyeDrops: usesEyeDrops === "yes",
        familyThyroidHistory: familyThyroid === "yes",
        hasGlaucoma: hasGlaucoma === "yes",
        hairLossGrade: hairLoss || undefined,
        proneToBlepharitis: blepharitis === "yes",
        hasEpilepsy: hasEpilepsy === "yes",
        procedureType: inferProcedureType(),
        mapping: mappingSize || mappingCurve || mappingThickness
          ? { size: mappingSize || undefined, curve: mappingCurve || undefined, thickness: mappingThickness || undefined }
          : undefined,
        authorizedPhotoPublishing: authorizedPhoto === "yes",
        signedAt: new Date(),
        notes: notes || undefined,
      });
      toast({ title: "Anamnese salva!", variant: "success" });
      router.push(`/clientes/${id}/anamnese`);
    } catch {
      toast({ title: "Erro ao salvar anamnese", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Topbar title="Nova Anamnese" />
      <div className="p-4 sm:p-6 max-w-2xl animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <Link href={`/clientes/${id}/anamnese`}>
            <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Ficha de Anamnese</h1>
            {client && <p className="text-sm text-muted-foreground">{client.name}</p>}
          </div>
        </div>

        {prefilled && (
          <div className="flex items-center gap-2 p-3 bg-brand-50 border border-brand-100 rounded-xl text-xs text-brand-700">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>Dados pré-preenchidos com a última ficha. Revise antes de salvar.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Vincular a agendamento */}
          {recentAppointments.length > 0 && (
            <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-5 sm:p-6">
              <h2 className="font-semibold mb-2 text-brand-700 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Agendamento
              </h2>
              <p className="text-xs text-muted-foreground mb-3">Vincule esta ficha a um atendimento (opcional)</p>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedAppointmentId("")}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm border transition-all ${
                    !selectedAppointmentId
                      ? "bg-brand-50 border-brand-300 text-brand-700 font-medium"
                      : "bg-white border-brand-100 text-muted-foreground hover:border-brand-200"
                  }`}
                >
                  Sem vínculo
                </button>
                {recentAppointments.map((apt) => (
                  <button
                    key={apt.id}
                    type="button"
                    onClick={() => setSelectedAppointmentId(apt.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm border transition-all ${
                      selectedAppointmentId === apt.id
                        ? "bg-brand-50 border-brand-300 text-brand-700 font-medium"
                        : "bg-white border-brand-100 text-muted-foreground hover:border-brand-200"
                    }`}
                  >
                    <span className="font-medium text-foreground">
                      {format(new Date(apt.scheduledAt), "dd/MM · HH:mm", { locale: ptBR })}
                    </span>
                    {" — "}
                    {apt.procedureName ?? "Procedimento"}
                    <span className="ml-1 text-xs opacity-60">
                      ({apt.status === "completed" ? "concluído" : apt.status === "in_progress" ? "em atendimento" : "confirmado"})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Informações Preventivas */}
          <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-5 sm:p-6">
            <h2 className="font-semibold mb-5 text-brand-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Informações Preventivas
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <YesNoField label="Possui alguma Alergia?" value={hasAllergy} onChange={setHasAllergy}
                detail detailValue={allergyDetails} onDetailChange={setAllergyDetails} detailPlaceholder="Qual alergia?" />
              <YesNoField label="Cirurgia ocular nos últimos 3 meses?" value={hadEyeSurgery} onChange={setHadEyeSurgery} />
              <YesNoField label="Possui doença ocular?" value={hasEyeDisease} onChange={setHasEyeDisease}
                detail detailValue={eyeDiseaseDetails} onDetailChange={setEyeDiseaseDetails} detailPlaceholder="Qual doença?" />
              <YesNoField label="Faz uso de colírio?" value={usesEyeDrops} onChange={setUsesEyeDrops} />
              <YesNoField label="Histórico de tireóide na família?" value={familyThyroid} onChange={setFamilyThyroid} />
              <YesNoField label="Possui glaucoma?" value={hasGlaucoma} onChange={setHasGlaucoma} />
              <YesNoField label="Propensa a blefarite?" value={blepharitis} onChange={setBlepharitis} />
              <YesNoField label="Possui epilepsia?" value={hasEpilepsy} onChange={setHasEpilepsy} />

              <div className="sm:col-span-2">
                <p className="text-sm font-medium mb-2">Grau de queda de cabelo</p>
                <div className="flex gap-2">
                  {([["low", "Pouco"], ["medium", "Médio"], ["high", "Muito"]] as const).map(([val, label]) => (
                    <button key={val} type="button" onClick={() => setHairLoss(val)}
                      className={`flex-1 py-1.5 rounded-xl text-sm font-medium border transition-all ${
                        hairLoss === val ? "bg-brand-500 text-white border-brand-500" : "bg-white border-brand-100 text-muted-foreground hover:border-brand-300"
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Procedimento */}
          <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-5 sm:p-6">
            <h2 className="font-semibold mb-2 text-brand-700">Procedimentos a Realizar</h2>
            <p className="text-xs text-muted-foreground mb-4">Selecione um ou mais procedimentos</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {procedures.filter((p) => p.isActive).map((proc) => {
                const isSelected = selectedProcedureIds.includes(proc.id);
                return (
                  <button
                    key={proc.id}
                    type="button"
                    onClick={() => toggleProcedure(proc.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                      isSelected
                        ? "bg-brand-500 text-white border-brand-500"
                        : "bg-white border-brand-100 text-muted-foreground hover:border-brand-300"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    {proc.name}
                  </button>
                );
              })}
              {procedures.filter((p) => p.isActive).length === 0 && (
                <p className="text-xs text-muted-foreground italic">Nenhum procedimento cadastrado</p>
              )}
            </div>

            {hasExtensionSelected && (
              <>
                <h3 className="font-medium text-sm mb-3 text-brand-600">Mapping Estilo</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="size">Tamanho</Label>
                    <Input id="size" value={mappingSize} onChange={(e) => setMappingSize(e.target.value)} placeholder="ex: 13mm" className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="curve">Curvatura</Label>
                    <Input id="curve" value={mappingCurve} onChange={(e) => setMappingCurve(e.target.value)} placeholder="ex: C" className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="thickness">Espessura</Label>
                    <Input id="thickness" value={mappingThickness} onChange={(e) => setMappingThickness(e.target.value)} placeholder="ex: 0.10" className="mt-1.5" />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Autorização e Observações */}
          <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-5 sm:p-6">
            <h2 className="font-semibold mb-5 text-brand-700">Autorizações</h2>
            <YesNoField
              label="Autoriza publicação de fotos antes/depois para fins de marketing?"
              value={authorizedPhoto}
              onChange={setAuthorizedPhoto}
            />
            <div className="mt-4">
              <Label htmlFor="notes">Observações adicionais</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações sobre sensibilidades, preferências ou cuidados especiais..." className="mt-1.5" rows={3} />
            </div>
          </div>

          <div className="flex gap-3">
            <Link href={`/clientes/${id}/anamnese`} className="flex-1">
              <Button type="button" variant="outline" className="w-full">Cancelar</Button>
            </Link>
            <Button type="submit" disabled={saving || !isComplete} className="flex-1">
              <Save className="w-4 h-4" />
              {saving ? "Salvando..." : "Salvar Anamnese"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
