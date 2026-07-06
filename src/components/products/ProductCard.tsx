import React, { memo } from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Palette } from "../../contexts/ThemeContext";
import { Product } from "../../types/product";
import { StatusBadge } from "./StatusBadge";

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

function ProductCardBase({
  palette,
  product,
  delay = 0,
  onEdit,
  onDelete,
  onPreviewImage,
}: {
  palette: Palette;
  product: Product;
  delay?: number;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onPreviewImage: (uri: string | null) => void;
}) {
  return (
    <Animated.View
      entering={FadeInDown.duration(380).delay(delay)}
      style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}
    >
      <View style={styles.topRow}>
        <Pressable onPress={() => onPreviewImage(product.imageUri)}>
          {product.imageUri ? (
            <Image source={{ uri: product.imageUri }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, styles.thumbFallback, { backgroundColor: palette.pillBg }]}>
              <Ionicons name="water-outline" size={22} color={palette.primary} />
            </View>
          )}
        </Pressable>

        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={[styles.name, { color: palette.text }]} numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={[styles.subtitle, { color: palette.muted }]} numberOfLines={1}>
            {product.description}
          </Text>
        </View>

        <StatusBadge status={product.status} palette={palette} />
      </View>

      <View style={[styles.divider, { backgroundColor: palette.border }]} />

      <View style={styles.metaRow}>
        <MetaItem label="Size" value={product.size} palette={palette} />
        <MetaItem label="Price" value={formatNaira(product.price)} palette={palette} />
        <MetaItem label="Available" value={product.available ? "Yes" : "No"} palette={palette} valueColor={product.available ? palette.success : palette.muted} />
      </View>

      <View style={styles.actionsRow}>
        <Pressable onPress={() => onEdit(product)} style={[styles.actionButton, { borderColor: palette.border }]}>
          <Ionicons name="create-outline" size={15} color={palette.text} />
          <Text style={[styles.actionText, { color: palette.text }]}>Edit</Text>
        </Pressable>
        <Pressable onPress={() => onDelete(product)} style={[styles.actionButton, { borderColor: palette.danger + "40" }]}>
          <Ionicons name="trash-outline" size={15} color={palette.danger} />
          <Text style={[styles.actionText, { color: palette.danger }]}>Delete</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

function MetaItem({
  label,
  value,
  palette,
  valueColor,
}: {
  label: string;
  value: string;
  palette: Palette;
  valueColor?: string;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={[styles.metaLabel, { color: palette.muted }]}>{label}</Text>
      <Text style={[styles.metaValue, { color: valueColor ?? palette.text }]}>{value}</Text>
    </View>
  );
}

export const ProductCard = memo(ProductCardBase);

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 18, padding: 16 },
  topRow: { flexDirection: "row", alignItems: "center" },
  thumb: { width: 52, height: 52, borderRadius: 12 },
  thumbFallback: { alignItems: "center", justifyContent: "center" },
  name: { fontSize: 14.5, fontWeight: "700" },
  subtitle: { fontSize: 12, marginTop: 2 },
  divider: { height: 1, marginVertical: 14 },
  metaRow: { flexDirection: "row" },
  metaLabel: { fontSize: 11, fontWeight: "600" },
  metaValue: { fontSize: 13.5, fontWeight: "700", marginTop: 3 },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  actionButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 40, borderRadius: 10, borderWidth: 1 },
  actionText: { fontSize: 12.5, fontWeight: "700" },
});