import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { View, Text, RefreshControl, Pressable, Platform, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { useTheme } from "../../contexts/ThemeContext";
import { useResponsive } from "../../hooks/useResponsive";
import { OrdersService } from "../../services/orders";
import { Order, OrderTab, OrderStatus, OrderEditInput, IN_PROGRESS_STATUSES, COMPLETED_STATUSES } from "../../types/order";
import { SearchBar } from "../../components/products/SearchBar";
import { Toast, ToastState } from "../../components/products/Toast";
import { OrdersStatsCards } from "../../components/orders/StatsCards";
import { OrdersTabsBar } from "../../components/orders/TabsBar";
import { StatusFilterDropdown } from "../../components/orders/StatusFilterDropdown";
import { OrderTable } from "../../components/orders/OrderTable";
import { OrderCard } from "../../components/orders/OrderCard";
import { OrderDetailsModal } from "../../components/orders/OrderDetailsModal";
import { AssignDriverModal } from "../../components/orders/AssignDriverModal";
import { EditOrderModal } from "../../components/orders/EditOrderModal";
import { DeleteOrderModal } from "../../components/orders/DeleteOrderModal";
import { OrdersSkeleton } from "../../components/orders/OrderSkeleton";
import { OrdersEmptyState } from "../../components/orders/EmptyState";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 350;

type DeliveryTypeFilter = "all" | "asap" | "scheduled";

/** todayString() — used as the default upper bound reference for the calendar filter. */
function todayString(): string {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

export default function OrdersScreen() {
  const { palette } = useTheme();
  const { isPhone } = useResponsive();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [activeTab, setActiveTab] = useState<OrderTab>("all");
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState<DeliveryTypeFilter>("all");
  const [dateFilter, setDateFilter] = useState<string>(""); // "" = no calendar filter applied
  const [page, setPage] = useState(1);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [detailsOrder, setDetailsOrder] = useState<Order | null>(null);
  const [assignOrder, setAssignOrder] = useState<Order | null>(null);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [deleteOrder, setDeleteOrder] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Real backend fetch — search, status, delivery type, and calendar date
  // all become actual query params, not client-side array filtering.
  const loadOrders = useCallback(async () => {
    setErrorMessage(null);
    try {
      const data = await OrdersService.getOrders({
        search: searchQuery,
        status: statusFilter,
        deliveryType: deliveryTypeFilter === "all" ? undefined : deliveryTypeFilter,
        date: dateFilter || undefined,
      });
      setOrders(data);
    } catch (e) {
      setErrorMessage("Could not load orders. Pull to refresh and try again.");
    }
  }, [searchQuery, statusFilter, deliveryTypeFilter, dateFilter]);

  // Initial load + reload whenever status/deliveryType/date change (these
  // don't need debouncing — only free-text search does).
  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadOrders();
      setLoading(false);
    })();
  }, [statusFilter, deliveryTypeFilter, dateFilter]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(async () => {
      setLoading(true);
      await loadOrders();
      setLoading(false);
    }, SEARCH_DEBOUNCE_MS);
  }, [loadOrders]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }, [loadOrders]);

  // Tabs still bucket client-side, since the backend already returns
  // everything matching search/status/deliveryType/date — the tab is just
  // a further split of that same result set by status group.
  const tabbedOrders = useMemo(() => {
    if (activeTab === "pending") return orders.filter((o) => o.status === "Pending");
    if (activeTab === "in_progress") return orders.filter((o) => IN_PROGRESS_STATUSES.includes(o.status));
    if (activeTab === "completed") return orders.filter((o) => COMPLETED_STATUSES.includes(o.status));
    return orders;
  }, [orders, activeTab]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, statusFilter, deliveryTypeFilter, dateFilter, searchQuery]);

  const pagedOrders = useMemo(() => tabbedOrders.slice(0, page * PAGE_SIZE), [tabbedOrders, page]);
  const hasMore = pagedOrders.length < tabbedOrders.length;

  const stats = useMemo(
    () => ({
      total: orders.length,
      pending: orders.filter((o) => o.status === "Pending").length,
      active: orders.filter((o) => IN_PROGRESS_STATUSES.includes(o.status)).length,
      completed: orders.filter((o) => COMPLETED_STATUSES.includes(o.status)).length,
    }),
    [orders]
  );

  const handleMoreInfo = useCallback((order: Order) => setDetailsOrder(order), []);
  const handleEdit = useCallback((order: Order) => setEditOrder(order), []);
  const handleDeleteRequest = useCallback((order: Order) => setDeleteOrder(order), []);

  const handleAssignDriverRequest = useCallback((order: Order) => {
    setDetailsOrder(null);
    setAssignOrder(order);
  }, []);

  const handleDriverAssigned = useCallback(
    (updated: Order) => {
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setAssignOrder(null);
      showToast("Driver assigned successfully", "success");
    },
    [showToast]
  );

  const handleSaveEdit = useCallback(
    async (input: OrderEditInput) => {
      if (!editOrder) return;
      try {
        const updated = await OrdersService.updateOrder(editOrder.id, input);
        setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
        setEditOrder(null);
        showToast("Order updated successfully", "success");
      } catch (e) {
        showToast("Could not update order. Please try again.", "error");
      }
    },
    [editOrder, showToast]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteOrder) return;
    setDeleting(true);
    try {
      await OrdersService.deleteOrder(deleteOrder.id);
      setOrders((prev) => prev.filter((o) => o.id !== deleteOrder.id));
      showToast("Order deleted successfully", "success");
      setDeleteOrder(null);
    } catch (e) {
      showToast("Could not delete order. Please try again.", "error");
    } finally {
      setDeleting(false);
    }
  }, [deleteOrder, showToast]);

  const isFilteredEmpty =
    searchQuery.trim().length > 0 || statusFilter !== "all" || activeTab !== "all" || deliveryTypeFilter !== "all" || !!dateFilter;

  return (
    <AdminLayout
      title="Orders"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={palette.primary} colors={[palette.primary]} />}
    >
      <View style={[styles.headerRow, isPhone && { flexDirection: "column", alignItems: "flex-start" }]}>
        <View>
          <Text style={[styles.pageTitle, { color: palette.text }]}>Orders</Text>
          <Text style={[styles.pageSubtitle, { color: palette.muted }]}>View and manage customer orders</Text>
        </View>
        <View style={[styles.headerActions, isPhone && { width: "100%", marginTop: 16, flexDirection: "column", alignItems: "stretch" }]}>
          <View style={[styles.searchWrap, isPhone && { width: "100%" }]}>
            <SearchBar palette={palette} value={searchQuery} onChangeText={handleSearchChange} placeholder="Search orders..." />
          </View>
          <View style={isPhone ? { width: "100%", marginTop: 12 } : undefined}>
            <StatusFilterDropdown palette={palette} value={statusFilter} onChange={setStatusFilter} />
          </View>
        </View>
      </View>

      {/* Delivery type (ASAP vs Scheduled) + calendar filter row */}
      <View style={[styles.filterRow, isPhone && { flexDirection: "column", alignItems: "stretch" }]}>
        <View style={[styles.deliveryTypePills, { backgroundColor: palette.pillBg }]}>
          {(["all", "asap", "scheduled"] as DeliveryTypeFilter[]).map((option) => {
            const isActive = option === deliveryTypeFilter;
            const label = option === "all" ? "All Deliveries" : option === "asap" ? "ASAP" : "Scheduled";
            return (
              <Pressable
                key={option}
                onPress={() => setDeliveryTypeFilter(option)}
                style={[styles.deliveryTypePill, isActive && { backgroundColor: palette.card }]}
              >
                <Text style={[styles.deliveryTypePillText, { color: isActive ? palette.text : palette.muted, fontWeight: isActive ? "800" : "600" }]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Calendar filter — lets the admin see what's Scheduled for a
            specific day. Only meaningful once "Scheduled" is selected
            above, but works standalone too (filters any order type by
            scheduled_date). */}
        <View style={[styles.dateFilterWrap, { borderColor: palette.border, backgroundColor: palette.card }]}>
          <Ionicons name="calendar-outline" size={16} color={palette.muted} />
          {Platform.OS === "web" ? (
            // @ts-ignore — real <input type="date"> for the browser's native picker
            <input
              type="date"
              value={dateFilter}
              onChange={(e: any) => setDateFilter(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                color: palette.text,
                fontSize: 13.5,
                fontFamily: "inherit",
                marginLeft: 8,
                flex: 1,
              }}
            />
          ) : (
            <Text style={[styles.dateFilterText, { color: dateFilter ? palette.text : palette.muted }]}>
              {dateFilter || "Filter by date"}
            </Text>
          )}
          {dateFilter ? (
            <Pressable onPress={() => setDateFilter("")} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={palette.muted} />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          onPress={() => setDateFilter(todayString())}
          style={[styles.todayButton, { borderColor: palette.border }]}
        >
          <Text style={[styles.todayButtonText, { color: palette.text }]}>Today</Text>
        </Pressable>
      </View>

      <OrdersStatsCards palette={palette} total={stats.total} pending={stats.pending} active={stats.active} completed={stats.completed} />

      <OrdersTabsBar palette={palette} active={activeTab} onChange={setActiveTab} />

      {errorMessage && (
        <View style={[styles.errorBanner, { backgroundColor: palette.danger + "1A" }]}>
          <Text style={[styles.errorBannerText, { color: palette.danger }]}>{errorMessage}</Text>
        </View>
      )}

      <Animated.View
        entering={FadeInDown.duration(400)}
        style={[styles.listCard, { backgroundColor: palette.card, borderColor: palette.border }]}
      >
        {loading ? (
          <OrdersSkeleton palette={palette} rows={5} />
        ) : pagedOrders.length === 0 ? (
          <OrdersEmptyState palette={palette} isFiltered={isFilteredEmpty} />
        ) : isPhone ? (
          <View style={{ gap: 14 }}>
            {pagedOrders.map((order, index) => (
              <OrderCard
                key={order.id}
                order={order}
                palette={palette}
                delay={index * 30}
                onMoreInfo={handleMoreInfo}
                onEdit={handleEdit}
                onDelete={handleDeleteRequest}
              />
            ))}
          </View>
        ) : (
          <OrderTable palette={palette} orders={pagedOrders} onMoreInfo={handleMoreInfo} onEdit={handleEdit} onDelete={handleDeleteRequest} />
        )}

        {hasMore && (
          <Text
            onPress={() => setPage((p) => p + 1)}
            style={[styles.loadMoreText, { color: palette.primary }]}
          >
            Load more orders
          </Text>
        )}
      </Animated.View>

      <View style={{ height: 24 }} />

      <OrderDetailsModal order={detailsOrder} palette={palette} onClose={() => setDetailsOrder(null)} onAssignDriver={handleAssignDriverRequest} />
      <AssignDriverModal order={assignOrder} palette={palette} onClose={() => setAssignOrder(null)} onAssigned={handleDriverAssigned} />
      <EditOrderModal order={editOrder} palette={palette} onClose={() => setEditOrder(null)} onSave={handleSaveEdit} />
      <DeleteOrderModal
        visible={!!deleteOrder}
        palette={palette}
        orderId={deleteOrder?.id ?? ""}
        loading={deleting}
        onCancel={() => setDeleteOrder(null)}
        onConfirm={handleConfirmDelete}
      />

      <Toast toast={toast} palette={palette} />
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22, gap: 16 },
  pageTitle: { fontSize: 26, fontWeight: "800" },
  pageSubtitle: { fontSize: 13.5, marginTop: 6 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  searchWrap: { width: 260 },

  filterRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" },
  deliveryTypePills: { flexDirection: "row", borderRadius: 12, padding: 4, gap: 2 },
  deliveryTypePill: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 9 },
  deliveryTypePillText: { fontSize: 12.5 },
  dateFilterWrap: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    minWidth: 190,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 4,
  },
  dateFilterText: { fontSize: 13.5, marginLeft: 8, flex: 1 },
  todayButton: { height: 44, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  todayButtonText: { fontSize: 12.5, fontWeight: "700" },

  errorBanner: { borderRadius: 12, padding: 14, marginBottom: 16 },
  errorBannerText: { fontSize: 12.5, fontWeight: "700" },

  listCard: { borderWidth: 1, borderRadius: 20, padding: 20 },
  loadMoreText: { textAlign: "center", fontSize: 13, fontWeight: "700", marginTop: 18, paddingVertical: 6 },
});