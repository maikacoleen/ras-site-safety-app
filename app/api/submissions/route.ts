import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 
import { auth } from "@/lib/auth"; 
import { headers } from "next/headers";

export async function GET(request: Request) {
  try {
    // Authenticate user session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    // If requesting sites list
    if (type === "sites") {
      const sites = await prisma.site.findMany({
        where: { active: true },
        orderBy: { name: "asc" },
      });
      return NextResponse.json(sites, { status: 200 });
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

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const {
      siteId,
      date,
      notes,
      ppeHardHat = false,
      ppeVest = false,
      ppeBoots = false,
      ppeEyeProtection = false,
      fallProtectionInPlace = false,
      laddersInspected = false,
      toolsInGoodCondition = false,
      hazardsIdentified = false,
      photos = [],
    } = body;

    // Site validation
    if (!siteId || typeof siteId !== "string" || siteId.trim() === "") {
      return NextResponse.json(
        { error: "Site is required. Please select a valid job site." },
        { status: 400 }
      );
    }

    // Verify site exists in database
    const existingSite = await prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!existingSite) {
      return NextResponse.json(
        { error: "Selected job site was not found." },
        { status: 400 }
      );
    }

    // Date validation & Future Date Check
    if (!date || typeof date !== "string" || isNaN(Date.parse(date))) {
      return NextResponse.json(
        { error: "Date is required. Please select a valid submission date." },
        { status: 400 }
      );
    }

    // Extract YYYY-MM-DD format if date is an ISO string or date string
    const dateOnly = date.split("T")[0];
    const targetDate = new Date(`${dateOnly}T12:00:00`);

    const now = new Date();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (targetDate > endOfToday) {
      return NextResponse.json(
        { error: "Submission date cannot be in the future. Please select today or a past date." },
        { status: 400 }
      );
    }

    // Checklist validation (at least one item checked)
    const checklistItems = [
      ppeHardHat,
      ppeVest,
      ppeBoots,
      ppeEyeProtection,
      fallProtectionInPlace,
      laddersInspected,
      toolsInGoodCondition,
      hazardsIdentified,
    ];

    const hasAnyChecked = checklistItems.some((item) => item === true || item === "true");

    if (!hasAnyChecked) {
      return NextResponse.json(
        { error: "Checklist is required. At least one safety checklist item must be checked." },
        { status: 400 }
      );
    }

    // Validate photos array and types
    if (!Array.isArray(photos)) {
      return NextResponse.json(
        { error: "Photos must be provided as an array of URLs." },
        { status: 400 }
      );
    }

    for (const url of photos) {
      if (typeof url !== "string" || (!url.startsWith("http://") && !url.startsWith("https://"))) {
        return NextResponse.json(
          { error: "Invalid photo URL format provided." },
          { status: 400 }
        );
      }
    }

    // Create submission record with linked photos
    const newSubmission = await prisma.submission.create({
      data: {
        workerId: session.user.id,
        siteId,
        date: targetDate,
        notes: typeof notes === "string" ? notes.trim() : null,
        ppeHardHat: Boolean(ppeHardHat),
        ppeVest: Boolean(ppeVest),
        ppeBoots: Boolean(ppeBoots),
        ppeEyeProtection: Boolean(ppeEyeProtection),
        fallProtectionInPlace: Boolean(fallProtectionInPlace),
        laddersInspected: Boolean(laddersInspected),
        toolsInGoodCondition: Boolean(toolsInGoodCondition),
        hazardsIdentified: Boolean(hazardsIdentified),
        photos: {
          create: photos.map((url: string) => ({ url })),
        },
      },
      include: {
        site: true,
        photos: true,
      },
    });

    return NextResponse.json(newSubmission, { status: 201 });
  } catch (error) {
    console.error("Error creating safety submission:", error);
    return NextResponse.json(
      { error: "Failed to process safety submission." },
      { status: 500 }
    );
  }
}