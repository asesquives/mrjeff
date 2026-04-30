import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { NewOrderDialog } from "@/components/orders/NewOrderDialog";
import { OrderDetailDialog } from "@/components/orders/OrderDetailDialog";
import { Plus, AlertTriangle } from "lucide-react";
import { format, isToday } from "date-fns";
import { es } from "date-fns/locale";

type Tab = "today" | "all" | "overdue";

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [itemsByOrder, setItemsByOrder] = useState<Record<string, number>>({});
  const [tab, setTab] = useState<Tab>("today");
  const [showNew, setShowNew] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*, clients(name), operators(name)")
      .order("received_at", { ascending: false });
    setOrders(data ?? []);

    const ids = (data ?? []).map((o: any) => o.id);
    if (ids.length) {
      const { data: items } = await supabase.from("order_items").select("order_id,quantity_in").in("order_id", ids);
      const map: Record<string, number> = {};
      (items ?? []).forEach((i: any) => {
        map[i.order_id] = (map[i.order_id] ?? 0) + (i.quantity_in ?? 0);
      });
      setItemsByOrder(map);
    } else {
      setItemsByOrder({});
    }
  };

  useEffect(() => { load(); }, []);

  const list = useMemo(() => {
    if (tab === "today") return orders.filter((o) => isToday(new Date(o.received_at)));
    if (tab === "overdue")
      return orders
        .filter(
          (o) =>
            ["received", "processing"].includes(o.status) &&
            o.promised_at &&
            new Date(o.promised_at) < new Date()
        )
        .sort((a, b) => new Date(a.promised_at).getTime() - new Date(b.promised_at).getTime());
    return orders;
  }, [orders, tab]);

  const overdueCount = useMemo(
    () =>
      orders.filter(
        (o) =>
          ["received", "processing"].includes(o.status) &&
          o.promised_at &&
          new Date(o.promised_at) < new Date()
      ).length,
    [orders]
  );

  return (
    <>
      <PageHeader
        eyebrow="Operación"
        title="Órdenes"
        action={
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 bg-foreground text-background font-semibold text-[13px] px-4 py-2 rounded-md hover:opacity-90"
          >
            <Plus size={14} /> Nueva orden
          </button>
        }
      />

      <div className="flex gap-2 mb-5 animate-fade-up">
        {[
          { k: "today" as const, l: "Hoy" },
          { k: "overdue" as const, l: "Pendientes vencidas", badge: overdueCount },
          { k: "all" as const, l: "Todas" },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-md border transition-colors ${
              tab === t.k ? "border-accent text-foreground bg-surface" : "border-border text-muted hover:text-foreground"
            }`}
          >
            {t.k === "overdue" && <AlertTriangle size={11} />}
            {t.l}
            {"badge" in t && t.badge ? (
              <span className="badge-state badge-state-neg ml-1">{t.badge}</span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="mictio-card overflow-hidden animate-fade-up">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left border-b border-border">
              <th className="px-4 py-3 eyebrow">Cliente</th>
              <th className="px-4 py-3 eyebrow">Operador</th>
              <th className="px-4 py-3 eyebrow">Prendas</th>
              <th className="px-4 py-3 eyebrow">Estado</th>
              <th className="px-4 py-3 eyebrow">Pago</th>
              <th className="px-4 py-3 eyebrow text-right">Total</th>
              <th className="px-4 py-3 eyebrow">Promesa</th>
            </tr>
          </thead>
          <tbody>
            {list.map((o) => {
              const overdue =
                ["received", "processing"].includes(o.status) &&
                o.promised_at &&
                new Date(o.promised_at) < new Date();
              return (
                <tr
                  key={o.id}
                  onClick={() => setSelectedId(o.id)}
                  className="border-b border-border last:border-0 hover:bg-surface/60 cursor-pointer"
                >
                  <td className="px-4 py-3 font-medium">{o.clients?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{o.operators?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{itemsByOrder[o.id] ?? 0}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3 text-muted uppercase text-[11px]">{o.payment_method ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-medium">S/ {Number(o.total_amount).toFixed(2)}</td>
                  <td className={`px-4 py-3 text-[12px] ${overdue ? "text-danger font-medium" : "text-muted"}`}>
                    {o.promised_at ? format(new Date(o.promised_at), "d MMM HH:mm", { locale: es }) : "—"}
                    {overdue && " · vencida"}
                  </td>
                </tr>
              );
            })}
            {list.length === 0 && (
              <tr><td colSpan={7} className="text-center py-10 text-muted text-[12px]">
                {tab === "today" ? "Sin órdenes hoy" : tab === "overdue" ? "Sin pendientes vencidas" : "Sin órdenes"}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showNew && <NewOrderDialog onClose={() => setShowNew(false)} onCreated={load} />}
      {selectedId && (
        <OrderDetailDialog
          orderId={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={load}
        />
      )}
    </>
  );
}
