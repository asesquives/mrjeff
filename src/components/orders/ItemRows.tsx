import { Trash2, Plus } from "lucide-react";

export type ItemDraft = {
  item_type: "polo" | "pantalon" | "camisa" | "short" | "vestido" | "sabana" | "toalla" | "otro";
  color_tag: "blanco" | "color";
  quantity_in: number;
  unit_price: number;
};

const TYPES: ItemDraft["item_type"][] = ["polo", "pantalon", "camisa", "short", "vestido", "sabana", "toalla", "otro"];

export const ItemRows = ({
  items,
  onChange,
}: {
  items: ItemDraft[];
  onChange: (next: ItemDraft[]) => void;
}) => {
  const update = (i: number, patch: Partial<ItemDraft>) => {
    const next = items.map((it, idx) => (idx === i ? { ...it, ...patch } : it));
    onChange(next);
  };
  const add = () =>
    onChange([...items, { item_type: "polo", color_tag: "color", quantity_in: 1, unit_price: 0 }]);
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-12 gap-2 eyebrow text-[10px] px-1">
        <div className="col-span-3">Prenda</div>
        <div className="col-span-3">Color</div>
        <div className="col-span-2">Cant.</div>
        <div className="col-span-2">P.U.</div>
        <div className="col-span-2 text-right">Subtotal</div>
      </div>

      {items.map((it, i) => {
        const subtotal = (Number(it.quantity_in) || 0) * (Number(it.unit_price) || 0);
        return (
          <div key={i} className="grid grid-cols-12 gap-2 items-center">
            <select
              value={it.item_type}
              onChange={(e) => update(i, { item_type: e.target.value as any })}
              className="col-span-3 bg-background border border-border rounded-md px-2 py-1.5 text-[12px]"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <div className="col-span-3 flex border border-border rounded-md p-0.5">
              {(["blanco", "color"] as const).map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => update(i, { color_tag: c })}
                  className={`flex-1 text-[11px] py-1 rounded transition-colors ${
                    it.color_tag === c ? "bg-surface text-foreground" : "text-muted"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <input
              type="number"
              min={1}
              value={it.quantity_in}
              onChange={(e) => update(i, { quantity_in: parseInt(e.target.value || "0") })}
              className="col-span-2 bg-background border border-border rounded-md px-2 py-1.5 text-[12px]"
            />

            <input
              type="number"
              step="0.01"
              min={0}
              value={it.unit_price}
              onChange={(e) => update(i, { unit_price: parseFloat(e.target.value || "0") })}
              className="col-span-2 bg-background border border-border rounded-md px-2 py-1.5 text-[12px]"
            />

            <div className="col-span-2 flex items-center justify-end gap-2">
              <span className="text-[12px] font-medium">S/ {subtotal.toFixed(2)}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-muted hover:text-danger"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={add}
        className="flex items-center gap-1.5 text-[12px] text-accent hover:opacity-80 mt-2"
      >
        <Plus size={12} /> Agregar prenda
      </button>
    </div>
  );
};
