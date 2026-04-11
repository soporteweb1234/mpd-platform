import { cn, formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface DataCardProps {
  title: string;
  value: number;
  format?: "currency" | "number" | "percent";
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  color?: "gold" | "green" | "amber" | "red" | "white";
  subtitle?: string;
  className?: string;
}

export function DataCard({
  title,
  value,
  format = "number",
  icon,
  trend,
  trendLabel,
  color = "white",
  subtitle,
  className,
}: DataCardProps) {
  const colorClasses = {
    gold: "text-mpd-gold",
    green: "text-mpd-green",
    amber: "text-mpd-amber",
    red: "text-mpd-red",
    white: "text-mpd-white",
  };

  const formatValue = (v: number) => {
    switch (format) {
      case "currency":
        return formatCurrency(v);
      case "percent":
        return `${v.toFixed(1)}%`;
      default:
        return v.toLocaleString("es-ES");
    }
  };

  return (
    <Card className={cn("hover:border-mpd-border-light transition-colors", className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-mpd-gray uppercase tracking-wider font-medium">{title}</span>
          <div className="text-mpd-gray">{icon}</div>
        </div>
        <p className={cn("text-2xl font-bold font-mono", colorClasses[color])}>
          {formatValue(value)}
        </p>
        {subtitle && (
          <p className="text-[11px] text-mpd-gray-dark mt-1 leading-snug">{subtitle}</p>
        )}
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            {trend >= 0 ? (
              <TrendingUp className="h-3 w-3 text-mpd-green" />
            ) : (
              <TrendingDown className="h-3 w-3 text-mpd-red" />
            )}
            <span className={cn("text-xs", trend >= 0 ? "text-mpd-green" : "text-mpd-red")}>
              {trend >= 0 ? "+" : ""}{trend.toFixed(1)}%
            </span>
            {trendLabel && <span className="text-xs text-mpd-gray-dark">{trendLabel}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
