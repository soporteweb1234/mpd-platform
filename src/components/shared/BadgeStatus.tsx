import { Badge } from "@/components/ui/badge";
import { getStatusLabel } from "@/lib/utils";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "success" | "warning"> = {
  PENDING: "warning",
  ACTIVE: "success",
  SUSPENDED: "destructive",
  BANNED: "destructive",
  INACTIVE: "secondary",
  AVAILABLE: "success",
  COMING_SOON: "warning",
  DISCONTINUED: "secondary",
  OPEN: "warning",
  IN_PROGRESS: "default",
  RESOLVED: "success",
  CLOSED: "secondary",
  DELIVERED: "success",
  CANCELLED: "destructive",
};

export function BadgeStatus({ status, label }: { status: string; label?: string }) {
  return (
    <Badge variant={statusVariant[status] ?? "secondary"}>
      {label ?? getStatusLabel(status)}
    </Badge>
  );
}
