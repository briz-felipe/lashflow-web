import { Badge } from "@/components/ui/badge";
import type { ClientSegment } from "@/domain/enums";
import { CLIENT_SEGMENT_LABELS } from "@/domain/enums";

interface ClientSegmentBadgeProps {
  segment: ClientSegment;
}

const segmentVariantMap: Record<ClientSegment, "default" | "success" | "warning" | "info" | "muted" | "secondary"> = {
  volume: "default",
  classic: "info",
  hybrid: "secondary",
  vip: "warning",
  recorrente: "success",
  inativa: "muted",
};

export function ClientSegmentBadge({ segment }: ClientSegmentBadgeProps) {
  return (
    <Badge variant={segmentVariantMap[segment]}>
      {CLIENT_SEGMENT_LABELS[segment]}
    </Badge>
  );
}
