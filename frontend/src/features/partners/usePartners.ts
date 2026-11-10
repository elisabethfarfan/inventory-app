import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPartner, getBorrowings, getDebts, getPartners, payBorrowing, returnBorrowing,
} from "../../api/partners";
import type { BorrowingStatus } from "../../types/partner";

export const usePartners = () =>
  useQuery({ queryKey: ["partners"], queryFn: getPartners });

export const useCreatePartner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { name: string; phone?: string }) => createPartner(v.name, v.phone),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["partners"] }),
  });
};

export const useBorrowings = (status?: BorrowingStatus) =>
  useQuery({ queryKey: ["borrowings", status ?? "all"], queryFn: () => getBorrowings(status) });

export const useDebts = () =>
  useQuery({ queryKey: ["borrowings", "debts"], queryFn: getDebts });

export const usePayBorrowing = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: number; note?: string }) => payBorrowing(v.id, v.note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["borrowings"] }),
  });
};

export const useReturnBorrowing = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: number; note?: string }) => returnBorrowing(v.id, v.note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["borrowings"] }),
  });
};