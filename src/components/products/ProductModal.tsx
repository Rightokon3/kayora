import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import Animated, { ZoomIn } from "react-native-reanimated";
import { Palette } from "../../contexts/ThemeContext";
import { Product, ProductInput, ProductStatus, BOTTLE_SIZES, PRODUCT_STATUSES } from "../../types/product";
import { ImageUploader } from "./ImageUploader";
import { SelectField } from "./SelectField";

const EMPTY_INPUT: ProductInput = {
  name: "",
  description: "",
  size: "",
  price: 0,
  imageUri: null,
  available: true,
  status: "Active",
};

export function ProductModal({
  visible,
  palette,
  mode,
  initialProduct,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  palette: Palette;
  mode: "add" | "edit";
  initialProduct: Product | null;
  onClose: () => void;
  onSubmit: (input: ProductInput) => Promise<void>;
}) {
  const [form, setForm] = useState<ProductInput>(EMPTY_INPUT);
  const [priceText, setPriceText] = useState("0");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      if (mode === "edit" && initialProduct) {
        const { id, createdAt, ...rest } = initialProduct;
        setForm(rest);
        setPriceText(String(initialProduct.price));
      } else {
        setForm(EMPTY_INPUT);
        setPriceText("0");
      }
      setErrors({});
    }
  }, [visible, mode, initialProduct]);

  const updateField = useCallback(<K extends keyof ProductInput>(key: K, value: ProductInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handlePriceChange = (text: string) => {
    const numeric = text.replace(/[^0-9.]/g, "");
    setPriceText(numeric);
    updateField("price", numeric ? parseFloat(numeric) : 0);
  };

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = "Product name is required.";
    if (!form.size.trim()) nextErrors.size = "Please select a bottle size.";
    if (!form.price || form.price <= 0) nextErrors.price = "Enter a valid price.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || saving) return;
    setSaving(true);
    try {
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <BlurView intensity={35} tint={palette.scheme === "dark" ? "dark" : "light"} style={StyleSheet.absoluteFill}>
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Animated.View entering={ZoomIn.duration(260)} style={[styles.modalCard, { backgroundColor: palette.card }]}>
            <View style={styles.headerRow}>
              <View>
                <Text style={[styles.title, { color: palette.text }]}>
                  {mode === "add" ? "Add New Product" : "Edit Product"}
                </Text>
                <Text style={[styles.subtitle, { color: palette.muted }]}>
                  {mode === "add" ? "Add a new product to the marketplace" : "Update product information"}
                </Text>
              </View>
              <Pressable onPress={onClose} hitSlop={10} style={[styles.closeButton, { backgroundColor: palette.pillBg }]}>
                <Ionicons name="close" size={18} color={palette.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
              <FieldLabel palette={palette} text="Product Name" />
              <TextInput
                style={[
                  styles.input,
                  { color: palette.text, borderColor: errors.name ? palette.danger : palette.border, backgroundColor: palette.background },
                ]}
                placeholder="e.g. Kayora Premium Water"
                placeholderTextColor={palette.muted}
                value={form.name}
                onChangeText={(t) => updateField("name", t)}
              />
              {errors.name && <ErrorText text={errors.name} palette={palette} />}

              <FieldLabel palette={palette} text="Bottle Size" style={{ marginTop: 16 }} />
              <SelectField
                palette={palette}
                label="Bottle Size"
                value={form.size}
                options={BOTTLE_SIZES}
                onSelect={(v) => updateField("size", v)}
              />
              {errors.size && <ErrorText text={errors.size} palette={palette} />}

              <FieldLabel palette={palette} text="Price (₦)" style={{ marginTop: 16 }} />
              <View
                style={[
                  styles.priceWrap,
                  { borderColor: errors.price ? palette.danger : palette.border, backgroundColor: palette.background },
                ]}
              >
                <Text style={[styles.currencySymbol, { color: palette.muted }]}>₦</Text>
                <TextInput
                  style={[styles.priceInput, { color: palette.text }]}
                  placeholder="0"
                  placeholderTextColor={palette.muted}
                  keyboardType="decimal-pad"
                  value={priceText}
                  onChangeText={handlePriceChange}
                />
              </View>
              {errors.price && <ErrorText text={errors.price} palette={palette} />}

              <FieldLabel palette={palette} text="Product Description" style={{ marginTop: 16 }} />
              <TextInput
                style={[styles.textarea, { color: palette.text, borderColor: palette.border, backgroundColor: palette.background }]}
                placeholder="Enter product description"
                placeholderTextColor={palette.muted}
                value={form.description}
                onChangeText={(t) => updateField("description", t)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <FieldLabel palette={palette} text="Product Image" style={{ marginTop: 16 }} />
              <ImageUploader palette={palette} imageUri={form.imageUri} onChange={(uri) => updateField("imageUri", uri)} />

              <View style={styles.rowBetween}>
                <View>
                  <FieldLabel palette={palette} text="Availability" />
                  <Text style={[styles.helperText, { color: palette.muted }]}>Visible for customer ordering</Text>
                </View>
                <Switch
                  value={form.available}
                  onValueChange={(v) => updateField("available", v)}
                  trackColor={{ false: palette.border, true: palette.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <FieldLabel palette={palette} text="Status" style={{ marginTop: 16, marginBottom: 8 }} />
              <SelectField
                palette={palette}
                label="Status"
                value={form.status}
                options={PRODUCT_STATUSES}
                onSelect={(v) => updateField("status", v as ProductStatus)}
              />

              <View style={styles.footerButtonsRow}>
                <Pressable onPress={onClose} disabled={saving} style={[styles.cancelButton, { borderColor: palette.border }]}>
                  <Text style={[styles.cancelButtonText, { color: palette.text }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleSave}
                  disabled={saving}
                  style={[styles.saveButton, { backgroundColor: palette.primary }]}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>{mode === "add" ? "Save Product" : "Update Product"}</Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
}

function FieldLabel({ palette, text, style }: { palette: Palette; text: string; style?: any }) {
  return <Text style={[styles.label, { color: palette.text }, style]}>{text}</Text>;
}

function ErrorText({ text, palette }: { text: string; palette: Palette }) {
  return <Text style={[styles.errorText, { color: palette.danger }]}>{text}</Text>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  modalCard: { width: "100%", maxWidth: 480, maxHeight: "88%", borderRadius: 24, padding: 22 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 },
  title: { fontSize: 18, fontWeight: "800" },
  subtitle: { fontSize: 12.5, marginTop: 4 },
  closeButton: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },

  label: { fontSize: 12.5, fontWeight: "700", marginBottom: 8 },
  helperText: { fontSize: 11.5, marginTop: 2 },
  errorText: { fontSize: 11.5, fontWeight: "600", marginTop: 6 },

  input: { height: 48, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, fontSize: 14 },
  textarea: { height: 96, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14 },

  priceWrap: { flexDirection: "row", alignItems: "center", height: 48, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14 },
  currencySymbol: { fontSize: 14, fontWeight: "700", marginRight: 6 },
  priceInput: { flex: 1, fontSize: 14, height: "100%" },

  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20 },

  footerButtonsRow: { flexDirection: "row", gap: 10, marginTop: 26 },
  cancelButton: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  cancelButtonText: { fontSize: 14, fontWeight: "700" },
  saveButton: { flex: 1, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  saveButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});