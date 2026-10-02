export type ExperienceId = "observacion" | "astrofoto" | "domo"

export type Experience = {
  id: ExperienceId
  code: string
  name: string
  kicker: string
  description: string
  features: string[]
  duration: string
  group: string
  groupShort: string
  price: number
  /** "persona": se multiplica por la cantidad; "domo": precio fijo por domo. */
  priceUnit: "persona" | "domo"
  maxGuests: number
}

export const EXPERIENCES: Experience[] = [
  {
    id: "observacion",
    code: "E/01",
    name: "Observación guiada",
    kicker: "Para la primera vez",
    description:
      "La noche completa con un astrónomo, un telescopio reflector de 16 pulgadas y un láser que dibuja las constelaciones sobre tu cabeza.",
    features: [
      "Telescopio de 16″ y binoculares 15×70",
      "Abrigo de pluma y bebidas calientes",
      "Mapa del cielo de tu noche, impreso",
    ],
    duration: "4 horas",
    group: "Hasta 12 personas",
    groupShort: "Hasta 12",
    price: 95,
    priceUnit: "persona",
    maxGuests: 12,
  },
  {
    id: "astrofoto",
    code: "E/02",
    name: "Astrofotografía",
    kicker: "Para llevarte el cielo",
    description:
      "Taller práctico con monturas ecuatoriales, cámaras full frame y un fotógrafo que te enseña a capturar la Vía Láctea y a procesar tus propias tomas.",
    features: [
      "Montura con seguimiento y cámara incluidas",
      "Procesamiento de tus fotos al amanecer",
      "Te llevás todos los archivos RAW",
    ],
    duration: "6 horas",
    group: "Hasta 6 personas",
    groupShort: "Hasta 6",
    price: 180,
    priceUnit: "persona",
    maxGuests: 6,
  },
  {
    id: "domo",
    code: "E/03",
    name: "Noche en domo",
    kicker: "Para no bajar la vista",
    description:
      "Dormí bajo una cúpula geodésica con techo transparente, calefacción y una cama que mira derecho al polo sur celeste. Cena de altura incluida.",
    features: [
      "Cena de cuatro pasos y desayuno",
      "Telescopio privado en el deck",
      "Te despertamos si pasa la Estación Espacial",
    ],
    duration: "1 noche",
    group: "Domo para 2 personas",
    groupShort: "2 por domo",
    price: 320,
    priceUnit: "domo",
    maxGuests: 2,
  },
]

export type Phase = {
  id: string
  index: string
  time: string
  name: string
  accent: string
  text: string
  sights: string[]
  sky: { top: string; mid: string; bottom: string }
}

/* Paradas de color: design-dna.json → tokens.skyPhases */
export const PHASES: Phase[] = [
  {
    id: "atardecer",
    index: "01",
    time: "19:42",
    name: "Atar",
    accent: "decer",
    text: "El sol se hunde detrás del volcán y el salar se pone color cobre. Armamos los telescopios con la última luz, tomamos un té de coca y te contamos qué vamos a ver esta noche.",
    sights: ["Llegada y montaje", "Primeros planetas al oeste", "Té de coca y mate"],
    sky: { top: "#1b1030", mid: "#7a2e3a", bottom: "#ff8a4a" },
  },
  {
    id: "hora-azul",
    index: "02",
    time: "20:21",
    name: "Hora ",
    accent: "azul",
    text: "Durante media hora el cielo no es ni día ni noche: es un azul profundo que sólo existe a esta altura. Aparecen las primeras estrellas y aprendés a encontrar la Cruz del Sur a ojo desnudo.",
    sights: ["Cinturón de Venus", "Primeras estrellas", "Orientación con la Cruz del Sur"],
    sky: { top: "#060b24", mid: "#13275e", bottom: "#3d5fa8" },
  },
  {
    id: "via-lactea",
    index: "03",
    time: "23:50",
    name: "Vía ",
    accent: "Láctea",
    text: "Sin luna y sin una sola luz artificial en cien kilómetros, la Vía Láctea es tan brillante que proyecta sombra. Es el momento de los telescopios: nebulosas, cúmulos y dos galaxias que se ven a simple vista.",
    sights: ["Nebulosa de la Laguna (M8)", "Nubes de Magallanes", "Omega Centauri"],
    sky: { top: "#020308", mid: "#070a17", bottom: "#121633" },
  },
  {
    id: "amanecer",
    index: "04",
    time: "06:58",
    name: "Ama",
    accent: "necer",
    text: "El frío aprieta y el horizonte se enciende de a poco. Desayuno caliente, café de verdad y las últimas fotos de la noche mientras la cordillera se tiñe de rosa.",
    sights: ["Últimas exposiciones", "Desayuno andino", "Regreso a Salta"],
    sky: { top: "#141a3a", mid: "#7c5a8a", bottom: "#ffb37a" },
  },
]

export const INTRO_SKY = { top: "#120c26", mid: "#4a2440", bottom: "#d8693f" }

export type Stat = {
  value: number
  decimals: number
  unit: string
  label: string
  note: string
}

export const STATS: Stat[] = [
  {
    value: 4180,
    decimals: 0,
    unit: "m s. n. m.",
    label: "Altura",
    note: "Por encima de casi toda la humedad y la turbulencia de la atmósfera.",
  },
  {
    value: 320,
    decimals: 0,
    unit: "noches / año",
    label: "Noches despejadas",
    note: "Promedio de los últimos diez años de registros propios.",
  },
  {
    value: 21.9,
    decimals: 1,
    unit: "mag/arcsec²",
    label: "Oscuridad del cielo",
    note: "Medido con fotómetro SQM. Un cielo de ciudad marca menos de 18.",
  },
  {
    value: 9,
    decimals: 0,
    unit: "% humedad",
    label: "Aire seco",
    note: "Humedad relativa media de noche: la imagen no tiembla en el ocular.",
  },
]

export const SITE = {
  coords: "24°35′ S · 67°24′ W",
  altitude: "4.180 m s. n. m.",
  bortle: "Bortle 1",
}

export const formatUSD = (n: number) =>
  `US$ ${new Intl.NumberFormat("es-AR").format(n)}`
