import { ArrowDownToLine, ArrowUpFromLine, Pencil } from "lucide-react";
import Badge from "../../components/ui/Badge";
import type { ProductRow } from "../../types/product";
import type { MovementType } from "../../types/stock";

interface ProductTableProps {
  products: ProductRow[];
  onMove: (product: ProductRow, type: MovementType) => void;
  onEdit: (product: ProductRow) => void;
  onToggleActive: (product: ProductRow) => void;
}

const formatPrice = (value: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(value);

function StockBadge({ stock, minimum }: { stock: number; minimum: number }) {
  if (stock === 0) return <Badge variant="danger">Sin stock</Badge>;
  if (stock <= minimum) return <Badge variant="warning">{stock} · bajo</Badge>;
  return <span className="font-medium text-slate-700">{stock}</span>;
}

export default function ProductTable({
  products,
  onMove,
  onEdit,
  onToggleActive,
}: ProductTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Código</th>
            <th className="px-4 py-3">Nombre</th>
            <th className="px-4 py-3">Código de barras</th>
            <th className="px-4 py-3 text-right">Precio</th>
            <th className="px-4 py-3 text-right">Stock</th>
            <th className="px-4 py-3 text-right">Mínimo</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {products.map((p) => (
            <tr key={p.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-mono text-slate-700">{p.code}</td>
              <td className="px-4 py-3">
                <div className="font-medium text-slate-800">{p.name}</div>
                {p.description && (
                  <div className="text-xs text-slate-500">{p.description}</div>
                )}
              </td>
              <td className="px-4 py-3 text-slate-600">{p.barcode ?? "—"}</td>
              <td className="px-4 py-3 text-right">{formatPrice(p.price)}</td>
              <td className="px-4 py-3 text-right">
                <StockBadge stock={p.stock} minimum={p.minimumStock} />
              </td>
              <td className="px-4 py-3 text-right text-slate-500">{p.minimumStock}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onToggleActive(p)}
                  title={p.active ? "Clic para desactivar" : "Clic para activar"}
                >
                  <Badge variant={p.active ? "success" : "neutral"}>
                    {p.active ? "Activo" : "Inactivo"}
                  </Badge>
                </button>
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onMove(p, "IN")}
                    disabled={!p.active}
                    className="flex items-center gap-1 rounded-lg border border-green-200 px-2.5 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowDownToLine size={14} /> Entrada
                  </button>
                  <button
                    onClick={() => onMove(p, "OUT")}
                    disabled={!p.active || p.stock === 0}
                    className="flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowUpFromLine size={14} /> Salida
                  </button>
                  <button
                    onClick={() => onEdit(p)}
                    title="Editar producto"
                    className="flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil size={14} /> Editar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}