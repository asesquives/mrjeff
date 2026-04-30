import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Plus, Search, Pencil } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { ClientProfileDialog } from "@/components/clients/ClientProfileDialog";
import { ClientFormDialog } from "@/components/clients/ClientFormDialog";

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export default function Clients() {
  const [list, setList] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
    setList(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return list;
    return list.filter(
      (c) =>
        c.name?.toLowerCase().includes(s) ||
        c.phone?.toLowerCase().includes(s) ||
        c.email?.toLowerCase().includes(s)
    );
  }, [list, q]);

  return (
    <>
      <PageHeader
        eyebrow="Directorio"
        title="Clientes"
        action={
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 bg-foreground text-background font-semibold text-[13px] px-4 py-2 rounded-md hover:opacity-90"
          >
            <Plus size={14} /> Nuevo cliente
          </button>
        }
      />

      <div className="flex items-center gap-2 bg-background border border-border rounded-md px-3 py-2 mb-4 max-w-md animate-fade-up">
        <Search size={13} className="text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, teléfono o email…"
          className="flex-1 bg-transparent text-[13px] focus:outline-none"
        />
      </div>

      <div className="mictio-card overflow-hidden animate-fade-up">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left border-b border-border">
              <th className="px-4 py-3 eyebrow">Nombre</th>
              <th className="px-4 py-3 eyebrow">Teléfono</th>
              <th className="px-4 py-3 eyebrow">Email</th>
              <th className="px-4 py-3 eyebrow">Notas</th>
              <th className="px-4 py-3 eyebrow text-right"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr
                key={c.id}
                onClick={() => setProfileId(c.id)}
                className="border-b border-border last:border-0 hover:bg-surface/60 cursor-pointer"
              >
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-muted">{c.phone ?? "—"}</td>
                <td className="px-4 py-3 text-muted">{c.email ?? "—"}</td>
                <td className="px-4 py-3 text-muted text-[12px] truncate max-w-[220px]">{c.notes ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditing(c); }}
                    className="text-muted hover:text-foreground"
                  >
                    <Pencil size={13} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="text-center py-10 text-muted">Sin clientes</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {creating && (
        <ClientFormDialog
          onClose={() => setCreating(false)}
          onSaved={() => { setCreating(false); load(); }}
        />
      )}
      {editing && (
        <ClientFormDialog
          client={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
      {profileId && (
        <ClientProfileDialog
          clientId={profileId}
          onClose={() => setProfileId(null)}
          onEdit={(c) => { setProfileId(null); setEditing(c); }}
        />
      )}
    </>
  );
}

export { schema };
