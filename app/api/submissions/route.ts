import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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

    // If requesting workers list (for admin worker filter)
    if (type === "workers") {
      const workers = await prisma.user.findMany({
        where: { role: "FRAMER", active: true },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      });
      return NextResponse.json(workers, { status: 200 });
    }

    // If requesting summary stats for SubmissionSummaryCards
    if (type === "summary") {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      const [todaySubmissions, activeWorkers, sites, siteSubmissionsGroup, siteTodayGroup, totalSubmissionsCount, pendingReviewCount] = await Promise.all([
        prisma.submission.findMany({
          where: {
            date: { gte: startOfToday, lte: endOfToday },
          },
          select: { workerId: true, siteId: true },
        }),
        prisma.user.findMany({
          where: { role: "FRAMER", active: true },
          select: { id: true, name: true, email: true },
          orderBy: { name: "asc" },
        }),
        prisma.site.findMany({
          where: { active: true },
          select: { id: true, name: true, address: true },
          orderBy: { name: "asc" },
        }),
        prisma.submission.groupBy({
          by: ["siteId"],
          _count: { id: true },
        }),
        prisma.submission.groupBy({
          by: ["siteId"],
          where: {
            date: { gte: startOfToday, lte: endOfToday },
          },
          _count: { id: true },
        }),
        prisma.submission.count(),
        prisma.submission.count({ where: { reviewed: false } }),
      ]);

      const submittedWorkerIds = new Set(todaySubmissions.map((s) => s.workerId));
      const unsubmittedWorkers = activeWorkers.filter((w) => !submittedWorkerIds.has(w.id));

      const siteBreakdown = sites.map((s) => {
        const totalCount = siteSubmissionsGroup.find((g) => g.siteId === s.id)?._count.id || 0;
        const todayCount = siteTodayGroup.find((g) => g.siteId === s.id)?._count.id || 0;
        return {
          siteId: s.id,
          siteName: s.name,
          siteAddress: s.address,
          totalSubmissions: totalCount,
          todaySubmissions: todayCount,
        };
      });

      return NextResponse.json(
        {
          submissionsTodayCount: todaySubmissions.length,
          totalActiveWorkersCount: activeWorkers.length,
          submittedWorkersCount: submittedWorkerIds.size,
          unsubmittedWorkers,
          siteBreakdown,
          totalSubmissionsCount,
          pendingReviewCount,
        },
        { status: 200 }
      );
    }

    const { id: userId, role } = session.user;

    // Read query parameters for filtering, sorting, and pagination
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "20";
    const sortBy = searchParams.get("sortBy") || "date"; // 'date' | 'site'
    const orderParam = searchParams.get("order"); // 'asc' | 'desc'
    const siteId = searchParams.get("siteId");
    const workerId = searchParams.get("workerId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Default order: desc for date sorting, asc for site sorting
    const order = orderParam === "asc" || orderParam === "desc" 
      ? orderParam 
      : sortBy === "site" ? "asc" : "desc";

    // Build filter query
    const whereClause: any = {};

    // Admins can see all or filter by worker; non-admins only see their own
    if (role === "ADMIN") {
      if (workerId) {
        whereClause.workerId = workerId;
      }
    } else {
      whereClause.workerId = userId;
    }

    if (siteId) {
      whereClause.siteId = siteId;
    }

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) {
        const dateStr = startDate.split("T")[0];
        const [sYear, sMonth, sDay] = dateStr.split("-").map(Number);
        const sDate = new Date(sYear, sMonth - 1, sDay, 0, 0, 0, 0);
        whereClause.date.gte = sDate;
      }
      if (endDate) {
        const dateStr = endDate.split("T")[0];
        const [eYear, eMonth, eDay] = dateStr.split("-").map(Number);
        const eDate = new Date(eYear, eMonth - 1, eDay, 23, 59, 59, 999);
        whereClause.date.lte = eDate;
      }
    }

    // Build order by
    let orderBy: any = [{ date: order }, { createdAt: order }];
    if (sortBy === "site") {
      orderBy = [{ site: { name: order } }, { date: "desc" }, { createdAt: "desc" }];
    } else if (sortBy === "reviewed") {
      orderBy = [{ reviewed: order }, { date: "desc" }, { createdAt: "desc" }];
    } else if (sortBy === "date") {
      orderBy = [{ date: order }, { createdAt: order }];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
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
        orderBy,
        skip,
        take: limitNum,
      }),
      prisma.submission.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return NextResponse.json({
      submissions,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
    }, { status: 200 });
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
    const [tYear, tMonth, tDay] = dateOnly.split("-").map(Number);
    const now = new Date();
    const targetDate = new Date(tYear, tMonth - 1, tDay, now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());

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

    // Revalidate paths for real-time UI updates across Admin & Framer contexts
    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/framer");
    revalidatePath("/api/submissions");

    return NextResponse.json(newSubmission, { status: 201 });
  } catch (error) {
    console.error("Error creating safety submission:", error);
    return NextResponse.json(
      { error: "Failed to process safety submission." },
      { status: 500 }
    );
  }
}