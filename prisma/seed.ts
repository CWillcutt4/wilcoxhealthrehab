import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const ownerEmail = process.env.OWNER_EMAIL || "owner@wilcoxhealthrehab.local";
  const ownerPassword = process.env.OWNER_PASSWORD || "changeme123";

  const existing = await prisma.employee.findUnique({ where: { email: ownerEmail } });
  if (existing) {
    console.log(`Owner employee already exists: ${ownerEmail}`);
    return;
  }

  const passwordHash = await bcrypt.hash(ownerPassword, 10);
  await prisma.employee.create({
    data: {
      email: ownerEmail,
      passwordHash,
      name: "Owner",
      role: "owner",
    },
  });

  console.log("Seeded owner employee:");
  console.log(`  email: ${ownerEmail}`);
  console.log(`  password: ${ownerPassword}`);
  console.log("  (change the password after first login)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
