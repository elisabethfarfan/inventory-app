import { useMemo, useState } from "react";
import { Plus, TriangleAlert } from "lucide-react";
import { useProductRows } from "../features/products/useProductRows";
import ProductTable from "../features/products/ProductTable";
import ProductForm from "../features/products/ProductForm";
import ProductFilters, {
  type StatusFilter,
} from "../features/products/ProductFilters";
import MovementForm from "../features/stock/MovementForm";
import Modal from "../components/ui/Modal";
import { useDebounce } from "../hooks/useDebounce";
import type { ProductRow } from "../types/product";
import type { MovementType } from "../types/stock";

export default function ProductsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [movement, setMovement] = useState<{
    product: ProductRow;
    type: MovementType;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const debouncedSearch = useDebounce(search);
  const { rows, isLoading, isError, error } = useProductRows();

  const filtered = useMemo(() => {
    if (!rows) return [];
    const term = debouncedSearch.trim().toLowerCase();

    return rows.filter((p) => {
      const matchesStatus =
        status === "all" || (status === "active" ? p.active : !p.active);
      const matchesSearch =
        term === "" ||
        p.name.toLowerCase().includes(term) ||
        p.code.toLowerCase().includes(term) ||
        (p.barcode ?? "").toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [rows, debouncedSearch, status]);

  const lowStockCount = useMemo(
    () => rows?.filter((p) => p.active && p.stock <= p.minimumStock).length ?? 0,
    [rows]
  );

  const hasProducts = !!rows && rows.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Productos</h2>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Nuevo producto
        </button>
      </div>

      {lowStockCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <TriangleAlert size={18} />
          {lowStockCount}{" "}
          {lowStockCount === 1 ? "producto está" : "productos están"} con stock
          bajo o agotado.
        </div>
      )}

      {hasProducts && (
        <ProductFilters
          search={search}
          onSearchChange={setSearch}
          status={status}
          onStatusChange={setStatus}
        />
      )}

      {isLoading && <p className="text-slate-500">Cargando productos...</p>}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error?.message}
        </div>
      )}

      {rows && rows.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          Aún no hay productos registrados.
        </div>
      )}

      {hasProducts && filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          Ningún producto coincide con la búsqueda.
        </div>
      )}

      {filtered.length > 0 && (
        <>
          <p className="text-sm text-slate-500">
            {filtered.length} de {rows?.length} productos
          </p>
          <ProductTable
            products={filtered}
            onMove={(product, type) => setMovement({ product, type })}
          />
        </>
      )}

      <Modal open={modalOpen} title="Nuevo producto" onClose={() => setModalOpen(false)}>
        <ProductForm onSuccess={() => setModalOpen(false)} />
      </Modal>

      <Modal
        open={movement !== null}
        title={movement?.type === "IN" ? "Registrar entrada" : "Registrar salida"}
        onClose={() => setMovement(null)}
      >
        {movement && (
          <MovementForm
            key={`${movement.product.id}-${movement.type}`}
            product={movement.product}
            type={movement.type}
            onSuccess={() => setMovement(null)}
          />
        )}
      </Modal>
    </div>
  );
}