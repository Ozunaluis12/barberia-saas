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
  ownerPassword: string;
  services: SeedService[];
  staff: SeedStaff[];
};

const DEMO_BUSINESSES: SeedBusinessConfig[] = [
  {
    slug: "demo-barberia",
    name: "Barbería Estilo Urbano",
    category: "BARBERSHOP",
    address: "Av. Principal 123",
    ownerEmail: "barberia@demo.com",
    ownerPassword: "Barberia123",
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
    slug: "demo-salon",
    name: "Salón Bella Imagen",
    category: "HAIR_SALON",
    address: "Calle 45 # 12-30",
    ownerEmail: "salon@demo.com",
    ownerPassword: "Salon123",
    services: [
      { name: "Corte y peinado", durationMinutes: 45, price: 20 },
      { name: "Color y mechas", durationMinutes: 90, price: 55 },
      { name: "Tratamiento capilar", durationMinutes: 60, price: 35 },
    ],
    staff: [
      { name: "Camila Reyes", commissionPercent: 45, workStart: "09:00", workEnd: "18:00" },
      { name: "Valentina Ruiz", commissionPercent: 45, workStart: "10:00", workEnd: "19:00" },
    ],
  },
  {
    slug: "demo-spa",
    name: "Spa Serenidad",
    category: "SPA",
    address: "Calle Los Almendros 45",
    ownerEmail: "spa@demo.com",
    ownerPassword: "Spa123",
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
  {
    slug: "demo-clinica",
    name: "Consultorio Médico Vitalis",
    category: "MEDICAL_CLINIC",
    address: "Carrera 8 # 20-15",
    ownerEmail: "clinica@demo.com",
    ownerPassword: "Clinica123",
    services: [
      { name: "Consulta general", durationMinutes: 30, price: 25 },
      { name: "Control de rutina", durationMinutes: 20, price: 15 },
      { name: "Consulta especializada", durationMinutes: 45, price: 40 },
    ],
    staff: [
      { name: "Dra. Patricia Gómez", commissionPercent: null, workStart: "08:00", workEnd: "16:00" },
      { name: "Dr. Andrés Salazar", commissionPercent: null, workStart: "12:00", workEnd: "20:00" },
    ],
  },
  {
    slug: "demo-veterinaria",
    name: "Veterinaria Patas Amigas",
    category: "VETERINARY",
    address: "Av. Los Robles 200",
    ownerEmail: "veterinaria@demo.com",
    ownerPassword: "Veterinaria123",
    services: [
      { name: "Consulta general", durationMinutes: 30, price: 20 },
      { name: "Vacunación", durationMinutes: 15, price: 12 },
      { name: "Baño y peluquería canina", durationMinutes: 60, price: 18 },
    ],
    staff: [
      { name: "Dra. Camila Reyes", commissionPercent: null, workStart: "09:00", workEnd: "17:00" },
      { name: "Dr. Felipe Suárez", commissionPercent: null, workStart: "10:00", workEnd: "18:00" },
    ],
  },
  {
    slug: "demo-taller",
    name: "Taller Mecánica Express",
    category: "WORKSHOP",
    address: "Zona Industrial, Bodega 12",
    ownerEmail: "taller@demo.com",
    ownerPassword: "Taller123",
    services: [
      { name: "Cambio de aceite", durationMinutes: 30, price: 30 },
      { name: "Revisión general", durationMinutes: 60, price: 40 },
      { name: "Alineación y balanceo", durationMinutes: 45, price: 35 },
    ],
    staff: [
      { name: "Julián Torres", commissionPercent: 30, workStart: "08:00", workEnd: "17:00" },
      { name: "Édgar Ramírez", commissionPercent: 30, workStart: "08:00", workEnd: "17:00" },
    ],
  },
  {
    slug: "demo-gimnasio",
    name: "Gimnasio PowerFit",
    category: "GYM",
    address: "Av. Deportiva 88",
    ownerEmail: "gimnasio@demo.com",
    ownerPassword: "Gimnasio123",
    services: [
      { name: "Entrenamiento personalizado", durationMinutes: 60, price: 20 },
      { name: "Clase grupal", durationMinutes: 45, price: 10 },
      { name: "Evaluación física", durationMinutes: 30, price: 15 },
    ],
    staff: [
      { name: "Diego Molina", commissionPercent: 40, workStart: "06:00", workEnd: "14:00" },
      { name: "Natalia Cárdenas", commissionPercent: 40, workStart: "14:00", workEnd: "21:00" },
    ],
  },
  {
    slug: "demo-otro",
    name: "Negocio Demo General",
    category: "OTHER",
    address: "Calle Principal 1",
    ownerEmail: "otro@demo.com",
    ownerPassword: "Otro123",
    services: [
      { name: "Servicio general", durationMinutes: 30, price: 20 },
      { name: "Consulta", durationMinutes: 20, price: 10 },
    ],
    staff: [
      { name: "Especialista A", commissionPercent: null, workStart: "09:00", workEnd: "18:00" },
      { name: "Especialista B", commissionPercent: null, workStart: "10:00", workEnd: "19:00" },
    ],
  },
];

async function seedBusiness(config: SeedBusinessConfig) {
  const existing = await prisma.business.findUnique({
    where: { slug: config.slug },
    include: { users: true },
  });

  if (existing) {
    // El negocio ya existe: solo nos aseguramos de que el login del dueño
    // demo coincida con la convención actual (correo/contraseña pueden
    // haber cambiado de nombre entre corridas del seed).
    const owner = existing.users.find((u) => u.role === "OWNER");
    if (owner) {
      const passwordHash = await bcrypt.hash(config.ownerPassword, 10);
      await prisma.user.update({
        where: { id: owner.id },
        data: { email: config.ownerEmail, passwordHash },
      });
    }
    console.log(`"${config.name}" ya existía — login actualizado a ${config.ownerEmail}.`);
    return;
  }

  const passwordHash = await bcrypt.hash(config.ownerPassword, 10);

  const organization = await prisma.organization.create({
    data: {
      name: config.name,
      locations: {
        create: {
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
      },
    },
    include: { locations: { include: { staff: true, services: true } } },
  });

  const business = organization.locations[0];
  const [staffA, staffB] = business.staff;
  const [serviceA, serviceB] = business.services;

  const today = new Date();
  today.setHours(11, 0, 0, 0);
  const in3h = new Date(today.getTime() + 3 * 60 * 60000);
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60000);
  const yesterday = new Date(today.getTime() - 24 * 60 * 60000);

  const clientA = await prisma.client.create({
    data: { organizationId: organization.id, name: "Miguel Ángel", phone: `${config.slug}-555-0101` },
  });
  const clientB = await prisma.client.create({
    data: { organizationId: organization.id, name: "Pedro Salinas", phone: `${config.slug}-555-0102` },
  });
  const clientRisky = await prisma.client.create({
    data: {
      organizationId: organization.id,
      name: "Roberto Núñez",
      phone: `${config.slug}-555-0103`,
      strikes: 2,
    },
  });
  const clientHappy = await prisma.client.create({
    data: { organizationId: organization.id, name: "Sofía Ramírez", phone: `${config.slug}-555-0104` },
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
      staffId: (staffB ?? staffA).id,
      serviceId: (serviceB ?? serviceA).id,
      clientId: clientB.id,
      clientName: clientB.name,
      clientPhone: clientB.phone,
      startTime: in3h,
      endTime: new Date(in3h.getTime() + (serviceB ?? serviceA).durationMinutes * 60000),
      status: "CONFIRMED",
      source: "WALK_IN",
      priceCharged: (serviceB ?? serviceA).price,
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
      comment: "Excelente atención, quedé muy contento.",
    },
  });

  console.log(`"${config.name}" creado:`);
  console.log(`  URL de reservas: /book/${config.slug}`);
  console.log(`  Login panel: ${config.ownerEmail} / ${config.ownerPassword}`);
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
