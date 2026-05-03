import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, Cell, Area, AreaChart,
} from "recharts";
import {
  format, startOfMonth, endOfMonth, subMonths,
  startOfWeek, endOfWeek, subWeeks,
  eachMonthOfInterval, eachWeekOfInterval,
} from "date-fns";
import { es } from "date-fns/locale";
import { DashboardPeriod, getPeriodRange } from "@/lib/period";
import { useTheme } from "@/lib/theme";
import { formatCurrency } from "@/lib/format";

interface Bucket {
  key: string;
  label: string;
  revenue: number;
  orders: number;
}

interface Props {
  period: DashboardPeriod;
  /** Filtro opcional: estados de orden a EXCLUIR (ej. ["cancelled"]). */
  ordersExcludeStatuses?: string[];
}

export default function BusinessTrends({
  period,
  ordersExcludeStatuses = ["cancelled"],
}: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Paleta Mictio (gris monocromática + acentos en última barra/punto)
  const barColor       = isDark ? "rgba(255,255,255,0.25)" : "#111111";
  const barColorActive = isDark ? "rgba(255,255,255,0.55)" : "#111111";
  const lineColor      = isDark ? "rgba(255,255,255,0.70)" : "#111111";
  const axisColor      = isDark ? "rgba(255,255,255,0.30)" : "#AAAAAA";
  const gridColor      = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";

  const { granularity, start: periodStart, end: periodEnd } = getPeriodRange(period);
  const anchor = period.date;
  const isRelative = period.mode === "month" || period.mode === "week";

  function buildBuckets(): Bucket[] {
    if (isRelative) {
      if (granularity === "month") {
        const base = startOfMonth(anchor);
        return Array.from({ length: 6 }).map((_, i) => {
          const d = subMonths(base, 5 - i);
          return { key: format(d, "yyyy-MM"), label: format(d, "MMM", { locale: es }), revenue: 0, orders: 0 };
        });
      }
      const base = startOfWeek(anchor, { weekStartsOn: 1 });
      return Array.from({ length: 8 }).map((_, i) => {
        const d = subWeeks(base, 7 - i);
        return { key: format(d, "yyyy-'W'II"), label: format(d, "d MMM", { locale: es }), revenue: 0, orders: 0 };
      });
    }
    if (granularity === "month") {
      return eachMonthOfInterval({ start: periodStart, end: periodEnd }).map((d) => ({
        key: format(d, "yyyy-MM"), label: format(d, "MMM", { locale: es }), revenue: 0, orders: 0,
      }));
    }
    return eachWeekOfInterval({ start: periodStart, end: periodEnd }, { weekStartsOn: 1 }).map((d) => ({
      key: format(d, "yyyy-'W'II"), label: format(d, "d MMM", { locale: es }), revenue: 0, orders: 0,
    }));
  }

  const rangeStart = isRelative
    ? (granularity === "month"
        ? startOfMonth(subMonths(anchor, 5)).toISOString()
        : startOfWeek(subWeeks(anchor, 7), { weekStartsOn: 1 }).toISOString())
    : periodStart.toISOString();
  const rangeEnd = isRelative
    ? (granularity === "month" ? endOfMonth(anchor).toISOString() : endOfWeek(anchor, { weekStartsOn: 1 }).toISOString())
    : periodEnd.toISOString();

  const { data, isLoading } = useQuery({
    queryKey: ["business-trends", granularity, rangeStart, rangeEnd, ordersExcludeStatuses.join(",")],
    queryFn: async () => {
      let ordersQ = supabase
        .from("orders")
        .select("received_at, status")
        .gte("received_at", rangeStart)
        .lte("received_at", rangeEnd);
      for (const s of ordersExcludeStatuses) ordersQ = ordersQ.neq("status", s as any);

      const [revRes, ordRes] = await Promise.all([
        supabase
          .from("cash_entries")
          .select("amount, created_at, type")
          .eq("type", "income")
          .gte("created_at", rangeStart)
          .lte("created_at", rangeEnd),
        ordersQ,
      ]);
      if (revRes.error) throw revRes.error;
      if (ordRes.error) throw ordRes.error;

      const buckets = buildBuckets();
      const idx = new Map(buckets.map((b, i) => [b.key, i]));
      const keyFor = (d: Date) =>
        granularity === "month"
          ? format(d, "yyyy-MM")
          : format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-'W'II");

      for (const r of (revRes.data ?? []) as any[]) {
        const i = idx.get(keyFor(new Date(r.created_at)));
        if (i !== undefined) buckets[i].revenue += Number(r.amount ?? 0);
      }
      for (const o of (ordRes.data ?? []) as any[]) {
        const i = idx.get(keyFor(new Date(o.received_at)));
        if (i !== undefined) buckets[i].orders += 1;
      }
      return buckets;
    },
  });

  const buckets = data ?? buildBuckets();

  // Totales del header: SOLO el período seleccionado
  const periodStartIso = periodStart.toISOString();
  const periodEndIso = periodEnd.toISOString();

  const { data: periodTotals } = useQuery({
    queryKey: ["business-trends-totals", periodStartIso, periodEndIso, ordersExcludeStatuses.join(",")],
    queryFn: async () => {
      let ordersCountQ = supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .gte("received_at", periodStartIso)
        .lte("received_at", periodEndIso);
      for (const s of ordersExcludeStatuses) ordersCountQ = ordersCountQ.neq("status", s as any);

      const [revRes, ordRes] = await Promise.all([
        supabase
          .from("cash_entries")
          .select("amount")
          .eq("type", "income")
          .gte("created_at", periodStartIso)
          .lte("created_at", periodEndIso),
        ordersCountQ,
      ]);
      if (revRes.error) throw revRes.error;
      if (ordRes.error) throw ordRes.error;
      const revenue = ((revRes.data ?? []) as any[]).reduce(
        (s, r) => s + Number(r.amount ?? 0), 0
      );
      return { revenue, orders: ordRes.count ?? 0 };
    },
  });

  const totalRevenue = periodTotals?.revenue ?? 0;
  const totalOrders = periodTotals?.orders ?? 0;

  const subtitle = isRelative
    ? granularity === "month" ? "Últimos 6 meses" : "Últimas 8 semanas"
    : getPeriodRange(period).label;

  const lastIndex = buckets.length - 1;

  return (
    <div className="animate-fade-up">
      <div className="flex items-end justify-between mb-3">
        <h2 className="text-[15px] font-semibold">Tendencias del negocio</h2>
        <span className="text-[11px] text-muted">{subtitle}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stagger mb-8">
        {/* Ingresos */}
        <div className="mictio-card p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="eyebrow">
              Ingresos por {granularity === "month" ? "mes" : "semana"}
            </span>
            <span className="text-[13px] font-semibold tabular-nums">{formatCurrency(totalRevenue)}</span>
          </div>
          <div className="h-[220px]">
            {isLoading ? (
              <div className="text-muted text-sm">Cargando...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={buckets} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={gridColor} vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} width={50}
                    tickFormatter={(v) => formatCurrency(Number(v))} />
                  <Tooltip
                    cursor={{ fill: gridColor }}
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v: any) => [formatCurrency(Number(v)), "Ingresos"]}
                  />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                    {buckets.map((_, i) => (
                      <Cell key={i} fill={i === lastIndex ? barColorActive : barColor} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Órdenes */}
        <div className="mictio-card p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="eyebrow">
              Órdenes por {granularity === "month" ? "mes" : "semana"}
            </span>
            <span className="text-[13px] font-semibold tabular-nums">{totalOrders} órdenes</span>
          </div>
          <div className="h-[220px]">
            {isLoading ? (
              <div className="text-muted text-sm">Cargando...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={buckets} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={lineColor} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={gridColor} vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                  <Tooltip
                    cursor={{ stroke: axisColor, strokeWidth: 1 }}
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v: any) => [v, "Órdenes"]}
                  />
                  <Area type="monotone" dataKey="orders" stroke={lineColor} strokeWidth={2} fill="url(#ordersGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
