import { Badge } from "@/components/ui/badge";
import type { PaymentStatus } from "@/domain/enums";
import { PAYMENT_STATUS_LABELS } from "@/domain/enums";

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
}

const statusVariantMap: Record<PaymentStatus, "success" | "warning" | "info" | "muted" | "destructive"> = {
  paid: "success",
  pending: "warning",
  partial: "info",
  refunded: "muted",
  failed: "destructive",
};

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  return (
    <Badge variant={statusVariantMap[status]}>
      {PAYMENT_STATUS_LABELS[status]}
    </Badge>
  );
}
