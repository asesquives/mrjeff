import { ReactNode } from "react";

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
    deltaTone === "pos" ? "badge-state-pos" : deltaTone === "neg" ? "badge-state-neg" : "badge-state-neutral";
  return (
    <div className="mictio-card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="eyebrow">{label}</span>
        {delta && <span className={`badge-state ${toneClass}`}>{delta}</span>}
      </div>
      <div className="num-display text-foreground">{value}</div>
      {children && <div className="mt-3 text-[12px] text-muted">{children}</div>}
    </div>
  );
};
