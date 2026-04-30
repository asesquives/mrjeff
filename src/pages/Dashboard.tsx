import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { MetricCard } from "@/components/MetricCard";
import { BarsChart, LineChart } from "@/components/charts/MiniCharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  formatCurrency, formatNumber,
  startOfMonthLima, startOfMonthOffset, monthLabel,
} from "@/lib/format";
import { AlertTriangle } from "lucide-react";

const pct = (curr: number, prev: number) => {
  if (prev === 0) return curr === 0 ? 0 : 100;
  return ((curr - prev) / prev) * 100;
};
const fmtDelta = (curr: number, prev: number) => {
  const diff = curr - prev;
  const p = pct(curr, prev);
  const sign = diff >= 0 ? "+" : "−";
  return `${sign}${formatNumber(Math.abs(diff))} · ${diff >= 0 ? "+" : "−"}${Math.abs(p).toFixed(0)}%`;
};
const fmtDeltaCurrency = (curr: number, prev: number) => {
  const diff = curr - prev;
  const p = pct(curr, prev);
  const sign = diff >= 0 ? "+" : "−";
  return `${sign}${formatCurrency(Math.abs(diff)).replace("S/ ", "S/ ")} · ${diff >= 0 ? "+" : "−"}${Math.abs(p).toFixed(0)}%`;
};

