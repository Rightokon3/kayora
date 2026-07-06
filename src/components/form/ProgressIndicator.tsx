import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { Palette } from "../../contexts/ThemeContext";

const STEP_LABELS = ["Personal", "Vehicle", "Road Info", "Review"];

export function ProgressIndicator({
  palette,
  currentStep,
}: {
  palette: Palette;
  currentStep: number;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(currentStep / (STEP_LABELS.length - 1), {
      duration: 350,
      easing: Easing.out(Easing.quad),
    });
  }, [currentStep]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View>
      <View style={[styles.track, { backgroundColor: palette.border }]}>
        <Animated.View
          style={[styles.fill, { backgroundColor: palette.primary }, fillStyle]}
        />
      </View>
      <View style={styles.labelsRow}>
        {STEP_LABELS.map((label, index) => {
          const isActive = index <= currentStep;
          return (
            <Text
              key={label}
              style={[
                styles.label,
                {
                  color: isActive ? palette.primary : palette.muted,
                  fontWeight: isActive ? "800" : "500",
                },
              ]}
            >
              {label}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 5, borderRadius: 3, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 3 },
  labelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  label: { fontSize: 11, flex: 1, textAlign: "center" },
});
