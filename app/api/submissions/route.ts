import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 
import { auth } from "@/lib/auth"; 
import { headers } from "next/headers";

export async function GET() {
  try {
    // Authenticate user session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: userId, role } = session.user;

    // Admins see all submissions; non-admins only see their own
    const whereClause = role === "ADMIN" ? {} : { workerId: userId };

    const submissions = await prisma.submission.findMany({
      where: whereClause,
      include: {
        worker: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        site: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        photos: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(submissions, { status: 200 });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}