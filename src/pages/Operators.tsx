import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";

export default function Operators() {
  const [list, setList] = useState<any[]>([]);

  const load = async () => {
    const { data } = await supabase.from("operators").select("*").order("created_at", { ascending: false });
    setList(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const toggle = async (id: string, is_active: boolean) => {
    const { error } = await supabase.from("operators").update({ is_active: !is_active }).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <>
      <PageHeader eyebrow="Equipo" title="Operadores" />

      <div className="mictio-card p-5 mb-5 animate-fade-up">
        <p className="text-[12px] text-muted">
          Los operadores se crean automáticamente cuando un usuario se registra en el sistema. Aquí puedes activar o desactivar al personal.
        </p>
      </div>

      <div className="mictio-card overflow-hidden animate-fade-up">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left border-b border-border">
              <th className="px-4 py-3 eyebrow">Nombre</th>
              <th className="px-4 py-3 eyebrow">Tipo</th>
              <th className="px-4 py-3 eyebrow">Estado</th>
              <th className="px-4 py-3 eyebrow text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {list.map((o) => (
              <tr key={o.id} className="border-b border-border last:border-0 hover:bg-surface/50">
                <td className="px-4 py-3 font-medium">{o.name}</td>
                <td className="px-4 py-3 text-muted text-[11px] uppercase tracking-wider">
                  {o.user_id ? "Con login" : "Catálogo"}
                </td>
                <td className="px-4 py-3">
                  <span className={`badge-state ${o.is_active ? "badge-state-pos" : "badge-state-neg"}`}>
                    {o.is_active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => toggle(o.id, o.is_active)}
                    className="text-[11px] border border-border px-3 py-1 rounded text-muted hover:text-foreground hover:border-accent">
                    {o.is_active ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
