import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge, STATUS_OPTIONS } from "@/components/StatusBadge";
import { X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const OrderDetailDialog = ({
  orderId,
  onClose,
  onChanged,
}: {
  orderId: string;
  onClose: () => void;
  onChanged: () => void;
}) => {
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [o, it] = await Promise.all([
      supabase.from("orders").select("*, clients(name,phone), operators(name)").eq("id", orderId).single(),
      supabase.from("order_items").select("*").eq("order_id", orderId),
    ]);
    setOrder(o.data);
    setItems(it.data ?? []);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [orderId]);

  const updateItemOut = async (id: string, quantity_out: number) => {
    const { error } = await supabase.from("order_items").update({ quantity_out }).eq("id", id);
    if (error) return toast.error(error.message);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity_out } : i)));
  };

  const totalIn = items.reduce((s, i) => s + (i.quantity_in || 0), 0);
  const totalOut = items.reduce((s, i) => s + (i.quantity_out || 0), 0);
  const missing = totalIn - totalOut;

  const changeStatus = async (newStatus: string) => {
    if (!order) return;

    if (newStatus === "delivered") {
      // Validar quantity_out
      const incomplete = items.some((i) => (i.quantity_out || 0) < (i.quantity_in || 0));
      if (incomplete) {
        const ok = window.confirm(
          `⚠ Faltan ${missing} prenda(s) por devolver (${totalOut}/${totalIn}). ¿Marcar como entregada de todas formas?`
        );
        if (!ok) return;
      }
    }

    setBusy(true);
    try {
      const patch: any = { status: newStatus };
      if (newStatus === "delivered") patch.delivered_at = new Date().toISOString();

      const { error } = await supabase.from("orders").update(patch).eq("id", order.id);
      if (error) throw error;

      // Crear cash_entry automático al entregar
      if (newStatus === "delivered" && order.status !== "delivered" && Number(order.total_amount) > 0) {
        const { error: eCash } = await supabase.from("cash_entries").insert({
          type: "income",
          method: order.payment_method ?? "cash",
          amount: Number(order.total_amount),
          description: `Pago orden ${order.clients?.name ?? ""}`.trim(),
          reference_order_id: order.id,
        });
        if (eCash) toast.error("Estado actualizado, pero falló el registro en caja: " + eCash.message);
        else toast.success("Entregada y registrada en caja");
      } else {
        toast.success("Estado actualizado");
      }

      await load();
      onChanged();
    } catch (err: any) {
      toast.error(err.message ?? "Error");
    } finally {
      setBusy(false);
    }
  };

  if (!order) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
        <div className="text-muted text-sm">Cargando…</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center px-4 py-8 overflow-y-auto" onClick={onClose}>
      <div className="mictio-card bg-background w-full max-w-2xl p-6 animate-fade-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="eyebrow mb-1">Orden</div>
            <h2 className="h2">{order.clients?.name ?? "—"}</h2>
            <div className="text-[12px] text-muted mt-1">
              {order.clients?.phone ?? "Sin teléfono"} · Operador: {order.operators?.name ?? "—"}
            </div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-foreground"><X size={18} /></button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="mictio-card p-3">
            <div className="eyebrow mb-1">Estado</div>
            <StatusBadge status={order.status} />
          </div>
          <div className="mictio-card p-3">
            <div className="eyebrow mb-1">Recibida</div>
            <div className="text-[12px]">{format(new Date(order.received_at), "d MMM HH:mm", { locale: es })}</div>
          </div>
          <div className="mictio-card p-3">
            <div className="eyebrow mb-1">Promesa</div>
            <div className="text-[12px]">{order.promised_at ? format(new Date(order.promised_at), "d MMM HH:mm", { locale: es }) : "—"}</div>
          </div>
          <div className="mictio-card p-3">
            <div className="eyebrow mb-1">Total</div>
            <div className="text-[14px] font-semibold">S/ {Number(order.total_amount).toFixed(2)}</div>
          </div>
        </div>

        <div className="mictio-card p-4 mb-5">
          <div className="eyebrow mb-3">Prendas — entrada / salida</div>
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 eyebrow text-[10px]">
              <div className="col-span-3">Tipo</div>
              <div className="col-span-2">Color</div>
              <div className="col-span-2">Entró</div>
              <div className="col-span-2">Salió</div>
              <div className="col-span-3 text-right">Subtotal</div>
            </div>
            {items.map((it) => {
              const diff = it.quantity_in - it.quantity_out;
              return (
                <div key={it.id} className="grid grid-cols-12 gap-2 items-center text-[12px]">
                  <div className="col-span-3 font-medium capitalize">{it.item_type}</div>
                  <div className="col-span-2 text-muted">{it.color_tag}</div>
                  <div className="col-span-2">{it.quantity_in}</div>
                  <div className="col-span-2 flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={it.quantity_in}
                      value={it.quantity_out}
                      onChange={(e) => updateItemOut(it.id, Math.max(0, parseInt(e.target.value || "0")))}
                      disabled={order.status === "delivered" || order.status === "cancelled"}
                      className="w-16 bg-background border border-border rounded px-2 py-1 text-[12px] disabled:opacity-50"
                    />
                    {diff > 0 && <span className="text-warning text-[10px]">−{diff}</span>}
                  </div>
                  <div className="col-span-3 text-right">S/ {Number(it.subtotal).toFixed(2)}</div>
                </div>
              );
            })}
          </div>

          {missing > 0 && order.status !== "delivered" && (
            <div className="mt-3 flex items-center gap-2 text-[11px] p-2 rounded-md" style={{ background: "hsl(var(--warning) / 0.10)", color: "hsl(var(--warning))" }}>
              <AlertTriangle size={13} />
              Faltan {missing} de {totalIn} prendas por devolver
            </div>
          )}
        </div>

        {order.notes && (
          <div className="mictio-card p-3 mb-5">
            <div className="eyebrow mb-1">Notas</div>
            <div className="text-[12px] text-muted">{order.notes}</div>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="text-[11px] text-muted">
            Pago: <span className="uppercase font-medium text-foreground">{order.payment_method ?? "—"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="eyebrow">Cambiar estado</span>
            <select
              value={order.status}
              onChange={(e) => changeStatus(e.target.value)}
              disabled={busy}
              className="bg-background border border-border rounded-md px-3 py-1.5 text-[12px] disabled:opacity-50"
            >
              {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
