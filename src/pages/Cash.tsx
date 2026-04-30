import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { MetricCard } from "@/components/MetricCard";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

const METHODS = ["cash", "yape", "pos", "bank"] as const;

export default function Cash() {
  const [list, setList] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: "income", method: "cash", amount: "", description: "" });

  const load = async () => {
    const { data } = await supabase.from("cash_entries").select("*").order("created_at", { ascending: false }).limit(100);
    setList(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) return toast.error("Monto inválido");
    if (form.description.length > 200) return toast.error("Descripción muy larga");
    const { error } = await supabase.from("cash_entries").insert({
      type: form.type as any,
      method: form.method as any,
      amount,
      description: form.description.trim() || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Movimiento registrado");
    setForm({ type: "income", method: "cash", amount: "", description: "" });
    setOpen(false);
    load();
  };

  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const todayList = list.filter((c) => c.created_at >= start);
  const income = todayList.filter((c) => c.type === "income").reduce((s, c) => s + Number(c.amount), 0);
  const expense = todayList.filter((c) => c.type === "expense").reduce((s, c) => s + Number(c.amount), 0);

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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger mb-8">
        <MetricCard label="Ingresos hoy" value={`S/ ${income.toFixed(2)}`} deltaTone="pos" />
        <MetricCard label="Egresos hoy" value={`S/ ${expense.toFixed(2)}`} deltaTone="neg" />
        <MetricCard label="Balance hoy" value={`S/ ${(income - expense).toFixed(2)}`} />
      </div>

      <div className="mictio-card overflow-hidden animate-fade-up">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left border-b border-border">
              <th className="px-4 py-3 eyebrow">Fecha</th>
              <th className="px-4 py-3 eyebrow">Tipo</th>
              <th className="px-4 py-3 eyebrow">Método</th>
              <th className="px-4 py-3 eyebrow">Descripción</th>
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
                <td className={`px-4 py-3 text-right font-semibold ${c.type === "income" ? "text-success" : "text-danger"}`}>
                  {c.type === "income" ? "+" : "-"}S/ {Number(c.amount).toFixed(2)}
                </td>
              </tr>
            ))}
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
                <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}
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
