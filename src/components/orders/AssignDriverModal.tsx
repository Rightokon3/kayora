import React, { useEffect, useState, useCallback, useMemo } from "react";
import { View, Text, Image, Pressable, ScrollView, ActivityIndicator, StyleSheet, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Palette } from "../../contexts/ThemeContext";
import { Order, AvailableDriver } from "../../types/order";
import { OrdersService } from "../../services/orders";
import { SearchBar } from "../products/SearchBar";

export function AssignDriverModal({
  order,
  palette,
  onClose,
  onAssigned,
}: {
  order: Order | null;
  palette: Palette;
  onClose: () => void;
  onAssigned: (order: Order) => void;
}) {
  const [drivers, setDrivers] = useState<AvailableDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!order) return;
    setLoading(true);
    OrdersService.getAvailableDrivers(order.id).then((list) => {
      setDrivers(list);
      setLoading(false);
    });
  }, [order?.id]);

  const filteredDrivers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return drivers;
    return drivers.filter(
      (d) => d.name.toLowerCase().includes(normalized) || d.driverId.toLowerCase().includes(normalized)
    );
  }, [drivers, query]);

  const handleAssign = useCallback(
    async (driverId: string) => {
      if (!order) return;
      setAssigningId(driverId);
      try {
        const updated = await OrdersService.assignDriver(order.id, driverId);
        onAssigned(updated);
      } finally {
        setAssigningId(null);
      }
    },
    [order, onAssigned]
  );

  if (!order) return null;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <BlurView intensity={35} tint={palette.scheme === "dark" ? "dark" : "light"} style={StyleSheet.absoluteFill}>
        <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
          <View style={[styles.modalCard, { backgroundColor: palette.card }]}>
            <View style={[styles.headerRow, { borderBottomColor: palette.border }]}>
              <View>
                <Text style={[styles.headerTitle, { color: palette.text }]}>Assign Driver</Text>
                <Text style={[styles.headerSubtitle, { color: palette.muted }]}>Order #{order.id}</Text>
              </View>
              <Pressable onPress={onClose} hitSlop={10} style={[styles.closeButton, { backgroundColor: palette.pillBg }]}>
                <Ionicons name="close" size={20} color={palette.text} />
              </Pressable>
            </View>

            <View style={{ paddingHorizontal: 18, paddingTop: 16 }}>
              <SearchBar palette={palette} value={query} onChangeText={setQuery} placeholder="Search driver..." />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              {loading ? (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator color={palette.primary} />
                </View>
              ) : filteredDrivers.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Ionicons name="car-sport-outline" size={36} color={palette.muted} />
                  <Text style={[styles.emptyText, { color: palette.muted }]}>No available drivers right now.</Text>
                </View>
              ) : (
                filteredDrivers.map((driver, index) => {
                  const initial = driver.name.trim().charAt(0).toUpperCase();
                  const isAssigning = assigningId === driver.id;
                  return (
                    <Animated.View
                      key={driver.id}
                      entering={FadeInDown.duration(320).delay(index * 40)}
                      style={[styles.driverCard, { backgroundColor: palette.background, borderColor: palette.border }]}
                    >
                      <View style={styles.driverTopRow}>
                        {driver.profileImage ? (
                          <Image source={{ uri: driver.profileImage }} style={styles.driverAvatar} />
                        ) : (
                          <View style={[styles.driverAvatar, styles.driverAvatarFallback, { backgroundColor: palette.primary }]}>
                            <Text style={styles.driverAvatarText}>{initial}</Text>
                          </View>
                        )}
                        <View style={{ marginLeft: 12, flex: 1 }}>
                          <Text style={[styles.driverName, { color: palette.text }]} numberOfLines={1}>
                            {driver.name}
                          </Text>
                          <Text style={[styles.driverId, { color: palette.muted }]}>{driver.driverId}</Text>
                        </View>
                        <View
                          style={[
                            styles.statusChip,
                            { backgroundColor: (driver.status === "active" ? palette.success : palette.secondary) + "1A" },
                          ]}
                        >
                          <Text style={[styles.statusChipText, { color: driver.status === "active" ? palette.success : palette.secondary }]}>
                            {driver.status === "active" ? "Available" : "Delivering"}
                          </Text>
                        </View>
                      </View>

                      <View style={[styles.divider, { backgroundColor: palette.border }]} />

                      <View style={styles.detailsGrid}>
                        <DriverDetail icon="call-outline" label={driver.phone} palette={palette} />
                        <DriverDetail icon="car-sport-outline" label={driver.vehicle} palette={palette} />
                        <DriverDetail icon="navigate-outline" label={`${driver.distanceKm} km away`} palette={palette} />
                        <DriverDetail icon="cube-outline" label={`${driver.assignedDeliveries} active deliveries`} palette={palette} />
                      </View>

                      <Pressable
                        onPress={() => handleAssign(driver.id)}
                        disabled={!!assigningId}
                        style={[styles.assignButton, { backgroundColor: palette.primary }]}
                      >
                        {isAssigning ? (
                          <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                          <Text style={styles.assignButtonText}>Assign</Text>
                        )}
                      </Pressable>
                    </Animated.View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </BlurView>
    </Modal>
  );
}

function DriverDetail({ icon, label, palette }: { icon: keyof typeof Ionicons.glyphMap; label: string; palette: Palette }) {
  return (
    <View style={styles.detailItem}>
      <Ionicons name={icon} size={13} color={palette.muted} />
      <Text style={[styles.detailText, { color: palette.text }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  modalCard: { flex: 1, marginTop: 30, borderTopLeftRadius: 26, borderTopRightRadius: 26, overflow: "hidden" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", padding: 18, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  headerSubtitle: { fontSize: 12, marginTop: 4 },
  closeButton: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  scrollContent: { padding: 18, gap: 14, paddingBottom: 32 },

  loadingWrap: { paddingVertical: 50, alignItems: "center" },
  emptyWrap: { alignItems: "center", paddingVertical: 50, gap: 10 },
  emptyText: { fontSize: 13, fontWeight: "600" },

  driverCard: { borderWidth: 1, borderRadius: 18, padding: 16 },
  driverTopRow: { flexDirection: "row", alignItems: "center" },
  driverAvatar: { width: 44, height: 44, borderRadius: 22 },
  driverAvatarFallback: { alignItems: "center", justifyContent: "center" },
  driverAvatarText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  driverName: { fontSize: 14.5, fontWeight: "700" },
  driverId: { fontSize: 11.5, marginTop: 2 },
  statusChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusChipText: { fontSize: 10.5, fontWeight: "800" },
  divider: { height: 1, marginVertical: 12 },

  detailsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 6, width: "47%" },
  detailText: { fontSize: 11.5, fontWeight: "600", flexShrink: 1 },

  assignButton: { height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  assignButtonText: { color: "#FFFFFF", fontSize: 13.5, fontWeight: "700" },
});