import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type SeedStaff = { name: string; commissionPercent: number | null; workStart: string; workEnd: string };
type SeedService = { name: string; durationMinutes: number; price: number };

type SeedBusinessConfig = {
  slug: string;
  name: string;
  category: string;
  address: string;
  ownerEmail: string;
  services: SeedService[];
  staff: SeedStaff[];
};

const DEMO_BUSINESSES: SeedBusinessConfig[] = [
  {
    slug: "demo-barberia",
    name: "Barbería Estilo Urbano",
    category: "BARBERSHOP",
    address: "Av. Principal 123",
    ownerEmail: "demo@turnify.app",
    services: [
      { name: "Corte clásico", durationMinutes: 30, price: 12 },
      { name: "Corte + barba", durationMinutes: 45, price: 18 },
      { name: "Diseño / fade", durationMinutes: 40, price: 15 },
      { name: "Afeitado clásico", durationMinutes: 25, price: 10 },
    ],
    staff: [
      { name: "Carlos Méndez", commissionPercent: 50, workStart: "09:00", workEnd: "18:00" },
      { name: "Jonathan Reyes", commissionPercent: 55, workStart: "10:00", workEnd: "19:00" },
      { name: "Ana Torres", commissionPercent: 60, workStart: "09:00", workEnd: "17:00" },
    ],
  },
  {
    slug: "demo-spa",
    name: "Spa Serenidad",
    category: "SPA",
    address: "Calle Los Almendros 45",
    ownerEmail: "demo-spa@turnify.app",
    services: [
      { name: "Masaje relajante", durationMinutes: 60, price: 35 },
      { name: "Facial hidratante", durationMinutes: 45, price: 28 },
      { name: "Masaje de piedras calientes", durationMinutes: 75, price: 45 },
    ],
    staff: [
      // Este negocio no paga comisión por servicio: commissionPercent queda en null.
      { name: "Laura Jiménez", commissionPercent: null, workStart: "09:00", workEnd: "17:00" },
      { name: "Marcos Vidal", commissionPercent: null, workStart: "11:00", workEnd: "19:00" },
    ],
  },
];

async function seedBusiness(config: SeedBusinessConfig) {
  const existing = await prisma.business.findUnique({ where: { slug: config.slug } });
  if (existing) {
    console.log(`"${config.name}" ya existe, no se vuelve a crear.`);
    return;
  }

  const passwordHash = await bcrypt.hash("demo1234", 10);

  const business = await prisma.business.create({
    data: {
      name: config.name,
      slug: config.slug,
      category: config.category,
      address: config.address,
      users: {
        create: {
          name: "Dueño Demo",
          email: config.ownerEmail,
          passwordHash,
          role: "OWNER",
        },
      },
      services: { create: config.services },
      staff: { create: config.staff },
    },
    include: { staff: true, services: true },
  });

  const [staffA, staffB] = business.staff;
  const [serviceA, serviceB] = business.services;

  const today = new Date();
  today.setHours(11, 0, 0, 0);
  const in3h = new Date(today.getTime() + 3 * 60 * 60000);
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60000);
  const yesterday = new Date(today.getTime() - 24 * 60 * 60000);

  const clientA = await prisma.client.create({
    data: { businessId: business.id, name: "Miguel Ángel", phone: `${config.slug}-555-0101` },
  });
  const clientB = await prisma.client.create({
    data: { businessId: business.id, name: "Pedro Salinas", phone: `${config.slug}-555-0102` },
  });
  const clientRisky = await prisma.client.create({
    data: { businessId: business.id, name: "Roberto Núñez", phone: `${config.slug}-555-0103`, strikes: 2 },
  });
  const clientHappy = await prisma.client.create({
    data: { businessId: business.id, name: "Sofía Ramírez", phone: `${config.slug}-555-0104` },
  });

  await prisma.appointment.create({
    data: {
      businessId: business.id,
      staffId: staffA.id,
      serviceId: serviceA.id,
      clientId: clientA.id,
      clientName: clientA.name,
      clientPhone: clientA.phone,
      startTime: today,
      endTime: new Date(today.getTime() + serviceA.durationMinutes * 60000),
      status: "CONFIRMED",
      source: "ONLINE",
      priceCharged: serviceA.price,
    },
  });

  await prisma.appointment.create({
    data: {
      businessId: business.id,
      staffId: staffB.id,
      serviceId: serviceB.id,
      clientId: clientB.id,
      clientName: clientB.name,
      clientPhone: clientB.phone,
      startTime: in3h,
      endTime: new Date(in3h.getTime() + serviceB.durationMinutes * 60000),
      status: "CONFIRMED",
      source: "WALK_IN",
      priceCharged: serviceB.price,
    },
  });

  await prisma.appointment.create({
    data: {
      businessId: business.id,
      staffId: staffA.id,
      serviceId: serviceA.id,
      clientId: clientRisky.id,
      clientName: clientRisky.name,
      clientPhone: clientRisky.phone,
      startTime: lastWeek,
      endTime: new Date(lastWeek.getTime() + serviceA.durationMinutes * 60000),
      status: "NO_SHOW",
      source: "ONLINE",
      priceCharged: serviceA.price,
    },
  });

  // Una cita completada con reseña, para poblar la sección de reseñas del panel.
  const completedAppt = await prisma.appointment.create({
    data: {
      businessId: business.id,
      staffId: staffA.id,
      serviceId: serviceA.id,
      clientId: clientHappy.id,
      clientName: clientHappy.name,
      clientPhone: clientHappy.phone,
      startTime: yesterday,
      endTime: new Date(yesterday.getTime() + serviceA.durationMinutes * 60000),
      status: "COMPLETED",
      source: "ONLINE",
      priceCharged: serviceA.price,
      paymentMethod: "CASH",
      paymentStatus: "PAID",
    },
  });

  await prisma.review.create({
    data: {
      businessId: business.id,
      appointmentId: completedAppt.id,
      clientId: clientHappy.id,
      staffId: staffA.id,
      rating: 5,
      comment: "Excelente atención, quedé muy contenta.",
    },
  });

  console.log(`"${config.name}" creado:`);
  console.log(`  URL de reservas: /book/${config.slug}`);
  console.log(`  Login panel: ${config.ownerEmail} / demo1234`);
}

async function main() {
  for (const config of DEMO_BUSINESSES) {
    await seedBusiness(config);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
