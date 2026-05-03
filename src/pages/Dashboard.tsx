import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { MetricCard } from "@/components/MetricCard";
import { BarsChart, LineChart } from "@/components/charts/MiniCharts";
import {
  format, startOfMonth, startOfWeek,
  addMonths, addWeeks, endOfWeek, endOfMonth, endOfDay,
} from "date-fns";
import { es } from "date-fns/locale";
import { formatCurrency, formatNumber } from "@/lib/format";
import { AlertTriangle, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  DashboardPeriod, PeriodMode,
  getPeriodRange, getPreviousPeriodRange,
} from "@/lib/period";

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
  return `${sign}${formatCurrency(Math.abs(diff))} · ${diff >= 0 ? "+" : "−"}${Math.abs(p).toFixed(0)}%`;
};

/** Build trailing trend buckets for the chart based on granularity. */
function buildBuckets(
  granularity: "week" | "month",
  anchorEnd: Date,
): { from: Date; to: Date; label: string; isCurrent: boolean }[] {
  const out: { from: Date; to: Date; label: string; isCurrent: boolean }[] = [];
  if (granularity === "week") {
    const anchor = startOfWeek(anchorEnd, { weekStartsOn: 1 });
    for (let i = 7; i >= 0; i--) {
      const f = addWeeks(anchor, -i);
      const t = endOfWeek(f, { weekStartsOn: 1 });
      out.push({
        from: f, to: t,
        label: format(f, "d MMM", { locale: es }),
        isCurrent: i === 0,
      });
    }
  } else {
    const anchor = startOfMonth(anchorEnd);
    for (let i = 5; i >= 0; i--) {
      const f = addMonths(anchor, -i);
      const t = endOfMonth(f);
      out.push({
        from: f, to: t,
        label: format(f, "MMM", { locale: es }),
        isCurrent: i === 0,
      });
    }
  }
  return out;
}

