import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Download, ShoppingCart } from "lucide-react";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import Pagination from "../components/ui/Pagination";
import SaleForm from "../features/sales/SaleForm";
import { useCancelSale, useSales } from "../features/sales/useSales";
import { useUsers } from "../features/users/useUsers";
import { useAuth } from "../features/auth/AuthContext";
import { usePagination } from "../hooks/usePagination";
import { downloadProfit } from "../api/reports";

const fmt = (v: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(v);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" });

const iso = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return iso(d);
};

export default function SalesPage() {
  const { session } = useAuth();
  const isAdmin = session?.role === "ADMIN";

  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [from, setFrom] = useState(daysAgo(0));
  const [to, setTo] = useState(daysAgo(0));
  const [seller, setSeller] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [period, setPeriod] = useState("day");
  const [exportError, setExportError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [reason, setReason] = useState("");

  const { data, isLoading, isError, error } = useSales({ from, to, seller });
  const users = useUsers(isAdmin);
  const sellers = isAdmin ? users.data ?? [] : [];
  const cancel = useCancelSale();

  const totals = useMemo(() => {
    const sales = (data ?? []).filter((s) => s.status === "COMPLETADA");
    return {
      count: sales.length,
      total: sales.reduce((a, s) => a + s.total, 0),
      discount: sales.reduce((a, s) => a + s.totalDiscount, 0),
      profit: sales.reduce((a, s) => a + (s.totalProfit ?? 0), 0),
    };
  }, [data]);

  const pager = usePagination(data ?? [], 20);

  const quick = (days: number) => {
    setFrom(daysAgo(days));
    setTo(daysAgo(0));
  };

  const exportProfit = async () => {
    setExportError(null);
    try {
      await downloadProfit(period, from, to);
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "No se pudo descargar el Excel");
    }
  };

  const field =
    "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Ventas</h2>
        <button
          onClick={() => {
            setDone(null);
            setOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          <ShoppingCart size={18} /> Nueva venta
        </button>
      </div>

      {done && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {done}
        </div>
      )}

      {exportError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {exportError}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs text-slate-500">
          Desde
          <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className={`${field} block`} />
        </label>
        <label className="text-xs text-slate-500">
          Hasta
          <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className={`${field} block`} />
        </label>

        <div className="flex gap-2">
          {[
            { l: "Hoy", d: 0 },
            { l: "7 días", d: 6 },
            { l: "30 días", d: 29 },
          ].map((q) => (
            <button
              key={q.l}
              onClick={() => quick(q.d)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              {q.l}
            </button>
          ))}
        </div>

        {isAdmin && (
          <label className="text-xs text-slate-500">
            Vendedor
            <select value={seller} onChange={(e) => setSeller(e.target.value)} className={`${field} block`}>
              <option value="">Todos</option>
              {sellers.map((u) => (
                <option key={u.id} value={u.username}>
                  {u.fullName} ({u.username})
                </option>
              ))}
            </select>
          </label>
        )}

        {isAdmin && (
          <div className="flex items-end gap-2">
            <label className="text-xs text-slate-500">
              Agrupar por
              <select value={period} onChange={(e) => setPeriod(e.target.value)} className={`${field} block`}>
                <option value="day">Día</option>
                <option value="week">Semana</option>
                <option value="month">Mes</option>
              </select>
            </label>
            <button
              onClick={exportProfit}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Download size={16} /> Excel de ganancias
            </button>
          </div>
        )}
      </div>

      <div className={`grid grid-cols-2 gap-3 ${isAdmin ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">Ventas</div>
          <div className="text-xl font-bold text-slate-800">{totals.count}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">Total vendido</div>
          <div className="text-xl font-bold text-slate-800">{fmt(totals.total)}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">Rebajas otorgadas</div>
          <div className="text-xl font-bold text-amber-600">{fmt(totals.discount)}</div>
        </div>
        {isAdmin && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">Ganancia</div>
            <div className="text-xl font-bold text-green-600">{fmt(totals.profit)}</div>
          </div>
        )}
      </div>

      {isLoading && <p className="text-slate-500">Cargando ventas...</p>}
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error.message}
        </div>
      )}

      {data && data.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          No hay ventas en este rango.
        </div>
      )}

      {data && data.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="w-8 px-2 py-3" />
                  <th className="px-4 py-3">N.º</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Vendedor</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Pago</th>
                  <th className="px-4 py-3 text-right">Rebaja</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  {isAdmin && <th className="px-4 py-3 text-right">Ganancia</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pager.pageItems.map((s) => {
                  const isOpen = expanded === s.id;
                  const annulled = s.status === "ANULADA";
                  return (
                    <Fragment key={s.id}>
                      <tr
                        onClick={() => setExpanded(isOpen ? null : s.id)}
                        className={`cursor-pointer hover:bg-slate-50 ${annulled ? "opacity-60" : ""}`}
                      >
                        <td className="px-2 py-3 text-slate-400">
                          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-700">
                          #{s.id} {annulled && <Badge variant="danger">Anulada</Badge>}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(s.createdAt)}</td>
                        <td className="px-4 py-3 text-slate-600">{s.soldBy}</td>
                        <td className="px-4 py-3 text-slate-600">{s.customerName ?? "—"}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {s.paymentMethod.charAt(0) + s.paymentMethod.slice(1).toLowerCase()}
                        </td>
                        <td className="px-4 py-3 text-right text-amber-600">
                          {s.totalDiscount > 0 ? fmt(s.totalDiscount) : "—"}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-medium text-slate-800 ${
                            annulled ? "line-through" : ""
                          }`}
                        >
                          {fmt(s.total)}
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3 text-right font-medium text-green-600">
                            {s.totalProfit != null ? fmt(s.totalProfit) : "—"}
                          </td>
                        )}
                      </tr>

                      {isOpen && (
                        <tr className="bg-slate-50">
                          <td colSpan={isAdmin ? 9 : 8} className="px-6 py-4">
                            {annulled && (
                              <p className="mb-3 rounded-lg bg-red-50 p-2 text-xs text-red-700">
                                Anulada por {s.cancelledBy}
                                {s.cancelledAt ? ` el ${formatDate(s.cancelledAt)}` : ""} · Motivo:{" "}
                                {s.cancelReason}
                              </p>
                            )}

                            {isAdmin && !annulled && (
                              <button
                                onClick={() => {
                                  setCancelling(s.id);
                                  setReason("");
                                  cancel.reset();
                                }}
                                className="mb-3 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                              >
                                Anular venta
                              </button>
                            )}

                            {s.note && <p className="mb-3 text-xs text-slate-500">Nota: {s.note}</p>}

                            <table className="w-full text-xs">
                              <thead className="text-slate-500">
                                <tr>
                                  <th className="py-1 text-left">Producto</th>
                                  <th className="py-1 text-left">Presentación</th>
                                  <th className="py-1 text-right">Cant.</th>
                                  <th className="py-1 text-right">Lista</th>
                                  <th className="py-1 text-right">Cobrado</th>
                                  <th className="py-1 text-right">Rebaja</th>
                                  <th className="py-1 text-right">Subtotal</th>
                                  {isAdmin && <th className="py-1 text-right">Ganancia</th>}
                                </tr>
                              </thead>
                              <tbody>
                                {s.items.map((it, k) => (
                                  <tr key={k} className="border-t border-slate-200">
                                    <td className="py-2">
                                      <div className="font-medium text-slate-800">{it.productName}</div>
                                      <div className="font-mono text-slate-500">{it.productCode}</div>
                                    </td>
                                    <td className="py-2">
                                      {it.externalFrom ? (
                                        <Badge variant="neutral">Origen: {it.externalFrom}</Badge>
                                      ) : it.fractionLabel ? (
                                        <Badge variant="warning">
                                          {it.fractionLabel}
                                          {it.containerId ? ` · balde #${it.containerId}` : ""}
                                        </Badge>
                                      ) : (
                                        <span className="text-slate-500">Entero</span>
                                      )}
                                    </td>
                                    <td className="py-2 text-right">{it.quantity}</td>
                                    <td className="py-2 text-right">{fmt(it.listPrice)}</td>
                                    <td className="py-2 text-right">{fmt(it.unitPrice)}</td>
                                    <td className="py-2 text-right text-amber-600">
                                      {it.discountPerUnit > 0
                                        ? `${fmt(it.discountPerUnit)} (${it.discountPercent}%)`
                                        : "—"}
                                      {it.discountReason && (
                                        <div className="text-slate-500">{it.discountReason}</div>
                                      )}
                                    </td>
                                    <td className="py-2 text-right font-medium">{fmt(it.subtotal)}</td>
                                    {isAdmin && (
                                      <td className="py-2 text-right text-green-600">
                                        {it.profit != null ? fmt(it.profit) : "—"}
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            page={pager.page}
            totalPages={pager.totalPages}
            total={pager.total}
            pageSize={pager.pageSize}
            onChange={pager.setPage}
          />
        </>
      )}

      <Modal open={open} title="Nueva venta" onClose={() => setOpen(false)}>
        <SaleForm
          key={String(open)}
          onSuccess={() => {
            setOpen(false);
            setDone("Venta registrada correctamente.");
          }}
        />
      </Modal>

      <Modal
        open={cancelling !== null}
        title={`Anular venta #${cancelling}`}
        onClose={() => setCancelling(null)}
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Se repondrá el stock y el contenido de los baldes. Esta acción no se puede deshacer.
          </p>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={200}
            placeholder="Motivo de la anulación (obligatorio)"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          {cancel.error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {cancel.error.message}
            </div>
          )}
          <div className="flex justify-end">
            <button
              disabled={cancel.isPending || reason.trim() === ""}
              onClick={() =>
                cancel.mutate(
                  { id: cancelling!, reason: reason.trim() },
                  {
                    onSuccess: () => {
                      setCancelling(null);
                      setDone("Venta anulada correctamente.");
                    },
                  }
                )
              }
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {cancel.isPending ? "Anulando..." : "Confirmar anulación"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}