import {
  BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { useEffect, useState } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui";
import { useUIStore } from "@/stores";

interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScanned: (barcode: string) => void;
  title?: string;
}

export function BarcodeScannerModal({
  visible,
  onClose,
  onScanned,
  title = "Scan barcode",
}: BarcodeScannerModalProps) {
  const theme = useUIStore((s) => s.theme);
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (visible) {
      setLocked(false);
    }
  }, [visible]);

  const handleBarcode = (result: BarcodeScanningResult) => {
    if (locked) return;
    const data = result.data?.trim();
    if (!data) return;

    setLocked(true);
    onScanned(data);
  };

  if (!permission) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: "#000" }]}>
        {!permission.granted ? (
          <View style={styles.permissionBox}>
            <Text style={styles.permissionText}>
              Camera permission is required to scan barcodes
            </Text>
            <Button title="Grant permission" onPress={requestPermission} />
            <Pressable onPress={onClose} style={{ marginTop: 20 }}>
              <Text style={{ color: "#fff" }}>Cancel</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
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

            {/* Overlay */}
            <View style={[styles.overlay, { paddingTop: insets.top + 12 }]}>
              <View style={styles.topBar}>
                <Pressable onPress={onClose} hitSlop={12}>
                  <Text style={styles.close}>Close</Text>
                </Pressable>
                <Text style={styles.title}>{title}</Text>
                <View style={{ width: 50 }} />
              </View>

              <View style={styles.frameWrapper}>
                <View style={styles.frame} />
                <Text style={styles.hint}>Align barcode within the frame</Text>
              </View>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const { width } = Dimensions.get("window");
const FRAME_SIZE = width * 0.7;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  permissionBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  permissionText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  overlay: {
    flex: 1,
    justifyContent: "space-between",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  close: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    width: 50,
  },
  title: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  frameWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
  },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE * 0.5,
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  hint: {
    color: "#fff",
    marginTop: 16,
    fontSize: 14,
    opacity: 0.85,
  },
});
