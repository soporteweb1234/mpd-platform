"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  value: number;
  format?: "currency" | "number" | "percent";
  duration?: number;
  className?: string;
}

export function AnimatedCounter({ value, format = "number", duration = 1500, className }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          hasAnimated.current = true;
          const startTime = performance.now();
          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayValue(Math.round(value * eased * 100) / 100);
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, duration]);

  const formatValue = (v: number) => {
    switch (format) {
      case "currency":
        return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(v);
      case "percent":
        return `${v.toFixed(1)}%`;
      default:
        return v.toLocaleString("es-ES");
    }
  };

  return (
    <span ref={ref} className={cn("font-mono tabular-nums", className)}>
      {formatValue(displayValue)}
    </span>
  );
}