export default function Dashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const startMonth = startOfMonthLima(0);
      const startPrev = startOfMonthOffset(1);
      const startSix = startOfMonthOffset(5);

      const [ordersRes, cashRes, clientsRes] = await Promise.all([
        supabase.from("orders").select("*, clients(name)").gte("received_at", startSix).order("received_at", { ascending: false }),
        supabase.from("cash_entries").select("*").gte("created_at", startSix),
        supabase.from("clients").select("id"),
      ]);
      const orders = ordersRes.data ?? [];
      const cash = cashRes.data ?? [];

      // Mes actual / anterior
      const ordersMonth = orders.filter((o) => o.received_at >= startMonth);
      const ordersPrev = orders.filter((o) => o.received_at >= startPrev && o.received_at < startMonth);

      const clientsMonth = new Set(ordersMonth.map((o: any) => o.client_id).filter(Boolean));
      const clientsPrev = new Set(ordersPrev.map((o: any) => o.client_id).filter(Boolean));

      const incomeMonth = cash.filter((c) => c.type === "income" && c.created_at >= startMonth)
        .reduce((s, c) => s + Number(c.amount), 0);
      const incomePrev = cash.filter((c) => c.type === "income" && c.created_at >= startPrev && c.created_at < startMonth)
        .reduce((s, c) => s + Number(c.amount), 0);

      // KPIs operativos
      const pendingToday = orders.filter((o) => ["received", "processing"].includes(o.status)).length;
      const overdue = orders.filter(
        (o) => ["received", "processing"].includes(o.status) && o.promised_at && new Date(o.promised_at) < new Date()
      );
      const deliveredAll = orders.filter((o) => o.status === "delivered");
      const avgOrder = deliveredAll.length
        ? deliveredAll.reduce((s, o) => s + Number(o.total_amount), 0) / deliveredAll.length
        : 0;

      const methodCount: Record<string, number> = {};
      deliveredAll.forEach((o) => {
        if (!o.payment_method) return;
        methodCount[o.payment_method] = (methodCount[o.payment_method] ?? 0) + 1;
      });
      const topMethod = Object.entries(methodCount).sort((a, b) => b[1] - a[1])[0];

      // Tendencias 6 meses
      const monthBuckets: { label: string; income: number; orders: number; isCurrent: boolean }[] = [];
      for (let i = 5; i >= 0; i--) {
        const start = startOfMonthOffset(i);
        const end = i === 0 ? "9999-12-31T00:00:00Z" : startOfMonthOffset(i - 1);
        const inc = cash.filter((c) => c.type === "income" && c.created_at >= start && c.created_at < end)
          .reduce((s, c) => s + Number(c.amount), 0);
        const ord = orders.filter((o) => o.received_at >= start && o.received_at < end).length;
        monthBuckets.push({ label: monthLabel(i), income: inc, orders: ord, isCurrent: i === 0 });
      }

      // Alertas: órdenes atrasadas con días de atraso
      const overdueList = overdue
        .map((o) => ({
          ...o,
          daysLate: Math.floor((Date.now() - new Date(o.promised_at).getTime()) / 86400000),
        }))
        .sort((a, b) => b.daysLate - a.daysLate);

      setData({
        today: new Date(),
        ordersMonth: ordersMonth.length,
        ordersPrev: ordersPrev.length,
        clientsMonth: clientsMonth.size,
        clientsPrev: clientsPrev.size,
        incomeMonth, incomePrev,
        pendingToday,
        overdueCount: overdue.length,
        avgOrder,
        topMethod: topMethod ? topMethod[0] : "—",
        topMethodCount: topMethod ? topMethod[1] : 0,
        monthBuckets,
        overdueList,
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

      {/* Fila 1 - Comparativas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger mb-4">
        <MetricCard
          label="Órdenes del mes"
          value={formatNumber(data.ordersMonth)}
          delta={fmtDelta(data.ordersMonth, data.ordersPrev)}
          deltaTone={data.ordersMonth >= data.ordersPrev ? "pos" : "neg"}
        >vs {formatNumber(data.ordersPrev)} mes anterior</MetricCard>
        <MetricCard
          label="Clientes atendidos"
          value={formatNumber(data.clientsMonth)}
          delta={fmtDelta(data.clientsMonth, data.clientsPrev)}
          deltaTone={data.clientsMonth >= data.clientsPrev ? "pos" : "neg"}
        >vs {formatNumber(data.clientsPrev)} mes anterior</MetricCard>
        <MetricCard
          label="Ingresos del mes"
          value={formatCurrency(data.incomeMonth)}
          delta={fmtDeltaCurrency(data.incomeMonth, data.incomePrev)}
          deltaTone={data.incomeMonth >= data.incomePrev ? "pos" : "neg"}
        >vs {formatCurrency(data.incomePrev)} mes anterior</MetricCard>
      </div>

      {/* Fila 2 - KPIs operativos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger mb-8">
        <MetricCard label="Pendientes hoy" value={formatNumber(data.pendingToday)} />
        <MetricCard
          label="Atrasadas"
          value={formatNumber(data.overdueCount)}
          deltaTone={data.overdueCount > 0 ? "neg" : "pos"}
          delta={data.overdueCount > 0 ? "Atención" : "OK"}
        />
        <MetricCard label="Ticket promedio" value={formatCurrency(data.avgOrder)} />
        <MetricCard label="Pago favorito" value={(data.topMethod ?? "—").toUpperCase()}>
          {formatNumber(data.topMethodCount)} órdenes
        </MetricCard>
      </div>

      {/* Tendencias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stagger mb-8">
        <div className="mictio-card p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="eyebrow">Ingresos por mes</span>
            <span className="text-[11px] text-muted">Últimos 6 meses</span>
          </div>
          <BarsChart
            bars={data.monthBuckets.map((b: any) => ({ label: b.label, value: b.income, current: b.isCurrent }))}
            valueFormatter={formatCurrency}
          />
        </div>
        <div className="mictio-card p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="eyebrow">Órdenes por mes</span>
            <span className="text-[11px] text-muted">Últimos 6 meses</span>
          </div>
          <LineChart points={data.monthBuckets.map((b: any) => ({ label: b.label, value: b.orders }))} />
        </div>
      </div>

      {/* Alertas */}
      <div className="mictio-card p-5 animate-fade-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-warning" />
            <span className="eyebrow">Órdenes atrasadas</span>
          </div>
          <span className="badge-state badge-state-neg">{data.overdueList.length}</span>
        </div>
        {data.overdueList.length === 0 ? (
          <div className="text-[13px] text-muted py-4 text-center">Sin atrasos. Todo al día ✓</div>
        ) : (
          <div className="divide-y divide-border">
            {data.overdueList.map((o: any) => (
              <div key={o.id} className="flex items-center justify-between py-2.5 text-[13px]">
                <div className="flex flex-col">
                  <span className="font-medium">{o.clients?.name ?? "—"}</span>
                  <span className="text-[11px] text-muted">
                    Prometida {format(new Date(o.promised_at), "d MMM HH:mm", { locale: es })}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted">{formatCurrency(Number(o.total_amount))}</span>
                  <span className="badge-state badge-state-neg">
                    {o.daysLate === 0 ? "Hoy" : `${o.daysLate}d atraso`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
