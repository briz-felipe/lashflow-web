"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AppointmentStatusBadge } from "@/components/appointments/AppointmentStatusBadge";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { appointmentService, paymentService } from "@/services";
import { toast } from "@/components/ui/toaster";
import { formatDateTime, formatCurrency, formatTime } from "@/lib/formatters";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  PlayCircle,
  User,
  Sparkles,
  Clock,
  DollarSign,
  Calendar,
  RefreshCw,
  Scissors,
} from "lucide-react";
import Link from "next/link";
import type { Appointment } from "@/domain/entities";
import type { Payment } from "@/domain/entities";
import type { AppointmentStatus, LashServiceType } from "@/domain/enums";
import type { PaymentMethod } from "@/domain/enums";
import { PAYMENT_METHOD_LABELS, LASH_SERVICE_TYPE_LABELS } from "@/domain/enums";
import { REMINDER_TEMPLATES } from "@/domain/entities/reminder";
import { WhatsAppReminderService } from "@/services/WhatsAppReminderService";
import { useWhatsAppTemplates } from "@/hooks/useWhatsAppTemplates";
import { useAuth } from "@/hooks/useAuth";
import { MessageCircle, ChevronDown } from "lucide-react";

const SERVICE_TYPE_CONFIG: Record<LashServiceType, { bg: string; text: string; icon: React.ReactNode }> = {
  application: { bg: "bg-brand-50 border-brand-200",     text: "text-brand-700",   icon: <Sparkles className="w-3.5 h-3.5" /> },
  maintenance:  { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", icon: <RefreshCw className="w-3.5 h-3.5" /> },
  removal:      { bg: "bg-red-50 border-red-200",         text: "text-red-700",     icon: <Scissors className="w-3.5 h-3.5" /> },
  lash_lifting: { bg: "bg-amber-50 border-amber-200",     text: "text-amber-700",   icon: <Sparkles className="w-3.5 h-3.5" /> },
  permanent:    { bg: "bg-purple-50 border-purple-200",   text: "text-purple-700",  icon: <Sparkles className="w-3.5 h-3.5" /> },
};

const PAYMENT_METHODS: PaymentMethod[] = ["pix", "credit_card", "debit_card", "cash", "bank_transfer"];

export default function AgendamentoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [apt, setApt] = useState<Appointment | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [savingPayment, setSavingPayment] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const { templates: apiTemplates } = useWhatsAppTemplates();
  const { user } = useAuth();
  // Use API templates if available, fall back to built-in ones
  const reminderTemplates = apiTemplates.length > 0 ? apiTemplates : REMINDER_TEMPLATES;

  useEffect(() => {
    async function load() {
      try {
        const a = await appointmentService.getAppointmentById(id);
        if (!a) return;
        setApt(a);
        // Busca pagamento por appointmentId sempre (paymentId pode vir null mesmo com pagamento existente)
        const p = await paymentService.getPaymentByAppointmentId(a.id).catch(() => null);
        setPayment(p);
      } catch (err) {
        console.error("[agenda/detail] load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const updateStatus = async (status: AppointmentStatus, reason?: string) => {
    if (!apt) return;
    const updated = await appointmentService.updateAppointmentStatus(apt.id, status, reason);
    setApt(updated);
    toast({ title: "Status atualizado!", variant: "success" });
  };

  const cancel = async () => {
    if (!apt) return;
    const updated = await appointmentService.cancelAppointment(apt.id, "Cancelado pela profissional", "professional");
    setApt(updated);
    toast({ title: "Agendamento cancelado", variant: "destructive" });
  };

  const registerPayment = async () => {
    if (!apt) return;
    setSavingPayment(true);
    try {
      const newPayment = await paymentService.createPayment({
        appointmentId: apt.id,
        clientId: apt.clientId,
        totalAmountInCents: apt.priceCharged,
        method: paymentMethod,
      });
      const paid = await paymentService.updatePayment(newPayment.id, {
        status: "paid",
        paidAmountInCents: apt.priceCharged,
        paidAt: new Date(),
        method: paymentMethod,
      });
      setPayment(paid);
      toast({ title: "Pagamento registrado!", variant: "success" });
    } catch {
      // 409 = pagamento já existe; busca e exibe sem mostrar erro
      const existing = await paymentService.getPaymentByAppointmentId(apt.id).catch(() => null);
      if (existing) {
        setPayment(existing);
      } else {
        toast({ title: "Erro ao registrar pagamento", variant: "destructive" });
      }
    } finally {
      setSavingPayment(false);
    }
  };

  if (loading) return <LoadingPage />;
  if (!apt) return <div className="p-6"><p>Agendamento não encontrado.</p></div>;

  const serviceTypeCfg = apt.serviceType ? SERVICE_TYPE_CONFIG[apt.serviceType] : null;

  return (
    <div>
      <Topbar title="Detalhes do Agendamento" />

      <div className="p-4 sm:p-6 animate-fade-in space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/agenda">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <h1 className="text-xl font-bold flex-1">Detalhes do Agendamento</h1>
          <AppointmentStatusBadge status={apt.status} />
        </div>

        {/* Row 1: 3 colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">

          {/* ── Cliente ── */}
          <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-6 sm:p-8">
            <h3 className="font-semibold mb-5 flex items-center gap-2 text-brand-700 text-base">
              <User className="w-4 h-4" /> Cliente
            </h3>
            {apt.clientName ? (
              <div className="space-y-3">
                <Link href={`/clientes/${apt.clientId}`} className="flex items-center gap-4 hover:bg-brand-50 rounded-xl p-3 -mx-3 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-gradient-brand flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                    {apt.clientName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-base">{apt.clientName}</p>
                    {apt.clientPhone && <p className="text-sm text-muted-foreground mt-0.5">{apt.clientPhone}</p>}
                  </div>
                </Link>

                {apt.clientPhone && apt.status !== "cancelled" && apt.status !== "no_show" && (
                  <div className="relative">
                    <Button
                      variant="outline"
                      className="w-full border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 gap-2"
                      onClick={() => setReminderOpen((o) => !o)}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Lembrete via WhatsApp
                      <ChevronDown className={`w-3.5 h-3.5 ml-auto transition-transform ${reminderOpen ? "rotate-180" : ""}`} />
                    </Button>

                    {reminderOpen && (
                      <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-brand-100 shadow-lg overflow-hidden">
                        {reminderTemplates.map((tpl) => {
                          const vars = WhatsAppReminderService.buildVariables({
                            clientName: apt.clientName!,
                            scheduledAt: apt.scheduledAt,
                            procedure: apt.procedureName ?? "procedimento",
                            durationMinutes: apt.durationMinutes,
                            salonAddress: user?.salonAddress,
                          });
                          const message = WhatsAppReminderService.interpolate(tpl.message, vars);
                          const url = WhatsAppReminderService.buildUrl(apt.clientPhone!, message);
                          return (
                            <a
                              key={tpl.id}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setReminderOpen(false)}
                              className="flex flex-col px-4 py-3 hover:bg-green-50 transition-colors border-b last:border-0 border-brand-50"
                            >
                              <span className="text-sm font-medium text-foreground">{tpl.name}</span>
                              <span className="text-xs text-muted-foreground mt-0.5">{tpl.description}</span>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : <p className="text-muted-foreground">—</p>}
          </div>

          {/* ── Tipo de Atendimento + Procedimento ── */}
          <div className="bg-white rounded-2xl border border-brand-100 shadow-card overflow-hidden">
            {/* Hero colorido do tipo */}
            {serviceTypeCfg ? (
              <div className={`px-6 sm:px-8 py-5 border-b ${serviceTypeCfg.bg}`}>
                <p className="text-xs font-medium text-muted-foreground mb-2">Tipo de Atendimento</p>
                <div className={`flex items-center gap-3 ${serviceTypeCfg.text}`}>
                  <span className="scale-150">{serviceTypeCfg.icon}</span>
                  <span className="text-xl font-bold">{LASH_SERVICE_TYPE_LABELS[apt.serviceType!]}</span>
                </div>
              </div>
            ) : (
              <div className="px-6 sm:px-8 py-5 border-b bg-brand-50">
                <p className="text-xs font-medium text-muted-foreground mb-1">Tipo de Atendimento</p>
                <p className="text-sm text-muted-foreground italic">Não informado</p>
              </div>
            )}
            {/* Procedimento */}
            <div className="p-6 sm:p-8">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-brand-700 text-base">
                <Sparkles className="w-4 h-4" /> Procedimento
              </h3>
              {apt.procedureName ? (
                <div className="space-y-3">
                  <p className="font-semibold text-lg leading-tight">{apt.procedureName}</p>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      {apt.durationMinutes} min
                    </div>
                    <span className="text-base font-bold text-emerald-600">{formatCurrency(apt.priceCharged)}</span>
                  </div>
                </div>
              ) : <p className="text-muted-foreground">—</p>}
            </div>
          </div>

          {/* ── Data e Hora ── */}
          <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-6 sm:p-8">
            <h3 className="font-semibold mb-5 flex items-center gap-2 text-brand-700 text-base">
              <Calendar className="w-4 h-4" /> Data e Hora
            </h3>
            <p className="text-lg font-bold">{formatDateTime(apt.scheduledAt)}</p>
            <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>{formatTime(apt.scheduledAt)} — {formatTime(apt.endsAt)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 ml-6">{apt.durationMinutes} minutos de duração</p>

            {/* Ações inline quando aplicável */}
            {apt.status !== "completed" && apt.status !== "cancelled" && apt.status !== "no_show" && (
              <div className="mt-6 pt-5 border-t border-brand-50 space-y-2">
                <p className="text-xs font-semibold text-brand-700 mb-3">Ações</p>
                {apt.status === "pending_approval" && (
                  <Button className="w-full bg-emerald-500 hover:bg-emerald-600" onClick={() => updateStatus("confirmed")}>
                    <CheckCircle2 className="w-4 h-4" /> Aprovar Agendamento
                  </Button>
                )}
                {apt.status === "confirmed" && (
                  <Button className="w-full bg-blue-500 hover:bg-blue-600" onClick={() => updateStatus("in_progress")}>
                    <PlayCircle className="w-4 h-4" /> Iniciar Atendimento
                  </Button>
                )}
                {apt.status === "in_progress" && (
                  <Button className="w-full bg-emerald-500 hover:bg-emerald-600" onClick={() => updateStatus("completed")}>
                    <CheckCircle2 className="w-4 h-4" /> Concluir Atendimento
                  </Button>
                )}
                <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50" onClick={cancel}>
                  <XCircle className="w-4 h-4" /> Cancelar Agendamento
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Pagamento (full width) */}
        <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-6 sm:p-8">
          <h3 className="font-semibold mb-5 flex items-center gap-2 text-brand-700 text-base">
            <DollarSign className="w-4 h-4" /> Pagamento
          </h3>
          {payment ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-brand-50 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <PaymentStatusBadge status={payment.status} />
              </div>
              <div className="p-4 bg-brand-50 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">Valor pago</p>
                <p className="font-bold text-lg">{formatCurrency(payment.paidAmountInCents)}</p>
              </div>
              {payment.method && (
                <div className="p-4 bg-brand-50 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">Método</p>
                  <p className="font-semibold">{PAYMENT_METHOD_LABELS[payment.method]}</p>
                </div>
              )}
            </div>
          ) : apt.status === "completed" ? (
            <div className="max-w-sm space-y-3">
              <Label>Método de pagamento</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="w-full h-11" onClick={registerPayment} disabled={savingPayment}>
                <DollarSign className="w-4 h-4" />
                {savingPayment ? "Registrando..." : `Confirmar ${formatCurrency(apt.priceCharged)}`}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Pagamento será registrado após o atendimento.</p>
          )}
        </div>
      </div>
    </div>
  );
}
