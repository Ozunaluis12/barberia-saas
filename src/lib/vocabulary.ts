export const BUSINESS_CATEGORIES = [
  "BARBERSHOP",
  "HAIR_SALON",
  "SPA",
  "MEDICAL_CLINIC",
  "VETERINARY",
  "WORKSHOP",
  "GYM",
  "OTHER",
] as const;

export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number];

export type Vocabulary = {
  categoryLabel: string;
  staffSingular: string;
  staffPlural: string;
  clientSingular: string;
  walkInLabel: string;
  bookingQuestion: string;
  anyStaffLabel: string;
  anyStaffDescription: string;
  servicePlaceholder: string;
};

const VOCABULARY: Record<BusinessCategory, Vocabulary> = {
  BARBERSHOP: {
    categoryLabel: "Barbería",
    staffSingular: "Barbero",
    staffPlural: "Barberos",
    clientSingular: "Cliente",
    walkInLabel: "Walk-in",
    bookingQuestion: "¿Con quién quieres cortarte?",
    anyStaffLabel: "Cualquiera disponible",
    anyStaffDescription:
      "El sistema te asigna al barbero libre más pronto, repartiendo la carga de forma justa.",
    servicePlaceholder: "Corte clásico",
  },
  HAIR_SALON: {
    categoryLabel: "Salón de belleza",
    staffSingular: "Estilista",
    staffPlural: "Estilistas",
    clientSingular: "Cliente",
    walkInLabel: "Sin cita previa",
    bookingQuestion: "¿Con quién prefieres tu cita?",
    anyStaffLabel: "Cualquiera disponible",
    anyStaffDescription:
      "El sistema te asigna al estilista libre más pronto, repartiendo la carga de forma justa.",
    servicePlaceholder: "Corte y peinado",
  },
  SPA: {
    categoryLabel: "Spa",
    staffSingular: "Especialista",
    staffPlural: "Especialistas",
    clientSingular: "Cliente",
    walkInLabel: "Sin cita previa",
    bookingQuestion: "¿Con quién prefieres tu sesión?",
    anyStaffLabel: "Cualquiera disponible",
    anyStaffDescription:
      "El sistema te asigna al especialista libre más pronto, repartiendo la carga de forma justa.",
    servicePlaceholder: "Masaje relajante",
  },
  MEDICAL_CLINIC: {
    categoryLabel: "Consultorio médico",
    staffSingular: "Doctor/a",
    staffPlural: "Doctores",
    clientSingular: "Paciente",
    walkInLabel: "Consulta sin cita",
    bookingQuestion: "¿Con qué doctor/a quieres tu consulta?",
    anyStaffLabel: "Cualquiera disponible",
    anyStaffDescription:
      "El sistema te asigna al doctor/a disponible más pronto, repartiendo la carga de forma justa.",
    servicePlaceholder: "Consulta general",
  },
  VETERINARY: {
    categoryLabel: "Veterinaria",
    staffSingular: "Veterinario/a",
    staffPlural: "Veterinarios",
    clientSingular: "Cliente",
    walkInLabel: "Consulta sin cita",
    bookingQuestion: "¿Con qué veterinario/a quieres tu consulta?",
    anyStaffLabel: "Cualquiera disponible",
    anyStaffDescription:
      "El sistema te asigna al veterinario/a disponible más pronto, repartiendo la carga de forma justa.",
    servicePlaceholder: "Consulta general",
  },
  WORKSHOP: {
    categoryLabel: "Taller",
    staffSingular: "Técnico",
    staffPlural: "Técnicos",
    clientSingular: "Cliente",
    walkInLabel: "Recepción sin cita",
    bookingQuestion: "¿Con quién prefieres tu servicio?",
    anyStaffLabel: "Cualquiera disponible",
    anyStaffDescription:
      "El sistema te asigna al técnico libre más pronto, repartiendo la carga de forma justa.",
    servicePlaceholder: "Cambio de aceite",
  },
  GYM: {
    categoryLabel: "Gimnasio",
    staffSingular: "Entrenador/a",
    staffPlural: "Entrenadores",
    clientSingular: "Cliente",
    walkInLabel: "Sin cita previa",
    bookingQuestion: "¿Con quién prefieres tu sesión?",
    anyStaffLabel: "Cualquiera disponible",
    anyStaffDescription:
      "El sistema te asigna al entrenador/a libre más pronto, repartiendo la carga de forma justa.",
    servicePlaceholder: "Entrenamiento personalizado",
  },
  OTHER: {
    categoryLabel: "Otro negocio",
    staffSingular: "Especialista",
    staffPlural: "Personal",
    clientSingular: "Cliente",
    walkInLabel: "Sin cita previa",
    bookingQuestion: "¿Con quién prefieres tu cita?",
    anyStaffLabel: "Cualquiera disponible",
    anyStaffDescription:
      "El sistema te asigna a la persona libre más pronto, repartiendo la carga de forma justa.",
    servicePlaceholder: "Nombre del servicio",
  },
};

export function getVocabulary(category: string): Vocabulary {
  return VOCABULARY[category as BusinessCategory] ?? VOCABULARY.OTHER;
}

export const CATEGORY_OPTIONS = BUSINESS_CATEGORIES.map((value) => ({
  value,
  label: VOCABULARY[value].categoryLabel,
}));
