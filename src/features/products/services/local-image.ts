import * as FileSystem from "expo-file-system/legacy";

const DIR = `${FileSystem.documentDirectory}product-images/`;

async function ensureDir() {
    const info = await FileSystem.getInfoAsync(DIR);
    if (!info.exists) {
        await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
    }
}

export async function persistLocalProductImage(
    productId: string,
    sourceUri: string,
    ext = "jpg",
): Promise<string> {
    await ensureDir();
    const dest = `${DIR}${productId}-${Date.now()}.${ext}`;
    await FileSystem.copyAsync({ from: sourceUri, to: dest });
    return dest;
}

export async function deleteLocalProductImage(uri: string) {
    try {
        const info = await FileSystem.getInfoAsync(uri);
        if (info.exists) {
            await FileSystem.deleteAsync(uri, { idempotent: true });
        }
    } catch {
        // ignore
    }
}
