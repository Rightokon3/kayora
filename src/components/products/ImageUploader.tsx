import React, { useState } from "react";
import { View, Text, Image, Pressable, StyleSheet, Platform, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Palette } from "../../contexts/ThemeContext";
import { adminApiFetch, ApiError } from "../../services/adminApi";

/* ============================================================
   IMAGE UPLOADER
   ------------------------------------------------------------
   Picks an image, immediately uploads it to Cloudinary via
   POST /admin/upload-image, and reports the real hosted
   https://res.cloudinary.com/... URL back through onChange — NOT
   the local blob:/file: URI expo-image-picker returns. That local
   URI only exists in this browser tab's memory; storing it in
   driver_profiles would produce a dead link the moment the page
   is closed or the record is viewed elsewhere.
============================================================ */
export function ImageUploader({
  palette,
  imageUri,
  onChange,
}: {
  palette: Palette;
  imageUri: string | null;
  onChange: (uri: string | null) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadToCloudinary = async (localUri: string) => {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();

      if (Platform.OS === "web") {
        // Same lesson as the signup flow: on web, expo-image-picker
        // returns a blob:/data: URI — the RN-style {uri,type,name}
        // shorthand below doesn't work in a browser, we need a real Blob.
        const fetched = await fetch(localUri);
        const blob = await fetched.blob();
        formData.append("file", blob, "upload.jpg");
      } else {
        formData.append("file", {
          uri: localUri,
          type: "image/jpeg",
          name: "upload.jpg",
        } as any);
      }

      const result = await adminApiFetch<{ success: true; url: string }>("/admin/upload-image", {
        method: "POST",
        body: formData,
      });

      onChange(result.url);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const requestAndPick = async (source: "camera" | "gallery") => {
    setPickerOpen(false);
    try {
      if (source === "camera") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) return;
        const result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true, aspect: [1, 1] });
        if (!result.canceled && result.assets?.[0]?.uri) await uploadToCloudinary(result.assets[0].uri);
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) return;
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: true,
          aspect: [1, 1],
        });
        if (!result.canceled && result.assets?.[0]?.uri) await uploadToCloudinary(result.assets[0].uri);
      }
    } catch (e) {
      // Permission denied or picker cancelled — leave image unchanged.
    }
  };

  // On web, launchImageLibraryAsync already opens the native file picker,
  // so "Web Upload" reuses the same gallery flow.
  const handleWebUpload = () => requestAndPick("gallery");

  if (uploading) {
    return (
      <View style={[styles.addButton, { borderColor: palette.border, backgroundColor: palette.pillBg }]}>
        <ActivityIndicator color={palette.primary} />
        <Text style={[styles.addButtonText, { color: palette.text }]}>Uploading...</Text>
      </View>
    );
  }

  if (imageUri) {
    return (
      <View>
        <View style={[styles.previewWrap, { borderColor: palette.border }]}>
          <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
          <Pressable onPress={() => onChange(null)} style={[styles.removeButton, { backgroundColor: palette.danger }]}>
            <Ionicons name="close" size={14} color="#FFFFFF" />
          </Pressable>
        </View>
        {error && <Text style={[styles.errorText, { color: palette.danger }]}>{error}</Text>}
      </View>
    );
  }

  return (
    <View>
      <Pressable
        onPress={() => setPickerOpen((v) => !v)}
        style={[styles.addButton, { borderColor: palette.border, backgroundColor: palette.pillBg }]}
      >
        <Ionicons name="image-outline" size={22} color={palette.primary} />
        <Text style={[styles.addButtonText, { color: palette.text }]}>Add Image</Text>
      </Pressable>

      {error && <Text style={[styles.errorText, { color: palette.danger }]}>{error}</Text>}

      {pickerOpen && (
        <View style={[styles.optionsRow, { borderColor: palette.border, backgroundColor: palette.card }]}>
          {Platform.OS !== "web" && (
            <Pressable style={styles.optionItem} onPress={() => requestAndPick("camera")}>
              <Ionicons name="camera-outline" size={18} color={palette.text} />
              <Text style={[styles.optionText, { color: palette.text }]}>Camera</Text>
            </Pressable>
          )}
          <Pressable style={styles.optionItem} onPress={() => requestAndPick("gallery")}>
            <Ionicons name="images-outline" size={18} color={palette.text} />
            <Text style={[styles.optionText, { color: palette.text }]}>Gallery</Text>
          </Pressable>
          {Platform.OS === "web" && (
            <Pressable style={styles.optionItem} onPress={handleWebUpload}>
              <Ionicons name="cloud-upload-outline" size={18} color={palette.text} />
              <Text style={[styles.optionText, { color: palette.text }]}>Upload from computer</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  previewWrap: { width: "100%", height: 180, borderRadius: 18, borderWidth: 1, overflow: "hidden", position: "relative" },
  previewImage: { width: "100%", height: "100%" },
  removeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    height: 100,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addButtonText: { fontSize: 13, fontWeight: "700" },
  errorText: { fontSize: 11.5, fontWeight: "600", marginTop: 8 },
  optionsRow: { marginTop: 10, borderWidth: 1, borderRadius: 14, overflow: "hidden" },
  optionItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 14 },
  optionText: { fontSize: 13, fontWeight: "600" },
});