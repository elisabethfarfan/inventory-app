import { Link } from "react-router-dom";
import { Package, CheckCircle2, TriangleAlert, Wallet } from "lucide-react";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import AdminSummary from "../features/dashboard/AdminSummary";
import { useAuth } from "../features/auth/AuthContext";
import { useProductRows } from "../features/products/useProductRows";
import { useMovements } from "../features/stock/useStock";

const formatPrice = (value: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(value);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" });

export default function DashboardPage() {
  const { session } = useAuth();
  const isAdmin = session?.role === "ADMIN";

  const { rows, isLoading, isError, error } = useProductRows();
  const movements = useMovements();

  if (isLoading) return <p className="text-slate-500">Cargando...</p>;

  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error?.message}
      </div>
    );
  }

  const products = rows ?? [];
  const active = products.filter((p) => p.active);
  const lowStock = active
    .filter((p) => p.stock <= p.minimumStock)
    .sort((a, b) => a.stock - b.stock);
  const inventoryValue = active.reduce((sum, p) => sum + p.price * p.stock, 0);
  const lastMovements = movements.data?.slice(0, 5) ?? [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Inicio</h2>

      {isAdmin && <AdminSummary />}

      <div
        className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${
          isAdmin ? "xl:grid-cols-4" : "xl:grid-cols-3"
        }`}
      >
        <StatCard label="Productos" value={products.length} icon={<Package size={22} />} tone="blue" />
        <StatCard label="Activos" value={active.length} icon={<CheckCircle2 size={22} />} tone="green" />
        <StatCard label="Stock bajo o agotado" value={lowStock.length} icon={<TriangleAlert size={22} />} tone="amber" />
        {isAdmin && (
          <StatCard
            label="Valor del inventario"
            value={formatPrice(inventoryValue)}
            icon={<Wallet size={22} />}
            tone="slate"
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h3 className="font-semibold text-slate-800">Alertas de stock</h3>
            <Link to="/productos" className="text-sm text-blue-600 hover:underline">
              Ver productos
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">Todo en orden, no hay alertas.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {lowStock.slice(0, 6).map((p) => (
                <li key={p.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <div className="text-sm font-medium text-slate-800">{p.name}</div>
                    <div className="font-mono text-xs text-slate-500">{p.code}</div>
                  </div>
                  {p.stock === 0 ? (
                    <Badge variant="danger">Sin stock</Badge>
                  ) : (
                    <Badge variant="warning">
                      {p.stock} / mín. {p.minimumStock}
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h3 className="font-semibold text-slate-800">Últimos movimientos</h3>
            <Link to="/movimientos" className="text-sm text-blue-600 hover:underline">
              Ver todos
            </Link>
          </div>
          {lastMovements.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">Aún no hay movimientos.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {lastMovements.map((m) => {
                const entry = m.type === "ENTRADA";
                return (
                  <li key={m.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <div className="text-sm font-medium text-slate-800">{m.product.name}</div>
                      <div className="text-xs text-slate-500">
                        {formatDate(m.createdAt)}
                        {m.registeredBy ? ` · ${m.registeredBy}` : ""}
                      </div>
                    </div>
                    <Badge variant={entry ? "success" : "danger"}>
                      {entry ? "+" : "−"}
                      {m.quantity}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}