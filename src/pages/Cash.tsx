import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { MetricCard } from "@/components/MetricCard";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { formatCurrency, limaIso, startOfMonthLima, startOfTodayLima, endOfTodayLima } from "@/lib/format";

const METHODS = ["cash", "yape", "pos", "bank"] as const;
type Method = typeof METHODS[number];

export default function Cash() {
  const [list, setList] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: "income", method: "cash" as Method, amount: "", description: "" });
  const [filter, setFilter] = useState<"today" | "month">("today");

  const load = async () => {
    const start = filter === "today" ? startOfTodayLima() : startOfMonthLima(0);
    const end = filter === "today" ? endOfTodayLima() : limaIso(9999, 1, 1);
    const { data } = await supabase
      .from("cash_entries")
      .select("*")
      .gte("created_at", start)
      .lt("created_at", end)
      .order("created_at", { ascending: false })
      .limit(500);
    setList(data ?? []);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) return toast.error("Monto inválido");
    if (form.description.length > 200) return toast.error("Descripción muy larga");
    const { error } = await supabase.from("cash_entries").insert({
      type: form.type as any,
      method: form.method,
      amount,
      description: form.description.trim() || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Movimiento registrado");
    setForm({ type: "income", method: "cash", amount: "", description: "" });
    setOpen(false);
    load();
  };

  const totals = useMemo(() => {
    const income = list.filter((c) => c.type === "income").reduce((s, c) => s + Number(c.amount), 0);
    const expense = list.filter((c) => c.type === "expense").reduce((s, c) => s + Number(c.amount), 0);
    const byMethod: Record<Method, { in: number; out: number }> = {
      cash: { in: 0, out: 0 }, yape: { in: 0, out: 0 }, pos: { in: 0, out: 0 }, bank: { in: 0, out: 0 },
    };
    list.forEach((c) => {
      const m = c.method as Method;
      if (!byMethod[m]) return;
      if (c.type === "income") byMethod[m].in += Number(c.amount);
      else byMethod[m].out += Number(c.amount);
    });
    return { income, expense, byMethod, balance: income - expense };
  }, [list]);

  return (
    <>
      <PageHeader
        eyebrow="Finanzas"
        title="Caja"
        action={
          <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 bg-foreground text-background font-semibold text-[13px] px-4 py-2 rounded-md hover:opacity-90">
            <Plus size={14} /> Movimiento
          </button>
        }
      />

      <div className="flex gap-2 mb-5 animate-fade-up">
        {([
          { k: "today", l: "Hoy" },
          { k: "month", l: "Este mes" },
        ] as const).map((f) => (
          <button
            key={f.k}
            onClick={() => setFilter(f.k)}
            className={`text-[12px] px-3 py-1.5 rounded-md border transition-colors ${
              filter === f.k ? "border-accent text-foreground bg-surface" : "border-border text-muted hover:text-foreground"
            }`}
          >
            {f.l}
          </button>
        ))}
        <span className="text-[11px] text-muted self-center ml-2">Zona horaria: Lima (UTC-5)</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger mb-6">
        <MetricCard label="Ingresos" value={formatCurrency(totals.income)} deltaTone="pos" />
        <MetricCard label="Egresos" value={formatCurrency(totals.expense)} deltaTone="neg" />
        <MetricCard label="Balance" value={formatCurrency(totals.balance)} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 stagger mb-8">
        {METHODS.map((m) => {
          const net = totals.byMethod[m].in - totals.byMethod[m].out;
          return (
            <div key={m} className="mictio-card p-4">
              <div className="eyebrow mb-2">{m}</div>
              <div className="text-[18px] font-bold tracking-tight">{formatCurrency(net)}</div>
              <div className="flex items-center gap-2 mt-1 text-[10px]">
                <span className="text-success">+{formatCurrency(totals.byMethod[m].in)}</span>
                <span className="text-danger">−{formatCurrency(totals.byMethod[m].out)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mictio-card overflow-hidden animate-fade-up">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left border-b border-border">
              <th className="px-4 py-3 eyebrow">Fecha</th>
              <th className="px-4 py-3 eyebrow">Tipo</th>
              <th className="px-4 py-3 eyebrow">Método</th>
              <th className="px-4 py-3 eyebrow">Descripción</th>
              <th className="px-4 py-3 eyebrow">Origen</th>
              <th className="px-4 py-3 eyebrow text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface/50">
                <td className="px-4 py-3 text-muted">{format(new Date(c.created_at), "d MMM HH:mm", { locale: es })}</td>
                <td className="px-4 py-3">
                  <span className={`badge-state ${c.type === "income" ? "badge-state-pos" : "badge-state-neg"}`}>
                    {c.type === "income" ? "Ingreso" : "Egreso"}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted uppercase text-[11px]">{c.method}</td>
                <td className="px-4 py-3 text-muted">{c.description ?? "—"}</td>
                <td className="px-4 py-3 text-[10px]">
                  {c.reference_order_id
                    ? <span className="badge-state badge-state-neutral">Orden</span>
                    : <span className="text-muted">Manual</span>}
                </td>
                <td className={`px-4 py-3 text-right font-semibold ${c.type === "income" ? "text-success" : "text-danger"}`}>
                  {c.type === "income" ? "+" : "−"}{formatCurrency(Number(c.amount))}
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-muted text-[12px]">Sin movimientos en este rango</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" onClick={() => setOpen(false)}>
          <div className="mictio-card bg-background w-full max-w-md p-6 animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <h2 className="h2 mb-4">Nuevo movimiento</h2>
            <form onSubmit={save} className="space-y-3">
              <div>
                <label className="eyebrow block mb-1.5">Tipo</label>
                <div className="flex gap-2">
                  {(["income", "expense"] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setForm({ ...form, type: t })}
                      className={`flex-1 text-[12px] py-2 rounded-md border ${form.type === t ? "border-accent bg-surface text-foreground" : "border-border text-muted"}`}>
                      {t === "income" ? "Ingreso" : "Egreso"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="eyebrow block mb-1.5">Método</label>
                <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value as Method })}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-[13px]">
                  {METHODS.map((m) => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label className="eyebrow block mb-1.5">Monto S/</label>
                <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-[13px]" required />
              </div>
              <div>
                <label className="eyebrow block mb-1.5">Descripción</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={200}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-[13px]" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 border border-border rounded-md py-2 text-[13px] text-muted hover:text-foreground">Cancelar</button>
                <button type="submit" className="flex-1 bg-foreground text-background font-semibold text-[13px] py-2 rounded-md hover:opacity-90">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
