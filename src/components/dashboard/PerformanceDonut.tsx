"use client";

import { formatUSD } from "@/lib/utils";

interface Slice {
  label: string;
  value: number;
}

const COLORS = ["#F0B429", "#00C875", "#FF9500", "#8B949E", "#E6EDF3"];

export function PerformanceDonut({ data }: { data: Slice[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  if (total <= 0) {
    return (
      <div className="flex items-center justify-center h-[180px] text-sm text-mpd-gray">
        Aún no hay rendimientos para mostrar
      </div>
    );
  }

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const segments = data.map((d, i) => {
    const frac = d.value / total;
    const dash = frac * circumference;
    const seg = {
      color: COLORS[i % COLORS.length],
      dash,
      gap: circumference - dash,
      offset,
      label: d.label,
      value: d.value,
      pct: frac * 100,
    };
    offset += dash;
    return seg;
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox="0 0 140 140" className="h-40 w-40">
        <circle cx="70" cy="70" r={radius} stroke="#161B22" strokeWidth="16" fill="none" />
        {segments.map((s, i) => (
          <circle
            key={i}
            cx="70"
            cy="70"
            r={radius}
            stroke={s.color}
            strokeWidth="16"
            fill="none"
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={-s.offset}
            transform="rotate(-90 70 70)"
          />
        ))}
        <text
          x="70"
          y="68"
          textAnchor="middle"
          className="fill-mpd-gray text-[8px] uppercase tracking-wider"
        >
          Total
        </text>
        <text
          x="70"
          y="82"
          textAnchor="middle"
          className="fill-mpd-white text-[11px] font-mono font-semibold"
        >
          {formatUSD(total, { decimals: 0 })}
        </text>
      </svg>

      <ul className="w-full space-y-1.5">
        {segments.map((s, i) => (
          <li key={i} className="flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-2 text-mpd-white truncate">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ background: s.color }}
              />
              <span className="truncate">{s.label}</span>
            </span>
            <span className="font-mono text-mpd-gray">
              {s.pct.toFixed(0)}% · {formatUSD(s.value, { decimals: 0 })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
