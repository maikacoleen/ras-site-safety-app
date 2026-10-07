export async function uploadPhotoToBlob(
  file: File,
  options: { timeoutMs?: number } = {}
): Promise<{ url: string }> {
  const { timeoutMs = 60000 } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `Upload failed with status ${res.status}`);
    }

    if (!data.url) {
      throw new Error("No URL returned from blob upload.");
    }

    return { url: data.url };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error(`Uploading photo "${file.name}" timed out after ${timeoutMs / 1000} seconds. Please check your connection and try again.`);
    }
    throw new Error(err.message || "Failed to upload photo to storage.");
  }
}

export function getBlobPathnameFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith(".blob.vercel-storage.com")) {
      return null;
    }
    return decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
  } catch {
    return null;
  }
}

/** Same-origin URL that streams a private Vercel Blob through /api/download. */
export function getPrivatePhotoSrc(blobUrl: string): string {
  if (!blobUrl) return blobUrl;
  if (blobUrl.startsWith("/api/download")) return blobUrl;
  return `/api/download?url=${encodeURIComponent(blobUrl)}`;
}
