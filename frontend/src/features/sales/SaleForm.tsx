import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { useProductRows } from "../products/useProductRows";
import { useCreateSale } from "./useSales";
import { useAuth } from "../auth/AuthContext";
import { useCreatePartner, usePartners } from "../partners/usePartners";
import type { FractionCode, ProductRow } from "../../types/product";
import type { PaymentMethod } from "../../types/sale";

interface Line {
  productId: number;
  fraction: FractionCode | null;
  quantity: string;
  unitPrice: string;
  reason: string;
  partnerId: number | null; // null = stock propio
  externalCost: string;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(v);

const METHODS: PaymentMethod[] = ["EFECTIVO", "YAPE", "PLIN", "TARJETA", "TRANSFERENCIA"];

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500";

const priceFor = (p: ProductRow, fr: FractionCode | null) => {
  if (!fr) return { list: p.price, floor: p.minPrice ?? p.price };
  const f = p.fractions?.find((x) => x.fraction === fr);
  return f
    ? { list: f.listPrice, floor: f.minPrice }
    : { list: p.price, floor: p.minPrice ?? p.price };
};

export default function SaleForm({ onSuccess }: { onSuccess: () => void }) {
  const { session } = useAuth();
  const isAdmin = session?.role === "ADMIN";
  const { rows } = useProductRows();
  const create = useCreateSale();
  const partners = usePartners();
  const createPartner = useCreatePartner();

  const [search, setSearch] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [customer, setCustomer] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("EFECTIVO");
  const [note, setNote] = useState("");
  const [newStore, setNewStore] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const byId = useMemo(() => new Map(rows?.map((p) => [p.id, p])), [rows]);
  const firstPartner = partners.data?.[0]?.id ?? 0;

  const term = search.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!rows || term === "") return [];
    return rows
      .filter(
        (p) =>
          p.active &&
          !lines.some((l) => l.productId === p.id) &&
          (p.name.toLowerCase().includes(term) ||
            p.code.toLowerCase().includes(term) ||
            (p.barcode ?? "").toLowerCase().includes(term))
      )
      .slice(0, 6);
  }, [rows, term, lines]);

  const addProduct = (id: number) => {
    const p = byId.get(id);
    if (!p) return;
    const sinStock = p.stock <= 0 && !p.fractionable;
    setLines((ls) => [
      ...ls,
      {
        productId: id,
        fraction: null,
        quantity: "1",
        unitPrice: String(p.price),
        reason: "",
        partnerId: sinStock ? firstPartner : null,
        externalCost: "",
      },
    ]);
    setSearch("");
  };

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const exact = rows?.find(
      (p) => p.barcode === search.trim() && p.active && !lines.some((l) => l.productId === p.id)
    );
    if (exact) addProduct(exact.id);
    else if (matches.length === 1) addProduct(matches[0].id);
  };

  const update = (i: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l, k) => (k === i ? { ...l, ...patch } : l)));

  const remove = (i: number) => setLines((ls) => ls.filter((_, k) => k !== i));

  const total = lines.reduce(
    (sum, l) => sum + (Number(l.unitPrice) || 0) * (Number(l.quantity) || 0),
    0
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (lines.length === 0) {
      setLocalError("Agrega al menos un producto");
      return;
    }

    for (const l of lines) {
      const p = byId.get(l.productId);
      if (!p) continue;
      const q = Number(l.quantity);
      const price = Number(l.unitPrice);
      if (!Number.isInteger(q) || q < 1) return setLocalError(`Cantidad inválida en ${p.name}`);
      if (!(price > 0)) return setLocalError(`Precio inválido en ${p.name}`);

      if (l.partnerId !== null) {
        if (l.partnerId === 0) return setLocalError("Agrega una tienda primero");
        const cost = Number(l.externalCost);
        if (!(cost > 0)) return setLocalError(`${p.name}: indica el costo que te cobra la tienda`);
        if (!isAdmin && price < cost)
          return setLocalError(`${p.name}: no puedes vender bajo el costo de la tienda (${fmt(cost)})`);
        continue;
      }

      if (!l.fraction && q > p.stock)
        return setLocalError(`${p.name}: solo hay ${p.stock} en stock (puedes conseguirlo en otra tienda)`);
      const { floor } = priceFor(p, l.fraction);
      if (!isAdmin && price < floor)
        return setLocalError(`${p.name}: el precio mínimo es ${fmt(floor)}`);
    }

    create.mutate(
      {
        customerName: customer.trim() || null,
        paymentMethod: method,
        note: note.trim() || null,
        items: lines.map((l) => ({
          productId: l.productId,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
          discountReason: l.reason.trim() || null,
          fraction: l.partnerId !== null ? null : l.fraction,
          partnerId: l.partnerId,
          externalCost: l.partnerId !== null ? Number(l.externalCost) : null,
        })),
      },
      { onSuccess }
    );
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="relative">
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={onSearchKey}
          placeholder="Buscar producto o escanear código de barras..."
          className={input}
        />
        {matches.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
            {matches.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => addProduct(p.id)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
                >
                  <span>
                    <span className="font-medium text-slate-800">{p.name}</span>{" "}
                    <span className="font-mono text-xs text-slate-500">{p.code}</span>
                  </span>
                  <span className={p.stock > 0 ? "text-slate-500" : "text-amber-600"}>
                    {fmt(p.price)} ·{" "}
                    {p.stock > 0 ? `stock ${p.stock}` : "Sin stock · conseguir en otra tienda"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {lines.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          Busca un producto para empezar la venta.
        </p>
      ) : (
        <div className="space-y-3">
          {lines.map((l, i) => {
            const p = byId.get(l.productId);
            if (!p) return null;
            const external = l.partnerId !== null;
            const price = Number(l.unitPrice) || 0;
            const base = priceFor(p, external ? null : l.fraction);
            const list = base.list;
            const floor = external ? Number(l.externalCost) || 0 : base.floor;
            const diff = list - price;
            const pct = list > 0 ? (diff / list) * 100 : 0;
            const belowFloor = price < floor;
            const discounted = diff > 0.004;

            return (
              <div key={i} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-800">{p.name}</div>
                    <div className="text-xs text-slate-500">
                      Lista {fmt(list)}
                      {external
                        ? " · Origen: otra tienda"
                        : ` · Mínimo ${fmt(floor)} · Stock ${p.stock}${
                            l.fraction ? " baldes cerrados" : ""
                          }`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="text-slate-400 hover:text-red-600"
                    title="Quitar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {p.fractionable && !external && (
                  <select
                    value={l.fraction ?? ""}
                    onChange={(e) => {
                      const fr = (e.target.value || null) as FractionCode | null;
                      update(i, { fraction: fr, unitPrice: String(priceFor(p, fr).list) });
                    }}
                    className={`${input} mt-2`}
                  >
                    <option value="">Balde entero</option>
                    {p.fractions?.map((f) => (
                      <option key={f.fraction} value={f.fraction}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                )}

                <label className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={external}
                    onChange={(e) =>
                      update(i, {
                        partnerId: e.target.checked ? firstPartner : null,
                        fraction: null,
                        unitPrice: String(p.price),
                      })
                    }
                  />
                  Conseguir en otra tienda
                </label>

                {external && (
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <label className="text-xs text-slate-500">
                      Tienda
                      <select
                        value={l.partnerId ?? 0}
                        onChange={(e) => update(i, { partnerId: Number(e.target.value) })}
                        className={input}
                      >
                        {(partners.data?.length ?? 0) === 0 && <option value={0}>Sin tiendas</option>}
                        {partners.data?.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs text-slate-500">
                      Costo que te cobran (por unidad)
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={l.externalCost}
                        onChange={(e) => update(i, { externalCost: e.target.value })}
                        className={input}
                      />
                    </label>
                  </div>
                )}

                <div className="mt-3 grid grid-cols-3 gap-3">
                  <label className="text-xs text-slate-500">
                    {l.fraction ? "Porciones" : "Cantidad"}
                    <input
                      type="number"
                      min={1}
                      max={l.fraction || external ? undefined : p.stock}
                      value={l.quantity}
                      onChange={(e) => update(i, { quantity: e.target.value })}
                      className={input}
                    />
                  </label>
                  <label className="text-xs text-slate-500">
                    Precio cobrado
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={l.unitPrice}
                      onChange={(e) => update(i, { unitPrice: e.target.value })}
                      className={`${input} ${belowFloor ? "border-red-400" : ""}`}
                    />
                  </label>
                  <div className="text-xs text-slate-500">
                    Subtotal
                    <div className="mt-2 text-sm font-semibold text-slate-800">
                      {fmt(price * (Number(l.quantity) || 0))}
                    </div>
                  </div>
                </div>

                {external && belowFloor && (
                  <div className="mt-2 text-xs text-red-600">
                    Por debajo del costo de la tienda
                    {isAdmin ? " · autorizado por ser administrador" : " · no se podrá registrar"}
                  </div>
                )}

                {!external && discounted && (
                  <div className={`mt-2 text-xs ${belowFloor ? "text-red-600" : "text-amber-600"}`}>
                    Rebaja de {fmt(diff)} por unidad ({pct.toFixed(1)} %)
                    {belowFloor &&
                      (isAdmin
                        ? " · bajo el mínimo (autorizado por ser administrador)"
                        : " · por debajo del mínimo, no se podrá registrar")}
                  </div>
                )}

                {discounted && (
                  <input
                    value={l.reason}
                    onChange={(e) => update(i, { reason: e.target.value })}
                    placeholder="Motivo de la rebaja (opcional)"
                    maxLength={200}
                    className={`${input} mt-2`}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs text-slate-500">
          Cliente (opcional)
          <input value={customer} onChange={(e) => setCustomer(e.target.value)} className={input} />
        </label>
        <label className="text-xs text-slate-500">
          Método de pago
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            className={input}
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m.charAt(0) + m.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block text-xs text-slate-500">
        Nota (opcional)
        <input value={note} onChange={(e) => setNote(e.target.value)} className={input} />
      </label>

      <div>
        <div className="flex gap-2">
          <input
            value={newStore}
            onChange={(e) => setNewStore(e.target.value)}
            placeholder="Nueva tienda aliada..."
            className={input}
          />
          <button
            type="button"
            disabled={newStore.trim() === "" || createPartner.isPending}
            onClick={() =>
              createPartner.mutate({ name: newStore.trim() }, { onSuccess: () => setNewStore("") })
            }
            className="whitespace-nowrap rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            Agregar tienda
          </button>
        </div>
        {createPartner.error && (
          <p className="mt-1 text-xs text-red-600">{createPartner.error.message}</p>
        )}
      </div>

      {(localError || create.error) && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {localError ?? create.error?.message}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-slate-200 pt-4">
        <div>
          <div className="text-xs text-slate-500">Total</div>
          <div className="text-2xl font-bold text-slate-800">{fmt(total)}</div>
        </div>
        <button
          type="submit"
          disabled={create.isPending || lines.length === 0}
          className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {create.isPending ? "Registrando..." : "Registrar venta"}
        </button>
      </div>
    </form>
  );
}