import { useTheme } from "@/lib/theme";
import { formatNumber } from "@/lib/format";

type Bar = { label: string; value: number; current?: boolean };

export const BarsChart = ({
  bars,
  valueFormatter,
  onHoverChange,
  hoverIndex,
}: {
  bars: Bar[];
  valueFormatter?: (n: number) => string;
  onHoverChange?: (index: number | null) => void;
  hoverIndex?: number | null;
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const barColor = isDark ? "rgba(255,255,255,0.25)" : "rgba(17,17,17,0.85)";
  const barColorActive = isDark ? "rgba(255,255,255,0.55)" : "#111111";
  const barColorHover = isDark ? "rgba(255,255,255,0.85)" : "#000000";
  const labelColor = isDark ? "rgba(255,255,255,0.30)" : "#AAAAAA";
  const labelColorHover = isDark ? "rgba(255,255,255,0.85)" : "#111111";
  const max = Math.max(1, ...bars.map((b) => b.value));

  return (
    <div
      className="flex items-end justify-between gap-2 h-[160px]"
      onMouseLeave={() => onHoverChange?.(null)}
    >
      {bars.map((b, i) => {
        const h = (b.value / max) * 100;
        const isHover = hoverIndex === i;
        const bg = isHover ? barColorHover : b.current ? barColorActive : barColor;
        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-1.5 h-full cursor-pointer"
            onMouseEnter={() => onHoverChange?.(i)}
          >
            <div className="flex-1 w-full flex items-end justify-center">
              <div
                className="w-full rounded-sm transition-all"
                style={{ height: `${h}%`, background: bg, minHeight: 2 }}
                title={valueFormatter ? valueFormatter(b.value) : formatNumber(b.value)}
              />
            </div>
            <div
              className="text-[10px] transition-colors"
              style={{ color: isHover ? labelColorHover : labelColor }}
            >
              {b.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const LineChart = ({
  points,
  onHoverChange,
  hoverIndex,
}: {
  points: { label: string; value: number }[];
  onHoverChange?: (index: number | null) => void;
  hoverIndex?: number | null;
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

  const max = Math.max(1, ...points.map((p) => p.value));
  const w = 100;
  const h = 100;
  const stepX = points.length > 1 ? w / (points.length - 1) : 0;
  const coords = points.map((p, i) => ({
    x: i * stepX,
    y: h - (p.value / max) * (h - 10) - 5,
  }));
  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;
  const lastIdx = coords.length - 1;

  return (
    <div className="h-[160px] relative">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="w-full h-[130px]"
        onMouseLeave={() => onHoverChange?.(null)}
        onMouseMove={(e) => {
          if (!onHoverChange || points.length === 0) return;
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const xPct = ((e.clientX - rect.left) / rect.width) * w;
          let nearest = 0;
          let best = Infinity;
          coords.forEach((c, i) => {
            const d = Math.abs(c.x - xPct);
            if (d < best) { best = d; nearest = i; }
          });
          onHoverChange(nearest);
        }}
      >
        <defs>
          <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={areaTop} />
            <stop offset="100%" stopColor={areaBottom} />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#lineFill)" />
        <path
          d={path}
          fill="none"
          stroke={lineColor}
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
        {hoverIndex != null && coords[hoverIndex] && (
          <line
            x1={coords[hoverIndex].x}
            x2={coords[hoverIndex].x}
            y1={0}
            y2={h}
            stroke={guideColor}
            strokeWidth={1}
            strokeDasharray="2 2"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {coords.map((c, i) => {
          const isHover = hoverIndex === i;
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
            style={{ color: hoverIndex === i ? labelColorHover : labelColor }}
          >
            {p.label}
          </div>
        ))}
      </div>
    </div>
  );
};
