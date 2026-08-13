import { useUIStore } from "@/stores";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useState } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const FRAME = Math.min(SCREEN_W * 0.72, 280);

function getFrameRect() {
  const left = (SCREEN_W - FRAME) / 2;
  const top = (SCREEN_H - FRAME) / 2;
  return {
    left,
    top,
    right: left + FRAME,
    bottom: top + FRAME,
  };
}

function isInsideFrame(bounds: {
  origin: { x: number; y: number };
  size: { width: number; height: number };
}) {
  const frame = getFrameRect();

  // Center of the detected barcode
  const cx = bounds.origin.x + bounds.size.width / 2;
  const cy = bounds.origin.y + bounds.size.height / 2;

  // Optional padding so edges aren’t too strict
  const pad = 8;

  return (
    cx >= frame.left + pad &&
    cx <= frame.right - pad &&
    cy >= frame.top + pad &&
    cy <= frame.bottom - pad
  );
}

interface Props {
  visible: boolean;
  title?: string;
  onClose: () => void;
  onScanned: (code: string) => void;
}

export function BarcodeScannerModal({
  visible,
  title = "Scan barcode",
  onClose,
  onScanned,
}: Props) {
  const theme = useUIStore((s) => s.theme);
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [locked, setLocked] = useState(false);

  const scanY = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setLocked(false);
      setTorch(false);
    }
  }, [visible]);

  useEffect(() => {
    if (visible && permission?.granted) {
      scanY.value = 0;
      scanY.value = withRepeat(
        withTiming(FRAME - 2, {
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true, // ping-pong, no hard jump
      );
    } else {
      cancelAnimation(scanY);
      scanY.value = 0;
    }
  }, [visible, permission?.granted, scanY]);

  const handleBarcode = (event: {
    data: string;
    bounds?: {
      origin: { x: number; y: number };
      size: { width: number; height: number };
    };
  }) => {
    if (locked || !event.data) return;

    if (!event.bounds) return;

    if (!isInsideFrame(event.bounds)) return;

    setLocked(true);
    onScanned(event.data.trim());
  };

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanY.value }],
  }));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {!permission?.granted ? (
          <View
            style={[
              styles.permission,
              {
                backgroundColor: theme.colors.background,
                paddingTop: insets.top,
              },
            ]}
          >
            <View
              style={[
                styles.permIcon,
                {
                  backgroundColor:
                    theme.colors.primaryMuted ?? theme.colors.surfaceSecondary,
                },
              ]}
            >
              <Ionicons
                name="camera-outline"
                size={28}
                color={theme.colors.primary}
              />
            </View>
            <Text style={[styles.permTitle, { color: theme.colors.text }]}>
              Camera access needed
            </Text>
            <Text
              style={[styles.permBody, { color: theme.colors.textSecondary }]}
            >
              Allow camera access to scan product barcodes.
            </Text>
            <Pressable
              onPress={requestPermission}
              style={[
                styles.primaryBtn,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Text style={styles.primaryBtnText}>Continue</Text>
            </Pressable>
            <Pressable onPress={onClose} hitSlop={12} style={{ marginTop: 16 }}>
              <Text
                style={{ color: theme.colors.textSecondary, fontWeight: "600" }}
              >
                Cancel
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              enableTorch={torch}
              barcodeScannerSettings={{
                barcodeTypes: [
                  "ean13",
                  "ean8",
                  "upc_a",
                  "upc_e",
                  "code128",
                  "code39",
                  "qr",
                ],
              }}
              onBarcodeScanned={locked ? undefined : handleBarcode}
            />

            {/* Dim overlay + cutout */}
            <View style={styles.overlay} pointerEvents="none">
              <View style={styles.overlayTop} />
              <View style={styles.overlayMiddle}>
                <View style={styles.overlaySide} />
                <View style={styles.frameWrap}>
                  <View
                    style={[styles.corner, styles.tl, { borderColor: "#fff" }]}
                  />
                  <View
                    style={[styles.corner, styles.tr, { borderColor: "#fff" }]}
                  />
                  <View
                    style={[styles.corner, styles.bl, { borderColor: "#fff" }]}
                  />
                  <View
                    style={[styles.corner, styles.br, { borderColor: "#fff" }]}
                  />
                  <Animated.View style={[styles.scanLine, scanLineStyle]} />
                </View>
                <View style={styles.overlaySide} />
              </View>
              <View style={styles.overlayBottom} />
            </View>

            {/* Top bar */}
            <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
              <Pressable onPress={onClose} style={styles.circleBtn} hitSlop={8}>
                <Ionicons name="close" size={22} color="#fff" />
              </Pressable>

              <Text style={styles.topTitle}>{title}</Text>

              <Pressable
                onPress={() => setTorch((t) => !t)}
                style={[
                  styles.circleBtn,
                  torch && { backgroundColor: "rgba(37, 99, 235, 0.85)" },
                ]}
                hitSlop={8}
              >
                <Ionicons
                  name={torch ? "flash" : "flash-outline"}
                  size={20}
                  color="#fff"
                />
              </Pressable>
            </View>

            {/* Bottom hint */}
            <View
              style={[
                styles.bottomHint,
                { paddingBottom: Math.max(insets.bottom, 20) + 12 },
              ]}
            >
              <View style={styles.hintPill}>
                <Ionicons name="barcode-outline" size={16} color="#fff" />
                <Text style={styles.hintText}>
                  Align the barcode inside the frame
                </Text>
              </View>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const dim = "rgba(0,0,0,0.55)";

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  permission: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  permIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  permTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 8,
    textAlign: "center",
  },
  permBody: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 24,
  },
  primaryBtn: {
    minWidth: 180,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: dim,
  },
  overlayMiddle: {
    height: FRAME,
    flexDirection: "row",
  },
  overlaySide: {
    flex: 1,
    backgroundColor: dim,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: dim,
  },
  frameWrap: {
    width: FRAME,
    height: FRAME,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderColor: "#fff",
  },
  tl: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 10,
  },
  tr: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 10,
  },
  bl: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 10,
  },
  br: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 10,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  circleBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomHint: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
  },
  hintPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
  },
  hintText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  scanLine: {
    position: "absolute",
    left: 8,
    right: 8,
    height: 2,
    backgroundColor: "#4ade80",
    borderRadius: 1,
    boxShadow: "0px 0px 44px 0px rgba(74, 222, 128, 0.8)",
    top: 0,
  },
});
