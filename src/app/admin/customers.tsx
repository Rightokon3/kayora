import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { useTheme } from "../../contexts/ThemeContext";
import { useResponsive } from "../../hooks/useResponsive";
import { CustomerService } from "../../services/CustomerService";
import { Customer, AccountInactivationRequest } from "../../types/customer";
import { SearchBar } from "../../components/products/SearchBar";
import { Toast, ToastState } from "../../components/products/Toast";
import { CustomerTable } from "../../components/customers/CustomerTable";
import { CustomerCard } from "../../components/customers/CustomerCard";
import { DeleteCustomerModal } from "../../components/customers/DeleteCustomerModal";
import { CustomersSkeleton } from "../../components/customers/CustomersSkeleton";
import { CustomersEmptyState } from "../../components/customers/EmptyState";
import { InactivationRequestsModal } from "../../components/customers/InactivationRequestsModal";

const SEARCH_DEBOUNCE_MS = 350;

export default function CustomersScreen() {
  const { palette } = useTheme();
  const { isPhone } = useResponsive();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* Account deletion requests — bell icon + badge + modal */
  const [inactivationRequests, setInactivationRequests] = useState<AccountInactivationRequest[]>([]);
  const [requestsModalVisible, setRequestsModalVisible] = useState(false);
  const [resolvingRequestId, setResolvingRequestId] = useState<number | null>(null);

  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, variant: "success" | "error" = "success") => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, variant });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 2800);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  const loadCustomers = useCallback(async (search: string) => {
    setLoading(true);
    try {
      const data = await CustomerService.getCustomers(search);
      setCustomers(data);
    } catch (e) {
      showToast("Could not load customers. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const loadInactivationRequests = useCallback(async () => {
    try {
      const data = await CustomerService.getInactivationRequests();
      setInactivationRequests(data);
    } catch (e) {
      // Silent — the bell badge just won't update this cycle; not worth
      // a toast for a background count refresh.
    }
  }, []);

  // Initial load of both the customer list and the deletion-request count.
  useEffect(() => {
    loadCustomers("");
    loadInactivationRequests();
  }, []);

  // Real backend search, debounced so we're not firing a request on every
  // keystroke — this replaces the old client-side .filter() entirely.
  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchQuery(text);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(() => {
        loadCustomers(text);
      }, SEARCH_DEBOUNCE_MS);
    },
    [loadCustomers]
  );

  const handleRequestDelete = useCallback((customer: Customer) => setDeleteTarget(customer), []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      // userId (the real numeric primary key) — NOT deleteTarget.id,
      // which is the display string "CUS-1001".
      await CustomerService.deleteCustomer(deleteTarget.userId);
      showToast("Customer account deleted successfully", "success");
      setDeleteTarget(null);
      await loadCustomers(searchQuery);
    } catch (e) {
      showToast("Could not delete customer. Please try again.", "error");
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, loadCustomers, searchQuery, showToast]);

  const handleResolveRequest = useCallback(
    async (request: AccountInactivationRequest) => {
      setResolvingRequestId(request.id);
      try {
        await CustomerService.resolveInactivationRequest(request.id);
        showToast("Account deleted and request resolved", "success");
        await Promise.all([loadInactivationRequests(), loadCustomers(searchQuery)]);
      } catch (e) {
        showToast("Could not resolve this request. Please try again.", "error");
      } finally {
        setResolvingRequestId(null);
      }
    },
    [loadInactivationRequests, loadCustomers, searchQuery, showToast]
  );

  const pendingCount = inactivationRequests.length;

  return (
    <AdminLayout title="Customers">
      <View>
        <View style={[styles.headerRow, isPhone && { flexDirection: "column", alignItems: "flex-start" }]}>
          <View>
            <Text style={[styles.pageTitle, { color: palette.text }]}>Customers</Text>
            <Text style={[styles.pageSubtitle, { color: palette.muted }]}>
              Manage and view customer information
            </Text>
          </View>

          <View style={[styles.actionsRow, isPhone && { width: "100%", marginTop: 16 }]}>
            <View style={[styles.searchWrap, isPhone && { flex: 1 }]}>
              <SearchBar palette={palette} value={searchQuery} onChangeText={handleSearchChange} placeholder="Search customers..." />
            </View>

            <Pressable
              onPress={() => setRequestsModalVisible(true)}
              style={[styles.bellButton, { backgroundColor: palette.card, borderColor: palette.border }]}
            >
              <Ionicons name="notifications-outline" size={20} color={palette.text} />
              {pendingCount > 0 && (
                <View style={[styles.badge, { backgroundColor: palette.danger }]}>
                  <Text style={styles.badgeText}>{pendingCount > 9 ? "9+" : pendingCount}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        <Animated.View
          entering={FadeInDown.duration(400)}
          style={[styles.listCard, { backgroundColor: palette.card, borderColor: palette.border }]}
        >
          <Text style={[styles.listTitle, { color: palette.text }]}>All Customers</Text>
          <Text style={[styles.listSubtitle, { color: palette.muted }]}>
            Total customers: {customers.length}
          </Text>

          <View style={{ marginTop: 18 }}>
            {loading ? (
              <CustomersSkeleton palette={palette} rows={4} />
            ) : customers.length === 0 ? (
              <CustomersEmptyState palette={palette} isSearch={searchQuery.trim().length > 0} />
            ) : isPhone ? (
              <View style={{ gap: 14 }}>
                {customers.map((customer, index) => (
                  <CustomerCard
                    key={customer.id}
                    customer={customer}
                    palette={palette}
                    delay={index * 40}
                    onDelete={handleRequestDelete}
                  />
                ))}
              </View>
            ) : (
              <CustomerTable palette={palette} customers={customers} onDelete={handleRequestDelete} />
            )}
          </View>
        </Animated.View>
      </View>

      <DeleteCustomerModal
        visible={!!deleteTarget}
        palette={palette}
        customerName={deleteTarget?.name ?? ""}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

      <InactivationRequestsModal
        visible={requestsModalVisible}
        palette={palette}
        requests={inactivationRequests}
        resolvingId={resolvingRequestId}
        onClose={() => setRequestsModalVisible(false)}
        onResolve={handleResolveRequest}
      />

      <Toast toast={toast} palette={palette} />
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22, gap: 16 },
  pageTitle: { fontSize: 26, fontWeight: "800" },
  pageSubtitle: { fontSize: 13.5, marginTop: 6 },
  actionsRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  searchWrap: { width: 300 },
  bellButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "800" },

  listCard: { borderWidth: 1, borderRadius: 20, padding: 20 },
  listTitle: { fontSize: 18, fontWeight: "800" },
  listSubtitle: { fontSize: 12.5, marginTop: 4 },
});