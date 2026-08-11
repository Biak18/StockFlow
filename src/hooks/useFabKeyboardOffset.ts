import { useKeyboardHandler } from "react-native-keyboard-controller";
import { Easing, useSharedValue, withTiming } from "react-native-reanimated";

export const useFabKeyboardOffset = () => {
    const offset = useSharedValue(0);

    // useFocusEffect(
    //     useCallback(() => {
    //         return () => {
    //             offset.value = 0; // hard reset, not animated — screen is going away regardless
    //         };
    //     }, [offset]),
    // );

    useKeyboardHandler(
        {
            onEnd: (e) => {
                "worklet";
                offset.value = withTiming(e.height, {
                    duration: e.duration > 0 ? e.duration : 250,
                    easing: Easing.out(Easing.cubic),
                });
            },
        },
        [],
    );

    return offset;
};
