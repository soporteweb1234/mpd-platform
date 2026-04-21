import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: { flame: "h-6 w-6", text: "text-sm tracking-[0.18em]" },
  md: { flame: "h-8 w-8", text: "text-base tracking-[0.22em]" },
  lg: { flame: "h-12 w-12", text: "text-xl tracking-[0.24em]" },
};

export function Logo({ className, showText = true, size = "md" }: LogoProps) {
  const s = sizes[size];
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <svg
        viewBox="0 0 48 48"
        className={cn(s.flame, "text-mpd-gold drop-shadow-[0_0_12px_rgba(240,180,41,0.45)]")}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="flame-grad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#F7C85A" />
            <stop offset="55%" stopColor="#F0B429" />
            <stop offset="100%" stopColor="#C69718" />
          </linearGradient>
        </defs>
        <path
          d="M24 4c2 6-3 9-3 14 0 3 2 5 4 5s3-2 3-4c0-2-1-3-1-5 4 3 9 8 9 15 0 7-5 13-12 13S12 36 12 29c0-6 4-10 6-14 2 3 4 5 6 5 1 0 2-1 2-2 0-5-4-7-2-14z"
          fill="url(#flame-grad)"
          stroke="none"
        />
      </svg>
      {showText && (
        <span
          className={cn(
            "font-body font-semibold uppercase text-mpd-white whitespace-nowrap",
            s.text
          )}
        >
          Manager Poker Deals
        </span>
      )}
    </div>
  );
}
