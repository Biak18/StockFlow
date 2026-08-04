import * as Sharing from "expo-sharing";

/**
 * Write a string to a cache file and open the system share sheet.
 * Uses legacy FileSystem API for broad compatibility with string writes.
 */
export async function shareTextFile(params: {
  content: string;
  fileName: string;
  mimeType?: string;
}) {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error("Sharing is not available on this device");
  }

  // Prefer new Paths API when writing bytes isn't required;
  // for CSV text, legacy write is the most reliable across SDK 56.
  const FileSystemLegacy = await import("expo-file-system/legacy");
  const path = `${FileSystemLegacy.cacheDirectory}${params.fileName}`;

  await FileSystemLegacy.writeAsStringAsync(path, params.content, {
    encoding: FileSystemLegacy.EncodingType.UTF8,
  });

  await Sharing.shareAsync(path, {
    mimeType: params.mimeType ?? "text/csv",
    dialogTitle: "Export report",
    UTI: "public.comma-separated-values-text",
  });
}
