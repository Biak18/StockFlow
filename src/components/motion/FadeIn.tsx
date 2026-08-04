import { StyleProp, ViewStyle } from "react-native";
import Animated, { Easing, FadeInDown } from "react-native-reanimated";

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  fromY?: number;
  style?: StyleProp<ViewStyle>;
}

export function FadeIn({
  children,
  delay = 0,
  duration = 320,
  fromY = 10,
  style,
}: FadeInProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay)
        .duration(duration)
        .easing(Easing.bezier(0.16, 1, 0.3, 1))
        .withInitialValues({ opacity: 0, transform: [{ translateY: fromY }] })}
      style={style}
    >
      {children}
    </Animated.View>
  );
}
