import { useId, useRef, useState, type FormEvent } from "react"
import { addDays, addMonths, format, startOfDay } from "date-fns"
import { es as dfEs } from "date-fns/locale"
import { es } from "react-day-picker/locale"
import { Minus, Plus } from "lucide-react"
import { Eyebrow } from "@/components/site/eyebrow"
import { BackgroundPaths } from "@/components/ui/background-paths"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { EXPERIENCES, formatUSD, type ExperienceId } from "@/lib/content"
import { gsap, MQ, useGSAP } from "@/lib/gsap"
import { isFullMoonDay, isNewMoonDay } from "@/lib/moon"
import { cn } from "@/lib/utils"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

type Confirmed = { date: Date; xpName: string; guests: number; email: string; total: number }

export function Booking({
  experience,
  onExperienceChange,
}: {
  experience: ExperienceId
  onExperienceChange: (id: ExperienceId) => void
}) {
  const sectionRef = useRef<HTMLElement>(null)
  const formId = useId()
  const [date, setDate] = useState<Date>()
  const [guests, setGuests] = useState(2)
  const [email, setEmail] = useState("")
  const [errors, setErrors] = useState<{ date?: string; email?: string }>({})
  const [confirmed, setConfirmed] = useState<Confirmed | null>(null)

  const xp = EXPERIENCES.find((x) => x.id === experience) ?? EXPERIENCES[0]
  const g = Math.min(guests, xp.maxGuests)
  const total = xp.priceUnit === "persona" ? xp.price * g : xp.price

  // ventana de reserva: desde 48 h hasta 12 meses
  const [{ minDate, maxDate }] = useState(() => {
    const today = startOfDay(new Date())
    return { minDate: addDays(today, 2), maxDate: addMonths(today, 12) }
  })

  // GSAP sólo toca contenedores (data-gsap); Framer Motion anima paths y letras.
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MQ.motion, () => {
        gsap.fromTo(
          "[data-gsap=orbits]",
          { rotate: -10, scale: 1.12 },
          {
            rotate: 8,
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        )
        gsap.from("[data-gsap=panel]", {
          y: 70,
          opacity: 0,
          duration: 1.3,
          ease: "expo.out",
          scrollTrigger: { trigger: "[data-gsap=panel]", start: "top 85%", once: true },
        })
      })
    },
    { scope: sectionRef }
  )

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!date) next.date = "Elegí una fecha en el calendario."
    if (!EMAIL_RE.test(email.trim())) next.email = "Revisá el mail: así no te podemos escribir."
    setErrors(next)
    if (next.date || next.email || !date) return
    setConfirmed({ date, xpName: xp.name, guests: g, email: email.trim(), total })
  }

  const reset = () => {
    setConfirmed(null)
    setDate(undefined)
    setEmail("")
    setErrors({})
  }

  const prettyDate = (d: Date) => format(d, "EEEE d 'de' MMMM", { locale: dfEs })

  return (
    <BackgroundPaths
      ref={sectionRef}
      id="reserva"
      title="Tu noche bajo el cielo más limpio del mundo"
      accentWords={[5, 6]}
      eyebrow={<Eyebrow index="05">Reserva</Eyebrow>}
      intro={
        <div className="mt-9 max-w-[30rem] space-y-8">
          <p className="text-[1.05rem] leading-relaxed text-dust/75">
            Elegí la fecha y la experiencia. Te confirmamos por mail en menos de 24 horas
            y coordinamos el traslado desde Salta capital.
          </p>
          <ul className="space-y-3 text-sm text-dust/75">
            <li className="flex items-center gap-3">
              <span aria-hidden="true" className="size-2 rounded-full bg-ice shadow-[0_0_8px_var(--ice)]" />
              Luna nueva: el cielo más oscuro del mes.
            </li>
            <li className="flex items-center gap-3">
              <span aria-hidden="true" className="size-2 rounded-full border border-dust/70" />
              Luna llena: ideal para la Luna, no tanto para galaxias.
            </li>
          </ul>
          <p className="eyebrow leading-relaxed text-muted-foreground">
            Si se nubla, reprogramamos sin cargo
          </p>
        </div>
      }
      buttonLabel={confirmed ? "Hacer otra reserva" : "Reservar mi noche"}
      buttonProps={
        confirmed
          ? { type: "button", onClick: reset }
          : { type: "submit", form: formId }
      }
      footnote={
        !confirmed && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Sin pago ahora. Confirmás cuando te escribimos.
          </p>
        )
      }
    >
      {confirmed ? (
        <div role="status" className="py-4">
          <p className="eyebrow text-ember">Pre-reserva registrada</p>
          <p className="font-display-wonk mt-5 text-[clamp(2rem,3.4vw,2.9rem)] leading-[1] font-light tracking-[-0.03em]">
            Listo. Tu noche del <em className="text-amber">{prettyDate(confirmed.date)}</em> ya
            tiene lugar.
          </p>
          <dl className="mt-8 grid grid-cols-2 gap-5 border-t border-line pt-6 text-sm">
            <div>
              <dt className="eyebrow text-muted-foreground">Experiencia</dt>
              <dd className="mt-2">{confirmed.xpName}</dd>
            </div>
            <div>
              <dt className="eyebrow text-muted-foreground">Personas</dt>
              <dd className="mt-2">{confirmed.guests}</dd>
            </div>
            <div>
              <dt className="eyebrow text-muted-foreground">Total estimado</dt>
              <dd className="mt-2">{formatUSD(confirmed.total)}</dd>
            </div>
            <div>
              <dt className="eyebrow text-muted-foreground">Te escribimos a</dt>
              <dd className="mt-2 break-all">{confirmed.email}</dd>
            </div>
          </dl>
          <p className="mt-7 text-sm leading-relaxed text-dust/70">
            En las próximas 24 horas te mandamos el detalle del traslado y cómo pagar.
            Mientras tanto, mirá el pronóstico: nosotros también lo hacemos.
          </p>
        </div>
      ) : (
        <form id={formId} noValidate onSubmit={submit} aria-label="Reservar una noche">
          <div className="grid gap-7 sm:grid-cols-[auto_1fr]">
            <div>
              <p className="eyebrow mb-3 text-muted-foreground" id={`${formId}-date`}>
                01 · Tu noche
              </p>
              <div
                aria-labelledby={`${formId}-date`}
                className={cn(
                  "rounded-xl border border-line bg-void/50 p-2",
                  errors.date && "border-destructive/70"
                )}
              >
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    setDate(d)
                    if (d) setErrors((er) => ({ ...er, date: undefined }))
                  }}
                  locale={es}
                  startMonth={minDate}
                  endMonth={maxDate}
                  disabled={[{ before: minDate }, { after: maxDate }]}
                  modifiers={{ newMoon: isNewMoonDay, fullMoon: isFullMoonDay }}
                  modifiersClassNames={{ newMoon: "moon-new", fullMoon: "moon-full" }}
                  className="w-full bg-transparent p-1 [--cell-size:--spacing(9)] sm:w-fit sm:[--cell-size:--spacing(10)]"
                  classNames={{
                    root: "w-full sm:w-fit",
                    caption_label: "text-sm font-medium capitalize select-none",
                  }}
                />
              </div>
              {errors.date && (
                <p role="alert" className="mt-2 text-xs text-destructive">
                  {errors.date}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-7">
              <fieldset>
                <legend className="eyebrow mb-3 text-muted-foreground">02 · Experiencia</legend>
                <div className="space-y-2">
                  {EXPERIENCES.map((x) => (
                    <label
                      key={x.id}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-line bg-void/40 px-4 py-3 text-sm transition-colors hover:border-dust/30 has-[:checked]:border-ember has-[:checked]:bg-ember/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ember"
                    >
                      <input
                        type="radio"
                        name="experiencia"
                        value={x.id}
                        checked={experience === x.id}
                        onChange={() => onExperienceChange(x.id)}
                        className="sr-only"
                      />
                      <span className="whitespace-nowrap">{x.name}</span>
                      <span className="whitespace-nowrap text-muted-foreground tabular-nums">
                        {formatUSD(x.price)}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div>
                <p className="eyebrow mb-3 text-muted-foreground" id={`${formId}-guests`}>
                  03 · Personas
                </p>
                <div
                  role="group"
                  aria-labelledby={`${formId}-guests`}
                  className="flex items-center justify-between rounded-lg border border-line bg-void/40 p-1.5"
                >
                  <button
                    type="button"
                    aria-label="Una persona menos"
                    disabled={g <= 1}
                    onClick={() => setGuests(Math.max(1, g - 1))}
                    className="grid size-9 cursor-pointer place-items-center rounded-md transition-colors hover:bg-nebula disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <Minus className="size-4" />
                  </button>
                  <output aria-live="polite" className="text-sm tabular-nums">
                    {g} {g === 1 ? "persona" : "personas"}
                  </output>
                  <button
                    type="button"
                    aria-label="Una persona más"
                    disabled={g >= xp.maxGuests}
                    onClick={() => setGuests(Math.min(xp.maxGuests, g + 1))}
                    className="grid size-9 cursor-pointer place-items-center rounded-md transition-colors hover:bg-nebula disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{xp.group}</p>
              </div>

              <div>
                <label htmlFor={`${formId}-email`} className="eyebrow mb-3 block text-muted-foreground">
                  04 · Tu mail
                </label>
                <Input
                  id={`${formId}-email`}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="nombre@correo.com"
                  value={email}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? `${formId}-email-error` : undefined}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errors.email) setErrors((er) => ({ ...er, email: undefined }))
                  }}
                  className="h-11 rounded-lg bg-void/40"
                />
                {errors.email && (
                  <p id={`${formId}-email-error`} role="alert" className="mt-2 text-xs text-destructive">
                    {errors.email}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap items-end justify-between gap-4 border-t border-line pt-6">
            <div>
              <p className="eyebrow text-muted-foreground">Resumen</p>
              <p className="mt-2 text-sm first-letter:uppercase">
                {date ? prettyDate(date) : "Todavía sin fecha"} · {xp.name} · {g}{" "}
                {g === 1 ? "persona" : "personas"}
              </p>
            </div>
            <div className="text-right">
              <p className="eyebrow text-muted-foreground">Total estimado</p>
              <p className="font-display-wonk mt-1 text-3xl font-light tabular-nums">
                {formatUSD(total)}
              </p>
            </div>
          </div>
        </form>
      )}
    </BackgroundPaths>
  )
}
