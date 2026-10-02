/* Fase lunar media (precisión de unas horas, suficiente para marcar días). */
const SYNODIC = 29.530588853
const DAY = 86_400_000
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14)

function moonAge(time: number) {
  const days = (time - KNOWN_NEW_MOON) / DAY
  return ((days % SYNODIC) + SYNODIC) % SYNODIC
}

function dayBounds(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  return [start, start + DAY] as const
}

/** La luna nueva ocurre durante este día (hora local). */
export function isNewMoonDay(date: Date) {
  const [s, e] = dayBounds(date)
  return moonAge(e) < moonAge(s)
}

/** La luna llena ocurre durante este día (hora local). */
export function isFullMoonDay(date: Date) {
  const [s, e] = dayBounds(date)
  const half = SYNODIC / 2
  const a0 = moonAge(s)
  const a1 = moonAge(e)
  return a0 < half && a1 >= half
}

export function nextNewMoon(from = new Date()) {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  for (let i = 0; i < 32; i++) {
    if (isNewMoonDay(d)) return new Date(d)
    d.setDate(d.getDate() + 1)
  }
  return d
}
