import React from "react";
import { View, Text, Image, Pressable, ScrollView, Linking, StyleSheet, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Palette } from "../../contexts/ThemeContext";
import { Order } from "../../types/order";
import { OrderStatusBadge } from "./StatusBadge";
import { OrderTimeline } from "./Timeline";

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
}

function InfoRow({ label, value, palette, isLast }: { label: string; value: string; palette: Palette; isLast?: boolean }) {
  return (
    <View style={[styles.infoRow, !isLast && { borderBottomWidth: 1, borderBottomColor: palette.border }]}>
      <Text style={[styles.infoLabel, { color: palette.muted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: palette.text }]}>{value}</Text>
    </View>
  );
}

function SectionCard({ title, palette, children }: { title: string; palette: Palette; children: React.ReactNode }) {
  return (
    <Animated.View
      entering={FadeInDown.duration(350)}
      style={[styles.sectionCard, { backgroundColor: palette.background, borderColor: palette.border }]}
    >
      <Text style={[styles.sectionTitle, { color: palette.text }]}>{title}</Text>
      <View style={{ marginTop: 12 }}>{children}</View>
    </Animated.View>
  );
}

export function OrderDetailsModal({
  order,
  palette,
  onClose,
  onAssignDriver,
}: {
  order: Order | null;
  palette: Palette;
  onClose: () => void;
  onAssignDriver: (order: Order) => void;
}) {
  if (!order) return null;

  const initial = order.customer.name.trim().charAt(0).toUpperCase();

  // Assign button shows only when: order is still Pending AND either it's
  // an Instant/ASAP order (deliverable right now), or it's Scheduled for
  // TODAY specifically — not any future date. An order scheduled for
  // tomorrow shouldn't be assignable yet.
  const isScheduledForToday = (() => {
    if (!order.scheduledDate) return false;
    const today = new Date();
    const scheduled = new Date(order.scheduledDate);
    return (
      scheduled.getFullYear() === today.getFullYear() &&
      scheduled.getMonth() === today.getMonth() &&
      scheduled.getDate() === today.getDate()
    );
  })();

  const needsDriverAssignment =
    order.status === "Pending" &&
    (order.deliveryType === "Instant" || isScheduledForToday);

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <BlurView intensity={35} tint={palette.scheme === "dark" ? "dark" : "light"} style={StyleSheet.absoluteFill}>
        <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
          <View style={[styles.modalCard, { backgroundColor: palette.card }]}>
            <View style={[styles.headerRow, { borderBottomColor: palette.border }]}>
              <View>
                <Text style={[styles.headerTitle, { color: palette.text }]}>Order #{order.id}</Text>
                <Text style={[styles.headerSubtitle, { color: palette.muted }]}>{formatDateTime(order.orderDate)}</Text>
              </View>
              <Pressable onPress={onClose} hitSlop={10} style={[styles.closeButton, { backgroundColor: palette.pillBg }]}>
                <Ionicons name="close" size={20} color={palette.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              <SectionCard title="Order Information" palette={palette}>
                <InfoRow label="Order ID" value={`#${order.id}`} palette={palette} />
                <InfoRow label="Order Date" value={formatDateTime(order.orderDate)} palette={palette} />
                <InfoRow label="Payment Method" value={order.paymentMethod} palette={palette} />
                <InfoRow label="Payment Status" value={order.paymentStatus} palette={palette} />
                <InfoRow label="Transaction ID" value={order.transactionId} palette={palette} />
                <InfoRow label="Delivery Type" value={order.deliveryType} palette={palette} />
                {order.deliveryType === "Scheduled" && (
                  <>
                    <InfoRow label="Scheduled Delivery" value={order.scheduledDate ? new Date(order.scheduledDate).toLocaleDateString() : "—"} palette={palette} />
                    <InfoRow label="Delivery Time" value={order.scheduledTime ?? "—"} palette={palette} />
                  </>
                )}
                <InfoRow label="Order Status" value={order.status} palette={palette} isLast />
              </SectionCard>

              <SectionCard title="Customer Information" palette={palette}>
                <View style={styles.customerRow}>
                  {order.customer.profilePicture ? (
                    <Image source={{ uri: order.customer.profilePicture }} style={styles.customerAvatar} />
                  ) : (
                    <View style={[styles.customerAvatar, styles.customerAvatarFallback, { backgroundColor: palette.primary }]}>
                      <Text style={styles.customerAvatarText}>{initial}</Text>
                    </View>
                  )}
                  <Text style={[styles.customerName, { color: palette.text }]}>{order.customer.name}</Text>
                </View>
                <InfoRow label="Phone Number" value={order.customer.phone} palette={palette} />
                <InfoRow label="Email" value={order.customer.email} palette={palette} />
                <InfoRow label="Delivery Address" value={order.customer.deliveryAddress} palette={palette} />
                <InfoRow label="Nearest Landmark" value={order.customer.nearestLandmark} palette={palette} />
                <InfoRow
                  label="GPS Coordinates"
                  value={`${order.customer.latitude.toFixed(5)}, ${order.customer.longitude.toFixed(5)}`}
                  palette={palette}
                  isLast
                />
              </SectionCard>

              <SectionCard title="Ordered Products" palette={palette}>
                <View style={[styles.productsHeaderRow, { borderBottomColor: palette.border }]}>
                  <Text style={[styles.productsHeaderCell, { flex: 2, color: palette.muted }]}>Bottle</Text>
                  <Text style={[styles.productsHeaderCell, { flex: 1, color: palette.muted }]}>Size</Text>
                  <Text style={[styles.productsHeaderCell, { flex: 1, color: palette.muted }]}>Qty</Text>
                  <Text style={[styles.productsHeaderCell, { flex: 1, color: palette.muted }]}>Price</Text>
                  <Text style={[styles.productsHeaderCell, { flex: 1.2, color: palette.muted, textAlign: "right" }]}>Subtotal</Text>
                </View>
                {order.products.map((product, index) => (
                  <View
                    key={`${product.bottleName}-${index}`}
                    style={[styles.productRow, index !== order.products.length - 1 && { borderBottomWidth: 1, borderBottomColor: palette.border }]}
                  >
                    <Text style={[styles.productCell, { flex: 2, color: palette.text, fontWeight: "700" }]} numberOfLines={1}>
                      {product.bottleName}
                    </Text>
                    <Text style={[styles.productCell, { flex: 1, color: palette.muted }]}>{product.size}</Text>
                    <Text style={[styles.productCell, { flex: 1, color: palette.muted }]}>{product.quantity}</Text>
                    <Text style={[styles.productCell, { flex: 1, color: palette.muted }]}>{formatNaira(product.price)}</Text>
                    <Text style={[styles.productCell, { flex: 1.2, color: palette.text, fontWeight: "800", textAlign: "right" }]}>
                      {formatNaira(product.subtotal)}
                    </Text>
                  </View>
                ))}
                <View style={[styles.totalRow, { borderTopColor: palette.border }]}>
                  <Text style={[styles.totalLabel, { color: palette.muted }]}>Total</Text>
                  <Text style={[styles.totalValue, { color: palette.text }]}>{formatNaira(order.amount)}</Text>
                </View>
              </SectionCard>

              <SectionCard title="Delivery Information" palette={palette}>
                <InfoRow label="Driver Assigned" value={order.delivery.driverName ?? "Not yet assigned"} palette={palette} />
                <InfoRow label="Vehicle" value={order.delivery.vehicle ?? "—"} palette={palette} />
                <InfoRow label="Estimated Delivery Time" value={order.delivery.estimatedDeliveryTime ?? "—"} palette={palette} />
                <InfoRow label="Distance" value={order.delivery.distanceKm != null ? `${order.delivery.distanceKm} km` : "—"} palette={palette} />
                <InfoRow label="Delivery Notes" value={order.specialInstructions || "—"} palette={palette} />
                <InfoRow label="Current Status" value={order.status} palette={palette} isLast />

                {needsDriverAssignment && (
                  <Pressable
                    onPress={() => onAssignDriver(order)}
                    style={[styles.assignButton, { backgroundColor: palette.primary }]}
                  >
                    <Ionicons name="person-add-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.assignButtonText}>Assign Driver</Text>
                  </Pressable>
                )}
              </SectionCard>

              <SectionCard title="Timeline" palette={palette}>
                <OrderTimeline palette={palette} events={order.timeline} />
              </SectionCard>
            </ScrollView>
          </View>
        </SafeAreaView>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalCard: { flex: 1, marginTop: 30, borderTopLeftRadius: 26, borderTopRightRadius: 26, overflow: "hidden" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", padding: 18, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  headerSubtitle: { fontSize: 12, marginTop: 4 },
  closeButton: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  scrollContent: { padding: 18, paddingBottom: 32, gap: 16 },

  sectionCard: { borderWidth: 1, borderRadius: 18, padding: 16 },
  sectionTitle: { fontSize: 14.5, fontWeight: "800" },

  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 9, gap: 12 },
  infoLabel: { fontSize: 12.5, fontWeight: "600" },
  infoValue: { fontSize: 12.5, fontWeight: "700", flexShrink: 1, textAlign: "right" },

  customerRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  customerAvatar: { width: 44, height: 44, borderRadius: 22 },
  customerAvatarFallback: { alignItems: "center", justifyContent: "center" },
  customerAvatarText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  customerName: { fontSize: 14.5, fontWeight: "700", marginLeft: 10 },

  productsHeaderRow: { flexDirection: "row", borderBottomWidth: 1, paddingBottom: 8, marginBottom: 4 },
  productsHeaderCell: { fontSize: 10.5, fontWeight: "700", textTransform: "uppercase" },
  productRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  productCell: { fontSize: 12.5 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, paddingTop: 12, marginTop: 4 },
  totalLabel: { fontSize: 12.5, fontWeight: "700" },
  totalValue: { fontSize: 15, fontWeight: "800" },

  assignButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 46, borderRadius: 12, marginTop: 14 },
  assignButtonText: { color: "#FFFFFF", fontSize: 13.5, fontWeight: "700" },
});