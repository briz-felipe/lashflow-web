"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppointments } from "@/hooks/useAppointments";
import { useProcedures } from "@/hooks/useProcedures";
import { useClients } from "@/hooks/useClients";
import { toast } from "@/components/ui/toaster";
import { ArrowLeft, Save, Calendar, User, Sparkles, RefreshCw, X, Search, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatPhone } from "@/lib/formatters";
import type { LashServiceType } from "@/domain/enums";
import { LASH_SERVICE_TYPE_LABELS } from "@/domain/enums";
import { computeCycle } from "@/components/clients/LashFlowStatus";
import type { Client } from "@/domain/entities";

const REMOVAL_PROC_ID = "proc-007";

const SERVICE_TYPES: Array<{
  type: LashServiceType;
  label: string;
  description: string;
  dot: string;
  active: string;
}> = [
  {
    type: "application",
    label: "Aplicação",
    description: "Nova aplicação completa de extensões",
    dot: "bg-brand-500",
    active: "border-brand-500 bg-brand-50 text-brand-700",
  },
  {
    type: "maintenance",
    label: "Manutenção",
    description: "Reposição dentro do ciclo (até 15 dias)",
    dot: "bg-emerald-500",
    active: "border-emerald-500 bg-emerald-50 text-emerald-700",
  },
  {
    type: "removal",
    label: "Remoção",
    description: "Remoção completa das extensões — R$30",
    dot: "bg-red-400",
    active: "border-red-400 bg-red-50 text-red-700",
  },
];

