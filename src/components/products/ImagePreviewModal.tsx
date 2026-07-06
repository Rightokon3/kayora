import { Ionicons } from "@expo/vector-icons";
import {
    Modal,
    Pressable,
    StyleSheet,
    useWindowDimensions,
    View
} from "react-native";
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { Palette } from "../../contexts/ThemeContext";

export function ImagePreviewModal({
  visible,
  imageUri,
  palette,
  onClose,
}: {
  visible: boolean;
  imageUri: string | null;
  palette: Palette;
  onClose: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event: { scale: number }) => {
      scale.value = savedScale.value * event.scale;
    })
    .onEnd(() => {
      const clamped = Math.min(Math.max(scale.value, 1), 4);
      scale.value = withTiming(clamped);
      savedScale.value = clamped;
    });

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleClose = () => {
    scale.value = 1;
    savedScale.value = 1;
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.overlay}>
          <Pressable
            onPress={handleClose}
            hitSlop={10}
            style={[styles.closeButton, { backgroundColor: palette.pillBg }]}
          >
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </Pressable>

          {imageUri ? (
            <GestureDetector gesture={pinchGesture}>
              <Animated.View
                style={{
                  width,
                  height: height * 0.7,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Animated.Image
                  source={{ uri: imageUri }}
                  style={[
                    { width: width * 0.9, height: height * 0.65 },
                    imageStyle,
                  ]}
                  resizeMode="contain"
                />
              </Animated.View>
            </GestureDetector>
          ) : (
            <View style={styles.placeholderWrap}>
              <Ionicons name="water-outline" size={64} color="#FFFFFF" />
            </View>
          )}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  placeholderWrap: { alignItems: "center", justifyContent: "center" },
});
