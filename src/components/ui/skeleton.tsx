import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-mpd-surface-hover", className)}
      {...props}
    />
  );
}

export { Skeleton };
