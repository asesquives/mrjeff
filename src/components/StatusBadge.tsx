const map: Record<string, { label: string; cls: string }> = {
  received: { label: "Recibida", cls: "badge-state-neutral" },
  processing: { label: "En proceso", cls: "badge-state-warn" },
  ready: { label: "Lista", cls: "badge-state-pos" },
  delivered: { label: "Entregada", cls: "badge-state-pos" },
  cancelled: { label: "Cancelada", cls: "badge-state-neg" },
  pending: { label: "Pendiente", cls: "badge-state-warn" },
  issued: { label: "Emitida", cls: "badge-state-pos" },
};

export const StatusBadge = ({ status }: { status: string }) => {
  const m = map[status] ?? { label: status, cls: "badge-state-neutral" };
  return <span className={`badge-state ${m.cls}`}>{m.label}</span>;
};
