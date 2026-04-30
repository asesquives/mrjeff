import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

const STATUSES = ["received", "processing", "ready", "delivered", "cancelled"] as const;

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("all");

  const load = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*, clients(name), operators(name)")
      .order("received_at", { ascending: false });
    setOrders(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: any) => {
    const patch: any = { status };
    if (status === "delivered") patch.delivered_at = new Date().toISOString();
    const { error } = await supabase.from("orders").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Estado actualizado");
    load();
  };

  const list = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <>
      <PageHeader eyebrow="Operación" title="Órdenes" />

      <div className="flex gap-2 mb-5 flex-wrap animate-fade-up">
        {[{ k: "all", l: "Todas" }, ...STATUSES.map(s => ({ k: s, l: s }))].map(f => (
          <button
            key={f.k}
            onClick={() => setFilter(f.k)}
            className={`text-[12px] px-3 py-1.5 rounded-md border transition-colors ${
              filter === f.k ? "border-accent text-foreground bg-surface" : "border-border text-muted hover:text-foreground"
            }`}
          >
            {f.l === "received" ? "Recibidas" : f.l === "processing" ? "En proceso" : f.l === "ready" ? "Listas" : f.l === "delivered" ? "Entregadas" : f.l === "cancelled" ? "Canceladas" : f.l}
          </button>
        ))}
      </div>

      <div className="mictio-card overflow-hidden animate-fade-up">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-muted text-left border-b border-border">
              <th className="font-medium px-4 py-3 eyebrow">Cliente</th>
              <th className="font-medium px-4 py-3 eyebrow">Operador</th>
              <th className="font-medium px-4 py-3 eyebrow">Recibida</th>
              <th className="font-medium px-4 py-3 eyebrow">Promesa</th>
              <th className="font-medium px-4 py-3 eyebrow">Total</th>
              <th className="font-medium px-4 py-3 eyebrow">Estado</th>
              <th className="font-medium px-4 py-3 eyebrow text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {list.map((o) => (
              <tr key={o.id} className="border-b border-border last:border-0 hover:bg-surface/50">
                <td className="px-4 py-3 font-medium">{o.clients?.name ?? "—"}</td>
                <td className="px-4 py-3 text-muted">{o.operators?.name ?? "—"}</td>
                <td className="px-4 py-3 text-muted">{format(new Date(o.received_at), "d MMM HH:mm", { locale: es })}</td>
                <td className="px-4 py-3 text-muted">{o.promised_at ? format(new Date(o.promised_at), "d MMM", { locale: es }) : "—"}</td>
                <td className="px-4 py-3">S/ {Number(o.total_amount).toFixed(2)}</td>
                <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                <td className="px-4 py-3 text-right">
                  <select
                    value={o.status}
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                    className="bg-background border border-border rounded text-[11px] px-2 py-1 text-muted hover:text-foreground"
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={7} className="text-center py-10 text-muted text-[12px]">Sin órdenes</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
