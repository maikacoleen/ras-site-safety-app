import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { convertHeicToJpeg, looksLikeHeic, looksLikeStandardImage } from "@/lib/convert-heic";

export const maxDuration = 60;

const STANDARD_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const HEIC_TYPES = new Set([
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") || "";

  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "Expected multipart/form-data file upload." },
      { status: 400 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided in request." },
        { status: 400 }
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const mime = (file.type || "").toLowerCase();
    const isHeic = looksLikeHeic(file.name, mime, bytes) || HEIC_TYPES.has(mime);
    const isStandardImage = STANDARD_IMAGE_TYPES.has(mime) || looksLikeStandardImage(file.name, mime, bytes);

    if (!isStandardImage && !isHeic) {
      return NextResponse.json(
        { error: "Only image files (PNG, JPEG/JPG, WEBP, HEIC, HEIF) are supported." },
        { status: 400 }
      );
    }

    let uploadBody: Buffer | File = file;
    let uploadName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    let uploadContentType = mime || "application/octet-stream";

    if (isHeic) {
      try {
        uploadBody = await convertHeicToJpeg(bytes);
        uploadName = uploadName.replace(/\.(heic|heif)$/i, ".jpg");
        if (!uploadName.toLowerCase().endsWith(".jpg")) {
          uploadName = `${uploadName}.jpg`;
        }
        uploadContentType = "image/jpeg";
      } catch (conversionError) {
        console.error("HEIC conversion error:", conversionError);
        return NextResponse.json(
          { error: `Could not convert HEIC/HEIF file "${file.name}" to JPEG.` },
          { status: 400 }
        );
      }
    }

    const filename = `submissions/${Date.now()}-${uploadName}`;

    const blob = await put(filename, uploadBody, {
      access: "private",
      addRandomSuffix: true,
      contentType: uploadContentType,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error: any) {
    console.error("Vercel Blob upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload photo to Vercel Blob." },
      { status: 400 }
    );
  }
}
