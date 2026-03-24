"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Link2Off,
  Loader2,
  Plus,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/useAuth";
import { useCalendarSync } from "@/hooks/useCalendarSync";
import { integrationsService, AppleCalendarItem } from "@/services/api/ApiIntegrationsService";

type Step = "status" | "tutorial" | "credentials" | "calendar";

export function AppleCalendarSection() {
  const { user, reloadProfile } = useAuth();
  const [step, setStep] = useState<Step>("status");
  const [showTutorial, setShowTutorial] = useState(false);
  const [appleId, setAppleId] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [calendars, setCalendars] = useState<AppleCalendarItem[]>([]);
  const [loadingCalendars, setLoadingCalendars] = useState(false);
  const [newCalendarName, setNewCalendarName] = useState("");
  const [creatingCalendar, setCreatingCalendar] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const { syncAll, syncing, progress, percent } = useCalendarSync();

  const connected = user?.appleCalendarConnected ?? false;
  const calendarName = user?.appleCalendarName;

  const handleConnect = async () => {
    if (!appleId || !appPassword) return;
    setConnecting(true);
    try {
      await integrationsService.connectApple(appleId, appPassword);
      await reloadProfile();
      toast({ title: "Conta Apple conectada!", variant: "success" });
      setStep("calendar");
      loadCalendars();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Credenciais inválidas";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setConnecting(false);
    }
  };

  const loadCalendars = async () => {
    setLoadingCalendars(true);
    try {
      const list = await integrationsService.listAppleCalendars();
      setCalendars(list.filter((c) => c.writable));
    } catch {
      toast({ title: "Erro ao buscar calendários", variant: "destructive" });
    } finally {
      setLoadingCalendars(false);
    }
  };

  const handleSelectCalendar = async (name: string) => {
    try {
      await integrationsService.selectAppleCalendar(name);
      await reloadProfile();
      toast({ title: `Calendário "${name}" selecionado!`, variant: "success" });
      setStep("status");
    } catch {
      toast({ title: "Erro ao selecionar calendário", variant: "destructive" });
    }
  };

  const handleCreateCalendar = async () => {
    if (!newCalendarName.trim()) return;
    setCreatingCalendar(true);
    try {
      await integrationsService.createAppleCalendar(newCalendarName.trim());
      await reloadProfile();
      toast({ title: `Calendário "${newCalendarName}" criado!`, variant: "success" });
      setNewCalendarName("");
      setStep("status");
    } catch {
      toast({ title: "Erro ao criar calendário", variant: "destructive" });
    } finally {
      setCreatingCalendar(false);
    }
  };

  const handleSyncAll = async () => {
    const result = await syncAll();
    if (!result) return;
    if (result.synced === 0 && result.failed === 0) {
      toast({ title: "Todos os agendamentos já estão sincronizados!", variant: "success" });
    } else {
      toast({
        title: `${result.synced} agendamento${result.synced !== 1 ? "s" : ""} sincronizado${result.synced !== 1 ? "s" : ""}${result.failed > 0 ? `, ${result.failed} com erro` : ""}`,
        variant: result.failed > 0 ? "destructive" : "success",
      });
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await integrationsService.disconnectApple();
      await reloadProfile();
      toast({ title: "Conta Apple desconectada", variant: "success" });
      setAppleId("");
      setAppPassword("");
      setStep("status");
    } catch {
      toast({ title: "Erro ao desconectar", variant: "destructive" });
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-brand-100 shadow-card overflow-hidden">
      <div className="px-6 py-5 border-b border-brand-50 flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-900 overflow-hidden">
          <img src="/apple_logo.jpg" alt="Apple" className="w-6 h-6 object-contain" />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold text-foreground">Apple Calendar</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Sincronize agendamentos com seu iPhone, iPad ou Mac</p>
        </div>
        {connected && (
          <Badge variant="success" className="flex-shrink-0">Conectado</Badge>
        )}
      </div>

      <div className="p-4 sm:p-6 space-y-4">

        {/* ── Status: conectado ── */}
        {connected && step === "status" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-800">
                  {calendarName ? `Calendário: ${calendarName}` : "Conta conectada, sem calendário selecionado"}
                </p>
                <p className="text-xs text-green-600 mt-0.5">
                  Novos agendamentos confirmados serão sincronizados automaticamente
                </p>
              </div>
            </div>
            {syncing ? (
              <div className="space-y-2 p-3 bg-brand-50 rounded-xl border border-brand-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-brand-700">
                    Sincronizando... {progress.done}/{progress.total}
                  </span>
                  <span className="text-brand-500 font-bold">{percent}%</span>
                </div>
                <div className="w-full h-2 bg-brand-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                {progress.currentName && (
                  <p className="text-[11px] text-muted-foreground truncate">
                    {progress.currentName}
                  </p>
                )}
                {progress.failed > 0 && (
                  <p className="text-[11px] text-red-500">{progress.failed} com erro</p>
                )}
              </div>
            ) : (
              <Button
                size="sm"
                onClick={handleSyncAll}
                className="w-full"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Sincronizar toda a agenda
              </Button>
            )}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setStep("calendar"); loadCalendars(); }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Trocar calendário
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="text-red-500 hover:text-red-600 border-red-200 hover:border-red-300"
              >
                <Link2Off className="w-3.5 h-3.5" />
                {disconnecting ? "Desconectando..." : "Desconectar"}
              </Button>
            </div>
          </div>
        )}

        {/* ── Status: não conectado ── */}
        {!connected && step === "status" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Conecte sua conta Apple para que os agendamentos confirmados apareçam automaticamente no seu calendário.
            </p>
            <Button onClick={() => setStep("tutorial")} className="w-full sm:w-auto">
              Conectar conta Apple
            </Button>
          </div>
        )}

        {/* ── Tutorial ── */}
        {step === "tutorial" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
              <p className="text-sm font-semibold text-amber-800">Como gerar sua App-Specific Password</p>
              <p className="text-xs text-amber-700">
                O Apple Calendar usa <strong>CalDAV</strong> — você precisa de uma senha específica para apps,
                diferente da sua senha principal. É seguro e pode ser revogada a qualquer momento.
              </p>
              <ol className="text-xs text-amber-800 space-y-2 list-decimal list-inside">
                <li>
                  Acesse{" "}
                  <a
                    href="https://appleid.apple.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-medium inline-flex items-center gap-1"
                  >
                    appleid.apple.com <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>Faça login com seu Apple ID</li>
                <li>Vá em <strong>Login e Segurança</strong> → <strong>Senhas específicas para apps</strong></li>
                <li>Clique em <strong>+</strong> e dê um nome (ex: "LashFlow")</li>
                <li>Copie a senha gerada no formato <code className="bg-amber-100 px-1 rounded">xxxx-xxxx-xxxx-xxxx</code></li>
              </ol>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setStep("status")}>Voltar</Button>
              <Button size="sm" onClick={() => setStep("credentials")}>Tenho minha senha →</Button>
            </div>
          </div>
        )}

        {/* ── Credenciais ── */}
        {step === "credentials" && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Apple ID (seu e-mail iCloud)</label>
                <Input
                  type="email"
                  value={appleId}
                  onChange={(e) => setAppleId(e.target.value)}
                  placeholder="voce@icloud.com"
                  className="h-10"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">App-Specific Password</label>
                <Input
                  type="password"
                  value={appPassword}
                  onChange={(e) => setAppPassword(e.target.value)}
                  placeholder="xxxx-xxxx-xxxx-xxxx"
                  className="h-10"
                  autoComplete="one-time-code"
                />
                <p className="text-xs text-muted-foreground">
                  Gerada em appleid.apple.com — não é sua senha principal
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setStep("tutorial")}>Voltar</Button>
              <Button
                size="sm"
                onClick={handleConnect}
                disabled={connecting || !appleId || !appPassword}
              >
                {connecting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Verificando...</> : "Conectar"}
              </Button>
            </div>
          </div>
        )}

        {/* ── Escolher / criar calendário ── */}
        {step === "calendar" && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-foreground">Escolha ou crie um calendário</p>

            {loadingCalendars ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Carregando calendários...
              </div>
            ) : (
              <div className="space-y-2">
                {calendars.map((cal) => (
                  <button
                    key={cal.name}
                    onClick={() => handleSelectCalendar(cal.name)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors hover:border-brand-300 hover:bg-brand-50/40 ${
                      cal.name === calendarName ? "border-brand-400 bg-brand-50" : "border-brand-100"
                    }`}
                  >
                    <div className="w-3 h-3 rounded-full bg-brand-400 flex-shrink-0" />
                    <span className="text-sm font-medium">{cal.name}</span>
                    {cal.name === calendarName && (
                      <CheckCircle2 className="w-4 h-4 text-brand-600 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            )}

            <div className="border-t border-brand-50 pt-4">
              <p className="text-xs text-muted-foreground mb-2">Ou crie um novo calendário dedicado:</p>
              <div className="flex gap-2">
                <Input
                  value={newCalendarName}
                  onChange={(e) => setNewCalendarName(e.target.value)}
                  placeholder="Ex: Consultas Studio Bella"
                  className="h-9 text-sm"
                />
                <Button
                  size="sm"
                  onClick={handleCreateCalendar}
                  disabled={creatingCalendar || !newCalendarName.trim()}
                  className="flex-shrink-0"
                >
                  {creatingCalendar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Criar
                </Button>
              </div>
            </div>

            {connected && (
              <Button variant="outline" size="sm" onClick={() => setStep("status")}>
                Cancelar
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
