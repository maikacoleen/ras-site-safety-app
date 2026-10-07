import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admin privileges required" },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Submission ID is required" },
        { status: 400 }
      );
    }

    const existingSubmission = await prisma.submission.findUnique({
      where: { id },
    });

    if (!existingSubmission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    let targetReviewedStatus = !existingSubmission.reviewed;

    try {
      const body = await request.json();
      if (typeof body.reviewed === "boolean") {
        targetReviewedStatus = body.reviewed;
      }
    } catch {
      // If request has no JSON body, toggle existing status
    }

    const updatedSubmission = await prisma.submission.update({
      where: { id },
      data: { reviewed: targetReviewedStatus },
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
    });

    return NextResponse.json(updatedSubmission, { status: 200 });
  } catch (error) {
    console.error("Error updating submission review status:", error);
    return NextResponse.json(
      { error: "Failed to update review status" },
      { status: 500 }
    );
  }
}
