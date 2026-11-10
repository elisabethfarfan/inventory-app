import { useMemo, useState } from "react";
import { Download, Plus, TriangleAlert, Upload } from "lucide-react";
import { useProductRows } from "../features/products/useProductRows";
import { useSetProductActive } from "../features/products/useProducts";
import ProductTable from "../features/products/ProductTable";
import ProductForm from "../features/products/ProductForm";
import ImportProducts from "../features/products/ImportProducts";
import ProductFilters, {
  type StatusFilter,
} from "../features/products/ProductFilters";
import MovementForm from "../features/stock/MovementForm";
import Modal from "../components/ui/Modal";
import Pagination from "../components/ui/Pagination";
import { useAuth } from "../features/auth/AuthContext";
import { useDebounce } from "../hooks/useDebounce";
import { usePagination } from "../hooks/usePagination";
import { downloadProducts } from "../api/reports";
import type { Product, ProductRow } from "../types/product";
import type { MovementType } from "../types/stock";

export default function ProductsPage() {
  const { session } = useAuth();
  const isAdmin = session?.role === "ADMIN";

  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [movement, setMovement] = useState<{
    product: ProductRow;
    type: MovementType;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [exportError, setExportError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search);
  const { rows, isLoading, isError, error } = useProductRows();
  const toggleActive = useSetProductActive();

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

  const pager = usePagination(filtered, 20);

  const lowStockCount = useMemo(
    () => rows?.filter((p) => p.active && p.stock <= p.minimumStock).length ?? 0,
    [rows]
  );

  const hasProducts = !!rows && rows.length > 0;

  const exportProducts = async () => {
    setExportError(null);
    try {
      await downloadProducts();
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "No se pudo descargar el Excel");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-bold text-slate-800">Productos</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportProducts}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Download size={18} />
            Excel de productos
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => setImportOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <Upload size={18} />
                Importar Excel
              </button>
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Plus size={18} />
                Nuevo producto
              </button>
            </>
          )}
        </div>
      </div>

      {exportError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {exportError}
        </div>
      )}

      {lowStockCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <TriangleAlert size={18} />
          {lowStockCount}{" "}
          {lowStockCount === 1 ? "producto está" : "productos están"} con stock
          bajo o agotado.
        </div>
      )}

      {toggleActive.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {toggleActive.error.message}
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
          {isAdmin && " Puedes cargarlos con «Importar Excel» o con «Nuevo producto»."}
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
            products={pager.pageItems}
            canEdit={isAdmin}
            onMove={(product, type) => setMovement({ product, type })}
            onEdit={(product) => setEditing(product)}
            onToggleActive={(product) =>
              toggleActive.mutate({ id: product.id, value: !product.active })
            }
          />
          <Pagination
            page={pager.page}
            totalPages={pager.totalPages}
            total={pager.total}
            pageSize={pager.pageSize}
            onChange={pager.setPage}
          />
        </>
      )}

      {isAdmin && (
        <>
          <Modal
            open={modalOpen}
            title="Nuevo producto"
            onClose={() => setModalOpen(false)}
          >
            <ProductForm onSuccess={() => setModalOpen(false)} />
          </Modal>

          <Modal
            open={editing !== null}
            title="Editar producto"
            onClose={() => setEditing(null)}
          >
            {editing && (
              <ProductForm
                key={editing.id}
                product={editing}
                onSuccess={() => setEditing(null)}
              />
            )}
          </Modal>

          <Modal
            open={importOpen}
            title="Importar productos desde Excel"
            onClose={() => setImportOpen(false)}
          >
            {importOpen && <ImportProducts onDone={() => setImportOpen(false)} />}
          </Modal>
        </>
      )}

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