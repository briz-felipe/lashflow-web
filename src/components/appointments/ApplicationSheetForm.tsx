"use client";

import { Ruler, RotateCcw, Maximize2, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ApplicationSheet } from "@/domain/entities";

interface ApplicationSheetFormProps {
  value: ApplicationSheet;
  onChange: (sheet: ApplicationSheet) => void;
}

export function ApplicationSheetForm({ value, onChange }: ApplicationSheetFormProps) {
  const mapping = value.mapping ?? {};

  const updateMapping = (field: "size" | "curve" | "thickness", v: string) => {
    onChange({
      ...value,
      mapping: { ...mapping, [field]: v || undefined },
    });
  };

  return (
    <div className="space-y-3">
      {/* Mapping */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Mapping</p>
        <div className="grid grid-cols-3 gap-2">
          <div className="relative">
            <Ruler className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-400 pointer-events-none" />
            <Input
              value={mapping.size ?? ""}
              onChange={(e) => updateMapping("size", e.target.value)}
              placeholder="Tam."
              className="pl-8 h-9 text-xs"
            />
          </div>
          <div className="relative">
            <RotateCcw className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-400 pointer-events-none" />
            <Input
              value={mapping.curve ?? ""}
              onChange={(e) => updateMapping("curve", e.target.value)}
              placeholder="Curv."
              className="pl-8 h-9 text-xs"
            />
          </div>
          <div className="relative">
            <Maximize2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-400 pointer-events-none" />
            <Input
              value={mapping.thickness ?? ""}
              onChange={(e) => updateMapping("thickness", e.target.value)}
              placeholder="Esp."
              className="pl-8 h-9 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Fiber model */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1.5">Modelo de fio</p>
        <div className="relative">
          <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-400 pointer-events-none" />
          <Input
            value={value.fiberModel ?? ""}
            onChange={(e) => onChange({ ...value, fiberModel: e.target.value || undefined })}
            placeholder="Ex: Volume Russo 6D, Fio a fio..."
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Technical notes */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1.5">Observacao tecnica</p>
        <Textarea
          value={value.technicalNotes ?? ""}
          onChange={(e) => onChange({ ...value, technicalNotes: e.target.value || undefined })}
          placeholder="Ex: Canto externo mais longo, sensibilidade na palpebra..."
          className="text-xs"
          rows={2}
        />
      </div>
    </div>
  );
}
