export const BUSINESS_CATEGORIES = ["BARBERSHOP", "HAIR_SALON", "SPA"] as const;

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
};

const DEFAULT_VOCABULARY: Vocabulary = VOCABULARY.BARBERSHOP;

export function getVocabulary(category: string): Vocabulary {
  return VOCABULARY[category as BusinessCategory] ?? DEFAULT_VOCABULARY;
}

export const CATEGORY_OPTIONS = BUSINESS_CATEGORIES.map((value) => ({
  value,
  label: VOCABULARY[value].categoryLabel,
}));
