import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { downloadTemplate, importProducts, type ImportResult } from "../../api/import";

export default function ImportProducts({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (dryRun: boolean) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const r = await importProducts(file, dryRun);
      setResult(r);
      if (!dryRun && r.created > 0) {
        qc.invalidateQueries({ queryKey: ["products"] });
        qc.invalidateQueries({ queryKey: ["stock"] });
        qc.invalidateQueries({ queryKey: ["movements"] });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo importar");
    } finally {
      setBusy(false);
    }
  };

  const hasErrors = (result?.errors.length ?? 0) > 0;
  const imported = result && !result.dryRun && result.created > 0;

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => downloadTemplate().catch(() => setError("No se pudo descargar la plantilla"))}
        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
      >
        <Download size={16} /> Descargar plantilla de Excel
      </button>

      <p className="text-xs text-slate-500">
        Columnas: codigo, nombre, descripcion, codigo_barras, costo, precio, precio_minimo,
        stock_inicial. Obligatorias: codigo, nombre y precio. Si un código o código de barras ya
        existe, esa fila se rechaza y no se importa nada hasta corregirla.
      </p>

      <input
        type="file"
        accept=".xlsx"
        onChange={(e) => {
          setFile(e.target.files?.[0] ?? null);
          setResult(null);
          setError(null);
        }}
        className="block w-full text-sm"
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {result && (
        <div
          className={`rounded-lg border p-3 text-sm ${
            hasErrors
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {imported ? (
            <strong>Se importaron {result.created} productos.</strong>
          ) : hasErrors ? (
            <>
              <strong>
                {result.errors.length} fila(s) con problemas de {result.totalRows}. No se importó nada.
              </strong>
              <ul className="mt-2 max-h-48 list-disc space-y-1 overflow-y-auto pl-5">
                {result.errors.map((er, i) => (
                  <li key={i}>
                    Fila {er.row}: {er.message}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <strong>{result.validRows} filas válidas. Todo listo para importar.</strong>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2">
        {imported ? (
          <button onClick={onDone} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">
            Cerrar
          </button>
        ) : (
          <>
            <button
              disabled={!file || busy}
              onClick={() => run(true)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Validar
            </button>
            <button
              disabled={!file || busy || hasErrors}
              onClick={() => run(false)}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {busy ? "Procesando..." : "Importar"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}