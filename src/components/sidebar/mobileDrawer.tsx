import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { Dimensions, Pressable, StyleSheet, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { Palette } from "../../contexts/ThemeContext";
import { AdminUser, Sidebar } from "../sidebar/sidebar";

const DRAWER_WIDTH = Math.min(320, Dimensions.get("window").width * 0.84);

export function MobileDrawer({
  visible,
  palette,
  user,
  onClose,
}: {
  visible: boolean;
  palette: Palette;
  user: AdminUser;
  onClose: () => void;
}) {
  const translateX = useSharedValue(-DRAWER_WIDTH);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateX.value = withTiming(0, {
        duration: 280,
        easing: Easing.out(Easing.cubic),
      });
      overlayOpacity.value = withTiming(1, { duration: 280 });
    } else {
      translateX.value = withTiming(-DRAWER_WIDTH, {
        duration: 220,
        easing: Easing.in(Easing.cubic),
      });
      overlayOpacity.value = withTiming(0, { duration: 220 });
    }
  }, [visible]);

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[styles.drawer, { width: DRAWER_WIDTH }, drawerStyle]}
      >
        <Pressable
          onPress={onClose}
          hitSlop={10}
          style={[styles.closeButton, { backgroundColor: palette.pillBg }]}
        >
          <Ionicons name="close" size={18} color={palette.text} />
        </Pressable>
        <Sidebar palette={palette} user={user} onNavigate={onClose} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.6)" },
  drawer: { position: "absolute", top: 0, bottom: 0, left: 0 },
  closeButton: {
    position: "absolute",
    top: 16,
    right: -46,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
});
