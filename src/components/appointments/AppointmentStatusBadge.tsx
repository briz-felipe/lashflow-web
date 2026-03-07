import { Badge } from "@/components/ui/badge";
import type { AppointmentStatus } from "@/domain/enums";
import { APPOINTMENT_STATUS_LABELS } from "@/domain/enums";
import { cn } from "@/lib/utils";

interface AppointmentStatusBadgeProps {
  status: AppointmentStatus;
  className?: string;
}

const statusVariantMap: Record<AppointmentStatus, "warning" | "default" | "info" | "success" | "destructive" | "muted"> = {
  pending_approval: "warning",
  confirmed: "default",
  in_progress: "info",
  completed: "success",
  cancelled: "destructive",
  no_show: "muted",
};

export function AppointmentStatusBadge({ status, className }: AppointmentStatusBadgeProps) {
  return (
    <Badge variant={statusVariantMap[status]} className={className}>
      {APPOINTMENT_STATUS_LABELS[status]}
    </Badge>
  );
}
