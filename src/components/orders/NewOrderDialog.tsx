import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ClientPicker } from "./ClientPicker";
import { ItemRows, ItemDraft } from "./ItemRows";
import { X } from "lucide-react";
import { toast } from "sonner";

const METHODS = ["cash", "yape", "pos", "bank"] as const;

export const NewOrderDialog = ({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) => {
  const [client, setClient] = useState<{ id: string; name: string; phone: string | null } | null>(null);
  const [operators, setOperators] = useState<any[]>([]);
  const [operatorId, setOperatorId] = useState<string>("");
  const [promisedAt, setPromisedAt] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    d.setHours(18, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [paymentMethod, setPaymentMethod] = useState<typeof METHODS[number]>("cash");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemDraft[]>([
    { item_type: "polo", color_tag: "color", quantity_in: 1, unit_price: 0 },
  ]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("operators").select("id,name").eq("is_active", true).order("name").then(({ data }) => {
      setOperators(data ?? []);
      if (data && data.length && !operatorId) setOperatorId(data[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = items.reduce((s, it) => s + (Number(it.quantity_in) || 0) * (Number(it.unit_price) || 0), 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return toast.error("Selecciona un cliente");
    if (!operatorId) return toast.error("Selecciona un operador");
    if (items.length === 0) return toast.error("Agrega al menos una prenda");
    if (items.some((it) => !it.quantity_in || it.quantity_in < 1)) return toast.error("Cantidades inválidas");

    setBusy(true);
    try {
      const { data: order, error: e1 } = await supabase
        .from("orders")
        .insert({
          client_id: client.id,
          operator_id: operatorId,
          status: "received",
          promised_at: new Date(promisedAt).toISOString(),
          payment_method: paymentMethod,
          total_amount: total,
          notes: notes.trim() || null,
        })
        .select("id")
        .single();
      if (e1 || !order) throw e1 ?? new Error("No se pudo crear la orden");

      const itemRows = items.map((it) => ({
        order_id: order.id,
        item_type: it.item_type,
        color_tag: it.color_tag,
        quantity_in: it.quantity_in,
        quantity_out: 0,
        unit_price: it.unit_price,
        subtotal: (Number(it.quantity_in) || 0) * (Number(it.unit_price) || 0),
      }));
      const { error: e2 } = await supabase.from("order_items").insert(itemRows);
      if (e2) throw e2;

      toast.success("Orden creada");
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? "Error al crear orden");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center px-4 py-8 overflow-y-auto" onClick={onClose}>
      <div className="mictio-card bg-background w-full max-w-2xl p-6 animate-fade-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="eyebrow mb-1">Nueva orden</div>
            <h2 className="h2">Registrar orden</h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-foreground"><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="eyebrow block mb-1.5">Cliente</label>
            <ClientPicker value={client} onChange={setClient} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="eyebrow block mb-1.5">Operador</label>
              <select value={operatorId} onChange={(e) => setOperatorId(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-[13px]">
                {operators.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div>
              <label className="eyebrow block mb-1.5">Promesa entrega</label>
              <input type="datetime-local" value={promisedAt} onChange={(e) => setPromisedAt(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-[13px]" />
            </div>
            <div>
              <label className="eyebrow block mb-1.5">Método de pago</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-[13px]">
                {METHODS.map((m) => <option key={m} value={m}>{m.toUpperCase()}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="eyebrow block mb-2">Prendas</label>
            <ItemRows items={items} onChange={setItems} />
          </div>

          <div>
            <label className="eyebrow block mb-1.5">Notas</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-[13px]" />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div>
              <div className="eyebrow">Total</div>
              <div className="num-display">S/ {total.toFixed(2)}</div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="border border-border rounded-md px-4 py-2 text-[13px] text-muted hover:text-foreground">
                Cancelar
              </button>
              <button type="submit" disabled={busy}
                className="bg-foreground text-background font-semibold text-[13px] px-5 py-2 rounded-md hover:opacity-90 disabled:opacity-50">
                {busy ? "Creando…" : "Crear orden"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
