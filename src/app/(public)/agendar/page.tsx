"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { mockProcedures } from "@/data";
import { appointmentService, clientService } from "@/services";
import { formatCurrency } from "@/lib/formatters";
import { LASH_TECHNIQUE_LABELS } from "@/domain/enums";
import { Clock, Sparkles, ChevronRight, CalendarDays, User } from "lucide-react";
import { addDays, format, isSunday, setHours, setMinutes, addMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/components/ui/toaster";

type Step = 1 | 2 | 3;

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
              step >= s.n
                ? "bg-brand-500 text-white"
                : "bg-brand-100 text-brand-400"
            }`}
          >
            {s.n}
          </div>
          <span className={`text-sm hidden sm:block ${step === s.n ? "font-semibold text-brand-700" : "text-muted-foreground"}`}>
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-px w-6 mx-1 ${step > s.n ? "bg-brand-400" : "bg-brand-100"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function AgendarPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [procedureId, setProcedureId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [clientData, setClientData] = useState({
    name: "",
    phone: "",
    email: "",
    instagram: "",
  });

  const activeProcedures = mockProcedures.filter((p) => p.isActive);
  const selectedProcedure = activeProcedures.find((p) => p.id === procedureId);

  const loadSlots = async (date: string, procId: string) => {
    if (!date || !procId) return;
    setLoadingSlots(true);
    const slots = await appointmentService.getAvailableSlots(new Date(date), procId);
    setAvailableSlots(slots);
    setLoadingSlots(false);
  };

  const handleDateChange = async (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    if (procedureId) await loadSlots(date, procedureId);
  };

  const handleSubmit = async () => {
    if (!selectedSlot || !procedureId || !clientData.name || !clientData.phone) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      let client = (await clientService.searchClients(clientData.phone))[0];
      if (!client) {
        client = await clientService.createClient({
          name: clientData.name,
          phone: clientData.phone.replace(/\D/g, ""),
          email: clientData.email || undefined,
          instagram: clientData.instagram.replace("@", "") || undefined,
        });
      }
      await appointmentService.createAppointment({
        clientId: client.id,
        procedureId,
        scheduledAt: selectedSlot,
      });
      router.push("/agendar/sucesso");
    } catch {
      toast({ title: "Erro ao solicitar agendamento", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const minDate = format(addDays(new Date(), 1), "yyyy-MM-dd");

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
          <div className="grid gap-3">
            {activeProcedures.map((proc) => (
              <button
                key={proc.id}
                onClick={() => setProcedureId(proc.id)}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                  procedureId === proc.id
                    ? "border-brand-500 bg-brand-50"
                    : "border-brand-100 bg-white hover:border-brand-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{proc.name}</h3>
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
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="text-lg font-bold text-brand-700">{formatCurrency(proc.priceInCents)}</p>
                    {procedureId === proc.id && (
                      <div className="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center ml-auto mt-1">
                        <ChevronRight className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <Button
            className="w-full mt-6"
            disabled={!procedureId}
            onClick={() => setStep(2)}
          >
            Continuar
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Step 2: Select slot */}
      {step === 2 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-brand-500" />
            Selecione a data e horário
          </h2>
          <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-6 mb-4">
            <Label htmlFor="date">Data desejada</Label>
            <Input
              id="date"
              type="date"
              min={minDate}
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="mt-1.5"
            />
          </div>

          {selectedDate && (
            <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-6">
              <h3 className="font-medium mb-3">Horários disponíveis</h3>
              {loadingSlots ? (
                <p className="text-sm text-muted-foreground">Carregando horários...</p>
              ) : availableSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum horário disponível nesta data. Tente outro dia.
                </p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.toString()}
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                        selectedSlot?.toString() === slot.toString()
                          ? "bg-brand-500 text-white shadow-glow"
                          : "bg-brand-50 text-brand-700 hover:bg-brand-100"
                      }`}
                    >
                      {format(slot, "HH:mm")}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
            <Button className="flex-1" disabled={!selectedSlot} onClick={() => setStep(3)}>
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
              {selectedDate && format(new Date(selectedDate), "EEEE, d 'de' MMMM", { locale: ptBR })}
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
                onChange={(e) => setClientData((d) => ({ ...d, instagram: e.target.value }))}
                placeholder="@seuusuario"
                className="mt-1.5"
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-3 text-center">
            Seu agendamento ficará aguardando confirmação da profissional.
          </p>

          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={() => setStep(2)}>Voltar</Button>
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
