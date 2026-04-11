"use client";

import { Ruler, RotateCcw, Maximize2, Layers } from "lucide-react";
import type { ApplicationSheet } from "@/domain/entities";

interface ApplicationSheetDisplayProps {
  sheet: ApplicationSheet;
  compact?: boolean;
}

export function ApplicationSheetDisplay({ sheet, compact }: ApplicationSheetDisplayProps) {
  const mapping = sheet.mapping;
  const hasMapping = mapping && (mapping.size || mapping.curve || mapping.thickness);

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2.5"}>
      {/* Mapping badges */}
      {hasMapping && (
        <div className="flex flex-wrap gap-1.5">
          {mapping.size && (
            <span className="flex items-center gap-1 text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
              <Ruler className="w-3 h-3" />
              {mapping.size}
            </span>
          )}
          {mapping.curve && (
            <span className="flex items-center gap-1 text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
              <RotateCcw className="w-3 h-3" />
              {mapping.curve}
            </span>
          )}
          {mapping.thickness && (
            <span className="flex items-center gap-1 text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
              <Maximize2 className="w-3 h-3" />
              {mapping.thickness}
            </span>
          )}
        </div>
      )}

      {/* Fiber model */}
      {sheet.fiberModel && (
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
          <span className={`font-medium text-foreground ${compact ? "text-xs" : "text-sm"}`}>
            {sheet.fiberModel}
          </span>
        </div>
      )}

      {/* Technical notes */}
      {sheet.technicalNotes && (
        <p className={`bg-brand-50 rounded-xl px-3 py-2 italic text-muted-foreground ${compact ? "text-[11px]" : "text-xs"}`}>
          {sheet.technicalNotes}
        </p>
      )}
    </div>
  );
}
