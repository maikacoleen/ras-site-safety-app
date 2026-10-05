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

async function main() {
  console.log("Starting database seed...");

  // 1. Clean existing records (in order of foreign key dependencies)
  await prisma.photo.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.site.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Users via BetterAuth
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

  const framer1 = await auth.api.signUpEmail({
    body: {
      email: "dave.framer@ras.com",
      password: "Password123!",
      name: "Dave Miller",
    },
  });

  const framer2 = await auth.api.signUpEmail({
    body: {
      email: "sarah.framer@ras.com",
      password: "Password123!",
      name: "Sarah Jenkins",
    },
  });

  console.log("Users created.");

  // 3. Create RAS Job Sites
  const site1 = await prisma.site.create({
    data: {
      name: "Royal Commons (Royal Bay)",
      address: "3450 Ryder Hesjedal Way, Colwood, BC",
      active: true,
    },
  });

  const site2 = await prisma.site.create({
    data: {
      name: "McCallum Lands Building A",
      address: "1016 McCallum Rd, Langford, BC",
      active: true,
    },
  });

  const site3 = await prisma.site.create({
    data: {
      name: "Telus Living Nanaimo",
      address: "77 City Centre Dr, Nanaimo, BC",
      active: true,
    },
  });

  console.log("Sites created.");

  // 4. Create Sample Submissions
  await prisma.submission.create({
    data: {
      date: new Date(),
      workerId: framer1.user.id,
      siteId: site1.id,
      ppeHardHat: true,
      ppeVest: true,
      ppeBoots: true,
      ppeEyeProtection: true,
      fallProtectionInPlace: true,
      laddersInspected: true,
      toolsInGoodCondition: true,
      hazardsIdentified: false,
      notes: "Morning safety check completed. Guardrails secure on Level 2 framing.",
    },
  });

  await prisma.submission.create({
    data: {
      date: new Date(Date.now() - 86400000),
      workerId: framer2.user.id,
      siteId: site2.id,
      ppeHardHat: true,
      ppeVest: true,
      ppeBoots: true,
      ppeEyeProtection: true,
      fallProtectionInPlace: true,
      laddersInspected: false,
      toolsInGoodCondition: true,
      hazardsIdentified: true,
      notes: "Ladder on west wall tagged out due to damaged rung.",
    },
  });

  console.log("Sample submissions created.");
  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end(); // Gracefully close pg connection pool
  });