import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/StatusBadge";
import { X, Pencil, Phone, Mail, FileText } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatCurrency } from "@/lib/format";

export const ClientProfileDialog = ({
  clientId,
  onClose,
  onEdit,
}: {
  clientId: string;
  onClose: () => void;
  onEdit: (c: any) => void;
}) => {
  const [client, setClient] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [c, o] = await Promise.all([
        supabase.from("clients").select("*").eq("id", clientId).single(),
        supabase.from("orders").select("*").eq("client_id", clientId).order("received_at", { ascending: false }),
      ]);
      setClient(c.data);
      setOrders(o.data ?? []);
    })();
  }, [clientId]);

  if (!client) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
        <div className="text-muted text-sm">Cargando…</div>
      </div>
    );
  }

  const delivered = orders.filter((o) => o.status === "delivered");
  const totalSpent = delivered.reduce((s, o) => s + Number(o.total_amount), 0);
  const pending = orders.filter((o) => ["received", "processing", "ready"].includes(o.status)).length;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center px-4 py-8 overflow-y-auto" onClick={onClose}>
      <div className="mictio-card bg-background w-full max-w-2xl p-6 animate-fade-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="eyebrow mb-1">Cliente</div>
            <h2 className="h2">{client.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onEdit(client)} className="border border-border rounded-md px-3 py-1.5 text-[12px] text-muted hover:text-foreground hover:border-accent flex items-center gap-1.5">
              <Pencil size={12} /> Editar
            </button>
            <button onClick={onClose} className="text-muted hover:text-foreground"><X size={18} /></button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="mictio-card p-4">
            <div className="eyebrow mb-1">Total gastado</div>
            <div className="num-display">{formatCurrency(totalSpent)}</div>
            <div className="text-[11px] text-muted mt-1">{delivered.length} órdenes entregadas</div>
          </div>
          <div className="mictio-card p-4">
            <div className="eyebrow mb-1">Total órdenes</div>
            <div className="num-display">{orders.length}</div>
            <div className="text-[11px] text-muted mt-1">{pending} en curso</div>
          </div>
          <div className="mictio-card p-4">
            <div className="eyebrow mb-1">Cliente desde</div>
            <div className="text-[14px] font-semibold mt-2">{format(new Date(client.created_at), "d MMM yyyy", { locale: es })}</div>
          </div>
        </div>

        <div className="mictio-card p-4 mb-5 space-y-2 text-[12px]">
          <div className="flex items-center gap-2 text-muted"><Phone size={12} /> {client.phone ?? "Sin teléfono"}</div>
          <div className="flex items-center gap-2 text-muted"><Mail size={12} /> {client.email ?? "Sin email"}</div>
          {client.notes && <div className="flex items-start gap-2 text-muted"><FileText size={12} className="mt-0.5" /> {client.notes}</div>}
        </div>

        <div>
          <div className="eyebrow mb-3">Historial de órdenes</div>
          <div className="mictio-card overflow-hidden">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="px-3 py-2 eyebrow">Fecha</th>
                  <th className="px-3 py-2 eyebrow">Estado</th>
                  <th className="px-3 py-2 eyebrow">Pago</th>
                  <th className="px-3 py-2 eyebrow text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 text-muted">{format(new Date(o.received_at), "d MMM yyyy", { locale: es })}</td>
                    <td className="px-3 py-2"><StatusBadge status={o.status} /></td>
                    <td className="px-3 py-2 text-muted uppercase text-[10px]">{o.payment_method ?? "—"}</td>
                    <td className="px-3 py-2 text-right font-medium">{formatCurrency(Number(o.total_amount))}</td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-6 text-muted">Sin órdenes</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
