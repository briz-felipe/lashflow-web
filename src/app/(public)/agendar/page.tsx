"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/formatters";
import { LASH_TECHNIQUE_LABELS } from "@/domain/enums";
import { Clock, Sparkles, ChevronRight, CalendarDays, User, Loader2 } from "lucide-react";
import { addDays, format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/components/ui/toaster";
import type { Procedure } from "@/domain/entities";

type Step = 1 | 2 | 3;

interface DaySlots {
  date: Date;
  slots: Date[];
  loading: boolean;
}

function StepIndicator({ step }: { step: Step }) {
  const steps = [
    { n: 1, label: "Escolha o procedimento" },
    { n: 2, label: "Selecione o horário" },
    { n: 3, label: "Seus dados" },
  ];
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all ${
              step >= s.n ? "bg-brand-500 text-white" : "bg-brand-100 text-brand-400"
            }`}
          >
            {s.n}
          </div>
          <span
            className={`text-sm hidden sm:block ${
              step === s.n ? "font-semibold text-brand-700" : "text-muted-foreground"
            }`}
          >
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <div
              className={`flex-1 h-px w-6 mx-1 ${step > s.n ? "bg-brand-400" : "bg-brand-100"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function AgendarPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loadingProcedures, setLoadingProcedures] = useState(true);
  const [procedureId, setProcedureId] = useState("");
  const [days, setDays] = useState<DaySlots[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [clientData, setClientData] = useState({
    name: "",
    phone: "",
    email: "",
    instagram: "",
  });

  useEffect(() => {
    api
      .get<Procedure[]>("/public/procedures")
      .then(setProcedures)
      .catch(() => toast({ title: "Erro ao carregar procedimentos", variant: "destructive" }))
      .finally(() => setLoadingProcedures(false));
  }, []);

  const selectedProcedure = procedures.find((p) => p.id === procedureId);
  const selectedDaySlots = days.find((d) => selectedDay && isSameDay(d.date, selectedDay));

  const loadDays = useCallback(async (procId: string) => {
    const next14 = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i + 1));

    // Initialize all days as loading
    setDays(next14.map((date) => ({ date, slots: [], loading: true })));

    // Fetch slots for each day in parallel
    await Promise.all(
      next14.map(async (date, idx) => {
        const dateStr = format(date, "yyyy-MM-dd");
        try {
          const res = await api.get<{ slots: string[] }>(
            `/public/available-slots?date=${dateStr}&procedure_id=${procId}`
          );
          const slots = (res.slots ?? []).map((s) => new Date(s));
          setDays((prev) => {
            const updated = [...prev];
            updated[idx] = { date, slots, loading: false };
            return updated;
          });
        } catch {
          setDays((prev) => {
            const updated = [...prev];
            updated[idx] = { date, slots: [], loading: false };
            return updated;
          });
        }
      })
    );
  }, []);

  const goToStep2 = async (procId: string) => {
    setProcedureId(procId);
    setSelectedDay(null);
    setSelectedSlot(null);
    setStep(2);
    loadDays(procId);
  };

  const handleSelectDay = (day: DaySlots) => {
    if (day.loading || day.slots.length === 0) return;
    setSelectedDay(day.date);
    setSelectedSlot(null);
  };

  const handleSubmit = async () => {
    if (!selectedSlot || !procedureId || !clientData.name || !clientData.phone) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/public/appointments", {
        procedure_id: procedureId,
        scheduled_at: selectedSlot.toISOString(),
        client: {
          name: clientData.name,
          phone: clientData.phone.replace(/\D/g, ""),
        },
      });
      router.push("/agendar/sucesso");
    } catch {
      toast({ title: "Erro ao solicitar agendamento", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-brand-800 mb-2">Agendar Horário</h1>
        <p className="text-muted-foreground">Escolha seu procedimento e horário preferido</p>
      </div>

      <StepIndicator step={step} />

      {/* Step 1: Choose procedure */}
      {step === 1 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-500" />
            Escolha o procedimento
          </h2>
          {loadingProcedures ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Carregando procedimentos...</span>
            </div>
          ) : procedures.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum procedimento disponível no momento.
            </p>
          ) : (
            <div className="grid gap-3">
              {procedures.map((proc) => (
                <button
                  key={proc.id}
                  onClick={() => goToStep2(proc.id)}
                  className="w-full text-left p-4 rounded-2xl border-2 border-brand-100 bg-white hover:border-brand-400 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold group-hover:text-brand-700 transition-colors">
                          {proc.name}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          {LASH_TECHNIQUE_LABELS[proc.technique]}
                        </Badge>
                      </div>
                      {proc.description && (
                        <p className="text-sm text-muted-foreground">{proc.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {proc.durationMinutes} min
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-4 flex-shrink-0 flex flex-col items-end gap-1">
                      <p className="text-lg font-bold text-brand-700">
                        {formatCurrency(proc.priceInCents)}
                      </p>
                      <ChevronRight className="w-4 h-4 text-brand-400 group-hover:text-brand-600 transition-colors" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Pick date + time slot */}
      {step === 2 && (
        <div>
          <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-brand-500" />
            Selecione a data e horário
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Próximas datas disponíveis para{" "}
            <span className="font-medium text-brand-700">{selectedProcedure?.name}</span>
          </p>

          {/* Date grid */}
          <div className="grid grid-cols-7 gap-1.5 mb-5">
            {days.map((day) => {
              const isSelected = selectedDay && isSameDay(day.date, selectedDay);
              const hasSlots = !day.loading && day.slots.length > 0;
              const isEmpty = !day.loading && day.slots.length === 0;

              return (
                <button
                  key={day.date.toString()}
                  onClick={() => handleSelectDay(day)}
                  disabled={day.loading || isEmpty}
                  className={`flex flex-col items-center py-2 px-1 rounded-xl text-xs transition-all border ${
                    isSelected
                      ? "bg-brand-500 text-white border-brand-500 shadow-glow"
                      : hasSlots
                      ? "bg-white border-brand-200 text-brand-700 hover:border-brand-400 hover:bg-brand-50 cursor-pointer"
                      : day.loading
                      ? "bg-brand-50 border-brand-50 text-brand-300 cursor-wait"
                      : "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed"
                  }`}
                >
                  <span className={`font-medium uppercase tracking-wide ${isSelected ? "text-white/80" : "text-muted-foreground"} text-[10px]`}>
                    {format(day.date, "EEE", { locale: ptBR })}
                  </span>
                  <span className="font-bold text-sm leading-tight">
                    {format(day.date, "d")}
                  </span>
                  {day.loading ? (
                    <Loader2 className="w-2.5 h-2.5 mt-0.5 animate-spin opacity-40" />
                  ) : hasSlots ? (
                    <span className={`text-[10px] mt-0.5 ${isSelected ? "text-white/80" : "text-emerald-600"}`}>
                      {day.slots.length} vagas
                    </span>
                  ) : (
                    <span className="text-[10px] mt-0.5 text-gray-300">–</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Time slots for selected day */}
          {selectedDay && selectedDaySlots && (
            <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-5 mb-5">
              <h3 className="font-medium text-sm mb-3 text-brand-700">
                {format(selectedDay, "EEEE, d 'de' MMMM", { locale: ptBR })}
              </h3>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {selectedDaySlots.slots.map((slot) => (
                  <button
                    key={slot.toString()}
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2 px-2 rounded-xl text-sm font-medium transition-all ${
                      selectedSlot?.toString() === slot.toString()
                        ? "bg-brand-500 text-white shadow-glow"
                        : "bg-brand-50 text-brand-700 hover:bg-brand-100"
                    }`}
                  >
                    {format(slot, "HH:mm")}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!selectedDay && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Selecione uma data com vagas disponíveis acima
            </p>
          )}

          <div className="flex gap-3 mt-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              Voltar
            </Button>
            <Button
              className="flex-1"
              disabled={!selectedSlot}
              onClick={() => setStep(3)}
            >
              Continuar
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Client data */}
      {step === 3 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-brand-500" />
            Seus dados
          </h2>

          {/* Summary */}
          <div className="bg-brand-50 rounded-2xl p-4 mb-6 border border-brand-200">
            <p className="text-sm text-brand-800 font-semibold">{selectedProcedure?.name}</p>
            <p className="text-xs text-brand-600">
              {selectedDay &&
                format(selectedDay, "EEEE, d 'de' MMMM", { locale: ptBR })}
              {selectedSlot && ` às ${format(selectedSlot, "HH:mm")}`}
            </p>
            <p className="text-sm font-bold text-brand-700 mt-1">
              {selectedProcedure && formatCurrency(selectedProcedure.priceInCents)}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-6 space-y-4">
            <div>
              <Label htmlFor="name">Nome completo *</Label>
              <Input
                id="name"
                value={clientData.name}
                onChange={(e) => setClientData((d) => ({ ...d, name: e.target.value }))}
                placeholder="Seu nome"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="phone">WhatsApp *</Label>
              <Input
                id="phone"
                value={clientData.phone}
                onChange={(e) => setClientData((d) => ({ ...d, phone: e.target.value }))}
                placeholder="(11) 99999-9999"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={clientData.email}
                onChange={(e) => setClientData((d) => ({ ...d, email: e.target.value }))}
                placeholder="seu@email.com"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={clientData.instagram}
                onChange={(e) =>
                  setClientData((d) => ({ ...d, instagram: e.target.value }))
                }
                placeholder="@seuusuario"
                className="mt-1.5"
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-3 text-center">
            Seu agendamento ficará aguardando confirmação da profissional.
          </p>

          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={() => setStep(2)}>
              Voltar
            </Button>
            <Button
              className="flex-1"
              disabled={!clientData.name || !clientData.phone || submitting}
              onClick={handleSubmit}
            >
              {submitting ? "Enviando..." : "Solicitar Agendamento"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
