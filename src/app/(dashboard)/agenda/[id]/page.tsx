"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Input } from "@/components/ui/input";
import { AppointmentStatusBadge } from "@/components/appointments/AppointmentStatusBadge";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { appointmentService, paymentService } from "@/services";
import { toast } from "@/components/ui/toaster";
import { formatDateTime, formatCurrency, formatTime } from "@/lib/formatters";
import {
  ArrowLeft, CheckCircle2, XCircle, User, Sparkles, Clock,
  DollarSign, Calendar, RefreshCw, Scissors, Edit2, FileText,
  MessageCircle, ChevronDown, Plus, Minus, X, Tag, Check, Settings,
} from "lucide-react";
import Link from "next/link";
import type { Appointment, Payment, ExtraService } from "@/domain/entities";
import type { AppointmentStatus, LashServiceType, PaymentMethod } from "@/domain/enums";
import { PAYMENT_METHOD_LABELS, LASH_SERVICE_TYPE_LABELS } from "@/domain/enums";
import { REMINDER_TEMPLATES } from "@/domain/entities/reminder";
import { WhatsAppReminderService } from "@/services/WhatsAppReminderService";
import { useWhatsAppTemplates } from "@/hooks/useWhatsAppTemplates";
import { useAuth } from "@/hooks/useAuth";
import { useExtraServices } from "@/hooks/useExtraServices";
import { useProcedures } from "@/hooks/useProcedures";
import { toBackendDate } from "@/config/timezone";
import type { UpdateAppointmentInput } from "@/domain/entities";

const PAYMENT_METHODS: PaymentMethod[] = ["pix", "credit_card", "debit_card", "cash", "bank_transfer"];

