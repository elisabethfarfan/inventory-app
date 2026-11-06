import { useState } from "react";
import Badge from "../components/ui/Badge";
import { useProducts } from "../features/products/useProducts";
import { useMovements } from "../features/stock/useStock";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" });

export default function MovementsPage() {
  const [productId, setProductId] = useState<number | undefined>();
  const { data: products } = useProducts();
  const { data, isLoading, isError, error } = useMovements(productId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Movimientos</h2>

        <select
          value={productId ?? ""}
          onChange={(e) =>
            setProductId(e.target.value ? Number(e.target.value) : undefined)
          }
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Últimos movimientos (todos)</option>
          {products?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} — {p.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p className="text-slate-500">Cargando movimientos...</p>}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error.message}
        </div>
      )}

      {data && data.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          Aún no hay movimientos registrados.
        </div>
      )}

      {data && data.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3 text-right">Cantidad</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3">Registrado por</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((m) => {
                const entry = m.type === "ENTRADA";
                return (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {formatDate(m.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{m.product.name}</div>
                      <div className="font-mono text-xs text-slate-500">{m.product.code}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={entry ? "success" : "danger"}>
                        {entry ? "Entrada" : "Salida"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {entry ? "+" : "−"}
                      {m.quantity}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {m.previousStock} → <strong>{m.newStock}</strong>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {m.registeredBy ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}