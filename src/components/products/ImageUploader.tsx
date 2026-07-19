import React, { useState } from "react";
import { View, Text, Image, Pressable, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Palette } from "../../contexts/ThemeContext";

/* ============================================================
   IMAGE UPLOADER
   ------------------------------------------------------------
   Returns a local URI (or base64 data URL on web) via onChange.
   When the Laravel API is wired up, the parent form is
   responsible for uploading this URI as multipart form data on
   submit — this component's contract (a single string URI)
   does not need to change.
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

  const requestAndPick = async (source: "camera" | "gallery") => {
    setPickerOpen(false);
    try {
      if (source === "camera") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) return;
        const result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true, aspect: [1, 1] });
        if (!result.canceled && result.assets?.[0]?.uri) onChange(result.assets[0].uri);
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) return;
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: true,
          aspect: [1, 1],
        });
        if (!result.canceled && result.assets?.[0]?.uri) onChange(result.assets[0].uri);
      }
    } catch (e) {
      // Permission denied or picker cancelled — leave image unchanged.
    }
  };

  // On web, launchImageLibraryAsync already opens the native file picker,
  // so "Web Upload" reuses the same gallery flow.
  const handleWebUpload = () => requestAndPick("gallery");

  if (imageUri) {
    return (
      <View style={[styles.previewWrap, { borderColor: palette.border }]}>
        <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
        <Pressable onPress={() => onChange(null)} style={[styles.removeButton, { backgroundColor: palette.danger }]}>
          <Ionicons name="close" size={14} color="#FFFFFF" />
        </Pressable>
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
  optionsRow: { marginTop: 10, borderWidth: 1, borderRadius: 14, overflow: "hidden" },
  optionItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 14 },
  optionText: { fontSize: 13, fontWeight: "600" },
});