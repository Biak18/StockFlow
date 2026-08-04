import { PADDING_BOTTOM, useGradualAnimation } from "@/utils/keyboard-handle";
import { StyleSheet } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

interface FormbaseViewProps {
  children: React.ReactNode;
}

const FormbaseView = ({ children }: FormbaseViewProps) => {
  const { height } = useGradualAnimation();

  const fakeView = useAnimatedStyle(() => {
    return {
      height: Math.abs(height.value),
      marginBottom: height.value > 0 ? 0 : PADDING_BOTTOM,
    };
  }, []);
  return (
    <SafeAreaView style={styles.root}>
      {children}
      <Animated.View style={fakeView} />
    </SafeAreaView>
  );
};

export default FormbaseView;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
