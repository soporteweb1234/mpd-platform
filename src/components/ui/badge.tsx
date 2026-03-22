import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-mpd-gold/20 text-mpd-gold",
        secondary: "border-transparent bg-mpd-surface text-mpd-gray",
        destructive: "border-transparent bg-mpd-red/20 text-mpd-red",
        outline: "border-mpd-border text-mpd-gray",
        success: "border-transparent bg-mpd-green/20 text-mpd-green",
        warning: "border-transparent bg-mpd-amber/20 text-mpd-amber",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
