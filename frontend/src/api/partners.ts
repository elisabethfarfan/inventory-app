import { api } from "./client";
import type { Borrowing, BorrowingStatus, Partner, PartnerDebt } from "../types/partner";

export const getPartners = () => api.get<Partner[]>("/partners").then((r) => r.data);

export const createPartner = (name: string, phone?: string) =>
  api.post<Partner>("/partners", { name, phone: phone || null }).then((r) => r.data);

export const getBorrowings = (status?: BorrowingStatus) =>
  api.get<Borrowing[]>("/borrowings", { params: { status } }).then((r) => r.data);

export const getDebts = () => api.get<PartnerDebt[]>("/borrowings/debts").then((r) => r.data);

export const payBorrowing = (id: number, note?: string) =>
  api.post<Borrowing>(`/borrowings/${id}/pay`, { note: note || null }).then((r) => r.data);

export const returnBorrowing = (id: number, note?: string) =>
  api.post<Borrowing>(`/borrowings/${id}/return`, { note: note || null }).then((r) => r.data);