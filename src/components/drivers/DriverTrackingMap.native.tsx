import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import MapLibreGL from "@maplibre/maplibre-react-native";

const STYLE_LIGHT = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
const STYLE_DARK = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

// ------------------------------------------------------------------
// IMPORTANT: this used to be `MapLibreGL.setAccessToken(null);` sitting
// directly at module scope. That meant it ran the INSTANT this file was
// imported — which happens eagerly from drivers.tsx -> TrackDriverModal
// -> here, even before the tracking modal is ever opened, and even
// before anything renders. If the native module isn't fully linked in a
// given build, that call throws synchronously during bundle evaluation,
// with no error boundary anywhere to catch it — which in a release APK
// (no red-screen overlay) takes down the ENTIRE app: navbar, layout,
// everything, before any of it mounts. That's the grey blank screen.
//
// Moving it into a lazily-called, try/caught function means: (a) it only
// runs once an actual map is about to be shown, not on every import of
// this file, and (b) if the native module genuinely isn't linked, we get
// a caught error and a visible fallback UI instead of a silent full-app
// crash.
// ------------------------------------------------------------------
let tokenInitialized = false;
function ensureAccessTokenSet(): boolean {
  if (tokenInitialized) return true;
  try {
    MapLibreGL.setAccessToken(null);
    tokenInitialized = true;
    return true;
  } catch (e) {
    console.warn("[DriverTrackingMap] MapLibreGL native module unavailable:", e);
    return false;
  }
}

export interface DriverTrackingMapHandle {
  centerOn: (lat: number, lng: number) => void;
}

interface DriverTrackingMapProps {
  latitude: number;
  longitude: number;
  isDark: boolean;
  onReady?: () => void;
}

export const DriverTrackingMap = forwardRef<DriverTrackingMapHandle, DriverTrackingMapProps>(
  function DriverTrackingMap({ latitude, longitude, isDark, onReady }, ref) {
    const cameraRef = useRef<MapLibreGL.Camera>(null);
    const [nativeAvailable, setNativeAvailable] = useState<boolean | null>(null);

    useEffect(() => {
      setNativeAvailable(ensureAccessTokenSet());
    }, []);

    useImperativeHandle(ref, () => ({
      centerOn: (lat: number, lng: number) => {
        cameraRef.current?.setCamera({
          centerCoordinate: [lng, lat],
          zoomLevel: 16,
          animationDuration: 600,
        });
      },
    }));

    // Still checking, or the native module genuinely isn't linked in this
    // build — show a plain fallback instead of crashing the screen around us.
    if (nativeAvailable === null) return null;
    if (nativeAvailable === false) {
      return (
        <View style={styles.fallback}>
          <Text style={styles.fallbackText}>Map unavailable in this build.</Text>
        </View>
      );
    }

    return (
      <MapLibreGL.MapView
        style={styles.map}
        styleURL={isDark ? STYLE_DARK : STYLE_LIGHT}
        logoEnabled={false}
        attributionEnabled
        onDidFinishLoadingMap={onReady}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          defaultSettings={{ centerCoordinate: [longitude, latitude], zoomLevel: 15 }}
        />
        <MapLibreGL.MarkerView coordinate={[longitude, latitude]} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.pin}>
            <Text style={styles.pinEmoji}>🚚</Text>
          </View>
        </MapLibreGL.MarkerView>
      </MapLibreGL.MapView>
    );
  }
);

const styles = StyleSheet.create({
  map: { flex: 1 },
  fallback: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  fallbackText: { fontSize: 13, color: "#6B7280", textAlign: "center" },
  pin: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "#0D4A8C",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0D4A8C",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  pinEmoji: { fontSize: 13 },
});