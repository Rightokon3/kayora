import { Stack } from "expo-router";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";
import { AdminAuthProvider } from "../context/AdminAuthContext";
import { OfflineGate } from "../components/OfflineGate";

function Gated({ children }: { children: React.ReactNode }) {
  const { palette } = useTheme();
  return <OfflineGate colors={palette}>{children}</OfflineGate>;
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Gated>
        <AdminAuthProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="admin" />
          </Stack>
        </AdminAuthProvider>
      </Gated>
    </ThemeProvider>
  );
}