const SERVICE_CONFIG: Record<LashServiceType, { icon: React.ReactNode; color: string; bg: string }> = {
  application:  { icon: <Sparkles className="w-4 h-4" />,  color: "text-brand-700",   bg: "bg-brand-50 border-brand-200" },
  maintenance:  { icon: <RefreshCw className="w-4 h-4" />, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  removal:      { icon: <Scissors className="w-4 h-4" />,  color: "text-red-700",     bg: "bg-red-50 border-red-200" },
  lash_lifting: { icon: <Sparkles className="w-4 h-4" />,  color: "text-amber-700",   bg: "bg-amber-50 border-amber-200" },
  permanent:    { icon: <Sparkles className="w-4 h-4" />,  color: "text-purple-700",  bg: "bg-purple-50 border-purple-200" },
};

interface LineItem {
  key: string;       // unique id for React key
  catalogId?: string; // set when originated from global catalog — prevents duplicates
  name: string;
  type: "add" | "deduct";
  amountInCents: number;
}

export default function AgendamentoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [apt, setApt] = useState<Appointment | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  // Preço base do procedimento (editável)
  const [customPriceStr, setCustomPriceStr] = useState("0");
  const [editingPrice, setEditingPrice] = useState(false);

  // Extra services como line items
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [showExtraPanel, setShowExtraPanel] = useState(false);
  const [catalogSelected, setCatalogSelected] = useState<string[]>([]);
  const [customName, setCustomName] = useState("");
  const [customAmtStr, setCustomAmtStr] = useState("");
  const [customType, setCustomType] = useState<"add" | "deduct">("add");

  // Pagamento
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [savingPayment, setSavingPayment] = useState(false);

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editProcedureId, setEditProcedureId] = useState("");
  const [editPriceStr, setEditPriceStr] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // WhatsApp
  const [reminderOpen, setReminderOpen] = useState(false);
  const { templates: apiTemplates } = useWhatsAppTemplates();
  const { user } = useAuth();
  const { services: extraCatalog } = useExtraServices();
  const { procedures } = useProcedures(true);
  const reminderTemplates = apiTemplates.length > 0 ? apiTemplates : REMINDER_TEMPLATES;

  useEffect(() => {
    async function load() {
      try {
        const a = await appointmentService.getAppointmentById(id);
        if (!a) return;
        setApt(a);
        setCustomPriceStr((a.priceCharged / 100).toFixed(2));
        const p = await paymentService.getPaymentByAppointmentId(a.id).catch(() => null);
        setPayment(p);
      } catch (err) {
        console.error("[agenda/detail]", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // ── Totais ──────────────────────────────────────────────────────────────────
  const basePrice = Math.round(parseFloat(customPriceStr.replace(",", ".") || "0") * 100);
  const totalAdds    = lineItems.filter((i) => i.type === "add").reduce((s, i) => s + i.amountInCents, 0);
  const totalDeducts = lineItems.filter((i) => i.type === "deduct").reduce((s, i) => s + i.amountInCents, 0);
  const total = Math.max(0, basePrice + totalAdds - totalDeducts);

  // ── Line item helpers ────────────────────────────────────────────────────────
  const addedCatalogIds = new Set(lineItems.map((i) => i.catalogId).filter(Boolean) as string[]);

  function toggleCatalogItem(id: string) {
    if (addedCatalogIds.has(id)) return; // já adicionado — bloqueia duplicata
    setCatalogSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function addCatalogSelected() {
    const toAdd = extraCatalog.filter((s) => catalogSelected.includes(s.id) && !addedCatalogIds.has(s.id));
    setLineItems((prev) => [
      ...prev,
      ...toAdd.map((s) => ({ key: `${s.id}-${Date.now()}`, catalogId: s.id, name: s.name, type: s.type, amountInCents: s.defaultAmountInCents })),
    ]);
    setCatalogSelected([]);
    setShowExtraPanel(false);
  }

  function addCustom() {
    const amt = Math.round(parseFloat(customAmtStr.replace(",", ".") || "0") * 100);
    if (!customName.trim() || amt <= 0) return;
    setLineItems((prev) => [
      ...prev,
      { key: `custom-${Date.now()}`, name: customName.trim(), type: customType, amountInCents: amt },
    ]);
    setCustomName("");
    setCustomAmtStr("");
    setShowExtraPanel(false);
  }

  function removeLineItem(key: string) {
    setLineItems((prev) => prev.filter((i) => i.key !== key));
  }

  // ── Status helpers ───────────────────────────────────────────────────────────
  const isActive   = apt ? !["completed", "cancelled", "no_show"].includes(apt.status) : false;
  const canApprove = apt?.status === "pending_approval";

  const updateStatus = async (status: AppointmentStatus, reason?: string) => {
    if (!apt) return;
    const updated = await appointmentService.updateAppointmentStatus(apt.id, status, reason);
    setApt(updated);
    toast({ title: "Status atualizado!", variant: "success" });
  };

  const cancel = async () => {
    if (!apt) return;
    await appointmentService.cancelAppointment(apt.id, "Cancelado pela profissional", "professional");
    toast({ title: "Agendamento cancelado", variant: "destructive" });
    window.history.back();
  };

  // ── Edit mode ────────────────────────────────────────────────────────────────
  function enterEditMode() {
    if (!apt) return;
    const d = apt.scheduledAt instanceof Date ? apt.scheduledAt : new Date(apt.scheduledAt as unknown as string);
    const pad = (n: number) => String(n).padStart(2, "0");
    setEditDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
    setEditTime(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
    setEditNotes(apt.notes ?? "");
    setEditProcedureId(apt.procedureId);
    setEditPriceStr((apt.priceCharged / 100).toFixed(2));
    setEditMode(true);
  }

  const saveEdit = async () => {
    if (!apt || !editDate || !editTime) return;
    setSavingEdit(true);
    try {
      const priceCharged = Math.round(parseFloat(editPriceStr.replace(",", ".") || "0") * 100);
      const scheduledAt = toBackendDate(editDate, editTime);
      const selected = procedures.find((p) => p.id === editProcedureId);
      const procedureChanged = editProcedureId !== apt.procedureId;

      const input: UpdateAppointmentInput = {
        procedureId: editProcedureId,
        scheduledAt,
        priceCharged,
        notes: editNotes || "",
      };
      if (procedureChanged) {
        input.durationMinutes = selected?.durationMinutes;
        input.procedureName = ""; // clear multi-procedure override
      }

      const updated = await appointmentService.updateAppointment(apt.id, input);
      setApt(updated);
      setCustomPriceStr((updated.priceCharged / 100).toFixed(2));
      setEditMode(false);
      toast({ title: "Agendamento atualizado!", variant: "success" });
    } catch (err) {
      toast({ title: err instanceof Error && err.message ? err.message : "Erro ao salvar", variant: "destructive" });
    } finally {
      setSavingEdit(false);
    }
  };

  // ── Confirmar pagamento ──────────────────────────────────────────────────────
  const confirmPayment = async () => {
    if (!apt || !paymentMethod) return;
    setSavingPayment(true);
    try {
      if (apt.status !== "completed") {
        // Backend requires: confirmed → in_progress → completed
        let current = apt;
        if (current.status === "confirmed") {
          current = await appointmentService.updateAppointmentStatus(apt.id, "in_progress");
        }
        const updated = await appointmentService.updateAppointmentStatus(current.id, "completed");
        setApt(updated);
      }
      const newPayment = await paymentService.createPayment({
        appointmentId: apt.id,
        clientId: apt.clientId,
        subtotalAmountInCents: basePrice,
        discountAmountInCents: totalDeducts,
        feeAmountInCents: totalAdds,
        totalAmountInCents: total,
        method: paymentMethod as PaymentMethod,
      });
      const paid = await paymentService.updatePayment(newPayment.id, {
        status: "paid",
        paidAmountInCents: total,
        paidAt: new Date(),
        method: paymentMethod as PaymentMethod,
      });
      setPayment(paid);
      toast({ title: "Pagamento confirmado!", variant: "success" });
    } catch {
      const existing = await paymentService.getPaymentByAppointmentId(apt.id).catch(() => null);
      if (existing) setPayment(existing);
      else toast({ title: "Erro ao registrar pagamento", variant: "destructive" });
    } finally {
      setSavingPayment(false);
    }
  };

  if (loading) return <LoadingPage />;
  if (!apt) return <div className="p-6 text-sm text-muted-foreground">Agendamento não encontrado.</div>;

  const svcCfg = apt.serviceType ? SERVICE_CONFIG[apt.serviceType] : null;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-receipt { display: block !important; }
        }
        .print-receipt { display: none; }
      `}</style>

      <div className="pb-32 sm:pb-6 no-print">
        <Topbar title="Agendamento" />

        <div className="p-4 sm:p-5 animate-fade-in space-y-3 max-w-lg mx-auto">

          {/* ── Header ── */}
          <div className="flex items-center gap-3">
            <Link href="/agenda">
              <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-brand-50 transition-colors">
                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
              </button>
            </Link>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{apt.clientName ?? "Cliente"}</p>
              <p className="text-xs text-muted-foreground">{formatDateTime(apt.scheduledAt)}</p>
            </div>
            {isActive && !editMode && (
              <button
                onClick={enterEditMode}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-brand-50 transition-colors flex-shrink-0"
                title="Editar agendamento"
              >
                <Edit2 className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
            <AppointmentStatusBadge status={apt.status} />
          </div>

          {/* ── Cliente ── */}
          <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {(apt.clientName ?? "?").charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/clientes/${apt.clientId}`} className="text-sm font-semibold hover:text-brand-600 transition-colors">
                  {apt.clientName ?? "—"}
                </Link>
                {apt.clientPhone && <p className="text-xs text-muted-foreground">{apt.clientPhone}</p>}
              </div>
              <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </div>

            {apt.clientPhone && apt.status !== "cancelled" && (
              <div className="relative">
                <button
                  onClick={() => setReminderOpen((o) => !o)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-green-200 text-green-700 text-sm font-medium hover:bg-green-50 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Lembrete WhatsApp
                  <ChevronDown className={`w-3.5 h-3.5 ml-auto transition-transform ${reminderOpen ? "rotate-180" : ""}`} />
                </button>
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
                        <a key={tpl.id} href={url} target="_blank" rel="noopener noreferrer"
                          onClick={() => setReminderOpen(false)}
                          className="flex flex-col px-4 py-3 hover:bg-green-50 transition-colors border-b last:border-0 border-brand-50">
                          <span className="text-sm font-medium">{tpl.name}</span>
                          <span className="text-xs text-muted-foreground mt-0.5">{tpl.description}</span>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Procedimento ── */}
          {editMode ? (
            <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-4 space-y-3">
              <p className="text-sm font-semibold text-brand-700">Procedimento</p>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {procedures.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setEditProcedureId(p.id);
                      setEditPriceStr((p.priceInCents / 100).toFixed(2));
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                      editProcedureId === p.id
                        ? "border-brand-500 bg-brand-50"
                        : "border-brand-50 bg-white hover:border-brand-200"
                    }`}
                  >
                    {editProcedureId === p.id && (
                      <Check className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold leading-tight ${editProcedureId === p.id ? "text-brand-700" : ""}`}>
                        {p.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{p.durationMinutes} min</p>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600 flex-shrink-0">
                      {formatCurrency(p.priceInCents)}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-brand-50">
                <span className="text-xs text-muted-foreground">Valor cobrado:</span>
                <span className="text-xs text-muted-foreground">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editPriceStr}
                  onChange={(e) => setEditPriceStr(e.target.value)}
                  className="flex-1 text-sm font-bold border-b-2 border-brand-400 outline-none bg-transparent text-brand-700"
                />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-brand-100 shadow-card overflow-hidden">
              {svcCfg && (
                <div className={`px-4 py-2.5 border-b flex items-center gap-2 ${svcCfg.bg}`}>
                  <span className={svcCfg.color}>{svcCfg.icon}</span>
                  <span className={`text-xs font-semibold ${svcCfg.color}`}>
                    {LASH_SERVICE_TYPE_LABELS[apt.serviceType!]}
                  </span>
                </div>
              )}
              <div className="p-4">
                <p className="font-semibold text-base leading-tight">{apt.procedureName ?? "—"}</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {apt.durationMinutes} min
                  </div>
                  {isActive ? (
                    editingPrice ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">R$</span>
                        <input
                          type="number" step="0.01" min="0"
                          className="w-24 text-right text-base font-bold border-b-2 border-brand-500 outline-none bg-transparent"
                          value={customPriceStr}
                          onChange={(e) => setCustomPriceStr(e.target.value)}
                          onBlur={() => setEditingPrice(false)}
                          autoFocus
                        />
                      </div>
                    ) : (
                      <button onClick={() => setEditingPrice(true)} className="flex items-center gap-1.5 group">
                        <span className="text-lg font-bold text-emerald-600">{formatCurrency(basePrice)}</span>
                        <Edit2 className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    )
                  ) : (
                    <span className="text-lg font-bold text-emerald-600">{formatCurrency(apt.priceCharged)}</span>
                  )}
                </div>
                {isActive && basePrice !== apt.priceCharged && (
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    Preço original: {formatCurrency(apt.priceCharged)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Data e Hora ── */}
          {editMode ? (
            <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-4 space-y-3">
              <p className="text-sm font-semibold text-brand-700 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Data e Hora
              </p>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Data</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Horário</label>
                <input
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-brand-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold">{formatDateTime(apt.scheduledAt)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatTime(apt.scheduledAt)} — {formatTime(apt.endsAt)} · {apt.durationMinutes} min
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Aprovação pendente ── */}
          {canApprove && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-semibold text-amber-800">Aguardando sua aprovação</p>
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 h-11 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm transition-colors"
                  onClick={() => updateStatus("confirmed")}>
                  <CheckCircle2 className="w-4 h-4" /> Aprovar
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 h-11 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-semibold text-sm transition-colors"
                  onClick={cancel}>
                  <XCircle className="w-4 h-4" /> Recusar
                </button>
              </div>
            </div>
          )}

          {/* ── Pagamento já registrado ── */}
          {payment && (
            <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-semibold text-emerald-700">Pagamento confirmado</span>
              </div>

              {/* Breakdown se tiver desconto ou taxa */}
              {(payment.discountAmountInCents > 0 || payment.feeAmountInCents > 0) && (
                <div className="bg-brand-50 rounded-xl p-3 mb-3 space-y-1.5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatCurrency(payment.subtotalAmountInCents || payment.totalAmountInCents)}</span>
                  </div>
                  {payment.feeAmountInCents > 0 && (
                    <div className="flex justify-between text-amber-600">
                      <span>Taxas / extras</span>
                      <span>+ {formatCurrency(payment.feeAmountInCents)}</span>
                    </div>
                  )}
                  {payment.discountAmountInCents > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Descontos</span>
                      <span>− {formatCurrency(payment.discountAmountInCents)}</span>
                    </div>
                  )}
                  <div className="border-t border-brand-100 pt-1.5 flex justify-between font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(payment.totalAmountInCents)}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 bg-brand-50 rounded-xl text-center">
                  <p className="text-xs text-muted-foreground mb-1">Total</p>
                  <p className="font-bold text-sm">{formatCurrency(payment.paidAmountInCents)}</p>
                </div>
                <div className="p-3 bg-brand-50 rounded-xl text-center">
                  <p className="text-xs text-muted-foreground mb-1">Método</p>
                  <p className="font-semibold text-xs">{payment.method ? PAYMENT_METHOD_LABELS[payment.method] : "—"}</p>
                </div>
                <div className="p-3 bg-brand-50 rounded-xl text-center">
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <PaymentStatusBadge status={payment.status} />
                </div>
              </div>
              <button
                onClick={() => window.print()}
                className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-brand-200 text-brand-700 text-sm font-medium hover:bg-brand-50 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Extrato PDF
              </button>
            </div>
          )}

          {/* ── Serviços adicionais + Pagamento ── */}
          {isActive && !canApprove && !payment && !editMode && (
            <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-4 space-y-4">

              {/* Header catálogo */}
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Tag className="w-4 h-4 text-brand-500" />
                  Taxas & Descontos
                </p>
                <Link href="/configuracoes/servicos" className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 transition-colors">
                  <Settings className="w-3 h-3" /> Gerenciar
                </Link>
              </div>

              {/* Catálogo global — sempre visível */}
              {extraCatalog.length === 0 ? (
                <Link
                  href="/configuracoes/servicos"
                  className="flex flex-col items-center gap-1 py-4 rounded-xl border border-dashed border-brand-200 text-center hover:bg-brand-50 transition-colors"
                >
                  <Tag className="w-5 h-5 text-brand-400" />
                  <span className="text-xs font-medium text-brand-600">Criar catálogo de serviços</span>
                  <span className="text-xs text-muted-foreground">Taxa de cartão, desconto fidelidade...</span>
                </Link>
              ) : (
                <div className="space-y-1.5">
                  {extraCatalog.map((svc) => {
                    const alreadyAdded = addedCatalogIds.has(svc.id);
                    const checked = catalogSelected.includes(svc.id);
                    return (
                      <button
                        key={svc.id}
                        type="button"
                        onClick={() => toggleCatalogItem(svc.id)}
                        disabled={alreadyAdded}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
                          alreadyAdded
                            ? "bg-gray-50 border-gray-100 opacity-50 cursor-not-allowed"
                            : checked
                            ? "bg-brand-50 border-brand-400"
                            : "bg-white border-brand-100 hover:border-brand-200"
                        }`}
                      >
                        <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          alreadyAdded ? "bg-gray-300 border-gray-300" : checked ? "bg-brand-500 border-brand-500" : "border-input"
                        }`}>
                          {(checked || alreadyAdded) && <Check className="w-2.5 h-2.5 text-white" />}
                        </span>
                        <span className={`text-xs font-bold flex-shrink-0 ${svc.type === "add" ? "text-amber-500" : "text-red-500"}`}>
                          {svc.type === "add" ? "+" : "−"}
                        </span>
                        <span className="flex-1 text-sm text-left">{svc.name}</span>
                        {alreadyAdded
                          ? <span className="text-xs text-muted-foreground flex-shrink-0">adicionado</span>
                          : <span className="text-sm font-semibold flex-shrink-0 text-muted-foreground">{formatCurrency(svc.defaultAmountInCents)}</span>
                        }
                      </button>
                    );
                  })}
                  {catalogSelected.length > 0 && (
                    <button
                      type="button"
                      onClick={addCatalogSelected}
                      className="w-full h-10 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold transition-colors"
                    >
                      Adicionar {catalogSelected.length} selecionado{catalogSelected.length > 1 ? "s" : ""}
                    </button>
                  )}
                </div>
              )}

              {/* Line items já adicionados */}
              {lineItems.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Adicionados</p>
                  {lineItems.map((item) => (
                    <div key={item.key} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-50">
                      <span className={`font-bold text-xs flex-shrink-0 ${item.type === "add" ? "text-amber-500" : "text-red-500"}`}>
                        {item.type === "add" ? "+" : "−"}
                      </span>
                      <span className="text-sm flex-1 min-w-0 truncate">{item.name}</span>
                      <span className={`text-sm font-semibold flex-shrink-0 ${item.type === "add" ? "text-amber-600" : "text-red-600"}`}>
                        {formatCurrency(item.amountInCents)}
                      </span>
                      <button onClick={() => removeLineItem(item.key)} className="text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Valor avulso (secundário) */}
              {!showExtraPanel ? (
                <button
                  onClick={() => setShowExtraPanel(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-brand-200 text-xs text-muted-foreground hover:text-brand-600 hover:border-brand-300 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Valor avulso
                </button>
              ) : (
                <div className="space-y-2 p-3 bg-brand-50 rounded-xl border border-brand-100">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-brand-700">Valor avulso</p>
                    <button onClick={() => setShowExtraPanel(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <Input
                    placeholder="Nome do serviço"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="h-9 text-sm"
                  />
                  <div className="flex rounded-xl border border-input overflow-hidden h-9">
                    <button
                      onClick={() => setCustomType("add")}
                      className={`flex-1 flex items-center justify-center gap-1 text-xs font-semibold transition-colors ${customType === "add" ? "bg-amber-100 text-amber-700" : "bg-white text-muted-foreground hover:bg-gray-50"}`}
                    >
                      <Plus className="w-3 h-3" /> Taxa
                    </button>
                    <button
                      onClick={() => setCustomType("deduct")}
                      className={`flex-1 flex items-center justify-center gap-1 text-xs font-semibold border-l transition-colors ${customType === "deduct" ? "bg-red-100 text-red-700" : "bg-white text-muted-foreground hover:bg-gray-50"}`}
                    >
                      <Minus className="w-3 h-3" /> Desconto
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">R$</span>
                    <Input
                      type="number" step="0.01" min="0"
                      placeholder="0,00"
                      value={customAmtStr}
                      onChange={(e) => setCustomAmtStr(e.target.value)}
                      className="h-9 text-sm pl-8"
                    />
                  </div>
                  <button
                    onClick={addCustom}
                    disabled={!customName.trim() || !customAmtStr}
                    className="w-full h-9 bg-brand-500 text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-brand-600 transition-colors"
                  >
                    Adicionar
                  </button>
                </div>
              )}

              {/* Forma de pagamento */}
              <div>
                <p className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <DollarSign className="w-4 h-4 text-brand-500" />
                  Forma de Pagamento
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        paymentMethod === m
                          ? "bg-brand-500 border-brand-500 text-white shadow-sm"
                          : "bg-white border-brand-100 text-foreground hover:border-brand-300"
                      }`}
                    >
                      {PAYMENT_METHOD_LABELS[m]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Breakdown final */}
              <div className="space-y-1.5 pt-1 border-t border-brand-50">
                {lineItems.length > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Subtotal (procedimento)</span>
                      <span>{formatCurrency(basePrice)}</span>
                    </div>
                    {lineItems.map((item) => (
                      <div key={item.key} className={`flex justify-between text-sm ${item.type === "add" ? "text-amber-600" : "text-red-600"}`}>
                        <span>{item.name}</span>
                        <span>{item.type === "add" ? "+" : "−"} {formatCurrency(item.amountInCents)}</span>
                      </div>
                    ))}
                    <div className="h-px bg-brand-100" />
                  </>
                )}
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span className="text-emerald-600">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Edit mode: notas + salvar ── */}
          {editMode && (
            <>
              <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-4">
                <p className="text-sm font-semibold text-brand-700 mb-2">Observações</p>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  placeholder="Observações sobre o atendimento..."
                  className="w-full px-3 py-2 rounded-xl border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>
              <button
                onClick={saveEdit}
                disabled={savingEdit || !editDate || !editTime || !editProcedureId}
                className="w-full h-12 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white rounded-2xl font-semibold text-sm transition-colors"
              >
                {savingEdit ? "Salvando..." : "Salvar Alterações"}
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="w-full flex items-center justify-center py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar edição
              </button>
            </>
          )}

          {/* ── Cancelar ── */}
          {isActive && !canApprove && !editMode && (
            <button
              onClick={cancel}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Cancelar Agendamento
            </button>
          )}

          {/* ── Confirmar Pagamento (inline, abaixo do cancelar) ── */}
          {isActive && !canApprove && !payment && !editMode && (
            <button
              onClick={confirmPayment}
              disabled={!paymentMethod || savingPayment}
              className="w-full h-14 flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-semibold text-base shadow-lg shadow-brand-500/30 transition-all no-print"
            >
              <CheckCircle2 className="w-5 h-5" />
              {savingPayment
                ? "Confirmando..."
                : paymentMethod
                ? `Confirmar Pagamento · ${formatCurrency(total)}`
                : "Selecione a forma de pagamento"}
            </button>
          )}
        </div>
      </div>

      {/* ── Extrato para impressão ── */}
      <div className="print-receipt p-8 max-w-xs mx-auto font-sans">
        <h1 className="text-xl font-bold text-center">{user?.salonName ?? "LashFlow"}</h1>
        {user?.salonAddress && (
          <p className="text-xs text-center text-gray-500 mt-1 mb-6">{user.salonAddress}</p>
        )}
        <div className="border-t border-gray-300 mb-4" />
        <h2 className="text-sm font-bold mb-3 uppercase tracking-wide text-gray-600">Extrato do Atendimento</h2>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Cliente</span>
            <span className="font-medium">{apt.clientName ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Data</span>
            <span className="font-medium">{formatDateTime(apt.scheduledAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Horário</span>
            <span className="font-medium">{formatTime(apt.scheduledAt)} — {formatTime(apt.endsAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Procedimento</span>
            <span className="font-medium">{apt.procedureName ?? "—"}</span>
          </div>
          {apt.serviceType && (
            <div className="flex justify-between">
              <span className="text-gray-500">Tipo</span>
              <span className="font-medium">{LASH_SERVICE_TYPE_LABELS[apt.serviceType]}</span>
            </div>
          )}
        </div>

        <div className="border-t border-gray-300 my-4" />

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Procedimento</span>
            <span>{formatCurrency(payment?.subtotalAmountInCents || payment?.totalAmountInCents || apt.priceCharged)}</span>
          </div>
          {payment && payment.feeAmountInCents > 0 && (
            <div className="flex justify-between text-amber-600">
              <span>Taxas / extras</span>
              <span>+ {formatCurrency(payment.feeAmountInCents)}</span>
            </div>
          )}
          {payment && payment.discountAmountInCents > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Descontos</span>
              <span>− {formatCurrency(payment.discountAmountInCents)}</span>
            </div>
          )}
          {payment?.method && (
            <div className="flex justify-between">
              <span className="text-gray-500">Forma de pgto.</span>
              <span>{PAYMENT_METHOD_LABELS[payment.method]}</span>
            </div>
          )}
          <div className="border-t border-gray-300 my-1" />
          <div className="flex justify-between font-bold text-base">
            <span>Total pago</span>
            <span>{formatCurrency(payment?.paidAmountInCents ?? apt.priceCharged)}</span>
          </div>
        </div>

        <div className="border-t border-gray-300 mt-6 pt-4 text-center">
          <p className="text-xs text-gray-400">Obrigada pela preferência! 💜</p>
        </div>
      </div>
    </>
  );
}
