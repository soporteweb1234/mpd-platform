import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  className?: string;
  align?: "left" | "center";
}

export function SectionHeading({ title, subtitle, className, align = "left" }: SectionHeadingProps) {
  return (
    <div className={cn(align === "center" && "text-center", className)}>
      <h2 className="text-2xl md:text-3xl font-bold text-mpd-white">{title}</h2>
      {subtitle && <p className="mt-2 text-mpd-gray text-sm md:text-base">{subtitle}</p>}
      <div className={cn("mt-3 h-0.5 w-12 bg-mpd-gold rounded-full", align === "center" && "mx-auto")} />
    </div>
  );
}
