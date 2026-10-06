import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { identifier } = await request.json();

    if (!identifier || typeof identifier !== "string") {
      return NextResponse.json(
        { error: "Identifier is required" },
        { status: 400 }
      );
    }

    const trimmed = identifier.trim();

    // If identifier contains @, assume it is an email directly
    if (trimmed.includes("@")) {
      return NextResponse.json({ email: trimmed });
    }

    // Otherwise, search by name or email case-insensitively
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { name: { equals: trimmed, mode: "insensitive" } },
          { email: { equals: trimmed, mode: "insensitive" } },
        ],
      },
      select: {
        email: true,
      },
    });

    if (!user) {
      // Return the trimmed identifier back if no match found (it will fail authentication cleanly)
      return NextResponse.json({ email: trimmed });
    }

    return NextResponse.json({ email: user.email });
  } catch (error) {
    console.error("Error resolving identifier:", error);
    return NextResponse.json(
      { error: "Failed to resolve login identifier" },
      { status: 500 }
    );
  }
}