export default function Dashboard() {
  const [mode, setMode] = useState<PeriodMode>("month");
  const [refDate, setRefDate] = useState<Date>(new Date());
  const [custom, setCustom] = useState<{ from?: Date; to?: Date }>({});
  const [data, setData] = useState<any>(null);

  const period: DashboardPeriod = useMemo(() => ({
    mode,
    date: refDate,
    customStart: custom.from,
    customEnd: custom.to,
  }), [mode, refDate, custom]);

  const current = useMemo(() => getPeriodRange(period), [period]);
  const previous = useMemo(() => getPreviousPeriodRange(period), [period]);
  const buckets = useMemo(
    () => buildBuckets(current.granularity, current.end),
    [current.granularity, current.end.getTime()],
  );


  useEffect(() => {
    (async () => {
      // Fetch range covering current + previous + buckets
      const minFrom = new Date(Math.min(
        previous.start.getTime(),
        current.start.getTime(),
        ...buckets.map((b) => b.from.getTime()),
      ));
      const maxTo = new Date(Math.max(
        previous.end.getTime(),
        current.end.getTime(),
        ...buckets.map((b) => b.to.getTime()),
      ));

      const [ordersRes, cashRes] = await Promise.all([
        supabase.from("orders").select("*, clients(name)").gte("received_at", minFrom.toISOString()).lte("received_at", maxTo.toISOString()),
        supabase.from("cash_entries").select("*").gte("created_at", minFrom.toISOString()).lte("created_at", maxTo.toISOString()),
      ]);
      const orders = ordersRes.data ?? [];
      const cash = cashRes.data ?? [];

      const inRange = <T extends { received_at?: string; created_at?: string }>(arr: T[], field: "received_at" | "created_at", from: Date, to: Date) =>
        arr.filter((x) => {
          const d = new Date((x as any)[field]).getTime();
          return d >= from.getTime() && d <= to.getTime();
        });

      const ordersCurr = inRange(orders, "received_at", current.start, current.end);
      const ordersPrev = inRange(orders, "received_at", previous.start, previous.end);

      const clientsCurr = new Set(ordersCurr.map((o: any) => o.client_id).filter(Boolean));
      const clientsPrev = new Set(ordersPrev.map((o: any) => o.client_id).filter(Boolean));

      const incomeCurr = inRange(cash, "created_at", current.start, current.end)
        .filter((c: any) => c.type === "income").reduce((s, c: any) => s + Number(c.amount), 0);
      const incomePrev = inRange(cash, "created_at", previous.start, previous.end)
        .filter((c: any) => c.type === "income").reduce((s, c: any) => s + Number(c.amount), 0);

      // KPIs operativos (siempre actuales, independientes del periodo)
      // Usamos query separada light
      const { data: openOrders } = await supabase
        .from("orders").select("*, clients(name)")
        .in("status", ["received", "processing"]);
      const pendingToday = (openOrders ?? []).length;
      const overdue = (openOrders ?? []).filter(
        (o: any) => o.promised_at && new Date(o.promised_at) < new Date()
      );

      const deliveredCurr = ordersCurr.filter((o: any) => o.status === "delivered");
      const avgOrder = deliveredCurr.length
        ? deliveredCurr.reduce((s: number, o: any) => s + Number(o.total_amount), 0) / deliveredCurr.length
        : 0;

      const methodCount: Record<string, number> = {};
      deliveredCurr.forEach((o: any) => {
        if (!o.payment_method) return;
        methodCount[o.payment_method] = (methodCount[o.payment_method] ?? 0) + 1;
      });
      const topMethod = Object.entries(methodCount).sort((a, b) => b[1] - a[1])[0];

      // Tendencias por buckets
      const trend = buckets.map((b) => {
        const inc = inRange(cash, "created_at", b.from, b.to)
          .filter((c: any) => c.type === "income").reduce((s, c: any) => s + Number(c.amount), 0);
        const ord = inRange(orders, "received_at", b.from, b.to).length;
        return { label: b.label, income: inc, orders: ord, isCurrent: b.isCurrent };
      });

      const overdueList = overdue
        .map((o: any) => ({
          ...o,
          daysLate: Math.floor((Date.now() - new Date(o.promised_at).getTime()) / 86400000),
        }))
        .sort((a: any, b: any) => b.daysLate - a.daysLate);

      setData({
        ordersCurr: ordersCurr.length,
        ordersPrev: ordersPrev.length,
        clientsCurr: clientsCurr.size,
        clientsPrev: clientsPrev.size,
        incomeCurr, incomePrev,
        pendingToday,
        overdueCount: overdue.length,
        avgOrder,
        topMethod: topMethod ? topMethod[0] : "—",
        topMethodCount: topMethod ? topMethod[1] : 0,
        trend,
        overdueList,
      });
    })();
  }, [mode, current.start.getTime(), current.end.getTime(), previous.start.getTime(), previous.end.getTime()]);

  const periodLabel = (() => {
    if (mode === "week") return "vs semana anterior";
    if (mode === "month") return "vs mes anterior";
    if (mode === "ytd") return "vs año anterior";
    return "vs periodo previo";
  })();

  const rangeLabel = current.label;

  return (
    <>
      <PageHeader
        eyebrow={rangeLabel}
        title="Dashboard"
      />

      {/* Period selector */}
      <div className="flex items-center gap-2 mb-5 animate-fade-up flex-wrap">
        {([
          { k: "week", l: "Semana" },
          { k: "month", l: "Mensual" },
          { k: "ytd", l: "YTD" },
          { k: "custom", l: "Personalizado" },
        ] as { k: PeriodMode; l: string }[]).map((t) => (
          <button
            key={t.k}
            onClick={() => setMode(t.k)}
            className={cn(
              "text-[12px] px-3 py-1.5 rounded-md border transition-colors",
              mode === t.k ? "border-accent text-foreground bg-surface" : "border-border text-muted hover:text-foreground"
            )}
          >
            {t.l}
          </button>
        ))}

        {mode === "custom" && (
          <>
            <DateBtn date={custom.from} placeholder="Desde" onChange={(d) => setCustom((c) => ({ ...c, from: d }))} />
            <DateBtn date={custom.to} placeholder="Hasta" onChange={(d) => setCustom((c) => ({ ...c, to: d }))} />
          </>
        )}
      </div>

      {!data ? (
        <div className="text-muted text-sm">Cargando…</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger mb-4">
            <MetricCard
              label="Órdenes"
              value={formatNumber(data.ordersCurr)}
              delta={fmtDelta(data.ordersCurr, data.ordersPrev)}
              deltaTone={data.ordersCurr >= data.ordersPrev ? "pos" : "neg"}
            >{periodLabel}: {formatNumber(data.ordersPrev)}</MetricCard>
            <MetricCard
              label="Clientes atendidos"
              value={formatNumber(data.clientsCurr)}
              delta={fmtDelta(data.clientsCurr, data.clientsPrev)}
              deltaTone={data.clientsCurr >= data.clientsPrev ? "pos" : "neg"}
            >{periodLabel}: {formatNumber(data.clientsPrev)}</MetricCard>
            <MetricCard
              label="Ingresos"
              value={formatCurrency(data.incomeCurr)}
              delta={fmtDeltaCurrency(data.incomeCurr, data.incomePrev)}
              deltaTone={data.incomeCurr >= data.incomePrev ? "pos" : "neg"}
            >{periodLabel}: {formatCurrency(data.incomePrev)}</MetricCard>
          </div>

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

          <ChartsRow
            trend={data.trend}
            incomeTotal={data.incomeCurr}
            ordersTotal={data.ordersCurr}
            caption={trendCaption(mode, data.trend.length)}
          />

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
      )}
    </>
  );
}

