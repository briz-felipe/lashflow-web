"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toaster";
import { useSettings } from "@/hooks/useSettings";
import { Clock, Link2, Copy, Check, Trash2, Plus, CalendarOff, Users } from "lucide-react";
import { WhatsAppTemplatesSection } from "@/components/settings/WhatsAppTemplatesSection";
import { SalonProfileSection } from "@/components/settings/SalonProfileSection";
import { AppleCalendarSection } from "@/components/settings/AppleCalendarSection";

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const ALL_DAYS: (0 | 1 | 2 | 3 | 4 | 5 | 6)[] = [1, 2, 3, 4, 5, 6, 0];

export default function ConfiguracoesPage() {
  const [copied, setCopied] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newReason, setNewReason] = useState("");
  const [addingDate, setAddingDate] = useState(false);
  const [savingSlots, setSavingSlots] = useState(false);
  const [savingRules, setSavingRules] = useState(false);
  const [rulesEdits, setRulesEdits] = useState<Record<string, string>>({});

  const [publicLink, setPublicLink] = useState("/agendar");
  useEffect(() => {
    setPublicLink(`${window.location.origin}/agendar`);
  }, []);

  const { timeSlots, blockedDates, segmentRules, loading, updateTimeSlots, addBlockedDate, removeBlockedDate, updateSegmentRules } =
    useSettings();

  const [slotEdits, setSlotEdits] = useState<
    Record<number, { isAvailable: boolean; startTime: string; endTime: string }>
  >({});

  const getSlotValue = (day: number) => {
    if (slotEdits[day] !== undefined) return slotEdits[day];
    const slot = timeSlots.find((s) => s.dayOfWeek === day);
    return slot
      ? { isAvailable: slot.isAvailable, startTime: slot.startTime, endTime: slot.endTime }
      : { isAvailable: false, startTime: "09:00", endTime: "18:00" };
  };

  const setSlotField = (day: number, field: string, value: string | boolean) => {
    setSlotEdits((prev) => ({
      ...prev,
      [day]: { ...getSlotValue(day), [field]: value },
    }));
  };

  const copyLink = () => {
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Link copiado!", variant: "success" });
  };

  const handleSaveSlots = async () => {
    setSavingSlots(true);
    try {
      const slots = ALL_DAYS.map((day) => {
        const v = getSlotValue(day);
        return { dayOfWeek: day, startTime: v.startTime, endTime: v.endTime, isAvailable: v.isAvailable };
      });
      await updateTimeSlots(slots);
      setSlotEdits({});
      toast({ title: "Horários salvos!", variant: "success" });
    } catch {
      toast({ title: "Erro ao salvar horários", variant: "destructive" });
    } finally {
      setSavingSlots(false);
    }
  };

  const handleAddBlockedDate = async () => {
    if (!newDate) return;
    setAddingDate(true);
    try {
      await addBlockedDate(newDate, newReason || undefined);
      setNewDate("");
      setNewReason("");
      toast({ title: "Data bloqueada!", variant: "success" });
    } catch {
      toast({ title: "Erro ao bloquear data", variant: "destructive" });
    } finally {
      setAddingDate(false);
    }
  };

  const handleRemoveBlockedDate = async (id: string) => {
    try {
      await removeBlockedDate(id);
      toast({ title: "Data desbloqueada", variant: "success" });
    } catch {
      toast({ title: "Erro ao remover data", variant: "destructive" });
    }
  };

  const getRuleValue = (key: string): number => {
    if (rulesEdits[key] !== undefined) return Number(rulesEdits[key]);
    const val = segmentRules[key as keyof typeof segmentRules];
    if (key === "vipMinSpentCents") return Math.round((val as number) / 100);
    return val as number;
  };

  const handleSaveRules = async () => {
    setSavingRules(true);
    try {
      const vipMinSpentDisplay = getRuleValue("vipMinSpentCents");
      await updateSegmentRules({
        vipMinAppointments: getRuleValue("vipMinAppointments"),
        vipMinSpentCents: vipMinSpentDisplay * 100,
        recorrenteMaxDays: getRuleValue("recorrenteMaxDays"),
        recorrenteMinAppointments: getRuleValue("recorrenteMinAppointments"),
        inativaMinDays: getRuleValue("inativaMinDays"),
      });
      setRulesEdits({});
      toast({ title: "Regras salvas!", variant: "success" });
    } catch {
      toast({ title: "Erro ao salvar regras", variant: "destructive" });
    } finally {
      setSavingRules(false);
    }
  };

  return (
    <div>
      <Topbar title="Configurações" />

      <div className="p-4 sm:p-6 animate-fade-in">
        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie sua agenda, link de agendamento e mensagens</p>
        </div>

        {/* Two-column grid on desktop */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">

          {/* ── Coluna esquerda: Horários ── */}
          <div className="space-y-6">

            {/* Working hours */}
            <div className="bg-white rounded-2xl border border-brand-100 shadow-card overflow-hidden">
              <div className="px-6 py-5 border-b border-brand-50 flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-50">
                  <Clock className="w-4 h-4 text-brand-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Horários de Atendimento</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Defina os dias e horários disponíveis para agendamento</p>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                {loading ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Carregando...</p>
                ) : (
                  <div className="space-y-2">
                    {ALL_DAYS.map((day) => {
                      const v = getSlotValue(day);
                      return (
                        <div
                          key={day}
                          className={`rounded-xl border transition-colors ${
                            v.isAvailable ? "border-brand-200 bg-brand-50/30" : "border-brand-50 bg-white"
                          }`}
                        >
                          {/* Day header row */}
                          <div className="flex items-center gap-3 px-4 py-3">
                            <span className={`w-10 text-sm font-bold flex-shrink-0 ${v.isAvailable ? "text-brand-700" : "text-muted-foreground"}`}>
                              {DAY_NAMES[day]}
                            </span>
                            <button
                              onClick={() => setSlotField(day, "isAvailable", !v.isAvailable)}
                              className="flex-shrink-0"
                            >
                              {v.isAvailable ? (
                                <Badge variant="success">Disponível</Badge>
                              ) : (
                                <Badge variant="muted">Fechado</Badge>
                              )}
                            </button>
                            {v.isAvailable && (
                              <div className="flex items-center gap-2 flex-1 justify-end">
                                <Input
                                  type="time"
                                  value={v.startTime}
                                  onChange={(e) => setSlotField(day, "startTime", e.target.value)}
                                  className="w-28 h-9 text-sm text-center"
                                />
                                <span className="text-muted-foreground text-xs flex-shrink-0">até</span>
                                <Input
                                  type="time"
                                  value={v.endTime}
                                  onChange={(e) => setSlotField(day, "endTime", e.target.value)}
                                  className="w-28 h-9 text-sm text-center"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <Button
                  className="mt-5 w-full sm:w-auto"
                  onClick={handleSaveSlots}
                  disabled={savingSlots || loading}
                >
                  {savingSlots ? "Salvando..." : "Salvar horários"}
                </Button>
              </div>
            </div>

            {/* WhatsApp Templates */}
            <WhatsAppTemplatesSection />

            {/* Segment Rules */}
            <div className="bg-white rounded-2xl border border-brand-100 shadow-card overflow-hidden">
              <div className="px-6 py-5 border-b border-brand-50 flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-50">
                  <Users className="w-4 h-4 text-brand-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Regras de Segmentação</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Critérios para classificar clientes automaticamente</p>
                </div>
              </div>
              <div className="p-4 sm:p-6 space-y-5">
                {loading ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Carregando...</p>
                ) : (
                  <>
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-brand-700 uppercase tracking-wide">VIP</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Mínimo de visitas</label>
                          <Input
                            type="number"
                            min={1}
                            value={getRuleValue("vipMinAppointments")}
                            onChange={(e) => setRulesEdits((p) => ({ ...p, vipMinAppointments: e.target.value }))}
                            className="h-9 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Gasto mínimo (R$)</label>
                          <Input
                            type="number"
                            min={1}
                            value={getRuleValue("vipMinSpentCents")}
                            onChange={(e) => setRulesEdits((p) => ({ ...p, vipMinSpentCents: e.target.value }))}
                            className="h-9 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-brand-700 uppercase tracking-wide">Recorrente</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Dias máx. entre visitas</label>
                          <Input
                            type="number"
                            min={1}
                            value={getRuleValue("recorrenteMaxDays")}
                            onChange={(e) => setRulesEdits((p) => ({ ...p, recorrenteMaxDays: e.target.value }))}
                            className="h-9 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Visitas mínimas</label>
                          <Input
                            type="number"
                            min={1}
                            value={getRuleValue("recorrenteMinAppointments")}
                            onChange={(e) => setRulesEdits((p) => ({ ...p, recorrenteMinAppointments: e.target.value }))}
                            className="h-9 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-brand-700 uppercase tracking-wide">Inativa</p>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Dias sem visita</label>
                        <Input
                          type="number"
                          min={1}
                          value={getRuleValue("inativaMinDays")}
                          onChange={(e) => setRulesEdits((p) => ({ ...p, inativaMinDays: e.target.value }))}
                          className="h-9 text-sm max-w-[140px]"
                        />
                      </div>
                    </div>

                    <Button
                      className="w-full sm:w-auto"
                      onClick={handleSaveRules}
                      disabled={savingRules}
                    >
                      {savingRules ? "Salvando..." : "Salvar regras"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── Coluna direita: Perfil + Apple Calendar + Link + Datas bloqueadas ── */}
          <div className="space-y-6">

            {/* Salon profile */}
            <SalonProfileSection />

            {/* Apple Calendar */}
            <AppleCalendarSection />

            {/* Public link */}
            <div className="bg-white rounded-2xl border border-brand-100 shadow-card overflow-hidden">
              <div className="px-6 py-5 border-b border-brand-50 flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-50">
                  <Link2 className="w-4 h-4 text-brand-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Link de Agendamento</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Compartilhe com suas clientes</p>
                </div>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Suas clientes podem solicitar horários diretamente por este link, sem precisar entrar em contato.
                </p>
                <div className="p-3 bg-brand-50 rounded-xl border border-brand-100 font-mono text-xs text-brand-700 break-all">
                  {publicLink}
                </div>
                <Button className="w-full" onClick={copyLink}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Link copiado!" : "Copiar link"}
                </Button>
              </div>
            </div>

            {/* Blocked dates */}
            <div className="bg-white rounded-2xl border border-brand-100 shadow-card overflow-hidden">
              <div className="px-6 py-5 border-b border-brand-50 flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50">
                  <CalendarOff className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Datas Bloqueadas</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Dias sem atendimento (férias, feriados…)</p>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-4">
                {/* Add form */}
                <div className="space-y-2">
                  <Input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full h-11"
                  />
                  <Input
                    placeholder="Motivo (opcional)"
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    className="w-full"
                  />
                  <Button
                    className="w-full"
                    onClick={handleAddBlockedDate}
                    disabled={!newDate || addingDate}
                  >
                    <Plus className="w-4 h-4" />
                    {addingDate ? "Bloqueando..." : "Bloquear data"}
                  </Button>
                </div>

                {/* List */}
                {loading ? (
                  <p className="text-sm text-muted-foreground text-center py-2">Carregando...</p>
                ) : blockedDates.length === 0 ? (
                  <div className="text-center py-6 text-sm text-muted-foreground border border-dashed border-brand-200 rounded-xl">
                    Nenhuma data bloqueada
                  </div>
                ) : (
                  <div className="space-y-2">
                    {blockedDates.map((bd) => (
                      <div
                        key={bd.id}
                        className="flex items-center gap-3 p-3 rounded-xl border border-red-100 bg-red-50/40"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-red-700">{bd.date}</p>
                          {bd.reason && <p className="text-xs text-muted-foreground mt-0.5 truncate">{bd.reason}</p>}
                        </div>
                        <button
                          onClick={() => handleRemoveBlockedDate(bd.id)}
                          className="flex-shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-100 transition-colors"
                          title="Remover"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
