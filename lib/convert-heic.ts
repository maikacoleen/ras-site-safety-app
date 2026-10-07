type HeicConvert = (options: {
  buffer: Buffer;
  format: "JPEG" | "PNG";
  quality?: number;
}) => Promise<ArrayBuffer>;

const HEIC_BRANDS = new Set([
  "heic",
  "heix",
  "heif",
  "hevc",
  "hevx",
  "heim",
  "heis",
  "mif1",
  "msf1",
]);

export function looksLikeHeic(
  fileName: string,
  mimeType: string,
  bytes: Uint8Array
): boolean {
  const type = (mimeType || "").toLowerCase();
  if (type.includes("heic") || type.includes("heif")) {
    return true;
  }

  const name = (fileName || "").toLowerCase();
  if (name.endsWith(".heic") || name.endsWith(".heif")) {
    return true;
  }

  if (bytes.length >= 12) {
    const ftyp = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]);
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11])
      .replace(/\0/g, "")
      .trim()
      .toLowerCase();
    if (ftyp === "ftyp" && HEIC_BRANDS.has(brand)) {
      return true;
    }
  }

  return false;
}

export function looksLikeStandardImage(
  fileName: string,
  mimeType: string,
  bytes: Uint8Array
): boolean {
  const type = (mimeType || "").toLowerCase();
  if (
    type === "image/jpeg" ||
    type === "image/jpg" ||
    type === "image/png" ||
    type === "image/webp"
  ) {
    return true;
  }

  const name = (fileName || "").toLowerCase();
  if (
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png") ||
    name.endsWith(".webp")
  ) {
    return true;
  }

  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return true;
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return true;
  }
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP"
  ) {
    return true;
  }

  return false;
}

export async function convertHeicToJpeg(buffer: Buffer): Promise<Buffer> {
  // heic-convert ships without TypeScript types
  const mod = await import("heic-convert" as string);
  const convert = ((mod as { default?: HeicConvert }).default ??
    mod) as HeicConvert;

  const output = await convert({
    buffer,
    format: "JPEG",
    quality: 0.8,
  });

  return Buffer.from(output);
}
