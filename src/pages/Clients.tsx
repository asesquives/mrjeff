import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(1, "Nombre requerido").max(100),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export default function Clients() {
  const [list, setList] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });

  const load = async () => {
    const { data } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
    setList(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      notes: form.notes.trim() || null,
    };
    const { error } = await supabase.from("clients").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Cliente agregado");
    setForm({ name: "", phone: "", email: "", notes: "" });
    setOpen(false);
    load();
  };

  return (
    <>
      <PageHeader
        eyebrow="Directorio"
        title="Clientes"
        action={
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 bg-foreground text-background font-semibold text-[13px] px-4 py-2 rounded-md hover:opacity-90"
          >
            <Plus size={14} /> Nuevo cliente
          </button>
        }
      />

      <div className="mictio-card overflow-hidden animate-fade-up">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left border-b border-border">
              <th className="px-4 py-3 eyebrow">Nombre</th>
              <th className="px-4 py-3 eyebrow">Teléfono</th>
              <th className="px-4 py-3 eyebrow">Email</th>
              <th className="px-4 py-3 eyebrow">Notas</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface/50">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-muted">{c.phone ?? "—"}</td>
                <td className="px-4 py-3 text-muted">{c.email ?? "—"}</td>
                <td className="px-4 py-3 text-muted text-[12px]">{c.notes ?? "—"}</td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={4} className="text-center py-10 text-muted">Sin clientes</td></tr>}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" onClick={() => setOpen(false)}>
          <div className="mictio-card bg-background w-full max-w-md p-6 animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <h2 className="h2 mb-4">Nuevo cliente</h2>
            <form onSubmit={save} className="space-y-3">
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
                <button type="button" onClick={() => setOpen(false)} className="flex-1 border border-border rounded-md py-2 text-[13px] text-muted hover:text-foreground hover:border-accent">Cancelar</button>
                <button type="submit" className="flex-1 bg-foreground text-background font-semibold text-[13px] py-2 rounded-md hover:opacity-90">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
