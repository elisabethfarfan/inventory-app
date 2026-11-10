import { useState } from "react";
import { Banknote, Handshake, PiggyBank, Tag, Wallet } from "lucide-react";
import StatCard from "../../components/ui/StatCard";
import { useSummary } from "./useSummary";

const fmt = (v: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(v);

const iso = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return iso(d);
};

const RANGES = [
  { label: "Hoy", days: 0 },
  { label: "7 días", days: 6 },
  { label: "30 días", days: 29 },
];

export default function AdminSummary() {
  const [days, setDays] = useState(0);
  const { summary, isLoading, isError } = useSummary(daysAgo(days), daysAgo(0), true);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">Resumen de ventas</h3>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => setDays(r.days)}
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                days === r.days
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {isError && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          No se pudo cargar el resumen.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label={`Vendido (${summary.count} ventas)`}
          value={isLoading ? "…" : fmt(summary.sold)}
          icon={<Banknote size={22} />}
          tone="blue"
        />
        <StatCard
          label="Ganancia"
          value={isLoading ? "…" : fmt(summary.profit)}
          icon={<PiggyBank size={22} />}
          tone="green"
        />
        <StatCard
          label="Rebajas otorgadas"
          value={isLoading ? "…" : fmt(summary.discount)}
          icon={<Tag size={22} />}
          tone="amber"
        />
        <StatCard
          label="Cobrado que es de otras tiendas"
          value={isLoading ? "…" : fmt(summary.external)}
          icon={<Wallet size={22} />}
          tone="slate"
        />
        <StatCard
          label="Debes a tiendas (pendiente)"
          value={isLoading ? "…" : fmt(summary.owed)}
          icon={<Handshake size={22} />}
          tone="amber"
        />
      </div>

      <p className="text-xs text-slate-500">
        De lo vendido, la ganancia es lo que te queda; el resto se reparte entre tu costo y lo
        que debes a otras tiendas.
      </p>
    </section>
  );
}