function trendCaption(period: PeriodKey, n: number) {
  if (period === "week") return "Últimas 8 semanas";
  if (period === "month") return "Últimos 6 meses";
  if (period === "ytd") return "Mes a mes este año";
  return `${n} periodos`;
}

function ChartsRow({
  trend, incomeTotal, ordersTotal, caption,
}: {
  trend: { label: string; income: number; orders: number; isCurrent: boolean }[];
  incomeTotal: number;
  ordersTotal: number;
  caption: string;
}) {
  const [incHover, setIncHover] = useState<number | null>(null);
  const [ordHover, setOrdHover] = useState<number | null>(null);

  const incRight = incHover != null
    ? `${trend[incHover].label} · ${formatCurrency(trend[incHover].income)}`
    : formatCurrency(incomeTotal);
  const ordRight = ordHover != null
    ? `${trend[ordHover].label} · ${formatNumber(trend[ordHover].orders)}`
    : formatNumber(ordersTotal);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stagger mb-8">
      <div className="mictio-card p-5">
        <div className="flex items-center justify-between mb-1">
          <span className="eyebrow">Ingresos</span>
          <span className="text-[12px] font-medium tabular-nums">{incRight}</span>
        </div>
        <div className="text-[11px] text-muted mb-3">{caption}</div>
        <BarsChart
          bars={trend.map((b) => ({ label: b.label, value: b.income, current: b.isCurrent }))}
          valueFormatter={formatCurrency}
          hoverIndex={incHover}
          onHoverChange={setIncHover}
          tooltipLabel="Ingresos"
        />
      </div>
      <div className="mictio-card p-5">
        <div className="flex items-center justify-between mb-1">
          <span className="eyebrow">Órdenes</span>
          <span className="text-[12px] font-medium tabular-nums">{ordRight}</span>
        </div>
        <div className="text-[11px] text-muted mb-3">{caption}</div>
        <LineChart
          points={trend.map((b) => ({ label: b.label, value: b.orders }))}
          hoverIndex={ordHover}
          onHoverChange={setOrdHover}
          tooltipLabel="Órdenes"
        />
      </div>
    </div>
  );
}

function DateBtn({ date, placeholder, onChange }: { date?: Date; placeholder: string; onChange: (d?: Date) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-md border border-border hover:text-foreground",
            date ? "text-foreground" : "text-muted"
          )}
        >
          <CalendarIcon size={12} />
          {date ? format(date, "d MMM yyyy", { locale: es }) : placeholder}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => onChange(d ?? undefined)}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}
