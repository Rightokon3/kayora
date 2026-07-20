import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import Animated, { ZoomIn } from "react-native-reanimated";
import { Palette } from "../../contexts/ThemeContext";

export function SetDriverPasswordModal({
  visible,
  palette,
  driverName,
  onSubmit,
  onSkip,
}: {
  visible: boolean;
  palette: Palette;
  driverName: string;
  onSubmit: (password: string, confirmPassword: string) => Promise<boolean>;
  onSkip: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!visible) return null;

  const handleSubmit = async () => {
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    const success = await onSubmit(password, confirmPassword);
    setSubmitting(false);
    if (!success) {
      setError("Could not set the password. Please try again.");
    }
  };

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onSkip}>
      <BlurView intensity={35} tint={palette.scheme === "dark" ? "dark" : "light"} style={StyleSheet.absoluteFill}>
        <View style={styles.overlay}>
          <Animated.View entering={ZoomIn.duration(220)} style={[styles.card, { backgroundColor: palette.card }]}>
            <View style={[styles.iconCircle, { backgroundColor: palette.primary + "1A" }]}>
              <Ionicons name="lock-closed-outline" size={26} color={palette.primary} />
            </View>
            <Text style={[styles.title, { color: palette.text }]}>Set Driver Password</Text>
            <Text style={[styles.message, { color: palette.muted }]}>
              "{driverName}" was created successfully. Set a login password for their driver account.
            </Text>

            <View style={{ width: "100%", gap: 14, marginTop: 6 }}>
              <View>
                <Text style={[styles.label, { color: palette.text }]}>Password</Text>
                <TextInput
                  style={[styles.input, { color: palette.text, borderColor: palette.border, backgroundColor: palette.background }]}
                  placeholder="At least 8 characters"
                  placeholderTextColor={palette.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
              <View>
                <Text style={[styles.label, { color: palette.text }]}>Confirm Password</Text>
                <TextInput
                  style={[styles.input, { color: palette.text, borderColor: palette.border, backgroundColor: palette.background }]}
                  placeholder="Re-enter password"
                  placeholderTextColor={palette.muted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
              {error && <Text style={[styles.errorText, { color: palette.danger }]}>{error}</Text>}
            </View>

            <View style={styles.buttonsRow}>
              <Pressable onPress={onSkip} disabled={submitting} style={[styles.skipButton, { borderColor: palette.border }]}>
                <Text style={[styles.skipButtonText, { color: palette.text }]}>Skip for now</Text>
              </Pressable>
              <Pressable onPress={handleSubmit} disabled={submitting} style={[styles.submitButton, { backgroundColor: palette.primary }]}>
                {submitting ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.submitButtonText}>Set Password</Text>}
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  card: { width: "100%", maxWidth: 380, borderRadius: 22, padding: 24, alignItems: "center" },
  iconCircle: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  title: { fontSize: 17, fontWeight: "800", marginBottom: 8, textAlign: "center" },
  message: { fontSize: 13.5, textAlign: "center", lineHeight: 19, marginBottom: 18 },
  label: { fontSize: 12.5, fontWeight: "700", marginBottom: 8 },
  input: { height: 46, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, fontSize: 14 },
  errorText: { fontSize: 12, fontWeight: "600", textAlign: "center" },
  buttonsRow: { flexDirection: "row", gap: 10, width: "100%", marginTop: 22 },
  skipButton: { flex: 1, height: 46, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  skipButtonText: { fontSize: 13.5, fontWeight: "700" },
  submitButton: { flex: 1, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  submitButtonText: { color: "#FFFFFF", fontSize: 13.5, fontWeight: "700" },
});