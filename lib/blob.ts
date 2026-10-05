import { upload } from "@vercel/blob/client";

export async function uploadPhotoToBlob(file: File): Promise<{ url: string }> {
  const newBlob = await upload(file.name, file, {
    access: "public",
    handleUploadUrl: "/api/upload",
  });

  return {
    url: newBlob.url,
  };
}