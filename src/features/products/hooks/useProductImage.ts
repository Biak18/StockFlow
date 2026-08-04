import { useEffect, useState } from "react";
import { imageService } from "../services/image-service";

const urlCache = new Map<string, string>();

export function useProductImage(imagePath: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(() => {
    if (!imagePath) return null;
    return urlCache.get(imagePath) ?? null;
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!imagePath) {
        setUrl(null);
        return;
      }

      const cached = urlCache.get(imagePath);
      if (cached) {
        setUrl(cached);
        return;
      }

      const signed = await imageService.getSignedUrl(imagePath);
      if (!cancelled && signed) {
        urlCache.set(imagePath, signed);
        setUrl(signed);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [imagePath]);

  return url;
}
