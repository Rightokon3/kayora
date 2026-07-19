import { Stack } from "expo-router";
import { ThemeProvider } from "../contexts/ThemeContext";
import { AdminAuthProvider } from "../context/AdminAuthContext";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AdminAuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="admin" />
        </Stack>
      </AdminAuthProvider>
    </ThemeProvider>
  );
}