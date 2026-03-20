"use client";

import { addDays, differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Appointment } from "@/domain/entities";
import type { LashServiceType } from "@/domain/enums";
import { AlertTriangle, CheckCircle2, Clock, RefreshCw, Circle, Scissors, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const DEFAULT_CYCLE_DAYS = 15;

// ─── Types ───────────────────────────────────────────────────────────────────

export type StepState = "done" | "active" | "next" | "upcoming" | "overdue";

interface FlowStep {
  key: "application" | "m1" | "m2" | "new_app" | "removal";
  label: string;
  state: StepState;
  date?: Date;       // confirmed/completed date
  projected?: Date;  // estimated from cycle
}

export interface CycleResult {
  steps: FlowStep[];
  nextSuggestedService?: LashServiceType;
  needsRemoval: boolean;
  summary: "no_data" | "ok" | "overdue" | "complete";
}

// ─── Core logic ───────────────────────────────────────────────────────────────
export function computeCycle(appointments: Appointment[], maxGapDays = DEFAULT_CYCLE_DAYS): CycleResult {
  const today = new Date();

  // All non-cancelled appointments that have a service type, sorted ASC
  const relevant = appointments
    .filter(
      (a) =>
        a.serviceType &&
        !["cancelled", "no_show"].includes(a.status)
    )
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());

  if (relevant.length === 0) {
    return { steps: [], needsRemoval: false, summary: "no_data", nextSuggestedService: "application" };
  }

  // Find the most recent application (completed or upcoming)
  const lastApp = [...relevant].reverse().find((a) => a.serviceType === "application");

  if (!lastApp) {
    return { steps: [], needsRemoval: false, summary: "no_data", nextSuggestedService: "application" };
  }

  const appDate = lastApp.scheduledAt;
  const appDone = lastApp.status === "completed" || lastApp.status === "in_progress";

  // Maintenances after the last application, sorted ASC
  const maintenances = relevant
    .filter(
      (a) =>
        a.serviceType === "maintenance" &&
        a.scheduledAt.getTime() > appDate.getTime()
    )
    .slice(0, 2);

  const m1 = maintenances[0];
  const m2 = maintenances[1];

  // Projected dates from application
  const m1Proj = addDays(appDate, maxGapDays);
  const m2Proj = addDays(m1?.scheduledAt ?? m1Proj, maxGapDays);
  const newAppProj = addDays(m2?.scheduledAt ?? m2Proj, maxGapDays);

  // Removal check: last completed apt was more than maxGapDays ago
  const lastCompleted = [...relevant].reverse().find(
    (a) => a.status === "completed" || a.status === "in_progress"
  );
  const daysSinceLast = lastCompleted ? differenceInDays(today, lastCompleted.scheduledAt) : 0;
  const needsRemoval = !!lastCompleted && daysSinceLast > maxGapDays;

  if (needsRemoval) {
    // Check if removal already scheduled/done
    const removalApt = relevant.find(
      (a) => a.serviceType === "removal" && a.scheduledAt.getTime() > appDate.getTime()
    );
    const remState: StepState = removalApt
      ? removalApt.status === "completed" ? "done" : "active"
      : "overdue";

    const steps: FlowStep[] = [
      { key: "application", label: "Aplicação", state: "done", date: appDate },
      { key: "removal", label: "Remoção", state: remState, date: removalApt?.scheduledAt },
      { key: "new_app", label: "Nova Aplicação", state: remState === "done" ? "next" : "upcoming" },
    ];

    return {
      steps,
      needsRemoval: true,
      summary: "overdue",
      nextSuggestedService: remState === "done" ? "application" : "removal",
    };
  }

  // Build normal cycle steps
  function aptState(apt: Appointment | undefined, proj: Date): StepState {
    if (!apt) {
      // No appointment yet — is it the next thing to schedule?
      return "upcoming";
    }
    if (apt.status === "completed" || apt.status === "in_progress") return "done";
    return "active"; // confirmed or pending_approval
  }

  const m1State = aptState(m1, m1Proj);
  const m2State = m1State === "done" ? aptState(m2, m2Proj) : "upcoming";
  const newAppState: StepState = m2State === "done" ? "next" : "upcoming";

  // Determine the current/next step
  let nextSuggested: LashServiceType = "application";
  let summary: CycleResult["summary"] = "ok";

  if (!appDone) {
    nextSuggested = "application";
  } else if (m1State !== "done") {
    nextSuggested = "maintenance";
  } else if (m2State !== "done") {
    nextSuggested = "maintenance";
  } else {
    nextSuggested = "application";
    summary = "complete";
  }

  // Mark "next" step as "next" instead of "upcoming" for visual emphasis
  const steps: FlowStep[] = [
    {
      key: "application",
      label: "Aplicação",
      state: appDone ? "done" : "active",
      date: appDate,
    },
    {
      key: "m1",
      label: "1ª Manutenção",
      state: m1State === "upcoming" && appDone ? "next" : m1State,
      date: m1?.scheduledAt,
      projected: !m1 ? m1Proj : undefined,
    },
    {
      key: "m2",
      label: "2ª Manutenção",
      state: m2State === "upcoming" && m1State === "done" ? "next" : m2State,
      date: m2?.scheduledAt,
      projected: !m2 ? m2Proj : undefined,
    },
    {
      key: "new_app",
      label: "Nova Aplicação",
      state: newAppState,
      projected: newAppProj,
    },
  ];

  return { steps, needsRemoval: false, summary, nextSuggestedService: nextSuggested };
}

