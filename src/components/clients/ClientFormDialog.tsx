import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(1, "Nombre requerido").max(100),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  email: z.string().trim().email("Email inválido").max(255).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const ClientFormDialog = ({
  client,
  onClose,
  onSaved,
}: {
  client?: any;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [form, setForm] = useState({
    name: client?.name ?? "",
    phone: client?.phone ?? "",
    email: client?.email ?? "",
    notes: client?.notes ?? "",
  });
  const [busy, setBusy] = useState(false);
  const isEdit = !!client;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      notes: form.notes.trim() || null,
    };
    setBusy(true);
    const { error } = isEdit
      ? await supabase.from("clients").update(payload).eq("id", client.id)
      : await supabase.from("clients").insert(payload);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(isEdit ? "Cliente actualizado" : "Cliente creado");
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="mictio-card bg-background w-full max-w-md p-6 animate-fade-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="eyebrow mb-1">{isEdit ? "Editar" : "Nuevo"}</div>
            <h2 className="h2">{isEdit ? "Editar cliente" : "Nuevo cliente"}</h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-foreground"><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {[
            { k: "name", l: "Nombre *", t: "text" },
            { k: "phone", l: "Teléfono", t: "tel" },
            { k: "email", l: "Email", t: "email" },
            { k: "notes", l: "Notas", t: "text" },
          ].map((f) => (
            <div key={f.k}>
              <label className="eyebrow block mb-1.5">{f.l}</label>
              <input
                type={f.t}
                value={(form as any)[f.k]}
                onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-[13px] focus:outline-none focus:border-accent"
              />
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-border rounded-md py-2 text-[13px] text-muted hover:text-foreground">
              Cancelar
            </button>
            <button type="submit" disabled={busy} className="flex-1 bg-foreground text-background font-semibold text-[13px] py-2 rounded-md hover:opacity-90 disabled:opacity-50">
              {busy ? "…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
