import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { auth } from "../lib/auth";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set in environment variables.");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SAMPLE_NOTES = [
  "Morning safety toolbox talk completed. Guardrails secure on Level 2 framing deck.",
  "Inspected all harnesses and lanyards prior to truss installation. All clear.",
  "Ladder on west wall tagged out due to damaged rung. Maintenance notified.",
  "Site clean-up completed. All extension cords elevated out of walkway water.",
  "Scaffolding toe-boards verified on South elevation. Harness anchor points tested.",
  "Pike poles inspected. Hard hat and eye protection enforced during pneumatic nailing.",
  "Heavy morning gusty wind. Lowered top deck loads and secured plywood stacks.",
  "Excavation perimeter fencing re-secured after delivery truck exit.",
  "Sub-floor shear panel nailing complete. High-vis vests and safety boots worn by all framers.",
  "First aid kit replenished on site trailer. Fire extinguisher tag up to date.",
  "Saw stations inspected; blade guards operating smoothly. Hearing protection active.",
  "Stairwell temporary railings reinforced before material load-in.",
  "Crane lifting zone cordoned off with caution tape during truss setting.",
  "Framing crew conducted site hazard assessment. Slip hazard near wet north ramp cleared.",
  "Routine daily check: PPE 100% compliant across framing team.",
];


async function main() {
  console.log("Starting database seed...");

  // 1. Clean existing records in dependency order
  await prisma.photo.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.site.deleteMany();
  await prisma.user.deleteMany();

  console.log("Cleaned existing database records.");

  // 2. Create Admin User
  const adminUser = await auth.api.signUpEmail({
    body: {
      email: "admin@ras.com",
      password: "AdminPass123!",
      name: "John Doe",
    },
  });

  await prisma.user.update({
    where: { id: adminUser.user.id },
    data: { role: Role.ADMIN },
  });

  // 3. Create Framer Users
  const framersData = [
    { email: "dave.framer@ras.com", name: "Dave Miller" },
    { email: "sarah.framer@ras.com", name: "Sarah Jenkins" },
    { email: "mike.framer@ras.com", name: "Mike Ross" },
    { email: "alex.framer@ras.com", name: "Alex Chen" },
    { email: "carlos.framer@ras.com", name: "Carlos Garcia" },
    { email: "lisa.framer@ras.com", name: "Lisa Wong" }, // Keeps zero submissions today for testing unsubmitted alert
  ];

  const framers = [];
  for (const f of framersData) {
    const created = await auth.api.signUpEmail({
      body: {
        email: f.email,
        password: "Password123!",
        name: f.name,
      },
    });
    framers.push(created.user);
  }

  console.log(`Created 1 Admin and ${framers.length} Framers.`);

  // 4. Create Job Sites
  const sitesData = [
    { name: "Royal Commons (Royal Bay)", address: "3450 Ryder Hesjedal Way, Colwood, BC" },
    { name: "McCallum Lands Building A", address: "1016 McCallum Rd, Langford, BC" },
    { name: "Telus Living Nanaimo", address: "77 City Centre Dr, Nanaimo, BC" },
    { name: "Harborview Towers Phase 2", address: "888 Belleville St, Victoria, BC" },
    { name: "Pacific Ridge Estates", address: "1200 Pacific Ave, Esquimalt, BC" },
  ];

  const sites = [];
  for (const s of sitesData) {
    const site = await prisma.site.create({
      data: {
        name: s.name,
        address: s.address,
        active: true,
      },
    });
    sites.push(site);
  }

  console.log(`Created ${sites.length} Job Sites.`);

  // 5. Generate 36 Submissions (Active Workers: framers[0..4], leaving framers[5] (Lisa) without today's submission)
  const activeFramers = framers.slice(0, 5);
  const now = new Date();

  // Define date offsets in days from today (0 = today, 1 = yesterday, etc.)
  const dayOffsets = [
    0, 0, 0, // 3 today (Dave, Sarah, Mike)
    1, 1, 1, 1, // 4 yesterday
    2, 2, 3, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29
  ];

  let submissionCount = 0;

  for (let i = 0; i < dayOffsets.length; i++) {
    const dayOffset = dayOffsets[i];
    const subDate = new Date(now.getTime() - dayOffset * 86400000 - Math.floor(Math.random() * 14400000));
    
    // Pick worker and site deterministically or semi-randomly
    const worker = activeFramers[i % activeFramers.length];
    const site = sites[(i + Math.floor(i / 2)) % sites.length];
    
    // Status mix: older items more likely to be reviewed, newer items pending
    const reviewed = dayOffset > 2 ? (i % 3 !== 0) : (i % 2 === 0);

    const notes = SAMPLE_NOTES[i % SAMPLE_NOTES.length];

    await prisma.submission.create({
      data: {
        date: subDate,
        workerId: worker.id,
        siteId: site.id,
        notes,
        reviewed,
        ppeHardHat: true,
        ppeVest: true,
        ppeBoots: true,
        ppeEyeProtection: i % 4 !== 0,
        fallProtectionInPlace: i % 5 !== 0,
        laddersInspected: i % 3 !== 0,
        toolsInGoodCondition: true,
        hazardsIdentified: i % 4 === 0,
        createdAt: subDate,
      },
    });

    submissionCount++;
  }

  console.log(`Successfully generated ${submissionCount} submission records with review statuses.`);
  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });