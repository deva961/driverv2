import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const password = await hash("Rajesh4459", 10);

  const existingUser = await prisma.user.findUnique({
    where: { phone: "9618544459" },
  });

  if (existingUser) {
    await prisma.user.update({
      where: {
        phone: "9618544459",
      },
      data: {
        password,
        role: Role.ADMIN,
      },
    });
  }

  if (!existingUser) {
    await prisma.user.create({
      data: {
        name: "Admin",
        phone: "9618544459",
        role: Role.ADMIN,
        password,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
