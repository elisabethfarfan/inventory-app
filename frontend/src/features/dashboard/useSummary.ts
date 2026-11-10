import { useMemo } from "react";
import { useSales } from "../sales/useSales";
import { useDebts } from "../partners/usePartners";

export function useSummary(from: string, to: string, enabled: boolean) {
  const sales = useSales({ from, to });
  const debts = useDebts();

  const summary = useMemo(() => {
    const completed = (sales.data ?? []).filter((s) => s.status === "COMPLETADA");

    let external = 0;
    for (const s of completed) {
      for (const it of s.items) {
        if (it.externalFrom && it.cost != null) external += it.cost * it.quantity;
      }
    }

    return {
      count: completed.length,
      sold: completed.reduce((a, s) => a + s.total, 0),
      profit: completed.reduce((a, s) => a + (s.totalProfit ?? 0), 0),
      discount: completed.reduce((a, s) => a + s.totalDiscount, 0),
      external,
      owed: (debts.data ?? []).reduce((a, d) => a + d.pendingAmount, 0),
    };
  }, [sales.data, debts.data]);

  return {
    summary,
    isLoading: enabled && (sales.isLoading || debts.isLoading),
    isError: sales.isError || debts.isError,
  };
}