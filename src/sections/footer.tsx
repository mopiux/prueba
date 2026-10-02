import { useId, useMemo, useState, type FormEvent } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { SITE } from "@/lib/content"
import { nextNewMoon } from "@/lib/moon"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const YEAR = new Date().getFullYear()

const NAV = [
  { href: "#manifiesto", label: "Manifiesto" },
  { href: "#noche", label: "Una noche" },
  { href: "#experiencias", label: "Experiencias" },
  { href: "#datos", label: "El lugar" },
  { href: "#reserva", label: "Reservar" },
]

export function Footer() {
  const id = useId()
  const [email, setEmail] = useState("")
  const [state, setState] = useState<"idle" | "error" | "ok">("idle")
  const newMoon = useMemo(() => format(nextNewMoon(), "d 'de' MMMM", { locale: es }), [])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setState(EMAIL_RE.test(email.trim()) ? "ok" : "error")
  }

  return (
    <footer id="contacto" className="gutter-x relative overflow-hidden border-t border-line pt-24 md:pt-32">
      <div className="mx-auto max-w-[88rem]">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-6">
            <p className="eyebrow text-ember">Newsletter</p>
            <h2 className="font-display-wonk mt-6 text-[clamp(2.6rem,5.4vw,5.25rem)] leading-[0.92] font-light tracking-[-0.04em]">
              Avisos <em className="text-amber">del cielo.</em>
            </h2>
            <p className="mt-6 max-w-[30rem] text-[1.02rem] leading-relaxed text-dust/70">
              Un mail por mes, antes de cada luna nueva: qué mirar, qué noches quedan libres y
              cuándo pasa algo que vale el viaje. La próxima luna nueva es el {newMoon}.
            </p>
          </div>

          <div className="lg:col-span-6">
            {state === "ok" ? (
              <p role="status" className="rounded-2xl border border-ember/40 bg-ember/10 p-6 text-[1.02rem] leading-relaxed">
                Listo, ya estás adentro. Te escribimos antes del {newMoon}, con el cielo de ese mes.
              </p>
            ) : (
              <form onSubmit={submit} noValidate className="flex flex-col gap-3 sm:flex-row">
                <label htmlFor={`${id}-nl`} className="sr-only">
                  Tu mail
                </label>
                <Input
                  id={`${id}-nl`}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="nombre@correo.com"
                  value={email}
                  aria-invalid={state === "error"}
                  aria-describedby={state === "error" ? `${id}-nl-error` : undefined}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (state === "error") setState("idle")
                  }}
                  className="h-13 flex-1 rounded-full bg-night px-6 text-base md:text-base"
                />
                <button
                  type="submit"
                  className="h-13 cursor-pointer rounded-full bg-dust px-8 text-[0.95rem] font-semibold text-void transition-colors hover:bg-ember hover:text-primary-foreground"
                >
                  Suscribirme
                </button>
              </form>
            )}
            {state === "error" && (
              <p id={`${id}-nl-error`} role="alert" className="mt-3 pl-6 text-xs text-destructive">
                Ese mail no parece válido. Probá de nuevo.
              </p>
            )}
          </div>
        </div>

        <div className="mt-24 grid gap-10 border-t border-line pt-12 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="eyebrow text-muted-foreground">Dónde</p>
            <p className="mt-4 leading-relaxed text-dust/80">
              Puna de Atacama, Salta, Argentina
              <br />
              <span className="font-mono text-xs text-dust/55">{SITE.coords}</span>
            </p>
          </div>
          <div>
            <p className="eyebrow text-muted-foreground">Cómo llegar</p>
            <p className="mt-4 leading-relaxed text-dust/80">
              Traslado incluido desde Salta capital: cinco horas por la RN 51 y el Abra de
              Chorrillos, con parada para aclimatarte.
            </p>
          </div>
          <div>
            <p className="eyebrow text-muted-foreground">Temporada</p>
            <p className="mt-4 leading-relaxed text-dust/80">
              Abierto todo el año. El cielo más estable va de abril a noviembre; en verano
              llegan las lluvias del invierno altiplánico.
            </p>
          </div>
          <nav aria-label="Secciones">
            <p className="eyebrow text-muted-foreground">Recorrido</p>
            <ul className="mt-4 space-y-2">
              {NAV.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-dust/80 transition-colors hover:text-ember">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      <div className="mx-auto mt-20 max-w-[88rem] select-none">
        <p
          aria-hidden="true"
          className="font-display-wonk bg-gradient-to-b from-dust/90 via-dust/35 to-transparent bg-clip-text text-center text-[clamp(6rem,27vw,26rem)] leading-[0.78] font-light tracking-[-0.06em] text-transparent italic"
        >
          Órbita
        </p>
      </div>

      <div className="mx-auto flex max-w-[88rem] flex-col items-start justify-between gap-4 border-t border-line py-7 text-xs text-muted-foreground sm:flex-row sm:items-center">
        <p>© {YEAR} Órbita Observatorio · {SITE.altitude}</p>
        <a href="#top" className="inline-flex items-center gap-2 transition-colors hover:text-dust">
          Volver arriba
          <ArrowUp aria-hidden="true" className="size-3.5" />
        </a>
      </div>
    </footer>
  )
}
