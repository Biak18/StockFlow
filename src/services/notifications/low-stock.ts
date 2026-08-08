import type { Product } from "@/features/products/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const ENABLED_KEY = "stockflow.lowStockNotifEnabled";
const LAST_SENT_KEY = "stockflow.lowStockNotifLastHash";

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export async function setupNotificationChannels() {
    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("low-stock", {
            name: "Low stock alerts",
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            // sound: "default", // critical for sound
            enableVibrate: true,
            showBadge: false,
        });
    }
}

export async function getLowStockNotifEnabled(): Promise<boolean> {
    const v = await AsyncStorage.getItem(ENABLED_KEY);
    return v !== "0"; // default on
}

export async function setLowStockNotifEnabled(enabled: boolean) {
    await AsyncStorage.setItem(ENABLED_KEY, enabled ? "1" : "0");
}

export async function ensureNotificationPermission(): Promise<boolean> {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;

    const asked = await Notifications.requestPermissionsAsync();
    return asked.granted;
}

function isLow(p: Product) {
    return (
        p.min_stock_level > 0 &&
        p.quantity > 0 &&
        p.quantity <= p.min_stock_level
    );
}

function isOut(p: Product) {
    return p.quantity <= 0;
}

/** Stable hash so we don't notify every refresh for the same set */
function buildHash(products: Product[]) {
    const low = products
        .filter((p) => isLow(p) || isOut(p))
        .map((p) => `${p.id}:${p.quantity}`)
        .sort()
        .join("|");
    return low;
}

export async function notifyLowStockIfNeeded(products: Product[]) {
    const enabled = await getLowStockNotifEnabled();
    if (!enabled) return;

    const granted = await ensureNotificationPermission();
    if (!granted) return;

    const low = products.filter(isLow);
    const out = products.filter(isOut);

    if (low.length === 0 && out.length === 0) {
        await AsyncStorage.setItem(LAST_SENT_KEY, "");
        return;
    }

    const hash = buildHash(products);
    const last = await AsyncStorage.getItem(LAST_SENT_KEY);
    if (last === hash) return; // same situation already notified

    const parts: string[] = [];
    if (out.length) parts.push(`${out.length} out of stock`);
    if (low.length) parts.push(`${low.length} low stock`);

    const body = parts.join(", ") +
        (out[0] || low[0] ? ` · e.g. ${(out[0] ?? low[0]).name}` : "");

    await Notifications.scheduleNotificationAsync({
        content: {
            title: "Stock attention needed",
            body,
            data: { screen: "products", filter: out.length ? "out" : "low" },
        },
        trigger: null, // immediate
    });

    await AsyncStorage.setItem(LAST_SENT_KEY, hash);
}

/** Call after user changes stock so a new hash can fire */
export async function clearLowStockNotifHash() {
    await AsyncStorage.removeItem(LAST_SENT_KEY);
}
