"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toaster";
import { useSettings } from "@/hooks/useSettings";
import { Settings, Clock, Link2, Copy, Check, Trash2, Plus } from "lucide-react";

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const ALL_DAYS = [1, 2, 3, 4, 5, 6, 0];

export default function ConfiguracoesPage() {
  const [copied, setCopied] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newReason, setNewReason] = useState("");
  const [addingDate, setAddingDate] = useState(false);
  const [savingSlots, setSavingSlots] = useState(false);

  const publicLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/agendar`
      : "/agendar";

  const { timeSlots, blockedDates, loading, updateTimeSlots, addBlockedDate, removeBlockedDate } =
    useSettings();

  // Local editable state for time slots
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

  return (
    <div>
      <Topbar title="Configurações" />

      <div className="p-6 animate-fade-in space-y-6 max-w-3xl">
        <PageHeader
          title="Configurações"
          description="Gerencie sua agenda e link público de agendamento"
        />

        {/* Public link */}
        <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-brand-700">
            <Link2 className="w-4 h-4" />
            Link Público de Agendamento
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Compartilhe este link com suas clientes para que elas possam solicitar horários
            diretamente.
          </p>
          <div className="flex gap-3">
            <Input value={publicLink} readOnly className="flex-1 bg-brand-50 border-brand-200" />
            <Button variant="outline" onClick={copyLink}>
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copiado!" : "Copiar"}
            </Button>
          </div>
        </div>

        {/* Working hours */}
        <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-brand-700">
            <Clock className="w-4 h-4" />
            Horários de Atendimento
          </h2>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : (
            <div className="space-y-3">
              {ALL_DAYS.map((day) => {
                const v = getSlotValue(day);
                return (
                  <div
                    key={day}
                    className="flex items-center gap-4 p-3 rounded-xl border border-brand-50 hover:border-brand-200 transition-colors"
                  >
                    <span className="w-8 text-sm font-semibold text-center flex-shrink-0">
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
                      <div className="flex items-center gap-2 text-sm flex-1">
                        <Input
                          type="time"
                          value={v.startTime}
                          onChange={(e) => setSlotField(day, "startTime", e.target.value)}
                          className="w-28 h-8 text-sm"
                        />
                        <span className="text-muted-foreground">—</span>
                        <Input
                          type="time"
                          value={v.endTime}
                          onChange={(e) => setSlotField(day, "endTime", e.target.value)}
                          className="w-28 h-8 text-sm"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <Button
            className="mt-4"
            onClick={handleSaveSlots}
            disabled={savingSlots || loading}
          >
            {savingSlots ? "Salvando..." : "Salvar horários"}
          </Button>
        </div>

        {/* Blocked dates */}
        <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-brand-700">
            <Settings className="w-4 h-4" />
            Datas Bloqueadas
          </h2>

          <div className="flex gap-2 mb-4">
            <Input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-40"
            />
            <Input
              placeholder="Motivo (opcional)"
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={handleAddBlockedDate}
              disabled={!newDate || addingDate}
            >
              <Plus className="w-4 h-4" />
              Bloquear
            </Button>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : blockedDates.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma data bloqueada</p>
          ) : (
            <div className="space-y-2">
              {blockedDates.map((bd) => (
                <div
                  key={bd.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-red-50 bg-red-50/50"
                >
                  <div>
                    <p className="text-sm font-medium">{bd.date}</p>
                    {bd.reason && <p className="text-xs text-muted-foreground">{bd.reason}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">Bloqueado</Badge>
                    <button
                      onClick={() => handleRemoveBlockedDate(bd.id)}
                      className="text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
