"use client";

import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  User,
  UserPlus,
  X,
} from "lucide-react";
import type { Client, ProcedureInput } from "@/domain/entities";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Suspense, useEffect, useRef, useState } from "react";
import { formatPhone, parsePtBR } from "@/lib/formatters";
import { ProcedureSelector, type SelectedProcedure, totalCents, totalDuration } from "@/components/appointments/ProcedureSelector";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LASH_SERVICE_TYPE_LABELS } from "@/domain/enums";
import { Label } from "@/components/ui/label";
import type { LashServiceType } from "@/domain/enums";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import { Topbar } from "@/components/layout/Topbar";
import { clientService } from "@/services";
import { computeCycle } from "@/components/clients/LashFlowStatus";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toBackendDate } from "@/config/timezone";
import { toast } from "@/components/ui/toaster";
import { useAppointments } from "@/hooks/useAppointments";
import { useClients } from "@/hooks/useClients";
import { useProcedures } from "@/hooks/useProcedures";
import { useAuth } from "@/hooks/useAuth";

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
    description: "Nova aplicação completa",
    dot: "bg-brand-500",
    active: "border-brand-500 bg-brand-50 text-brand-700",
  },
  {
    type: "maintenance",
    label: "Manutenção",
    description: "Reposição no ciclo",
    dot: "bg-emerald-500",
    active: "border-emerald-500 bg-emerald-50 text-emerald-700",
  },
  {
    type: "removal",
    label: "Remoção",
    description: "Remoção completa",
    dot: "bg-red-400",
    active: "border-red-400 bg-red-50 text-red-700",
  },
  {
    type: "removal_application",
    label: "Remoção + Aplicação",
    description: "Remove e aplica na mesma sessão",
    dot: "bg-orange-500",
    active: "border-orange-500 bg-orange-50 text-orange-700",
  },
];

