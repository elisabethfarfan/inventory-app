import { useState } from "react";
import Badge from "../components/ui/Badge";
import {
  useBorrowings, useDebts, usePayBorrowing, useReturnBorrowing,
} from "../features/partners/usePartners";
import type { Borrowing, BorrowingStatus } from "../types/partner";

const fmt = (v: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(v);
const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" });

const variant = (s: BorrowingStatus) =>
  s === "PENDIENTE" ? "warning" : s === "CANCELADO" ? "neutral" : "success";

export default function BorrowingsPage() {
  const [status, setStatus] = useState<BorrowingStatus>("PENDIENTE");
  const debts = useDebts();
  const list = useBorrowings(status);
  const pay = usePayBorrowing();
  const ret = useReturnBorrowing();
  const [error, setError] = useState<string | null>(null);

  const close = (kind: "pay" | "return", b: Borrowing) => {
    const msg =
      kind === "pay"
        ? `¿Marcar como PAGADO (${fmt(b.total)} a ${b.partnerName})?`
        : `¿Marcar como DEVUELTO (producto devuelto a ${b.partnerName})?`;
    if (!window.confirm(msg)) return;
    setError(null);
    const m = kind === "pay" ? pay : ret;
    m.mutate({ id: b.id }, { onError: (e) => setError(e.message) });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Préstamos y deudas</h2>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="font-semibold text-slate-800">Lo que debes por tienda</h3>
        </div>
        {debts.data && debts.data.length === 0 && (
          <p className="p-5 text-sm text-slate-500">No debes nada a otras tiendas.</p>
        )}
        {debts.data && debts.data.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Tienda</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3 text-right">Pendientes</th>
                <th className="px-4 py-3 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {debts.data.map((d) => (
                <tr key={d.partnerId}>
                  <td className="px-4 py-3 font-medium text-slate-800">{d.partnerName}</td>
                  <td className="px-4 py-3 text-slate-600">{d.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-right">{d.pendingCount}</td>
                  <td className="px-4 py-3 text-right font-semibold text-amber-600">{fmt(d.pendingAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="font-semibold text-slate-800">Detalle</h3>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as BorrowingStatus)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          >
            <option value="PENDIENTE">Pendientes</option>
            <option value="PAGADO">Pagados</option>
            <option value="DEVUELTO">Devueltos</option>
            <option value="CANCELADO">Cancelados</option>
          </select>
        </div>

        {list.data && list.data.length === 0 && (
          <p className="p-5 text-sm text-slate-500">No hay registros.</p>
        )}
        {list.data && list.data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Tienda</th>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3 text-right">Cant.</th>
                  <th className="px-4 py-3 text-right">Costo</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Venta</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.data.map((b) => (
                  <tr key={b.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(b.createdAt)}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{b.partnerName}</td>
                    <td className="px-4 py-3">
                      <div className="text-slate-800">{b.productName}</div>
                      <div className="font-mono text-xs text-slate-500">{b.productCode}</div>
                    </td>
                    <td className="px-4 py-3 text-right">{b.quantity}</td>
                    <td className="px-4 py-3 text-right">{fmt(b.unitCost)}</td>
                    <td className="px-4 py-3 text-right font-medium">{fmt(b.total)}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">#{b.saleId}</td>
                    <td className="px-4 py-3">
                      <Badge variant={variant(b.status)}>{b.status.toLowerCase()}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {b.status === "PENDIENTE" && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => close("pay", b)}
                            className="rounded-lg border border-green-300 px-2.5 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50"
                          >
                            Marcar pagado
                          </button>
                          <button
                            onClick={() => close("return", b)}
                            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Marcar devuelto
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}