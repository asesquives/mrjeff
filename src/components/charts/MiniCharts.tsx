import { useEffect, useMemo } from "react";
import { formatNumber } from "@/lib/format";

type Bar = { label: string; value: number; current?: boolean };

export const BarsChart = ({ bars, valueFormatter }: { bars: Bar[]; valueFormatter?: (n: number) => string }) => {
  const max = Math.max(1, ...bars.map((b) => b.value));
  return (
    <div className="flex items-end justify-between gap-2 h-[160px]">
      {bars.map((b, i) => {
        const h = (b.value / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full">
            <div className="flex-1 w-full flex items-end justify-center">
              <div
                className="w-full rounded-sm transition-all"
                style={{
                  height: `${h}%`,
                  background: "hsl(var(--accent) / 0.85)",
                  border: b.current ? "1px solid hsl(var(--accent))" : "none",
                  opacity: b.current ? 1 : 0.85,
                  minHeight: 2,
                }}
                title={valueFormatter ? valueFormatter(b.value) : formatNumber(b.value)}
              />
            </div>
            <div className="text-[10px] text-muted">{b.label}</div>
          </div>
        );
      })}
    </div>
  );
};

export const LineChart = ({ points }: { points: { label: string; value: number }[] }) => {
  const max = Math.max(1, ...points.map((p) => p.value));
  const w = 100;
  const h = 100;
  const stepX = points.length > 1 ? w / (points.length - 1) : 0;
  const coords = points.map((p, i) => ({ x: i * stepX, y: h - (p.value / max) * (h - 10) - 5 }));
  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;

  return (
    <div className="h-[160px]">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-[130px]">
        <defs>
          <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.2" />
            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#lineFill)" />
        <path d={path} fill="none" stroke="hsl(var(--accent))" strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={1.5} fill="hsl(var(--accent))" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div className="flex justify-between mt-1">
        {points.map((p, i) => (
          <div key={i} className="text-[10px] text-muted flex-1 text-center">{p.label}</div>
        ))}
      </div>
    </div>
  );
};
