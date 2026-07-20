import { adminApiFetch } from "./adminApi";
import { Product, ProductInput } from "../types/product";

export const ProductService = {
  async getProducts(search: string = ""): Promise<Product[]> {
    const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
    return adminApiFetch<Product[]>(`/admin/products${query}`);
  },

  async createProduct(input: ProductInput): Promise<Product> {
    return adminApiFetch<Product>("/admin/products", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async updateProduct(id: string, input: ProductInput): Promise<Product> {
    return adminApiFetch<Product>(`/admin/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },

  async deleteProduct(id: string): Promise<void> {
    await adminApiFetch(`/admin/products/${id}`, { method: "DELETE" });
  },
};