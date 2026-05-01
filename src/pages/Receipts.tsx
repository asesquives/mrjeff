import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Search, Check } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatCurrency } from "@/lib/format";

type Tab = "pending" | "all";

export default function Receipts() {
  const [tab, setTab] = useState<Tab>("pending");
  const [list, setList] = useState<any[]>([]);
  const [q, setQ] = useState("");

  const load = async () => {
    const { data } = await supabase
      .from("receipts")
      .select("*, orders(total_amount, received_at, clients(name))")
      .order("created_at", { ascending: false });
    setList(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let l = list;
    if (tab === "pending") l = l.filter((r) => r.status === "pending");
    const s = q.trim().toLowerCase();
    if (s) l = l.filter((r) => r.client_name?.toLowerCase().includes(s) || r.client_doc?.includes(s));
    return l;
  }, [list, tab, q]);

  const pendingCount = list.filter((r) => r.status === "pending").length;

  const markIssued = async (id: string) => {
    const { error } = await supabase.from("receipts").update({ status: "issued" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Marcado como emitido");
    load();
  };

  return (
    <>
      <PageHeader eyebrow="Facturación" title="Comprobantes" />

      <div className="flex items-center gap-2 mb-4 animate-fade-up">
        <div className="flex p-1 rounded-md border border-border bg-background">
          <button
            onClick={() => setTab("pending")}
            className={`text-[12px] px-3 py-1.5 rounded transition-colors ${
              tab === "pending" ? "bg-surface text-foreground font-medium" : "text-muted hover:text-foreground"
            }`}
          >
            Pendientes {pendingCount > 0 && <span className="ml-1 text-warning">({pendingCount})</span>}
          </button>
          <button
            onClick={() => setTab("all")}
            className={`text-[12px] px-3 py-1.5 rounded transition-colors ${
              tab === "all" ? "bg-surface text-foreground font-medium" : "text-muted hover:text-foreground"
            }`}
          >
            Historial
          </button>
        </div>

        <div className="flex items-center gap-2 bg-background border border-border rounded-md px-3 py-2 flex-1 max-w-sm ml-auto">
          <Search size={13} className="text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar cliente o documento…"
            className="flex-1 bg-transparent text-[13px] focus:outline-none"
          />
        </div>
      </div>

      <div className="mictio-card overflow-hidden animate-fade-up">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left border-b border-border">
              <th className="px-4 py-3 eyebrow">Fecha</th>
              <th className="px-4 py-3 eyebrow">Tipo</th>
              <th className="px-4 py-3 eyebrow">Cliente</th>
              <th className="px-4 py-3 eyebrow">Documento</th>
              <th className="px-4 py-3 eyebrow text-right">Monto</th>
              <th className="px-4 py-3 eyebrow">Estado</th>
              <th className="px-4 py-3 eyebrow text-right"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface/60">
                <td className="px-4 py-3 text-muted text-[12px]">
                  {format(new Date(r.created_at), "d MMM yyyy", { locale: es })}
                </td>
                <td className="px-4 py-3 capitalize font-medium">{r.receipt_type}</td>
                <td className="px-4 py-3">{r.client_name}</td>
                <td className="px-4 py-3 text-muted">{r.client_doc ?? "—"}</td>
                <td className="px-4 py-3 text-right font-medium">
                  {r.orders ? formatCurrency(Number(r.orders.total_amount)) : "—"}
                </td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3 text-right">
                  {r.status === "pending" && (
                    <button
                      onClick={() => markIssued(r.id)}
                      className="inline-flex items-center gap-1 border border-border rounded-md px-2.5 py-1 text-[11px] text-muted hover:text-foreground hover:border-accent"
                    >
                      <Check size={11} /> Marcar emitido
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-10 text-muted">Sin comprobantes</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-[11px] text-muted mt-3">
        Los comprobantes en estado <span className="text-warning font-medium">Pendiente</span> aún no se emiten ante SUNAT. La integración con Nubefact llegará en v2.
      </div>
    </>
  );
}
