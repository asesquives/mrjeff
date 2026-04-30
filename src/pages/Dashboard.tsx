import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();

      const [ordersRes, cashRes, clientsRes] = await Promise.all([
        supabase.from("orders").select("*, clients(name)").order("received_at", { ascending: false }).limit(50),
        supabase.from("cash_entries").select("*").gte("created_at", startOfDay),
        supabase.from("clients").select("id"),
      ]);

      const orders = ordersRes.data ?? [];
      const cash = cashRes.data ?? [];
      const todayOrders = orders.filter((o: any) => o.received_at >= startOfDay);
      const pending = orders.filter((o: any) => ["received", "processing", "ready"].includes(o.status));
      const ready = orders.filter((o: any) => o.status === "ready");

      const income = cash.filter((c) => c.type === "income").reduce((s, c) => s + Number(c.amount), 0);
      const expense = cash.filter((c) => c.type === "expense").reduce((s, c) => s + Number(c.amount), 0);

      setData({
        today,
        todayOrdersCount: todayOrders.length,
        pendingCount: pending.length,
        readyCount: ready.length,
        clientsCount: clientsRes.data?.length ?? 0,
        income, expense, balance: income - expense,
        recent: orders.slice(0, 8),
      });
    })();
  }, []);

  if (!data) return <div className="text-muted text-sm">Cargando…</div>;

  return (
    <>
      <PageHeader
        eyebrow={format(data.today, "EEEE d 'de' MMMM, yyyy", { locale: es })}
        title="Dashboard"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger mb-8">
        <MetricCard label="Órdenes hoy" value={data.todayOrdersCount} />
        <MetricCard label="En proceso / Listas" value={data.pendingCount} delta={`${data.readyCount} listas`} deltaTone="neutral" />
        <MetricCard label="Ingresos hoy" value={`S/ ${data.income.toFixed(2)}`} deltaTone="pos" />
        <MetricCard label="Balance del día" value={`S/ ${data.balance.toFixed(2)}`} delta={`-S/ ${data.expense.toFixed(2)}`} deltaTone={data.balance >= 0 ? "pos" : "neg"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 stagger">
        <div className="mictio-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <span className="eyebrow">Órdenes recientes</span>
            <span className="text-[11px] text-muted">{data.recent.length}</span>
          </div>
          <div className="divide-y divide-border">
            {data.recent.map((o: any) => (
              <div key={o.id} className="flex items-center justify-between py-2.5 text-[13px]">
                <div className="flex flex-col">
                  <span className="font-medium">{o.clients?.name ?? "—"}</span>
                  <span className="text-[11px] text-muted">{format(new Date(o.received_at), "d MMM HH:mm", { locale: es })}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted">S/ {Number(o.total_amount).toFixed(2)}</span>
                  <StatusBadge status={o.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mictio-card p-5">
          <span className="eyebrow">Resumen caja del día</span>
          <div className="mt-4 space-y-4">
            <div>
              <div className="text-[11px] text-muted mb-1">Ingresos</div>
              <div className="num-display text-success">S/ {data.income.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-[11px] text-muted mb-1">Egresos</div>
              <div className="num-display text-danger">S/ {data.expense.toFixed(2)}</div>
            </div>
            <div className="pt-3 border-t border-border">
              <div className="text-[11px] text-muted mb-1">Balance</div>
              <div className="num-display">S/ {data.balance.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
