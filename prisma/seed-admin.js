const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL || "admin@hakkiveda.com";
  const password =
    process.env.ADMIN_SEED_PASSWORD || crypto.randomBytes(16).toString("hex");
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      firstName: "System",
      lastName: "Admin",
      email,
      hashedPassword,
      isActive: true,
    },
  });

  const adminUser = await prisma.adminUser.upsert({
    where: { userId: user.id },
    update: { role: "ADMIN", isActive: true },
    create: {
      userId: user.id,
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log("Admin account ready!");
  console.log("  Email:", email);
  console.log(
    "  Password:",
    process.env.ADMIN_SEED_PASSWORD
      ? "(from ADMIN_SEED_PASSWORD env var)"
      : password
  );
  console.log("  Role:     ADMIN");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
