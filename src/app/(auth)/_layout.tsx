import { Stack } from "expo-router";
import { AdminAuthProvider } from "../../context/AdminAuthContext";

export default function AuthLayout() {
  return (
    <AdminAuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AdminAuthProvider>
  );
}