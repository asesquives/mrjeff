import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, Plus, Check } from "lucide-react";
import { toast } from "sonner";

type Client = { id: string; name: string; phone: string | null };

export const ClientPicker = ({
  value,
  onChange,
}: {
  value: Client | null;
  onChange: (c: Client) => void;
}) => {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (q.trim().length < 1) {
        const { data } = await supabase.from("clients").select("id,name,phone").order("created_at", { ascending: false }).limit(8);
        setResults(data ?? []);
      } else {
        const { data } = await supabase
          .from("clients")
          .select("id,name,phone")
          .or(`name.ilike.%${q}%,phone.ilike.%${q}%`)
          .limit(10);
        setResults(data ?? []);
      }
    }, 150);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const createClient = async () => {
    const name = newName.trim();
    if (!name) return toast.error("Nombre requerido");
    if (name.length > 100) return toast.error("Nombre muy largo");
    const { data, error } = await supabase
      .from("clients")
      .insert({ name, phone: newPhone.trim() || null })
      .select("id,name,phone")
      .single();
    if (error || !data) return toast.error(error?.message ?? "Error");
    toast.success("Cliente creado");
    onChange(data);
    setCreating(false);
    setNewName("");
    setNewPhone("");
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <div
        className="flex items-center gap-2 bg-background border border-border rounded-md px-3 py-2 cursor-text"
        onClick={() => setOpen(true)}
      >
        <Search size={13} className="text-muted" />
        <input
          value={value && !open ? value.name : q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar cliente por nombre o teléfono…"
          className="flex-1 bg-transparent text-[13px] focus:outline-none"
        />
        {value && <Check size={13} className="text-success" />}
      </div>

      {open && (
        <div className="absolute z-10 left-0 right-0 mt-1 mictio-card bg-background max-h-[280px] overflow-auto">
          {!creating && (
            <>
              {results.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => { onChange(c); setOpen(false); setQ(""); }}
                  className="w-full text-left px-3 py-2 hover:bg-surface text-[13px] flex items-center justify-between"
                >
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted text-[11px]">{c.phone ?? ""}</span>
                </button>
              ))}
              {results.length === 0 && (
                <div className="px-3 py-3 text-[12px] text-muted">Sin resultados</div>
              )}
              <button
                type="button"
                onClick={() => { setCreating(true); setNewName(q); }}
                className="w-full text-left px-3 py-2 border-t border-border text-[12px] text-accent hover:bg-surface flex items-center gap-1.5"
              >
                <Plus size={12} /> Crear cliente nuevo
              </button>
            </>
          )}

          {creating && (
            <div className="p-3 space-y-2">
              <div className="eyebrow">Nuevo cliente</div>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nombre"
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-[13px]"
              />
              <input
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="Teléfono (opcional)"
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-[13px]"
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setCreating(false)} className="flex-1 border border-border rounded-md py-1.5 text-[12px] text-muted hover:text-foreground">
                  Cancelar
                </button>
                <button type="button" onClick={createClient} className="flex-1 bg-foreground text-background font-semibold text-[12px] py-1.5 rounded-md hover:opacity-90">
                  Crear
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
