import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { useTheme } from "../../contexts/ThemeContext";
import { useResponsive } from "../../hooks/useResponsive";
import { ProductService } from "../../services/ProductService";
import { Product, ProductInput } from "../../types/product";
import { SearchBar } from "../../components/products/SearchBar";
import { ProductTable } from "../../components/products/ProductsTable";
import { ProductCard } from "../../components/products/ProductCard";
import { ProductModal } from "../../components/products/ProductModal";
import { ImagePreviewModal } from "../../components/products/ImagePreviewModal";
import { DeleteConfirmDialog } from "../../components/products/DeleteConfirmDialog";
import { ProductsSkeleton } from "../../components/products/ProductsSkeleton";
import { ProductsEmptyState } from "../../components/products/EmptyState";
import { Toast, ToastState } from "../../components/products/Toast";

const SEARCH_DEBOUNCE_MS = 350;

export default function ProductsScreen() {
  const { palette } = useTheme();
  const { isPhone } = useResponsive();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [previewUri, setPreviewUri] = useState<string | null | undefined>(undefined);

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

  const loadProducts = useCallback(async (search: string) => {
    setLoading(true);
    try {
      const data = await ProductService.getProducts(search);
      setProducts(data);
    } catch (e) {
      showToast("Could not load products. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadProducts("");
  }, []);

  // Real backend search, debounced — replaces the old client-side filter.
  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchQuery(text);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(() => {
        loadProducts(text);
      }, SEARCH_DEBOUNCE_MS);
    },
    [loadProducts]
  );

  const handleOpenAdd = useCallback(() => {
    setModalMode("add");
    setActiveProduct(null);
    setModalVisible(true);
  }, []);

  const handleOpenEdit = useCallback((product: Product) => {
    setModalMode("edit");
    setActiveProduct(product);
    setModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => setModalVisible(false), []);

  const handleSubmitModal = useCallback(
    async (input: ProductInput) => {
      try {
        if (modalMode === "add") {
          await ProductService.createProduct(input);
          showToast("Product added successfully", "success");
        } else if (activeProduct) {
          await ProductService.updateProduct(activeProduct.id, input);
          showToast("Product updated successfully", "success");
        }
        setModalVisible(false);
        await loadProducts(searchQuery);
      } catch (e) {
        showToast("Something went wrong. Please try again.", "error");
      }
    },
    [modalMode, activeProduct, loadProducts, searchQuery, showToast]
  );

  const handleRequestDelete = useCallback((product: Product) => setDeleteTarget(product), []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await ProductService.deleteProduct(deleteTarget.id);
      showToast("Product deleted successfully", "success");
      setDeleteTarget(null);
      await loadProducts(searchQuery);
    } catch (e) {
      showToast("Could not delete product. Please try again.", "error");
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, loadProducts, searchQuery, showToast]);

  return (
    <AdminLayout title="Marketplace Products">
      <View>
        <Text style={[styles.pageTitle, { color: palette.text }]}>Marketplace Products</Text>
        <Text style={[styles.pageSubtitle, { color: palette.muted }]}>
          Manage products available in the marketplace
        </Text>

        <View style={[styles.toolbarRow, isPhone && { flexDirection: "column", alignItems: "stretch" }]}>
          <View style={{ flex: 1 }}>
            <SearchBar palette={palette} value={searchQuery} onChangeText={handleSearchChange} />
          </View>
          <Pressable
            onPress={handleOpenAdd}
            style={[styles.addButton, { backgroundColor: palette.primary }, isPhone && { marginTop: 12 }]}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Product</Text>
          </Pressable>
        </View>

        <Animated.View
          entering={FadeInDown.duration(400)}
          style={[styles.listCard, { backgroundColor: palette.card, borderColor: palette.border }]}
        >
          <Text style={[styles.listTitle, { color: palette.text }]}>All Products</Text>
          <Text style={[styles.listSubtitle, { color: palette.muted }]}>
            Total products: {products.length}
          </Text>

          <View style={{ marginTop: 18 }}>
            {loading ? (
              <ProductsSkeleton palette={palette} rows={4} />
            ) : products.length === 0 ? (
              <ProductsEmptyState palette={palette} isSearch={searchQuery.trim().length > 0} />
            ) : isPhone ? (
              <View style={{ gap: 14 }}>
                {products.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    palette={palette}
                    delay={index * 40}
                    onEdit={handleOpenEdit}
                    onDelete={handleRequestDelete}
                    onPreviewImage={setPreviewUri}
                  />
                ))}
              </View>
            ) : (
              <ProductTable
                palette={palette}
                products={products}
                onEdit={handleOpenEdit}
                onDelete={handleRequestDelete}
                onPreviewImage={setPreviewUri}
              />
            )}
          </View>
        </Animated.View>
      </View>

      <ProductModal
        visible={modalVisible}
        palette={palette}
        mode={modalMode}
        initialProduct={activeProduct}
        onClose={handleCloseModal}
        onSubmit={handleSubmitModal}
      />

      <ImagePreviewModal
        visible={previewUri !== undefined}
        imageUri={previewUri ?? null}
        palette={palette}
        onClose={() => setPreviewUri(undefined)}
      />

      <DeleteConfirmDialog
        visible={!!deleteTarget}
        palette={palette}
        productName={deleteTarget?.name ?? ""}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

      <Toast toast={toast} palette={palette} />
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  pageTitle: { fontSize: 26, fontWeight: "800" },
  pageSubtitle: { fontSize: 13.5, marginTop: 6, marginBottom: 22 },

  toolbarRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 22 },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 46,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  addButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },

  listCard: { borderWidth: 1, borderRadius: 20, padding: 20 },
  listTitle: { fontSize: 18, fontWeight: "800" },
  listSubtitle: { fontSize: 12.5, marginTop: 4 },
});