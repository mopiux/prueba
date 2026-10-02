import { useRef } from "react"
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap"
import { cn } from "@/lib/utils"

const LINKS = [
  { href: "#noche", label: "La noche" },
  { href: "#experiencias", label: "Experiencias" },
  { href: "#datos", label: "El lugar" },
  { href: "#contacto", label: "Contacto" },
]

export function Nav() {
  const ref = useRef<HTMLElement>(null)

  useGSAP(() => {
    const el = ref.current
    if (!el) return
    const show = gsap.quickTo(el, "yPercent", { duration: 0.45, ease: "power3.out" })
    const st = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        const scrolled = self.scroll() > 24
        el.dataset.scrolled = String(scrolled)
        if (self.scroll() < 120) show(0)
        else show(self.direction === 1 ? -110 : 0)
      },
    })
    return () => st.kill()
  })

  return (
    <header
      ref={ref}
      data-scrolled="false"
      className={cn(
        "gutter-x fixed inset-x-0 top-0 z-50 border-b border-transparent transition-[background-color,border-color,backdrop-filter] duration-500",
        "data-[scrolled=true]:border-line data-[scrolled=true]:bg-void/70 data-[scrolled=true]:backdrop-blur-xl"
      )}
    >
      <nav aria-label="Principal" className="mx-auto flex h-16 max-w-[88rem] items-center justify-between gap-6 md:h-[4.5rem]">
        <a href="#top" className="group flex items-baseline gap-2" aria-label="Órbita, volver al inicio">
          <span className="font-display-wonk text-[1.6rem] leading-none font-normal italic tracking-[-0.03em]">
            Órbita
          </span>
          <span className="eyebrow hidden text-muted-foreground transition-colors group-hover:text-ember sm:inline">
            Obs. 4180
          </span>
        </a>

        <ul className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="relative text-sm text-dust/75 transition-colors after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-ember after:transition-transform after:duration-500 after:ease-[var(--ease-out-expo)] hover:text-dust hover:after:origin-left hover:after:scale-x-100"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#reserva"
          className="inline-flex h-10 items-center gap-2 rounded-full border border-ember/50 bg-ember/10 px-5 text-sm font-medium text-dust transition-colors hover:bg-ember hover:text-primary-foreground"
        >
          Reservar
          <span aria-hidden="true">→</span>
        </a>
      </nav>
    </header>
  )
}
