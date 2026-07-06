import React, { memo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Palette } from "../../contexts/ThemeContext";
import { Driver } from "../../types/driver";
import { DriverAvatar } from "./DriverAvatar";
import { DriverStatusBadge } from "./StatusBadge";

function DriverCardBase({
  palette,
  driver,
  delay = 0,
  onTrack,
  onEdit,
  onDelete,
}: {
  palette: Palette;
  driver: Driver;
  delay?: number;
  onTrack: (driver: Driver) => void;
  onEdit: (driver: Driver) => void;
  onDelete: (driver: Driver) => void;
}) {
  const fullName = `${driver.firstName} ${driver.lastName}`;

  return (
    <Animated.View
      entering={FadeInDown.duration(380).delay(delay)}
      style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}
    >
      <View style={styles.topRow}>
        <DriverAvatar palette={palette} name={fullName} profileImage={driver.profileImage} size={48} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={[styles.name, { color: palette.text }]} numberOfLines={1}>
            {fullName}
          </Text>
          <Text style={[styles.driverId, { color: palette.muted }]}>{driver.driverId}</Text>
        </View>
        <DriverStatusBadge status={driver.status} palette={palette} />
      </View>

      <View style={[styles.divider, { backgroundColor: palette.border }]} />

      <InfoRow icon="call-outline" text={driver.phone} palette={palette} />
      <InfoRow icon="car-sport-outline" text={`${driver.vehicle.brand} ${driver.vehicle.model} · ${driver.vehicle.plateNumber}`} palette={palette} />

      <View style={styles.actionsRow}>
        <Pressable onPress={() => onTrack(driver)} style={[styles.actionButton, { borderColor: palette.border }]}>
          <Ionicons name="location-outline" size={15} color={palette.secondary} />
          <Text style={[styles.actionText, { color: palette.secondary }]}>Track</Text>
        </Pressable>
        <Pressable onPress={() => onEdit(driver)} style={[styles.actionButton, { borderColor: palette.border }]}>
          <Ionicons name="create-outline" size={15} color={palette.text} />
          <Text style={[styles.actionText, { color: palette.text }]}>Edit</Text>
        </Pressable>
        <Pressable onPress={() => onDelete(driver)} style={[styles.actionButton, { borderColor: palette.danger + "40" }]}>
          <Ionicons name="trash-outline" size={15} color={palette.danger} />
          <Text style={[styles.actionText, { color: palette.danger }]}>Delete</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

function InfoRow({ icon, text, palette }: { icon: keyof typeof Ionicons.glyphMap; text: string; palette: Palette }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={14} color={palette.muted} />
      <Text style={[styles.infoText, { color: palette.text }]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

export const DriverCard = memo(DriverCardBase);

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 18, padding: 16 },
  topRow: { flexDirection: "row", alignItems: "center" },
  name: { fontSize: 15, fontWeight: "700" },
  driverId: { fontSize: 11.5, marginTop: 2 },
  divider: { height: 1, marginVertical: 14 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  infoText: { fontSize: 12.5, flexShrink: 1 },
  actionsRow: { flexDirection: "row", gap: 8, marginTop: 6 },
  actionButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 40, borderRadius: 10, borderWidth: 1 },
  actionText: { fontSize: 12, fontWeight: "700" },
});