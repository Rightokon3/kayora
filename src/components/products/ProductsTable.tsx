import React, { memo } from "react";
import { View, Text, Image, Pressable, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Palette } from "../../contexts/ThemeContext";
import { Product } from "../../types/product";
import { StatusBadge } from "./StatusBadge";

const COLUMN_WIDTHS = {
  product: 260,
  size: 90,
  price: 100,
  available: 90,
  status: 130,
  actions: 100,
};

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

function ProductTableBase({
  palette,
  products,
  onEdit,
  onDelete,
  onPreviewImage,
}: {
  palette: Palette;
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onPreviewImage: (uri: string | null) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
        <View style={[styles.headerRow, { borderBottomColor: palette.border }]}>
          <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.product, color: palette.muted }]}>Product</Text>
          <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.size, color: palette.muted }]}>Size</Text>
          <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.price, color: palette.muted }]}>Price</Text>
          <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.available, color: palette.muted }]}>Available</Text>
          <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.status, color: palette.muted }]}>Status</Text>
          <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.actions, color: palette.muted }]}>Actions</Text>
        </View>

        {products.map((product, index) => (
          <View
            key={product.id}
            style={[
              styles.row,
              index !== products.length - 1 && { borderBottomWidth: 1, borderBottomColor: palette.border },
            ]}
          >
            <View style={[styles.productCell, { width: COLUMN_WIDTHS.product }]}>
              <Pressable onPress={() => onPreviewImage(product.imageUri)}>
                {product.imageUri ? (
                  <Image source={{ uri: product.imageUri }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbFallback, { backgroundColor: palette.pillBg }]}>
                    <Ionicons name="water-outline" size={18} color={palette.primary} />
                  </View>
                )}
              </Pressable>
              <View style={{ marginLeft: 12, flexShrink: 1 }}>
                <Text style={[styles.productName, { color: palette.text }]} numberOfLines={1}>
                  {product.name}
                </Text>
                <Text style={[styles.productSubtitle, { color: palette.muted }]} numberOfLines={1}>
                  {product.description}
                </Text>
              </View>
            </View>

            <Text style={[styles.cell, { width: COLUMN_WIDTHS.size, color: palette.text, fontWeight: "700" }]}>
              {product.size}
            </Text>
            <Text style={[styles.cell, { width: COLUMN_WIDTHS.price, color: palette.text, fontWeight: "700" }]}>
              {formatNaira(product.price)}
            </Text>
            <Text style={[styles.cell, { width: COLUMN_WIDTHS.available, color: product.available ? palette.success : palette.muted, fontWeight: "700" }]}>
              {product.available ? "Yes" : "No"}
            </Text>
            <View style={{ width: COLUMN_WIDTHS.status }}>
              <StatusBadge status={product.status} palette={palette} />
            </View>
            <View style={[styles.actionsCell, { width: COLUMN_WIDTHS.actions }]}>
              <Pressable onPress={() => onEdit(product)} style={[styles.actionButton, { borderColor: palette.border }]}>
                <Ionicons name="create-outline" size={16} color={palette.text} />
              </Pressable>
              <Pressable onPress={() => onDelete(product)} style={[styles.actionButton, { borderColor: palette.border }]}>
                <Ionicons name="trash-outline" size={16} color={palette.danger} />
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export const ProductTable = memo(ProductTableBase);

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", borderBottomWidth: 1, paddingBottom: 12, marginBottom: 4, gap: 8 },
  headerCell: { fontSize: 11.5, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 16, gap: 8 },
  productCell: { flexDirection: "row", alignItems: "center" },
  thumb: { width: 44, height: 44, borderRadius: 10 },
  thumbFallback: { alignItems: "center", justifyContent: "center" },
  productName: { fontSize: 14, fontWeight: "700" },
  productSubtitle: { fontSize: 12, marginTop: 2 },
  cell: { fontSize: 13.5 },
  actionsCell: { flexDirection: "row", gap: 8 },
  actionButton: { width: 34, height: 34, borderRadius: 9, borderWidth: 1, alignItems: "center", justifyContent: "center" },
});