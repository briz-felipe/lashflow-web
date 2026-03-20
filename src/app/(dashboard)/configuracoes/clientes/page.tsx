"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { useSettings } from "@/hooks/useSettings";
import { useAuth } from "@/hooks/useAuth";
import { integrationsService } from "@/services/api/ApiIntegrationsService";
import { Users, RefreshCw } from "lucide-react";

const CYCLE_PRESETS = [15, 20, 21, 25];

export default function ClientesPage() {
  const [savingRules, setSavingRules] = useState(false);
  const [rulesEdits, setRulesEdits] = useState<Record<string, string>>({});

  const [savingCycle, setSavingCycle] = useState(false);
  const [cycleDaysInput, setCycleDaysInput] = useState<string | null>(null);

  const { segmentRules, loading, updateSegmentRules } = useSettings();
  const { user, reloadProfile } = useAuth();

  const currentCycleDays = user?.maintenanceCycleDays ?? 15;
  const displayCycleDays = cycleDaysInput !== null ? Number(cycleDaysInput) : currentCycleDays;

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

  const handleSaveCycle = async () => {
    const days = cycleDaysInput !== null ? Number(cycleDaysInput) : currentCycleDays;
    if (!days || days < 7 || days > 60) {
      toast({ title: "Valor inválido. Use entre 7 e 60 dias.", variant: "destructive" });
      return;
    }
    setSavingCycle(true);
    try {
      await integrationsService.updateProfile({ maintenanceCycleDays: days });
      await reloadProfile();
      setCycleDaysInput(null);
      toast({ title: `Ciclo atualizado para ${days} dias!`, variant: "success" });
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setSavingCycle(false);
    }
  };

  const isDirty = cycleDaysInput !== null && Number(cycleDaysInput) !== currentCycleDays;

  return (
    <div className="p-4 sm:p-6 animate-fade-in max-w-2xl space-y-5">

      {/* ── Ciclo de manutenção ── */}
      <div className="bg-white rounded-2xl border border-brand-100 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-brand-50 flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-50 flex-shrink-0">
            <RefreshCw className="w-4 h-4 text-brand-600" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Ciclo de Manutenção</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Prazo máximo entre atendimentos antes de indicar remoção
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {/* Presets rápidos */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Atalhos comuns</p>
            <div className="flex gap-2 flex-wrap">
              {CYCLE_PRESETS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setCycleDaysInput(String(d))}
                  className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
                    displayCycleDays === d
                      ? "bg-brand-500 border-brand-500 text-white"
                      : "bg-white border-brand-100 text-foreground hover:border-brand-300"
                  }`}
                >
                  {d} dias
                </button>
              ))}
            </div>
          </div>

          {/* Input customizado */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Ou defina manualmente</p>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={7}
                  max={60}
                  value={cycleDaysInput ?? currentCycleDays}
                  onChange={(e) => setCycleDaysInput(e.target.value)}
                  className="h-10 w-28 text-sm"
                />
                <span className="text-sm text-muted-foreground">dias</span>
              </div>
            </div>
            <Button
              onClick={handleSaveCycle}
              disabled={savingCycle || !isDirty}
              className="mt-5 h-10"
            >
              {savingCycle ? "Salvando..." : "Salvar"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground bg-brand-50 rounded-xl px-3 py-2">
            Atualmente: <strong>{currentCycleDays} dias</strong> — quando uma cliente ultrapassar esse prazo sem manutenção, o fluxo indicará remoção antes da próxima aplicação.
          </p>
        </div>
      </div>

      {/* ── Regras de segmentação ── */}
      <div className="bg-white rounded-2xl border border-brand-100 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-brand-50 flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-50 flex-shrink-0">
            <Users className="w-4 h-4 text-brand-600" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Regras de Segmentação</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Critérios para classificar clientes automaticamente
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-5">
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
                      onChange={(e) =>
                        setRulesEdits((p) => ({ ...p, vipMinAppointments: e.target.value }))
                      }
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Gasto mínimo (R$)</label>
                    <Input
                      type="number"
                      min={1}
                      value={getRuleValue("vipMinSpentCents")}
                      onChange={(e) =>
                        setRulesEdits((p) => ({ ...p, vipMinSpentCents: e.target.value }))
                      }
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
                      onChange={(e) =>
                        setRulesEdits((p) => ({ ...p, recorrenteMaxDays: e.target.value }))
                      }
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Visitas mínimas</label>
                    <Input
                      type="number"
                      min={1}
                      value={getRuleValue("recorrenteMinAppointments")}
                      onChange={(e) =>
                        setRulesEdits((p) => ({ ...p, recorrenteMinAppointments: e.target.value }))
                      }
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
                    onChange={(e) =>
                      setRulesEdits((p) => ({ ...p, inativaMinDays: e.target.value }))
                    }
                    className="h-9 text-sm max-w-[160px]"
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
  );
}
