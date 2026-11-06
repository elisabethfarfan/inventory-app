import Badge from "../components/ui/Badge";
import { useContainerSummary, useOpenContainers } from "../features/containers/useContainers";

const FRACTIONS = [
  { v: 0.5, l: "1/2" },
  { v: 0.25, l: "1/4" },
  { v: 0.125, l: "1/8" },
  { v: 0.0625, l: "1/16" },
  { v: 0.03125, l: "1/32" },
];

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

export default function ContainersPage() {
  const summary = useContainerSummary();
  const open = useOpenContainers();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Baldes abiertos</h2>

      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="font-semibold text-slate-800">Resumen por producto</h3>
        </div>
        {summary.isLoading && <p className="p-5 text-slate-500">Cargando...</p>}
        {summary.isError && (
          <p className="p-5 text-sm text-red-700">{summary.error.message}</p>
        )}
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
                      {s.openCount > 0
                        ? `${toFraction(s.openRemaining)} de balde`
                        : "—"}
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