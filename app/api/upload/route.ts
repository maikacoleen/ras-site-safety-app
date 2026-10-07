import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export const maxDuration = 60;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
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

    const mime = (file.type || "").toLowerCase();
    const fileName = (file.name || "").toLowerCase();
    const isStandardImage =
      ALLOWED_IMAGE_TYPES.has(mime) ||
      fileName.endsWith(".jpg") ||
      fileName.endsWith(".jpeg") ||
      fileName.endsWith(".png") ||
      fileName.endsWith(".webp");

    if (!isStandardImage) {
      return NextResponse.json(
        { error: "Only image files (PNG, JPEG/JPG) are supported." },
        { status: 400 }
      );
    }

    const uploadName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uploadContentType = mime || "image/jpeg";
    const filename = `submissions/${Date.now()}-${uploadName}`;

    const blob = await put(filename, file, {
      access: "private",
      addRandomSuffix: true,
      contentType: uploadContentType,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error: unknown) {
    console.error("Vercel Blob upload error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to upload photo to Vercel Blob.";
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