// ─── Visual config ────────────────────────────────────────────────────────────
const STATE_CONFIG: Record<StepState, { dot: string; text: string; line: string }> = {
  done:     { dot: "bg-emerald-500 text-white",                               text: "text-foreground",            line: "bg-emerald-200" },
  active:   { dot: "bg-brand-500 text-white ring-4 ring-brand-100",           text: "text-brand-700 font-semibold", line: "bg-brand-200" },
  next:     { dot: "bg-brand-100 text-brand-600 ring-2 ring-brand-300",       text: "text-brand-700 font-medium",  line: "bg-brand-100" },
  upcoming: { dot: "bg-white text-brand-200 border-2 border-brand-100",       text: "text-muted-foreground",       line: "bg-brand-50" },
  overdue:  { dot: "bg-red-500 text-white ring-4 ring-red-100",               text: "text-red-700 font-semibold",  line: "bg-red-200" },
};

const KEY_ICONS: Record<FlowStep["key"], React.ReactNode> = {
  application: <Sparkles className="w-3.5 h-3.5" />,
  m1:          <RefreshCw className="w-3.5 h-3.5" />,
  m2:          <RefreshCw className="w-3.5 h-3.5" />,
  new_app:     <Sparkles className="w-3.5 h-3.5" />,
  removal:     <Scissors className="w-3.5 h-3.5" />,
};

const ACTIVE_ICONS: Record<StepState, React.ReactNode> = {
  done:     <CheckCircle2 className="w-3.5 h-3.5" />,
  active:   <Clock className="w-3.5 h-3.5" />,
  next:     <Clock className="w-3.5 h-3.5" />,
  upcoming: <Circle className="w-3.5 h-3.5" />,
  overdue:  <AlertTriangle className="w-3.5 h-3.5" />,
};

function fmtDate(d: Date) { return format(d, "dd/MM", { locale: ptBR }); }

function DayNote({ step }: { step: FlowStep }) {
  const today = new Date();
  const ref = step.date ?? step.projected;
  if (!ref) return null;
  const delta = differenceInDays(ref, today);
  const isProj = !step.date;

  if (step.state === "done") {
    const abs = Math.abs(delta);
    return <span className="text-xs text-muted-foreground">{abs === 0 ? "hoje" : `há ${abs}d`}</span>;
  }
  if (step.state === "active") {
    if (delta === 0) return <span className="text-xs text-brand-600 font-medium">hoje</span>;
    if (delta < 0) return <span className="text-xs text-brand-600">há {Math.abs(delta)}d</span>;
    return <span className="text-xs text-brand-600">em {delta}d</span>;
  }
  if (step.state === "overdue") {
    return <span className="text-xs text-red-600 font-medium">{Math.abs(delta)}d atrasada</span>;
  }
  if ((step.state === "next" || step.state === "upcoming") && isProj) {
    if (delta <= 0) return <span className="text-xs text-amber-600">prazo passando</span>;
    return <span className="text-xs text-brand-500">~{delta}d</span>;
  }
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function LashFlowStatus({ appointments }: { appointments: Appointment[] }) {
  const { user } = useAuth();
  const maxGapDays = user?.maintenanceCycleDays ?? DEFAULT_CYCLE_DAYS;
  const cycle = computeCycle(appointments, maxGapDays);

  if (cycle.summary === "no_data" || cycle.steps.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-5">
        <h3 className="font-semibold text-sm mb-2 flex items-center gap-2 text-brand-700">
          <RefreshCw className="w-4 h-4" /> Fluxo de Atendimento
        </h3>
        <p className="text-xs text-muted-foreground">
          O ciclo inicia com a primeira <strong>Aplicação</strong> registrada com tipo de serviço.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-5">
      <h3 className="font-semibold text-sm mb-5 flex items-center gap-2 text-brand-700">
        <RefreshCw className="w-4 h-4" />
        Fluxo de Atendimento
      </h3>

      <div>
        {cycle.steps.map((step, i) => {
          const isLast = i === cycle.steps.length - 1;
          const cfg = STATE_CONFIG[step.state];
          const displayDate = step.date ?? step.projected;
          const isProjected = !step.date && !!step.projected;

          return (
            <div key={step.key} className="flex gap-3">
              {/* Dot + connector */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${cfg.dot}`}>
                  {step.state === "upcoming" ? KEY_ICONS[step.key] : ACTIVE_ICONS[step.state]}
                </div>
                {!isLast && <div className={`w-0.5 flex-1 min-h-[20px] my-0.5 ${cfg.line}`} />}
              </div>

              {/* Content */}
              <div className={`flex-1 pt-1 ${isLast ? "" : "pb-4"}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className={`text-sm leading-tight ${cfg.text}`}>{step.label}</p>
                    {displayDate && (
                      <p className="text-xs mt-0.5">
                        {isProjected && <span className="text-brand-300">previsão </span>}
                        <span className={isProjected ? "text-brand-500 font-medium" : "text-muted-foreground font-medium"}>
                          {fmtDate(displayDate)}
                        </span>
                      </p>
                    )}
                  </div>
                  <DayNote step={step} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer banner */}
      <div className="mt-4 pt-3 border-t border-brand-50">
        {cycle.needsRemoval && (
          <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl border border-red-200">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">
              <strong>Remoção necessária.</strong> Intervalo superior a {maxGapDays} dias. Agende remoção (R$30) antes de nova aplicação.
            </p>
          </div>
        )}
        {!cycle.needsRemoval && cycle.summary === "ok" && (
          <p className="text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl">
            Ciclo em dia — agende a próxima manutenção em até {maxGapDays} dias.
          </p>
        )}
        {!cycle.needsRemoval && cycle.summary === "complete" && (
          <p className="text-xs text-brand-700 bg-brand-50 px-3 py-2 rounded-xl">
            Ciclo completo — hora de agendar a nova aplicação!
          </p>
        )}
      </div>
    </div>
  );
}
