import { ReactNode } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

export const MetricCard = ({
  label,
  value,
  delta,
  deltaTone = "neutral",
  children,
}: {
  label: string;
  value: string | number;
  delta?: string;
  deltaTone?: "pos" | "neg" | "neutral";
  children?: ReactNode;
}) => {
  const toneClass =
    deltaTone === "pos"
      ? "badge-state-pos"
      : deltaTone === "neg"
      ? "badge-state-neg"
      : "badge-state-neutral";

  const valueColor =
    deltaTone === "pos"
      ? "hsl(var(--success))"
      : deltaTone === "neg"
      ? "hsl(var(--danger))"
      : "hsl(var(--foreground))";

  return (
    <div className="mictio-card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="eyebrow">{label}</span>
        {delta && (
          <span className={`badge-state ${toneClass} gap-1`}>
            {deltaTone === "pos" && <ArrowUp size={10} strokeWidth={2.5} />}
            {deltaTone === "neg" && <ArrowDown size={10} strokeWidth={2.5} />}
            {delta}
          </span>
        )}
      </div>
      <div className="num-display" style={{ color: valueColor }}>
        {value}
      </div>
      {children && <div className="mt-3 text-[12px] text-muted">{children}</div>}
    </div>
  );
};
