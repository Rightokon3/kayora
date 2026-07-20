import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* ============================================================
   ADMIN API CLIENT
   ------------------------------------------------------------
   Mirrors services/api.ts (the driver app's client) exactly —
   same SecureStore/AsyncStorage web fallback, same 401 handling,
   same token+expiry persistence pattern. Kept as a SEPARATE file
   (not a shared one) on purpose: admin tokens and driver tokens
   must never be readable through the same storage keys, since
   that's what stops one panel's session from leaking into the
   other's requests.
============================================================ */

const isWeb = Platform.OS === "web";

const storage = {
  async getItem(key: string): Promise<string | null> {
    return isWeb ? AsyncStorage.getItem(key) : SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (isWeb) {
      await AsyncStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  async removeItem(key: string): Promise<void> {
    if (isWeb) {
      await AsyncStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000/api";

const TOKEN_KEY = "kayora_admin_token";
const TOKEN_EXPIRY_KEY = "kayora_admin_token_expiry";
const SESSION_USER_KEY = "kayora_admin_session_user";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function saveAdminSession(
  token: string,
  expiresAt: string,
  user: { employeeId: string; email: string; name: string; role: "super_admin" | "admin"; profilePicture: string | null }
) {
  await storage.setItem(TOKEN_KEY, token);
  await storage.setItem(TOKEN_EXPIRY_KEY, expiresAt);
  await storage.setItem(SESSION_USER_KEY, JSON.stringify(user));
}

export async function clearAdminSession() {
  await storage.removeItem(TOKEN_KEY);
  await storage.removeItem(TOKEN_EXPIRY_KEY);
  await storage.removeItem(SESSION_USER_KEY);
}

export async function hasValidAdminSession(): Promise<boolean> {
  const token = await storage.getItem(TOKEN_KEY);
  const expiry = await storage.getItem(TOKEN_EXPIRY_KEY);
  if (!token || !expiry) return false;
  return new Date(expiry).getTime() > Date.now();
}

export async function getStoredAdminUser(): Promise<{
  employeeId: string;
  email: string;
  name: string;
  role: "super_admin" | "admin";
  profilePicture: string | null;
} | null> {
  const raw = await storage.getItem(SESSION_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function adminApiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await storage.getItem(TOKEN_KEY);

  // FormData (file uploads) must NOT have a manual Content-Type — the
  // browser/RN needs to set its own multipart boundary. Forcing
  // "application/json" here, as this function did before, silently broke
  // every multipart upload (Cloudinary would receive a body it couldn't
  // parse as an image at all).
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const body = await response.json().catch(() => ({}));

  if (response.status === 401) {
    if (token) {
      // Had a token and the server rejected it — genuinely expired/invalid
      // (e.g. the 30-day or 1-day cutoff passed), so force a clean logout.
      await clearAdminSession();
      throw new ApiError("Session expired. Please log in again.", 401);
    }
    throw new ApiError(body.message ?? "Invalid administrator credentials.", 401);
  }

  if (response.status === 403) {
    throw new ApiError(body.message ?? "You do not have permission to do that.", 403);
  }

  if (!response.ok) {
    throw new ApiError(body.message ?? "Request failed", response.status);
  }

  return body as T;
}