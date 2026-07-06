import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Linking,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { Palette } from "../../contexts/ThemeContext";
import { DriversService } from "../../services/drivers";
import { Driver } from "../../types/driver";
import { DriverAvatar } from "./DriverAvatar";
import { DriverStatusBadge } from "./StatusBadge";

/* ============================================================
   NOTE ON MAP TECHNOLOGY
   ------------------------------------------------------------
   The brief asked for React Native Maps, but that library has no
   web renderer at all, which conflicts with the "must work on
   Android, iOS, Web, Tablets, Desktop" requirement. This uses a
   Leaflet map inside a WebView instead — the same approach
   already used in the Kayora Driver app's tracking modals — so
   the map actually renders on every target platform.
============================================================ */

function buildTrackingHtml(lat: number, lng: number, isDark: boolean) {
  const tileUrl = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background: ${isDark ? "#09090B" : "#F8FAFC"}; }
    .leaflet-control-attribution { font-size: 9px; }
    .kayora-vehicle-marker {
      width: 26px; height: 26px; border-radius: 8px;
      background: #0D4A8C; border: 3px solid #FFFFFF;
      box-shadow: 0 0 0 5px rgba(13,74,140,0.25);
      display: flex; align-items: center; justify-content: center;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map', { zoomControl: false }).setView([${lat}, ${lng}], 15);
    L.tileLayer('${tileUrl}', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);

    var icon = L.divIcon({ className: 'kayora-vehicle-marker', html: '🚚', iconSize: [26, 26] });
    var marker = L.marker([${lat}, ${lng}], { icon: icon }).addTo(map);

    function updateMarker(lat, lng) {
      var newLatLng = new L.LatLng(lat, lng);
      marker.setLatLng(newLatLng);
      map.panTo(newLatLng, { animate: true, duration: 1 });
    }
    function centerMap(lat, lng) {
      map.setView([lat, lng], 16, { animate: true });
    }
    true;
  </script>
</body>
</html>`;
}

export function TrackDriverModal({
  visible,
  palette,
  driver,
  onClose,
}: {
  visible: boolean;
  palette: Palette;
  driver: Driver | null;
  onClose: () => void;
}) {
  const webviewRef = useRef<WebView>(null);
  const [location, setLocation] = useState(driver?.location ?? null);
  const [mapReady, setMapReady] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (driver) setLocation(driver.location);
    setMapReady(false);
  }, [driver?.id]);

  const applyLocation = useCallback((next: Driver["location"]) => {
    setLocation(next);
    webviewRef.current?.injectJavaScript(
      `updateMarker(${next.latitude}, ${next.longitude}); true;`,
    );
  }, []);

  useEffect(() => {
    if (!visible || !driver || !mapReady) return;
    pollRef.current = setInterval(async () => {
      try {
        const next = await DriversService.trackDriver(driver.id);
        applyLocation(next);
      } catch (e) {
        // Ignore transient tracking errors in demo mode.
      }
    }, 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [visible, driver?.id, mapReady, applyLocation]);

  if (!visible || !driver) return null;

  const fullName = `${driver.firstName} ${driver.lastName}`;
  const html = location
    ? buildTrackingHtml(
        location.latitude,
        location.longitude,
        palette.scheme === "dark",
      )
    : "";

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const next = await DriversService.trackDriver(driver.id);
      applyLocation(next);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCenter = () => {
    if (location) {
      webviewRef.current?.injectJavaScript(
        `centerMap(${location.latitude}, ${location.longitude}); true;`,
      );
    }
  };

  const handleOpenInMaps = () => {
    if (!location) return;
    const url = Platform.select({
      ios: `http://maps.apple.com/?daddr=${location.latitude},${location.longitude}`,
      android: `geo:${location.latitude},${location.longitude}?q=${location.latitude},${location.longitude}`,
      default: `https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=16/${location.latitude}/${location.longitude}`,
    });
    if (url) Linking.openURL(url).catch(() => {});
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: palette.background }]}
        edges={["top", "bottom"]}
      >
        <View style={[styles.headerRow, { borderBottomColor: palette.border }]}>
          <View style={styles.headerLeft}>
            <DriverAvatar
              palette={palette}
              name={fullName}
              profileImage={driver.profileImage}
              size={40}
            />
            <View style={{ marginLeft: 10 }}>
              <Text style={[styles.headerName, { color: palette.text }]}>
                {fullName}
              </Text>
              <Text style={[styles.headerId, { color: palette.muted }]}>
                {driver.driverId}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={10}
            style={[styles.closeButton, { backgroundColor: palette.pillBg }]}
          >
            <Ionicons name="close" size={20} color={palette.text} />
          </Pressable>
        </View>

        <View style={[styles.mapWrap, { borderColor: palette.border }]}>
          {html ? (
            <View style={{ flex: 1 }}>
              <WebView
                ref={webviewRef}
                originWhitelist={["*"]}
                source={{ html }}
                style={{ flex: 1 }}
                onLoadEnd={() => setMapReady(true)}
                javaScriptEnabled
                domStorageEnabled
              />
            </View>
          ) : null}
          {!mapReady && (
            <View
              style={[
                styles.mapLoadingOverlay,
                { backgroundColor: palette.card },
              ]}
            >
              <ActivityIndicator size="small" color={palette.primary} />
            </View>
          )}

          <View style={styles.mapControls}>
            <Pressable
              onPress={handleCenter}
              style={[
                styles.mapControlButton,
                { backgroundColor: palette.card },
              ]}
            >
              <Ionicons name="locate-outline" size={18} color={palette.text} />
            </Pressable>
            <Pressable
              onPress={handleRefresh}
              style={[
                styles.mapControlButton,
                { backgroundColor: palette.card },
              ]}
            >
              {refreshing ? (
                <ActivityIndicator size="small" color={palette.primary} />
              ) : (
                <Ionicons
                  name="refresh-outline"
                  size={18}
                  color={palette.text}
                />
              )}
            </Pressable>
            <Pressable
              onPress={handleOpenInMaps}
              style={[
                styles.mapControlButton,
                { backgroundColor: palette.card },
              ]}
            >
              <Ionicons
                name="navigate-outline"
                size={18}
                color={palette.text}
              />
            </Pressable>
          </View>
        </View>

        <Animated.View
          entering={FadeIn.duration(300)}
          style={[
            styles.infoCard,
            { backgroundColor: palette.card, borderColor: palette.border },
          ]}
        >
          <View style={styles.infoTopRow}>
            <DriverStatusBadge status={driver.status} palette={palette} />
            <Text style={[styles.speedText, { color: palette.text }]}>
              {location?.speed ?? 0} km/h
            </Text>
          </View>

          <InfoRow
            label="Vehicle"
            value={`${driver.vehicle.brand} ${driver.vehicle.model}`}
            palette={palette}
          />
          <InfoRow
            label="Plate Number"
            value={driver.vehicle.plateNumber}
            palette={palette}
          />
          <InfoRow
            label="Latitude"
            value={location ? location.latitude.toFixed(5) : "—"}
            palette={palette}
          />
          <InfoRow
            label="Longitude"
            value={location ? location.longitude.toFixed(5) : "—"}
            palette={palette}
          />
          <InfoRow
            label="Last Updated"
            value={
              location ? new Date(location.updatedAt).toLocaleTimeString() : "—"
            }
            palette={palette}
            isLast
          />
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}

function InfoRow({
  label,
  value,
  palette,
  isLast,
}: {
  label: string;
  value: string;
  palette: Palette;
  isLast?: boolean;
}) {
  return (
    <View
      style={[
        styles.infoRow,
        !isLast && { borderBottomWidth: 1, borderBottomColor: palette.border },
      ]}
    >
      <Text style={[styles.infoLabel, { color: palette.muted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: palette.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  headerName: { fontSize: 15, fontWeight: "800" },
  headerId: { fontSize: 11.5, marginTop: 2 },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  mapWrap: {
    flex: 1,
    margin: 16,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  mapLoadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  mapControls: { position: "absolute", top: 14, right: 14, gap: 10 },
  mapControlButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },

  infoCard: {
    margin: 16,
    marginTop: 0,
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
  },
  infoTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  speedText: { fontSize: 15, fontWeight: "800" },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 9,
  },
  infoLabel: { fontSize: 12.5, fontWeight: "600" },
  infoValue: { fontSize: 12.5, fontWeight: "700" },
});