// ─── Client search combobox ───────────────────────────────────────────────────
function ClientSearch({
  selected,
  onSelect,
}: {
  selected: Client | null;
  onSelect: (c: Client | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: results } = useClients(
    { search: query.length >= 1 ? query : undefined },
    20
  );

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  if (selected) {
    return (
      <div className="flex items-center gap-3 p-3 bg-brand-50 rounded-xl border border-brand-200">
        <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {selected.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{selected.name}</p>
          <p className="text-xs text-muted-foreground">{formatPhone(selected.phone)}</p>
        </div>
        <button
          type="button"
          onClick={() => { onSelect(null); setQuery(""); }}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar por nome ou telefone..."
          className="pl-9"
          autoComplete="off"
        />
      </div>
      {open && (query.length >= 1 || results.length > 0) && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white rounded-xl border border-brand-100 shadow-card-hover overflow-hidden max-h-56 overflow-y-auto">
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground px-4 py-3">Nenhuma cliente encontrada</p>
          ) : (
            results.map((c) => (
              <button
                key={c.id}
                type="button"
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-brand-50 transition-colors text-left"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(c);
                  setQuery("");
                  setOpen(false);
                }}
              >
                <div className="w-7 h-7 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {c.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{formatPhone(c.phone)}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function NovoAgendamentoPage() {
  return (
    <Suspense fallback={null}>
      <NovoAgendamentoContent />
    </Suspense>
  );
}

function NovoAgendamentoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledClientId = searchParams.get("clientId") ?? "";

  const { createAppointment } = useAppointments();
  const { procedures } = useProcedures(true);
  const { data: allClients } = useClients({}, 100);
  const [saving, setSaving] = useState(false);

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [form, setForm] = useState({
    procedureId: "",
    serviceType: "" as LashServiceType | "",
    date: "",
    time: "09:00",
    notes: "",
  });

  // Pre-fill client if coming from profile
  useEffect(() => {
    if (prefilledClientId && allClients.length > 0 && !selectedClient) {
      const c = allClients.find((x) => x.id === prefilledClientId);
      if (c) setSelectedClient(c);
    }
  }, [prefilledClientId, allClients, selectedClient]);

  // Fetch selected client's appointments to compute flow
  const { appointments } = useAppointments(
    selectedClient ? { clientId: selectedClient.id } : undefined
  );
  const cycle = selectedClient ? computeCycle(appointments) : null;

  // Auto-suggest service type when client changes
  useEffect(() => {
    if (cycle?.nextSuggestedService) {
      setForm((f) => ({ ...f, serviceType: cycle.nextSuggestedService! }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClient?.id]);

  // Auto-select removal procedure
  useEffect(() => {
    if (form.serviceType === "removal") {
      setForm((f) => ({ ...f, procedureId: REMOVAL_PROC_ID }));
    } else if (form.procedureId === REMOVAL_PROC_ID) {
      setForm((f) => ({ ...f, procedureId: "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.serviceType]);

  const visibleProcedures =
    form.serviceType === "removal"
      ? procedures.filter((p) => p.id === REMOVAL_PROC_ID)
      : procedures.filter((p) => p.id !== REMOVAL_PROC_ID);

  const selectedProcedure = procedures.find((p) => p.id === form.procedureId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !form.procedureId || !form.serviceType || !form.date || !form.time) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const scheduledAt = new Date(`${form.date}T${form.time}:00`);
      const apt = await createAppointment({
        clientId: selectedClient.id,
        procedureId: form.procedureId,
        scheduledAt,
        serviceType: form.serviceType as LashServiceType,
        priceCharged: selectedProcedure?.priceInCents ?? 0,
        notes: form.notes || undefined,
      });
      toast({ title: "Agendamento criado!", variant: "success" });
      router.push(`/agenda/${apt.id}`);
    } catch {
      toast({ title: "Erro ao criar agendamento", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Topbar title="Novo Agendamento" />
      <div className="p-4 sm:p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/agenda">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold">Novo Agendamento</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 xl:grid-cols-[3fr_2fr] gap-6">
            {/* ── Coluna esquerda ── */}
            <div className="space-y-6">
              {/* Cliente */}
              <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-6 sm:p-8">
                <h2 className="font-semibold mb-5 flex items-center gap-2 text-brand-700 text-base">
                  <User className="w-4 h-4" /> Cliente *
                </h2>
                <ClientSearch
                  selected={selectedClient}
                  onSelect={(c) => {
                    setSelectedClient(c);
                    setForm((f) => ({ ...f, serviceType: "" }));
                  }}
                />
                {selectedClient && cycle && cycle.summary !== "no_data" && (
                  <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-xl text-xs ${
                    cycle.summary === "overdue"
                      ? "bg-red-50 border border-red-200 text-red-700"
                      : cycle.summary === "complete"
                      ? "bg-brand-50 text-brand-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>
                      {cycle.summary === "overdue" && "Intervalo > 15 dias — remoção recomendada."}
                      {cycle.summary === "ok" && cycle.nextSuggestedService === "maintenance" && "Aguardando manutenção."}
                      {cycle.summary === "complete" && "Ciclo completo — nova aplicação."}
                      {cycle.nextSuggestedService && (
                        <strong className="ml-1">Sugestão: {LASH_SERVICE_TYPE_LABELS[cycle.nextSuggestedService]}.</strong>
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Tipo de atendimento */}
              <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-6 sm:p-8">
                <h2 className="font-semibold mb-5 flex items-center gap-2 text-brand-700 text-base">
                  <RefreshCw className="w-4 h-4" /> Tipo de Atendimento *
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  {SERVICE_TYPES.map(({ type, label, description, dot, active }) => {
                    const isSelected = form.serviceType === type;
                    const isSuggested = cycle?.nextSuggestedService === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, serviceType: type }))}
                        className={`relative flex flex-col items-center text-center p-4 rounded-xl border-2 transition-all gap-2 ${
                          isSelected
                            ? active
                            : "border-brand-50 bg-white text-muted-foreground hover:border-brand-200"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full ${dot} ${isSelected ? "" : "opacity-40"}`} />
                        <span className="text-sm font-semibold leading-tight">{label}</span>
                        <span className="text-xs opacity-70 leading-tight">{description}</span>
                        {isSuggested && !isSelected && (
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs bg-amber-400 text-white px-1.5 py-0.5 rounded-full whitespace-nowrap">
                            sugerido
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Procedimento */}
              {form.serviceType && (
                <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-6 sm:p-8">
                  <h2 className="font-semibold mb-5 flex items-center gap-2 text-brand-700 text-base">
                    <Sparkles className="w-4 h-4" /> Procedimento *
                  </h2>
                  <Select
                    value={form.procedureId}
                    onValueChange={(v) => setForm((f) => ({ ...f, procedureId: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o procedimento" />
                    </SelectTrigger>
                    <SelectContent>
                      {visibleProcedures.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} — {formatCurrency(p.priceInCents)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedProcedure && (
                    <div className="mt-4 p-4 bg-brand-50 rounded-xl text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duração:</span>
                        <span className="font-medium">{selectedProcedure.durationMinutes} min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valor:</span>
                        <span className="font-semibold text-brand-700">{formatCurrency(selectedProcedure.priceInCents)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Coluna direita ── */}
            <div className="space-y-6">
              {/* Data e Hora */}
              <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-6 sm:p-8">
                <h2 className="font-semibold mb-5 flex items-center gap-2 text-brand-700 text-base">
                  <Calendar className="w-4 h-4" /> Data e Hora *
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Data</Label>
                    <Input
                      id="date"
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Hora</Label>
                    <Input
                      id="time"
                      type="time"
                      value={form.time}
                      onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-6 sm:p-8">
                <Label htmlFor="notes" className="text-base font-semibold text-brand-700">Observações</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Observações sobre o atendimento..."
                  className="mt-2"
                  rows={6}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Link href="/agenda" className="flex-1">
                  <Button type="button" variant="outline" className="w-full h-11">Cancelar</Button>
                </Link>
                <Button type="submit" disabled={saving} className="flex-1 h-11">
                  <Save className="w-4 h-4" />
                  {saving ? "Salvando..." : "Criar Agendamento"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
