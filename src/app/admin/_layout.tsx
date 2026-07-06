import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect, Stack } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useTheme } from "../../contexts/ThemeContext";

const SESSION_KEY = "kayora_admin_session";

export default function AdminLayout() {
  const { palette } = useTheme();
  const [status, setStatus] = useState<"checking" | "authed" | "guest">("checking");

  useEffect(() => {
    (async () => {
      try {
        const session = await SecureStore.getItemAsync(SESSION_KEY);
        setStatus(session ? "authed" : "guest");
      } catch (e) {
        setStatus("guest");
      }
    })();
  }, []);

  if (status === "checking") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: palette.background }}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }



  return <Stack screenOptions={{ headerShown: false }} />;
}