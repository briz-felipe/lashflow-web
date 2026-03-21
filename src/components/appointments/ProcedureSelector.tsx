"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, Plus, Search, X } from "lucide-react";

import type { Procedure } from "@/domain/entities";
import { centsToInput, formatCurrency, parsePtBR } from "@/lib/formatters";

export interface SelectedProcedure {
  procedureId: string;
  name: string;
  durationMinutes: number;
  priceStr: string; // pt-BR format, e.g. "150,00"
}

export function procedureFromRaw(proc: Procedure): SelectedProcedure {
  return {
    procedureId: proc.id,
    name: proc.name,
    durationMinutes: proc.durationMinutes,
    priceStr: centsToInput(proc.priceInCents),
  };
}

export function totalCents(selected: SelectedProcedure[]): number {
  return selected.reduce((s, p) => s + parsePtBR(p.priceStr), 0);
}

export function totalDuration(selected: SelectedProcedure[]): number {
  return selected.reduce((s, p) => s + p.durationMinutes, 0);
}

interface Props {
  procedures: Procedure[];
  selected: SelectedProcedure[];
  onChange: (procedures: SelectedProcedure[]) => void;
}

export function ProcedureSelector({ procedures, selected, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedIds = new Set(selected.map((s) => s.procedureId));
  const filtered = procedures.filter(
    (p) =>
      p.isActive &&
      !selectedIds.has(p.id) &&
      (query === "" || p.name.toLowerCase().includes(query.toLowerCase()))
  );

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function add(proc: Procedure) {
    onChange([...selected, procedureFromRaw(proc)]);
    setQuery("");
    setOpen(false);
  }

  function remove(procedureId: string) {
    onChange(selected.filter((s) => s.procedureId !== procedureId));
  }

  function updatePrice(procedureId: string, priceStr: string) {
    onChange(selected.map((s) => (s.procedureId === procedureId ? { ...s, priceStr } : s)));
  }

  const grandTotal = totalCents(selected);

  return (
    <div className="space-y-2">
      {/* Search input */}
      <div ref={ref} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar procedimento..."
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            className="w-full h-11 pl-9 pr-4 rounded-xl border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        {open && (
          <>
            {filtered.length > 0 && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-brand-100 shadow-lg overflow-hidden max-h-52 overflow-y-auto">
                {filtered.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => add(p)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-50 transition-colors border-b last:border-0 border-brand-50 text-left"
                  >
                    <Plus className="w-4 h-4 text-brand-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.durationMinutes} min</p>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600 flex-shrink-0">
                      {formatCurrency(p.priceInCents)}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {filtered.length === 0 && query.length > 0 && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-brand-100 shadow-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">Nenhum procedimento encontrado</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Selected list */}
      {selected.length > 0 && (
        <div className="space-y-1.5">
          {selected.map((s) => (
            <div
              key={s.procedureId}
              className="flex items-center gap-3 p-3 rounded-xl border border-brand-200 bg-brand-50"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-brand-700 leading-tight truncate">{s.name}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <Clock className="w-3 h-3" />
                  {s.durationMinutes} min
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-xs text-muted-foreground">R$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={s.priceStr}
                  onChange={(e) => updatePrice(s.procedureId, e.target.value)}
                  className="w-24 text-right text-sm font-bold border-b-2 border-brand-400 outline-none bg-transparent text-brand-700 focus:border-brand-600"
                />
              </div>
              <button
                type="button"
                onClick={() => remove(s.procedureId)}
                className="text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {selected.length > 1 && (
            <div className="flex justify-between items-center px-1 py-1.5 text-sm">
              <span className="text-muted-foreground">
                Total · {totalDuration(selected)} min
              </span>
              <span className="font-bold text-brand-700">{formatCurrency(grandTotal)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
