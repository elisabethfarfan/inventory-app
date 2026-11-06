import { api } from "./client";

async function download(url: string, params: Record<string, string>, fallback: string) {
  const res = await api.get(url, { params, responseType: "blob" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(res.data);
  a.download = fallback;
  a.click();
  URL.revokeObjectURL(a.href);
}

export const downloadProfit = (period: string, from: string, to: string) =>
  download("/reports/profit", { period, from, to }, `ganancias-${period}-${from}_${to}.xlsx`);

export const downloadProducts = () => download("/reports/products", {}, "productos.xlsx");