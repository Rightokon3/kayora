import { Product, ProductInput } from "../types/product";
import { DEMO_PRODUCTS } from "../demo/productDemoData";



let store: Product[] = [...DEMO_PRODUCTS];

function simulateLatency<T>(value: T, ms = 500): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function generateId(): string {
  return `PRD-${Math.floor(100 + Math.random() * 900)}${Date.now().toString().slice(-3)}`;
}

export const ProductService = {
  async getProducts(): Promise<Product[]> {
    return simulateLatency([...store]);
  },

  async searchProducts(query: string): Promise<Product[]> {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return simulateLatency([...store], 150);
    const filtered = store.filter(
      (p) =>
        p.name.toLowerCase().includes(normalized) ||
        p.size.toLowerCase().includes(normalized) ||
        p.status.toLowerCase().includes(normalized)
    );
    return simulateLatency(filtered, 150);
  },

  async createProduct(input: ProductInput): Promise<Product> {
    const product: Product = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      ...input,
    };
    store = [product, ...store];
    return simulateLatency(product, 700);
  },

  async updateProduct(id: string, input: ProductInput): Promise<Product> {
    let updated: Product | null = null;
    store = store.map((p) => {
      if (p.id === id) {
        updated = { ...p, ...input };
        return updated;
      }
      return p;
    });
    if (!updated) throw new Error("Product not found");
    return simulateLatency(updated, 700);
  },

  async deleteProduct(id: string): Promise<void> {
    store = store.filter((p) => p.id !== id);
    return simulateLatency(undefined, 500);
  },
};