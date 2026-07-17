import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const slug = "demo-barberia";
  const existing = await prisma.shop.findUnique({ where: { slug } });
  if (existing) {
    console.log("La barbería demo ya existe, no se vuelve a crear.");
    return;
  }

  const passwordHash = await bcrypt.hash("demo1234", 10);

  const shop = await prisma.shop.create({
    data: {
      name: "Barbería Estilo Urbano",
      slug,
      address: "Av. Principal 123",
      users: {
        create: {
          name: "Dueño Demo",
          email: "demo@corteya.app",
          passwordHash,
          role: "OWNER",
        },
      },
      services: {
        create: [
          { name: "Corte clásico", durationMinutes: 30, price: 12 },
          { name: "Corte + barba", durationMinutes: 45, price: 18 },
          { name: "Diseño / fade", durationMinutes: 40, price: 15 },
          { name: "Afeitado clásico", durationMinutes: 25, price: 10 },
        ],
      },
      barbers: {
        create: [
          { name: "Carlos Méndez", commissionPercent: 50, workStart: "09:00", workEnd: "18:00" },
          { name: "Jonathan Reyes", commissionPercent: 55, workStart: "10:00", workEnd: "19:00" },
          { name: "Ana Torres", commissionPercent: 60, workStart: "09:00", workEnd: "17:00" },
        ],
      },
    },
    include: { barbers: true, services: true },
  });

  const [carlos, jonathan] = shop.barbers;
  const corteClasico = shop.services[0];
  const corteBarba = shop.services[1];

  const today = new Date();
  today.setHours(11, 0, 0, 0);
  const in3h = new Date(today.getTime() + 3 * 60 * 60000);

  await prisma.appointment.createMany({
    data: [
      {
        shopId: shop.id,
        barberId: carlos.id,
        serviceId: corteClasico.id,
        clientName: "Miguel Ángel",
        clientPhone: "555-0101",
        startTime: today,
        endTime: new Date(today.getTime() + corteClasico.durationMinutes * 60000),
        status: "CONFIRMED",
        source: "ONLINE",
      },
      {
        shopId: shop.id,
        barberId: jonathan.id,
        serviceId: corteBarba.id,
        clientName: "Pedro Salinas",
        clientPhone: "555-0102",
        startTime: in3h,
        endTime: new Date(in3h.getTime() + corteBarba.durationMinutes * 60000),
        status: "CONFIRMED",
        source: "WALK_IN",
      },
    ],
  });

  console.log("Barbería demo creada:");
  console.log("  URL de reservas: /book/demo-barberia");
  console.log("  Login panel: demo@corteya.app / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
