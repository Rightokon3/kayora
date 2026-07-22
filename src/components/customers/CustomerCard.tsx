import React, { memo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Palette } from "../../contexts/ThemeContext";
import { Customer } from "../../types/customer";
import { CustomerAvatar } from "./CustomerAvatar";

function formatJoinedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function CustomerCardBase({
  palette,
  customer,
  delay = 0,
  onDelete,
  onDistributorPress,
}: {
  palette: Palette;
  customer: Customer;
  delay?: number;
  onDelete: (customer: Customer) => void;
  onDistributorPress: (customer: Customer) => void;
}) {
  const isPendingApplication = customer.distributorApplication?.status === "pending";

  return (
    <Animated.View
      entering={FadeInDown.duration(380).delay(delay)}
      style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}
    >
      <View style={styles.topRow}>
        <CustomerAvatar palette={palette} name={customer.name} profilePicture={customer.profilePicture} size={48} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={[styles.name, { color: palette.text }]} numberOfLines={1}>
            {customer.name}
          </Text>
          <Text style={[styles.customerId, { color: palette.muted }]}>{customer.id}</Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: palette.border }]} />

      <InfoRow icon="call-outline" text={customer.phone} palette={palette} />
      <InfoRow icon="mail-outline" text={customer.email} palette={palette} />
      <InfoRow
        icon="location-outline"
        text={`${customer.address.street}, ${customer.address.city}, ${customer.address.state}`}
        palette={palette}
      />
      <InfoRow icon="calendar-outline" text={`Joined ${formatJoinedDate(customer.joinedAt)}`} palette={palette} />

      {customer.distributorApplication && (
        <Pressable
          onPress={() => onDistributorPress(customer)}
          style={[
            styles.distributorButton,
            {
              borderColor: isPendingApplication ? palette.danger + "40" : palette.border,
            },
          ]}
        >
          <Ionicons
            name="business-outline"
            size={15}
            color={isPendingApplication ? palette.danger : palette.muted}
          />
          <Text
            style={[
              styles.distributorButtonText,
              { color: isPendingApplication ? palette.danger : palette.muted },
            ]}
          >
            {isPendingApplication ? "Distributor Application (Pending)" : "View Distributor Application"}
          </Text>
        </Pressable>
      )}

      <Pressable
        onPress={() => onDelete(customer)}
        style={[styles.deleteButton, { borderColor: palette.danger + "40" }]}
      >
        <Ionicons name="trash-outline" size={15} color={palette.danger} />
        <Text style={[styles.deleteButtonText, { color: palette.danger }]}>Delete Account</Text>
      </Pressable>
    </Animated.View>
  );
}

function InfoRow({ icon, text, palette }: { icon: keyof typeof Ionicons.glyphMap; text: string; palette: Palette }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={14} color={palette.muted} style={{ marginTop: 1 }} />
      <Text style={[styles.infoText, { color: palette.text }]} numberOfLines={2}>
        {text}
      </Text>
    </View>
  );
}

export const CustomerCard = memo(CustomerCardBase);

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 18, padding: 16 },
  topRow: { flexDirection: "row", alignItems: "center" },
  name: { fontSize: 15, fontWeight: "700" },
  customerId: { fontSize: 11.5, marginTop: 2 },
  divider: { height: 1, marginVertical: 14 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 10 },
  infoText: { fontSize: 12.5, flexShrink: 1, lineHeight: 17 },
  distributorButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 6,
  },
  distributorButtonText: { fontSize: 12.5, fontWeight: "700" },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
  },
  deleteButtonText: { fontSize: 12.5, fontWeight: "700" },
});