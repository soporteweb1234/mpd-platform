import { Badge } from "@/components/ui/badge";
import { getStratumLabel } from "@/lib/utils";

const stratumVariant: Record<string, "default" | "secondary" | "success" | "warning"> = {
  NOVATO: "secondary",
  SEMI_PRO: "warning",
  PROFESIONAL: "default",
  REFERENTE: "success",
};

export function BadgeStratum({ stratum }: { stratum: string }) {
  return (
    <Badge variant={stratumVariant[stratum] ?? "secondary"}>
      {getStratumLabel(stratum)}
    </Badge>
  );
}