// ─── Quick register modal ──────────────────────────────────────────────────────
function QuickRegisterModal({
  open,
  initialName,
  onClose,
  onCreated,
}: {
  open: boolean;
  initialName: string;
  onClose: () => void;
  onCreated: (c: Client) => void;
}) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setPhone("");
    }
  }, [open, initialName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setSaving(true);
    try {
      const created = await clientService.createClient({ name: name.trim(), phone: phone.trim() });
      toast({ title: `${created.name} cadastrada!`, variant: "success" });
      onCreated(created);
    } catch {
      toast({ title: "Erro ao cadastrar cliente", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-brand-500" />
            Cadastro Rápido
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">
          Preencha nome e telefone. Os demais dados podem ser adicionados depois.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="qr-name">Nome *</Label>
            <Input
              id="qr-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome da cliente"
              className="mt-1.5 h-11"
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="qr-phone">Telefone / WhatsApp *</Label>
            <Input
              id="qr-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
              className="mt-1.5 h-11"
              type="tel"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={saving || !name.trim() || !phone.trim()}>
              {saving ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
  const [modalOpen, setModalOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: results } = useClients(
    { search: query.length >= 1 ? query : undefined },
    20
  );

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
    <>
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
        {open && query.length >= 1 && (
          <div className="absolute z-50 top-full mt-1 w-full bg-white rounded-xl border border-brand-100 shadow-card-hover overflow-hidden max-h-64 overflow-y-auto">
            {results.length === 0 ? (
              <div className="px-4 py-3 text-sm text-muted-foreground">
                Nenhuma cliente encontrada para &ldquo;{query}&rdquo;
              </div>
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
            <button
              type="button"
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-50 transition-colors text-left border-t border-brand-50"
              onMouseDown={(e) => {
                e.preventDefault();
                setOpen(false);
                setModalOpen(true);
              }}
            >
              <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                <UserPlus className="w-3.5 h-3.5 text-brand-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-brand-700">Cadastrar nova cliente</p>
                <p className="text-xs text-muted-foreground">Cadastro rápido com nome e telefone</p>
              </div>
            </button>
          </div>
        )}
      </div>

      <QuickRegisterModal
        open={modalOpen}
        initialName={query}
        onClose={() => setModalOpen(false)}
        onCreated={(c) => {
          onSelect(c);
          setQuery("");
          setModalOpen(false);
        }}
      />
    </>
  );
}


// ─── Date + Time picker card ───────────────────────────────────────────────────
function DateTimePicker({
  date,
  time,
  onDateChange,
  onTimeChange,
}: {
  date: string;
  time: string;
  onDateChange: (d: string) => void;
  onTimeChange: (t: string) => void;
}) {
  const parsedDate = date ? new Date(date + "T12:00:00") : null;
  const dateLabel = parsedDate
    ? format(parsedDate, "EEEE, d 'de' MMMM", { locale: ptBR })
    : null;

  return (
    <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-4">
      <h2 className="font-semibold flex items-center gap-2 text-brand-700 text-sm mb-3">
        <Calendar className="w-4 h-4" /> Data e Hora *
      </h2>

      <div className="space-y-3">
        {/* Data */}
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Data</label>
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full h-11 px-3 rounded-xl border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
          {dateLabel && (
            <p className="mt-1 text-[11px] text-brand-600 font-medium capitalize">{dateLabel}</p>
          )}
        </div>

        {/* Hora */}
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Horário</label>
          <input
            type="time"
            value={time}
            onChange={(e) => onTimeChange(e.target.value)}
            className="w-full h-11 px-3 rounded-xl border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>
      </div>
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
  const prefilledDate = searchParams.get("date") ?? "";

  const { createAppointment } = useAppointments();
  const { procedures } = useProcedures(true);
  const { user } = useAuth();
  const { data: allClients } = useClients({}, 100);
  const [saving, setSaving] = useState(false);

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedProcs, setSelectedProcs] = useState<SelectedProcedure[]>([]);
  const [form, setForm] = useState({
    serviceType: "" as LashServiceType | "",
    date: prefilledDate,
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
  const cycle = selectedClient ? computeCycle(appointments, user?.maintenanceCycleDays) : null;

  // Auto-suggest service type when client changes
  useEffect(() => {
    if (cycle?.nextSuggestedService) {
      setForm((f) => ({ ...f, serviceType: cycle.nextSuggestedService! }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClient?.id]);

  // Clear procedure selection when service type changes
  useEffect(() => {
    setSelectedProcs([]);
  }, [form.serviceType]);

  // ── Computed totals ─────────────────────────────────────────────────────────
  const isMulti = selectedProcs.length > 1;
  const combinedName = selectedProcs.map((p) => p.name).join(" + ");
  const priceCharged = totalCents(selectedProcs);
  const procDuration = totalDuration(selectedProcs);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || selectedProcs.length === 0 || !form.serviceType || !form.date || !form.time) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const scheduledAt = toBackendDate(form.date, form.time);

      // Build procedures array with custom price detection
      const proceduresInput: ProcedureInput[] = selectedProcs.map((sp) => {
        const catalogProc = procedures.find((p) => p.id === sp.procedureId);
        const enteredCents = parsePtBR(sp.priceStr);
        const isCustom = catalogProc && enteredCents !== catalogProc.priceInCents;
        return {
          procedureId: sp.procedureId,
          customPriceInCents: isCustom ? enteredCents : null,
        };
      });

      const apt = await createAppointment({
        clientId: selectedClient.id,
        scheduledAt,
        serviceType: form.serviceType as LashServiceType,
        procedures: proceduresInput,
        notes: form.notes || undefined,
        status: "confirmed",
      });
      toast({ title: "Agendamento criado!", variant: "success" });
      router.push(`/agenda/${apt.id}`);
    } catch (err) {
      toast({
        title: err instanceof Error && err.message ? err.message : "Erro ao criar agendamento",
        variant: "destructive",
      });
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
                    setSelectedProcs([]);
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
                <div className="grid grid-cols-2 gap-2.5">
                  {SERVICE_TYPES.map(({ type, label, description, dot, active }) => {
                    const isSelected = form.serviceType === type;
                    const isSuggested = cycle?.nextSuggestedService === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, serviceType: type }))}
                        className={`relative flex flex-col items-center text-center p-3 sm:p-4 rounded-xl border-2 transition-all gap-1.5 min-h-[5rem] ${
                          isSelected
                            ? active
                            : "border-brand-50 bg-white text-muted-foreground hover:border-brand-200"
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full ${dot} ${isSelected ? "" : "opacity-40"}`} />
                        <span className="text-xs sm:text-sm font-semibold leading-tight">{label}</span>
                        <span className="text-[10px] sm:text-xs opacity-70 leading-tight">{description}</span>
                        {isSuggested && !isSelected && (
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] bg-amber-400 text-white px-1.5 py-0.5 rounded-full whitespace-nowrap">
                            sugerido
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Procedimentos (multi-select) */}
              {form.serviceType && (
                <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-6 sm:p-8">
                  <h2 className="font-semibold mb-4 flex items-center gap-2 text-brand-700 text-base">
                    <Sparkles className="w-4 h-4" /> Procedimentos *
                  </h2>
                  <ProcedureSelector
                    procedures={procedures}
                    selected={selectedProcs}
                    onChange={setSelectedProcs}
                  />
                </div>
              )}
            </div>

            {/* ── Coluna direita ── */}
            <div className="space-y-6">
              {/* Data e Hora */}
              <DateTimePicker
                date={form.date}
                time={form.time}
                onDateChange={(d) => setForm((f) => ({ ...f, date: d }))}
                onTimeChange={(t) => setForm((f) => ({ ...f, time: t }))}
              />

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
