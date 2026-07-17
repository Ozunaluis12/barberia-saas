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
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60000);

  const miguel = await prisma.client.create({
    data: { shopId: shop.id, name: "Miguel Ángel", phone: "555-0101" },
  });
  const pedro = await prisma.client.create({
    data: { shopId: shop.id, name: "Pedro Salinas", phone: "555-0102" },
  });
  const carlosCliente = await prisma.client.create({
    data: { shopId: shop.id, name: "Roberto Núñez", phone: "555-0103", strikes: 2 },
  });

  await prisma.appointment.createMany({
    data: [
      {
        shopId: shop.id,
        barberId: carlos.id,
        serviceId: corteClasico.id,
        clientId: miguel.id,
        clientName: miguel.name,
        clientPhone: miguel.phone,
        startTime: today,
        endTime: new Date(today.getTime() + corteClasico.durationMinutes * 60000),
        status: "CONFIRMED",
        source: "ONLINE",
      },
      {
        shopId: shop.id,
        barberId: jonathan.id,
        serviceId: corteBarba.id,
        clientId: pedro.id,
        clientName: pedro.name,
        clientPhone: pedro.phone,
        startTime: in3h,
        endTime: new Date(in3h.getTime() + corteBarba.durationMinutes * 60000),
        status: "CONFIRMED",
        source: "WALK_IN",
      },
      {
        shopId: shop.id,
        barberId: carlos.id,
        serviceId: corteClasico.id,
        clientId: carlosCliente.id,
        clientName: carlosCliente.name,
        clientPhone: carlosCliente.phone,
        startTime: lastWeek,
        endTime: new Date(lastWeek.getTime() + corteClasico.durationMinutes * 60000),
        status: "NO_SHOW",
        source: "ONLINE",
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
