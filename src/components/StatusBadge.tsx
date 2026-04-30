const map: Record<string, { label: string; bg: string; fg: string; border?: string }> = {
  // Gris
  received: { label: "Recibida", bg: "hsl(var(--muted) / 0.18)", fg: "hsl(var(--foreground-secondary))" },
  // Amarillo
  processing: { label: "En proceso", bg: "hsl(var(--warning) / 0.12)", fg: "hsl(var(--warning))" },
  // Azul
  ready: { label: "Lista", bg: "hsl(217 91% 60% / 0.12)", fg: "hsl(217 91% 65%)" },
  // Verde
  delivered: { label: "Entregada", bg: "hsl(var(--success) / 0.12)", fg: "hsl(var(--success))" },
  // Rojo
  cancelled: { label: "Cancelada", bg: "hsl(var(--danger) / 0.12)", fg: "hsl(var(--danger))" },
  // Recibos
  pending: { label: "Pendiente", bg: "hsl(var(--warning) / 0.12)", fg: "hsl(var(--warning))" },
  issued: { label: "Emitida", bg: "hsl(var(--success) / 0.12)", fg: "hsl(var(--success))" },
};

export const StatusBadge = ({ status }: { status: string }) => {
  const m = map[status] ?? { label: status, bg: "hsl(var(--accent) / 0.12)", fg: "hsl(var(--accent))" };
  return (
    <span
      className="badge-state"
      style={{ background: m.bg, color: m.fg }}
    >
      {m.label}
    </span>
  );
};

export const STATUS_OPTIONS = [
  { value: "received", label: "Recibida" },
  { value: "processing", label: "En proceso" },
  { value: "ready", label: "Lista" },
  { value: "delivered", label: "Entregada" },
  { value: "cancelled", label: "Cancelada" },
] as const;
