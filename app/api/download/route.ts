import { type NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getBlobPathnameFromUrl } from "@/lib/blob";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const urlParam = request.nextUrl.searchParams.get("url");
  const pathnameParam = request.nextUrl.searchParams.get("pathname");

  let urlOrPathname: string | null = null;

  if (urlParam) {
    if (!getBlobPathnameFromUrl(urlParam)) {
      return NextResponse.json({ error: "Invalid blob URL" }, { status: 400 });
    }
    urlOrPathname = urlParam;
  } else if (pathnameParam) {
    urlOrPathname = pathnameParam;
  }

  if (!urlOrPathname) {
    return NextResponse.json(
      { error: "Missing url or pathname parameter" },
      { status: 400 }
    );
  }

  try {
    const result = await get(urlOrPathname, { access: "private" });

    if (!result || result.statusCode !== 200) {
      return new NextResponse("File not found", { status: 404 });
    }

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType || "image/jpeg",
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error serving private blob:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
