import { api } from "./client";

export interface ImportRowError { row: number; message: string }
export interface ImportResult {
  dryRun: boolean;
  totalRows: number;
  validRows: number;
  created: number;
  errors: ImportRowError[];
}

export const importProducts = (file: File, dryRun: boolean) => {
  const form = new FormData();
  form.append("file", file);
  return api
    .post<ImportResult>("/products/import", form, { params: { dryRun } })
    .then((r) => r.data);
};

export async function downloadTemplate() {
  const res = await api.get("/products/import/template", { responseType: "blob" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(res.data);
  a.download = "plantilla-productos.xlsx";
  a.click();
  URL.revokeObjectURL(a.href);
}