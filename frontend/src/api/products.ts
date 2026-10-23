import { api } from "./client";
import type { Product, ProductInput } from "../types/product";

export const getProducts = () =>
  api.get<Product[]>("/products").then((r) => r.data);

export const createProduct = (product: ProductInput) =>
  api.post<Product>("/products", product).then((r) => r.data);