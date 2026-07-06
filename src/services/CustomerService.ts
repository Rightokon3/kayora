import { Customer } from "../types/customer";
import { DEMO_CUSTOMERS } from "../demo/customersDemoData";



let store: Customer[] = [...DEMO_CUSTOMERS];

function simulateLatency<T>(value: T, ms = 500): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const CustomerService = {
  async getCustomers(): Promise<Customer[]> {
    return simulateLatency([...store]);
  },

  async searchCustomers(query: string): Promise<Customer[]> {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return simulateLatency([...store], 150);
    const filtered = store.filter(
      (c) =>
        c.name.toLowerCase().includes(normalized) ||
        c.email.toLowerCase().includes(normalized) ||
        c.phone.toLowerCase().includes(normalized) ||
        c.address.city.toLowerCase().includes(normalized)
    );
    return simulateLatency(filtered, 150);
  },

  async deleteCustomer(id: string): Promise<void> {
    store = store.filter((c) => c.id !== id);
    return simulateLatency(undefined, 500);
  },
};