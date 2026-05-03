import { useState } from "react";
import { useTheme } from "@/lib/theme";
import { formatNumber } from "@/lib/format";

type Bar = { label: string; value: number; current?: boolean };

function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0];
  const raw = max / count;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / pow;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * pow;
  const ticks: number[] = [];
  for (let v = 0; v <= max + step * 0.001; v += step) ticks.push(v);
  return ticks;
}

export const BarsChart = ({
  bars,
  valueFormatter,
  onHoverChange,
  hoverIndex,
  tooltipLabel = "Ingresos",
}: {
  bars: Bar[];
  valueFormatter?: (n: number) => string;
  onHoverChange?: (index: number | null) => void;
  hoverIndex?: number | null;
  tooltipLabel?: string;
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const barColor = isDark ? "rgba(255,255,255,0.25)" : "rgba(17,17,17,0.85)";
  const barColorActive = isDark ? "rgba(255,255,255,0.55)" : "#111111";
  const barColorHover = isDark ? "rgba(255,255,255,0.85)" : "#000000";
  const labelColor = isDark ? "rgba(255,255,255,0.30)" : "#AAAAAA";
  const labelColorHover = isDark ? "rgba(255,255,255,0.85)" : "#111111";
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const axisColor = isDark ? "rgba(255,255,255,0.28)" : "#9CA3AF";

  const [internal, setInternal] = useState<number | null>(null);
  const isControlled = hoverIndex !== undefined;
  const active = isControlled ? hoverIndex : internal;
  const setHover = (i: number | null) => {
    if (!isControlled) setInternal(i);
    onHoverChange?.(i);
  };

  const dataMax = Math.max(1, ...bars.map((b) => b.value));
  const ticks = niceTicks(dataMax);
  const yMax = ticks[ticks.length - 1] || dataMax;
  const fmt = valueFormatter ?? ((n: number) => formatNumber(n));

  return (
    <div className="relative h-[200px] flex">
      {/* Y axis labels */}
      <div className="flex flex-col justify-between pr-2 py-1 text-[10px] text-right" style={{ color: axisColor, width: 36 }}>
        {[...ticks].reverse().map((t, i) => (
          <div key={i}>{fmt(t)}</div>
        ))}
      </div>

      {/* Plot area */}
      <div className="relative flex-1" onMouseLeave={() => setHover(null)}>
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between py-1 pointer-events-none">
          {ticks.slice().reverse().map((_, i) => (
            <div key={i} className="border-t" style={{ borderColor: gridColor }} />
          ))}
        </div>

        {/* Bars */}
        <div className="relative h-full flex items-end justify-between gap-2 pb-6 pt-1">
          {bars.map((b, i) => {
            const h = (b.value / yMax) * 100;
            const isHover = active === i;
            const bg = isHover ? barColorHover : b.current ? barColorActive : barColor;
            return (
              <div
                key={i}
                className="flex-1 h-full flex flex-col items-center cursor-pointer relative"
                onMouseEnter={() => setHover(i)}
              >
                <div className="flex-1 w-full flex items-end justify-center px-0.5">
                  <div
                    className="w-full rounded-sm transition-colors"
                    style={{ height: `${h}%`, background: bg, minHeight: 2 }}
                  />
                </div>
                <div
                  className="text-[10px] absolute bottom-0 transition-colors"
                  style={{ color: isHover ? labelColorHover : labelColor }}
                >
                  {b.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tooltip */}
        {active != null && bars[active] && (
          <ChartTooltip
            indexRatio={(active + 0.5) / bars.length}
            label={bars[active].label}
            line={`${tooltipLabel}: ${fmt(bars[active].value)}`}
          />
        )}
      </div>
    </div>
  );
};

export const LineChart = ({
  points,
  onHoverChange,
  hoverIndex,
  tooltipLabel = "Órdenes",
  valueFormatter,
}: {
  points: { label: string; value: number }[];
  onHoverChange?: (index: number | null) => void;
  hoverIndex?: number | null;
  tooltipLabel?: string;
  valueFormatter?: (n: number) => string;
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const lineColor = isDark ? "rgba(255,255,255,0.70)" : "#111111";
  const areaTop = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.10)";
  const areaBottom = isDark ? "rgba(255,255,255,0)" : "rgba(0,0,0,0)";
  const dotFill = isDark ? "rgba(255,255,255,0.90)" : "#111111";
  const dotStroke = isDark ? "#0E0E0E" : "#FFFFFF";
  const labelColor = isDark ? "rgba(255,255,255,0.30)" : "#AAAAAA";
  const labelColorHover = isDark ? "rgba(255,255,255,0.85)" : "#111111";
  const guideColor = isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.20)";
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const axisColor = isDark ? "rgba(255,255,255,0.28)" : "#9CA3AF";

  const [internal, setInternal] = useState<number | null>(null);
  const isControlled = hoverIndex !== undefined;
  const active = isControlled ? hoverIndex : internal;
  const setHover = (i: number | null) => {
    if (!isControlled) setInternal(i);
    onHoverChange?.(i);
  };

  const dataMax = Math.max(1, ...points.map((p) => p.value));
  const ticks = niceTicks(dataMax);
  const yMax = ticks[ticks.length - 1] || dataMax;
  const fmt = valueFormatter ?? ((n: number) => formatNumber(n));

  const w = 100;
  const h = 100;
  const stepX = points.length > 1 ? w / (points.length - 1) : 0;
  const coords = points.map((p, i) => ({
    x: i * stepX,
    y: h - (p.value / yMax) * (h - 8) - 4,
  }));
  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;
  const lastIdx = coords.length - 1;

  return (
    <div className="relative h-[200px] flex">
      <div className="flex flex-col justify-between pr-2 py-1 text-[10px] text-right" style={{ color: axisColor, width: 36 }}>
        {[...ticks].reverse().map((t, i) => (
          <div key={i}>{fmt(t)}</div>
        ))}
      </div>

      <div className="relative flex-1">
        <div className="absolute inset-0 flex flex-col justify-between py-1 pointer-events-none">
          {ticks.slice().reverse().map((_, i) => (
            <div key={i} className="border-t" style={{ borderColor: gridColor }} />
          ))}
        </div>

        <svg
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="none"
          className="w-full h-[170px]"
          onMouseLeave={() => setHover(null)}
          onMouseMove={(e) => {
            if (points.length === 0) return;
            const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
            const xPct = ((e.clientX - rect.left) / rect.width) * w;
            let nearest = 0;
            let best = Infinity;
            coords.forEach((c, i) => {
              const d = Math.abs(c.x - xPct);
              if (d < best) { best = d; nearest = i; }
            });
            setHover(nearest);
          }}
        >
          <defs>
            <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={areaTop} />
              <stop offset="100%" stopColor={areaBottom} />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#lineFill)" />
          <path d={path} fill="none" stroke={lineColor} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
          {active != null && coords[active] && (
            <line
              x1={coords[active].x}
              x2={coords[active].x}
              y1={0}
              y2={h}
              stroke={guideColor}
              strokeWidth={1}
              strokeDasharray="2 2"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {coords.map((c, i) => {
            const isHover = active === i;
            return (
              <circle
                key={i}
                cx={c.x}
                cy={c.y}
                r={isHover ? 2.4 : i === lastIdx ? 2 : 1.4}
                fill={isHover ? dotFill : i === lastIdx ? dotFill : lineColor}
                stroke={isHover || i === lastIdx ? dotStroke : "none"}
                strokeWidth={isHover || i === lastIdx ? 0.8 : 0}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>
        <div className="flex justify-between mt-1">
          {points.map((p, i) => (
            <div
              key={i}
              className="text-[10px] flex-1 text-center transition-colors"
              style={{ color: active === i ? labelColorHover : labelColor }}
            >
              {p.label}
            </div>
          ))}
        </div>

        {active != null && points[active] && (
          <ChartTooltip
            indexRatio={points.length > 1 ? active / (points.length - 1) : 0.5}
            label={points[active].label}
            line={`${tooltipLabel}: ${fmt(points[active].value)}`}
          />
        )}
      </div>
    </div>
  );
};

function ChartTooltip({
  indexRatio,
  label,
  line,
}: {
  indexRatio: number;
  label: string;
  line: string;
}) {
  // Flip side so tooltip stays inside plot
  const onRight = indexRatio < 0.55;
  const leftPct = Math.min(95, Math.max(5, indexRatio * 100));
  return (
    <div
      className="absolute top-1/2 -translate-y-1/2 pointer-events-none z-10"
      style={{
        left: `${leftPct}%`,
        transform: `translate(${onRight ? "12px" : "calc(-100% - 12px)"}, -50%)`,
      }}
    >
      <div
        className="rounded-md border px-2.5 py-1.5 text-[11px] shadow-md whitespace-nowrap"
        style={{
          background: "hsl(var(--popover))",
          color: "hsl(var(--popover-foreground))",
          borderColor: "hsl(var(--border))",
        }}
      >
        <div className="font-medium">{label}</div>
        <div className="opacity-80">{line}</div>
      </div>
    </div>
  );
}
