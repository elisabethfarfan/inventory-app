import { api } from "./client";
import type { Product, ProductInput } from "../types/product";

export const getProducts = () =>
  api.get<Product[]>("/products").then((r) => r.data);

export const createProduct = (product: ProductInput) =>
  api.post<Product>("/products", product).then((r) => r.data);

export const updateProduct = (id: number, product: ProductInput) =>
  api.put<Product>(`/products/${id}`, product).then((r) => r.data);

export const setProductActive = (id: number, value: boolean) =>
  api
    .patch<Product>(`/products/${id}/active`, null, { params: { value } })
    .then((r) => r.data);