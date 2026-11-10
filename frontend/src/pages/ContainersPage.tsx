import { useState } from "react";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import { useAuth } from "../features/auth/AuthContext";
import {
  useAdjustContainer,
  useContainerSummary,
  useOpenContainers,
  useWriteOffContainer,
} from "../features/containers/useContainers";
import type { OpenContainer } from "../types/container";

// 0.75 -> "3/4"; si no es múltiplo de 1/32, muestra el decimal
function toFraction(n: number): string {
  const x = Math.round(n * 32);
  if (Math.abs(x / 32 - n) > 0.0001) return n.toFixed(3);
  if (x === 32) return "1";
  if (x === 0) return "0";
  let num = x;
  let den = 32;
  while (num % 2 === 0) {
    num /= 2;
    den /= 2;
  }
  return den === 1 ? String(num) : `${num}/${den}`;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" });

type Action = { kind: "adjust" | "writeoff"; container: OpenContainer };

export default function ContainersPage() {
  const { session } = useAuth();
  const isAdmin = session?.role === "ADMIN";

  const summary = useContainerSummary();
  const open = useOpenContainers();
  const adjust = useAdjustContainer();
  const writeOff = useWriteOffContainer();

  const [action, setAction] = useState<Action | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const start = (kind: Action["kind"], c: OpenContainer) => {
    setAction({ kind, container: c });
    setAmount(String(c.remaining));
    setReason("");
    adjust.reset();
    writeOff.reset();
  };

  const close = () => setAction(null);

  const value = Number(amount);
  const valid =
    reason.trim() !== "" &&
    (action?.kind === "writeoff" || (value > 0 && value <= 1));

  const submit = () => {
    if (!action) return;
    const id = action.container.id;
    if (action.kind === "adjust") {
      adjust.mutate({ id, remaining: value, reason: reason.trim() }, { onSuccess: close });
    } else {
      writeOff.mutate({ id, reason: reason.trim() }, { onSuccess: close });
    }
  };

  const pending = adjust.isPending || writeOff.isPending;
  const err = adjust.error ?? writeOff.error;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Baldes abiertos</h2>

      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="font-semibold text-slate-800">Resumen por producto</h3>
        </div>
        {summary.isLoading && <p className="p-5 text-slate-500">Cargando...</p>}
        {summary.isError && <p className="p-5 text-sm text-red-700">{summary.error.message}</p>}
        {summary.data && summary.data.length === 0 && (
          <p className="p-5 text-sm text-slate-500">
            No hay productos fraccionables. Marca uno como fraccionado en Productos.
          </p>
        )}
        {summary.data && summary.data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3 text-right">Baldes cerrados</th>
                  <th className="px-4 py-3 text-right">Baldes abiertos</th>
                  <th className="px-4 py-3 text-right">Contenido en abiertos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.data.map((s) => (
                  <tr key={s.productId}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{s.productName}</div>
                      <div className="font-mono text-xs text-slate-500">{s.productCode}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{s.closedStock}</td>
                    <td className="px-4 py-3 text-right">
                      {s.openCount > 0 ? (
                        <Badge variant="warning">{s.openCount}</Badge>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {s.openCount > 0 ? `${toFraction(s.openRemaining)} de balde` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="font-semibold text-slate-800">Baldes abiertos ahora</h3>
          <p className="text-xs text-slate-500">
            Las fracciones se venden primero de estos, el más antiguo primero.
          </p>
        </div>
        {open.isLoading && <p className="p-5 text-slate-500">Cargando...</p>}
        {open.isError && <p className="p-5 text-sm text-red-700">{open.error.message}</p>}
        {open.data && open.data.length === 0 && (
          <p className="p-5 text-sm text-slate-500">No hay baldes abiertos.</p>
        )}
        {open.data && open.data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Balde</th>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Queda</th>
                  <th className="px-4 py-3">Abierto por</th>
                  <th className="px-4 py-3">Abierto el</th>
                  {isAdmin && <th className="px-4 py-3 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {open.data.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3 font-mono text-slate-700">#{c.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{c.productName}</div>
                      <div className="font-mono text-xs text-slate-500">{c.productCode}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{toFraction(c.remaining)}</div>
                      <div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${Math.min(100, c.remaining * 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c.openedBy}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(c.openedAt)}</td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => start("adjust", c)}
                            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Ajustar
                          </button>
                          <button
                            onClick={() => start("writeoff", c)}
                            className="rounded-lg border border-red-300 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                          >
                            Dar de baja
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        open={action !== null}
        title={
          action?.kind === "adjust"
            ? `Ajustar balde #${action.container.id}`
            : `Dar de baja balde #${action?.container.id}`
        }
        onClose={close}
      >
        {action && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              {action.container.productName} · ahora queda{" "}
              <strong>{toFraction(action.container.remaining)}</strong>
            </p>

            {action.kind === "adjust" ? (
              <label className="block text-xs text-slate-500">
                Contenido real (en baldes: 0.5 = 1/2, 0.25 = 1/4)
                <input
                  type="number"
                  step="0.03125"
                  min="0.03125"
                  max="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                {value > 0 && value <= 1 && (
                  <span className="mt-1 block text-slate-500">Equivale a {toFraction(value)}</span>
                )}
              </label>
            ) : (
              <p className="rounded-lg bg-red-50 p-2 text-xs text-red-700">
                El balde saldrá de la lista y no se podrá vender de él. No se puede deshacer.
              </p>
            )}

            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
              placeholder="Motivo (obligatorio): derrame, pintura seca, medición..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />

            {err && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {err.message}
              </div>
            )}

            <div className="flex justify-end">
              <button
                disabled={!valid || pending}
                onClick={submit}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                  action.kind === "adjust"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {pending
                  ? "Guardando..."
                  : action.kind === "adjust"
                  ? "Guardar ajuste"
                  : "Confirmar baja"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}