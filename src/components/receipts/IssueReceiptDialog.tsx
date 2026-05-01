import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, FileText } from "lucide-react";
import { toast } from "sonner";

export const IssueReceiptDialog = ({
  orderId,
  defaultClientName,
  onClose,
  onSaved,
}: {
  orderId: string;
  defaultClientName?: string;
  onClose: () => void;
  onSaved?: () => void;
}) => {
  const [type, setType] = useState<"boleta" | "factura">("boleta");
  const [name, setName] = useState(defaultClientName ?? "");
  const [doc, setDoc] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(defaultClientName ?? "");
  }, [defaultClientName]);

  const submit = async () => {
    if (!name.trim()) return toast.error("Ingresa el nombre del cliente");
    if (type === "factura" && doc.trim().length !== 11)
      return toast.error("RUC debe tener 11 dígitos");
    if (type === "boleta" && doc && doc.trim().length !== 8)
      return toast.error("DNI debe tener 8 dígitos (o dejar vacío)");

    setBusy(true);
    const { error } = await supabase.from("receipts").insert({
      order_id: orderId,
      receipt_type: type,
      client_name: name.trim(),
      client_doc: doc.trim() || null,
      status: "pending",
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Comprobante registrado (pendiente de emisión)");
    onSaved?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-start justify-center px-4 py-8 overflow-y-auto" onClick={onClose}>
      <div className="mictio-card bg-background w-full max-w-md p-6 animate-fade-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="eyebrow mb-1 flex items-center gap-1.5"><FileText size={11} /> Comprobante</div>
            <h2 className="h2">Emitir comprobante</h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-foreground"><X size={18} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <div className="eyebrow mb-2">Tipo</div>
            <div className="flex p-1 rounded-md border border-border bg-background">
              {(["boleta", "factura"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-1 text-[12px] py-1.5 rounded capitalize transition-colors ${
                    type === t ? "bg-surface text-foreground font-medium" : "text-muted hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="eyebrow mb-1.5">{type === "factura" ? "Razón social" : "Nombre del cliente"}</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-[13px] focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <div className="eyebrow mb-1.5">{type === "factura" ? "RUC (11 dígitos)" : "DNI (8 dígitos · opcional)"}</div>
            <input
              value={doc}
              onChange={(e) => setDoc(e.target.value.replace(/\D/g, ""))}
              maxLength={type === "factura" ? 11 : 8}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-[13px] focus:outline-none focus:border-accent"
            />
          </div>

          <div className="text-[11px] text-muted p-3 rounded-md" style={{ background: "hsl(var(--accent) / 0.08)" }}>
            Quedará en estado <span className="font-semibold text-foreground">Pendiente</span>. La emisión electrónica con SUNAT se conectará en v2 (Nubefact).
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button onClick={onClose} className="text-[12px] text-muted hover:text-foreground px-3 py-2">Cancelar</button>
            <button
              onClick={submit}
              disabled={busy}
              className="bg-foreground text-background font-semibold text-[13px] px-4 py-2 rounded-md hover:opacity-90 disabled:opacity-50"
            >
              Registrar comprobante
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
