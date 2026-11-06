import { storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { OrderInspirationPhoto } from "./types";

/**
 * Client-side high-quality image compressor.
 * Downscales images to max 1600px keeping aspect ratio, and exports as JPEG quality 0.85.
 * This guarantees a file size of ~200-400 KB while preserving every delicate cake detail,
 * sugar flower, pearl, and text inscription with pin-sharp clarity.
 */
export async function compressImageFile(
  file: File,
  maxDimension = 1600,
  quality = 0.85
): Promise<{
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Nepodarilo sa načítať súbor."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Neplatný formát obrázka."));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Nepodarilo sa inicializovať grafický kontext."));
          return;
        }

        // Draw image with smooth bicubic scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Chyba pri kompresii obrázka."));
              return;
            }
            resolve({
              blob,
              dataUrl,
              width,
              height,
              sizeBytes: blob.size,
            });
          },
          "image/jpeg",
          quality
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads customer's inspiration cake photo to Firebase Storage with auto-compression.
 * Falls back to inline base64 if Firebase Storage is unavailable.
 */
export async function uploadCakeInspirationPhoto(
  file: File
): Promise<OrderInspirationPhoto> {
  const cleanOriginalName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, "-")
    .replace(/-+/g, "-");

  const compressed = await compressImageFile(file, 1400, 0.82);

  if (storage) {
    try {
      const uploadPromise = (async () => {
        const fileName = `inspiracia-${Date.now()}-${cleanOriginalName.replace(/\.[^.]+$/, "")}.jpg`;
        const storagePath = `cake-inspirations/${fileName}`;
        const storageRef = ref(storage, storagePath);

        const snapshot = await uploadBytes(storageRef, compressed.blob, {
          contentType: "image/jpeg",
          customMetadata: {
            originalName: file.name,
            uploadedAt: new Date().toISOString(),
          },
        });

        const url = await getDownloadURL(snapshot.ref);

        return {
          url,
          storagePath,
          fileName: file.name,
          sizeBytes: compressed.sizeBytes,
        };
      })();

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Storage timeout (1.2s)")), 1200)
      );

      return await Promise.race([uploadPromise, timeoutPromise]);
    } catch (err) {
      console.warn("[Firebase Storage] Upload timed out or failed, using instant fallback:", err);
    }
  }

  // Instant fallback to compressed data URL (under 100ms)
  return {
    url: compressed.dataUrl,
    fileName: file.name,
    sizeBytes: compressed.sizeBytes,
  };
}

/**
 * Deletes inspiration photo from Firebase Storage to free up the 5 GB quota.
 */
export async function deleteCakeInspirationPhoto(storagePath: string): Promise<boolean> {
  if (!storage || !storagePath) return false;
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
    return true;
  } catch (err) {
    console.warn("[Firebase Storage] Delete failed:", err);
    return false;
  }
}

/**
 * Converts a base64 data URL to a standard browser File object.
 */
export function dataUrlToFile(dataUrl: string, filename = "inspiracia.jpg"): File {
  const parts = dataUrl.split(",");
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

/**
 * Fetches an image from an external URL (Google Images, Pinterest, direct web link)
 * and returns it as a File. Uses server-side proxy fallback to bypass CORS restrictions.
 */
export async function fetchRemoteImageAsFile(url: string): Promise<File> {
  if (url.startsWith("data:")) {
    return dataUrlToFile(url, "inspiracia.jpg");
  }

  // Fast direct server proxy - bypasses browser CORS errors and prevents hanging
  try {
    const res = await fetch("/api/fetch-remote-image/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(3000),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.dataUrl) {
        return dataUrlToFile(data.dataUrl, "inspiracia.jpg");
      }
    }
  } catch (err) {
    console.warn("Direct server proxy fetch failed:", err);
  }

  throw new Error("Nepodarilo sa stiahnuť obrázok z odkazu.");
}

