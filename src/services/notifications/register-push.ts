import { supabase } from "@/services/supabase";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export async function registerAndSavePushToken(userId: string) {
    if (!Device.isDevice) {
        console.warn("Push requires a physical device");
        return null;
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
    if (finalStatus !== "granted") return null;

    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("low-stock", {
            name: "Low stock alerts",
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
        });
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;
    const tokenResult = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined,
    );
    const token = tokenResult.data;

    const { error } = await supabase
        .from("profiles")
        .update({
            push_token: token,
            push_token_updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

    if (error) throw new Error(error.message);
    return token;
}
