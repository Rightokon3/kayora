import { adminApiFetch } from "./adminApi";
import { Customer, AccountInactivationRequest, DistributorApplication } from "../types/customer";

/* ============================================================
   CUSTOMER SERVICE
   ------------------------------------------------------------
   Talks to:
     GET    /admin/customers?search=
     DELETE /admin/customers/{userId}
     GET    /admin/customers/inactivation-requests
     DELETE /admin/customers/inactivation-requests/{id}
     GET    /admin/distributor-applications/{id}
     POST   /admin/distributor-applications/{id}/approve
     POST   /admin/distributor-applications/{id}/deny
============================================================ */

export const CustomerService = {
  async getCustomers(search: string = ""): Promise<Customer[]> {
    const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
    return adminApiFetch<Customer[]>(`/admin/customers${query}`);
  },

  /** Pass customer.userId (the real numeric id), not customer.id ("CUS-1001"). */
  async deleteCustomer(userId: number | string): Promise<void> {
    await adminApiFetch(`/admin/customers/${userId}`, { method: "DELETE" });
  },

  async getInactivationRequests(): Promise<AccountInactivationRequest[]> {
    return adminApiFetch<AccountInactivationRequest[]>("/admin/customers/inactivation-requests");
  },

  /** Deletes the requesting customer's account and clears the request. */
  async resolveInactivationRequest(id: number): Promise<void> {
    await adminApiFetch(`/admin/customers/inactivation-requests/${id}`, { method: "DELETE" });
  },

  /** Full column set for the distributor-application modal — the
   *  customers list endpoint only embeds a summary per row. */
  async getDistributorApplication(id: number): Promise<DistributorApplication> {
    return adminApiFetch<DistributorApplication>(`/admin/distributor-applications/${id}`);
  },

  /** Flips the underlying user to a distributor on the backend. */
  async approveDistributorApplication(id: number): Promise<void> {
    await adminApiFetch(`/admin/distributor-applications/${id}/approve`, { method: "POST" });
  },

  /** Rejects the application; the user stays a normal customer. */
  async denyDistributorApplication(id: number): Promise<void> {
    await adminApiFetch(`/admin/distributor-applications/${id}/deny`, { method: "POST" });
  },
};