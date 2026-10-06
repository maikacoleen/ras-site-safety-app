import { put } from "@vercel/blob";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  const contentType = request.headers.get("content-type") || "";

  // Direct FormData File Upload
  if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json(
          { error: "No file provided in request." },
          { status: 400 }
        );
      }

      // Allowed MIME types (HEIC/HEIF are converted to JPEG on the client before hitting this endpoint)
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        return NextResponse.json(
          { error: "Only image files (PNG, JPEG/JPG) are supported." },
          { status: 400 }
        );
      }

      const filename = `submissions/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

      // Upload to Vercel Blob
      const blob = await put(filename, file, {
        access: "private",
        addRandomSuffix: true,
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

  // Client-side handleUpload flow fallback
  try {
    const body = (await request.json()) as HandleUploadBody;
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: ["image/jpeg", "image/png"],
          tokenPayload: JSON.stringify({}),
        };
      },
      onUploadCompleted: async ({ blob }: any) => {
        console.log("Blob upload completed:", blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error: any) {
    console.error("Vercel Blob handleUpload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate upload token." },
      { status: 400 }
    );
  }
}