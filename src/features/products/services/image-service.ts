import { supabase } from "@/services/supabase";
import { File } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";

const BUCKET = "product-images";

export type PickedImage = {
  uri: string;
  mimeType: string;
  fileName: string;
};

export const imageService = {
  async pickFromLibrary(): Promise<PickedImage | null> {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      throw new Error("Permission to access photos is required");
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return null;

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      mimeType: asset.mimeType ?? "image/jpeg",
      fileName: asset.fileName ?? `image-${Date.now()}.jpg`,
    };
  },

  async pickFromCamera(): Promise<PickedImage | null> {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new Error("Permission to access the camera is required");
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return null;

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      mimeType: asset.mimeType ?? "image/jpeg",
      fileName: asset.fileName ?? `camera-${Date.now()}.jpg`,
    };
  },

  /**
   * Upload using the new Expo FileSystem File API (SDK 54+)
   */
  async upload(
    organizationId: string,
    productId: string,
    image: PickedImage,
  ): Promise<string> {
    const ext = image.fileName.split(".").pop() ?? "jpg";
    const path = `${organizationId}/${productId}/${Date.now()}.${ext}`;

    // New API – reliable binary read
    const file = new File(image.uri);
    const bytes = await file.bytes(); // Uint8Array

    const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
      contentType: image.mimeType,
      upsert: true,
    });

    if (error) throw new Error(error.message);

    return path;
  },

  async getSignedUrl(
    path: string,
    expiresIn = 60 * 60,
  ): Promise<string | null> {
    if (!path) return null;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.warn("Failed to create signed URL", error.message);
      return null;
    }

    return data.signedUrl;
  },

  async remove(path: string): Promise<void> {
    if (!path) return;
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) throw new Error(error.message);
  },
};
