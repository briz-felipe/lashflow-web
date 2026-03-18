"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { useSettings } from "@/hooks/useSettings";
import { Users } from "lucide-react";

export default function ClientesPage() {
  const [savingRules, setSavingRules] = useState(false);
  const [rulesEdits, setRulesEdits] = useState<Record<string, string>>({});

  const { segmentRules, loading, updateSegmentRules } = useSettings();

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
    <div className="p-4 sm:p-6 animate-fade-in max-w-2xl">
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
